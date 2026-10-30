import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq, sql, desc, asc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import * as schema from '../db/schema';
import { UrduLanguagePack } from '../lib/abjad/packs/urdu';
import { CONTEXTUAL_VOCAB } from '../db/seed';
import { vocalizeUrduWord, makePhoneticBreakdown } from '../lib/abjad/packs/urduVocalizer';
import { lookupUrduWord } from '../lib/abjad/urduDictionary';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const api = new Hono();

// Enable CORS for local dev
api.use('*', cors());

// Ensure audio cache directory exists
const AUDIO_CACHE_DIR = join(process.cwd(), 'public', 'audio', 'cache');
if (!existsSync(AUDIO_CACHE_DIR)) {
  mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
}

// -------------------------------------------------------------
// 1. GET /api/stories - List all stories
// -------------------------------------------------------------
api.get('/stories', async (c) => {
  try {
    const allStories = db
      .select()
      .from(schema.stories)
      .orderBy(asc(schema.stories.level), asc(schema.stories.subLevel))
      .all()
      .map((s) => ({
        ...s,
        sceneVocabPreview: s.sceneVocabPreviewJson,
      }));
    return c.json({ success: true, data: allStories });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// -------------------------------------------------------------
// 2. GET /api/stories/:slug - Get story with paragraphs, tokens & analyses
// -------------------------------------------------------------
api.get('/stories/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const story = db.select().from(schema.stories).where(eq(schema.stories.slug, slug)).get();

    if (!story) {
      return c.json({ success: false, error: 'Story not found' }, 404);
    }

    // Fetch paragraphs ordered by paragraphIndex
    const paragraphsList = db
      .select()
      .from(schema.paragraphs)
      .where(eq(schema.paragraphs.storyId, story.id))
      .all()
      .sort((a, b) => a.paragraphIndex - b.paragraphIndex);

    const paragraphIds = paragraphsList.map((p) => p.id);

    // Fetch all tokens for these paragraphs
    const allTokens: (typeof schema.tokens.$inferSelect)[] = [];
    const allAnalyses: Record<string, typeof schema.tokenAnalyses.$inferSelect> = {};

    for (const pid of paragraphIds) {
      const pTokens = db
        .select()
        .from(schema.tokens)
        .where(eq(schema.tokens.paragraphId, pid))
        .all()
        .sort((a, b) => a.tokenIndex - b.tokenIndex);

      allTokens.push(...pTokens);

      for (const tok of pTokens) {
        if (tok.isWord) {
          const analysis = db
            .select()
            .from(schema.tokenAnalyses)
            .where(eq(schema.tokenAnalyses.tokenId, tok.id))
            .get();

          if (analysis) {
            allAnalyses[tok.id] = analysis;
          }
        }
      }
    }

    return c.json({
      success: true,
      data: {
        story: {
          ...story,
          sceneVocabPreview: story.sceneVocabPreviewJson,
        },
        paragraphs: paragraphsList,
        tokens: allTokens,
        analyses: allAnalyses,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// -------------------------------------------------------------
// 3. POST /api/telemetry - Word lookup telemetry
// -------------------------------------------------------------
const TelemetrySchema = z.object({
  normalizedSurface: z.string(),
  vocalizedSurface: z.string(),
  tapLevel: z.number().int().min(1).max(3),
  storyId: z.string().optional().nullable(),
  storySlug: z.string().optional().nullable(),
  storyTitleUrdu: z.string().optional().nullable(),
  sourceSentenceUrdu: z.string().optional().nullable(),
});

api.post('/telemetry', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = TelemetrySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.format() }, 400);
    }

    const {
      normalizedSurface,
      vocalizedSurface,
      tapLevel,
      storyId,
      storySlug,
      storyTitleUrdu,
      sourceSentenceUrdu,
    } = parsed.data;

    // Check existing telemetry record
    const existing = db
      .select()
      .from(schema.userTelemetry)
      .where(
        sql`${schema.userTelemetry.normalizedSurface} = ${normalizedSurface} AND ${schema.userTelemetry.vocalizedSurface} = ${vocalizedSurface}`
      )
      .get();

    const now = new Date();

    if (existing) {
      db.update(schema.userTelemetry)
        .set({
          lookupCount: existing.lookupCount + 1,
          lastTapLevel: tapLevel,
          maxTapLevel: Math.max(existing.maxTapLevel, tapLevel),
          lastSeenAt: now,
          ...(storyId ? { storyId, storySlug, storyTitleUrdu, sourceSentenceUrdu } : {}),
        })
        .where(eq(schema.userTelemetry.id, existing.id))
        .run();
    } else {
      db.insert(schema.userTelemetry)
        .values({
          id: `tel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          normalizedSurface,
          vocalizedSurface,
          lookupCount: 1,
          maxTapLevel: tapLevel,
          lastTapLevel: tapLevel,
          storyId: storyId || null,
          storySlug: storySlug || null,
          storyTitleUrdu: storyTitleUrdu || null,
          sourceSentenceUrdu: sourceSentenceUrdu || null,
          masteryStatus: 'learning',
          isStarred: false,
          lastSeenAt: now,
        })
        .run();
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// -------------------------------------------------------------
// 4. GET /api/telemetry - Get user vocabulary telemetry items with joined analyses
// -------------------------------------------------------------
api.get('/telemetry', async (c) => {
  try {
    const items = db
      .select()
      .from(schema.userTelemetry)
      .orderBy(desc(schema.userTelemetry.lastSeenAt))
      .all();

    // Enrich with analysis data with bulletproof fallback
    const enriched = items.map((item) => {
      // 1. Direct match on vocalizedForm
      let analysis = db
        .select()
        .from(schema.tokenAnalyses)
        .where(eq(schema.tokenAnalyses.vocalizedForm, item.vocalizedSurface))
        .get();

      // 2. Fallback match via tokens table on normalizedForm
      if (!analysis) {
        const matchingTok = db
          .select()
          .from(schema.tokens)
          .where(eq(schema.tokens.normalizedForm, item.normalizedSurface))
          .limit(1)
          .get();
        if (matchingTok) {
          analysis = db
            .select()
            .from(schema.tokenAnalyses)
            .where(eq(schema.tokenAnalyses.tokenId, matchingTok.id))
            .get();
        }
      }

      // 3. Fallback match in CONTEXTUAL_VOCAB (for phrases, idioms, and compounds)
      const vocabEntry =
        !analysis &&
        (CONTEXTUAL_VOCAB[item.vocalizedSurface] ||
          CONTEXTUAL_VOCAB[item.normalizedSurface] ||
          CONTEXTUAL_VOCAB[UrduLanguagePack.stripHarakatPreserveOrthography(item.normalizedSurface)]);

      return {
        ...item,
        englishGloss: analysis?.englishContextualGloss || (vocabEntry ? vocabEntry.englishContextualGloss : null),
        urduExplanation: analysis?.urduSimpleExplanation || (vocabEntry ? vocabEntry.urduSimpleExplanation : null),
        spokenSynonyms: analysis?.spokenUrduSynonymsJson || (vocabEntry ? vocabEntry.spokenUrduSynonymsJson : []),
        arabicRoot: analysis?.arabicRoot || (vocabEntry ? vocabEntry.arabicRoot : null),
        cousins: analysis?.familiarCousinsJson || (vocabEntry ? vocabEntry.familiarCousinsJson : []),
        literaryNuanceNote: analysis?.literaryNuanceNote || (vocabEntry ? vocabEntry.literaryNuanceNote : null),
      };
    });

    return c.json({ success: true, data: enriched });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// -------------------------------------------------------------
// 4a. DELETE /api/telemetry/:id - Delete word(s) from vault
// -------------------------------------------------------------
api.delete('/telemetry/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const isMasteredOnly = c.req.query('mastered') === 'true';
    const isAll = c.req.query('all') === 'true' || id === 'all';

    if (isAll) {
      db.delete(schema.userTelemetry).run();
      return c.json({ success: true, count: 'all' });
    }

    if (isMasteredOnly) {
      db.delete(schema.userTelemetry).where(eq(schema.userTelemetry.masteryStatus, 'mastered')).run();
      return c.json({ success: true, count: 'mastered' });
    }

    db.delete(schema.userTelemetry).where(eq(schema.userTelemetry.id, id)).run();
    return c.json({ success: true, id });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// -------------------------------------------------------------
// 4b. PATCH /api/telemetry/:id - Update star status or mastery
// -------------------------------------------------------------
const PatchTelemetrySchema = z.object({
  isStarred: z.boolean().optional(),
  masteryStatus: z.enum(['learning', 'mastered']).optional(),
});

api.patch('/telemetry/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = PatchTelemetrySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.format() }, 400);
    }

    const updates: Record<string, any> = {};
    if (parsed.data.isStarred !== undefined) updates.isStarred = parsed.data.isStarred;
    if (parsed.data.masteryStatus !== undefined) {
      updates.masteryStatus = parsed.data.masteryStatus;
      updates.lastReviewedAt = new Date();
    }

    db.update(schema.userTelemetry)
      .set(updates)
      .where(eq(schema.userTelemetry.id, id))
      .run();

    return c.json({ success: true, id, updates });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// -------------------------------------------------------------
// 4c. GET /api/telemetry/export - Export vocabulary to Anki CSV
// -------------------------------------------------------------
api.get('/telemetry/export', async (c) => {
  try {
    const items = db
      .select()
      .from(schema.userTelemetry)
      .orderBy(desc(schema.userTelemetry.lastSeenAt))
      .all();

    let csv = '\uFEFF"Urdu Headword","Vocalized (Harakat)","English Definition","Spoken Urdu Synonyms","Context Sentence","Source Story","Mastery Status"\n';

    for (const item of items) {
      let analysis = db
        .select()
        .from(schema.tokenAnalyses)
        .where(eq(schema.tokenAnalyses.vocalizedForm, item.vocalizedSurface))
        .get();

      if (!analysis) {
        const matchingTok = db
          .select()
          .from(schema.tokens)
          .where(eq(schema.tokens.normalizedForm, item.normalizedSurface))
          .limit(1)
          .get();
        if (matchingTok) {
          analysis = db
            .select()
            .from(schema.tokenAnalyses)
            .where(eq(schema.tokenAnalyses.tokenId, matchingTok.id))
            .get();
        }
      }

      const vocabEntry =
        !analysis &&
        (CONTEXTUAL_VOCAB[item.vocalizedSurface] ||
          CONTEXTUAL_VOCAB[item.normalizedSurface] ||
          CONTEXTUAL_VOCAB[UrduLanguagePack.stripHarakatPreserveOrthography(item.normalizedSurface)]);

      const clean = (str: string | null | undefined) => `"${(str || '').replace(/"/g, '""')}"`;
      const spoken = (analysis?.spokenUrduSynonymsJson || (vocabEntry ? vocabEntry.spokenUrduSynonymsJson : []) || []).join('، ');

      csv += [
        clean(item.normalizedSurface),
        clean(item.vocalizedSurface),
        clean(analysis?.englishContextualGloss || (vocabEntry ? vocabEntry.englishContextualGloss : '')),
        clean(spoken),
        clean(item.sourceSentenceUrdu || ''),
        clean(item.storyTitleUrdu || 'Literary Urdu'),
        clean(item.masteryStatus || 'learning'),
      ].join(',') + '\n';
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="abjad-vocabulary-vault.csv"',
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

function splitTextForTTS(text: string, maxLen = 160): string[] {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  const words = text.split(/\s+/);
  let current = '';

  for (const w of words) {
    if ((current ? current + ' ' + w : w).length <= maxLen) {
      current = current ? current + ' ' + w : w;
    } else {
      if (current) parts.push(current);
      current = w;
    }
  }
  if (current) parts.push(current);
  return parts;
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// 5. GET/POST /api/tts - Audio synthesis with multi-voice support & SHA-256 caching
// -------------------------------------------------------------
export function cleanUrduForTTS(text: string): string {
  if (!text) return '';
  // Normalize Unicode to NFC so decomposed \u0627\u0653 becomes precomposed \u0622 (Alif with Madda)
  let normalized = text.normalize('NFC').trim();

  // Strip combining diacritics / harakat / jazm (U+064B - U+0652, U+0656 - U+065F, U+06DF - U+06E8)
  // Standalone diacritics (especially jazm/sukūn \u0652) on isolated words cause neural Urdu TTS models
  // to spell out individual letter phonemes rather than reading the natural word vocabulary.
  // Note: Alif with Madda (\u0622) and Combining Madda (\u0653) are strictly preserved.
  normalized = normalized.replace(/[\u064B-\u0652\u0656-\u065F\u06DF-\u06E8]/g, '').trim();

  // Neural TTS phonetic correction for isolated 'آنوں' / 'آنُوں' (annas):
  // When spoken in isolation, neural models often slur 'آنوں' into 'ایِنو' (eeno),
  // dropping the crucial Alif Madda. Segmenting to 'آ نوں' guarantees that the neural voice
  // pronounces the open long vowel /aː/ (Alif with Madda) followed by 'noñ' (/aːnõː/).
  if (/^آن[ُ]?[و]?[ں]?$/u.test(normalized)) {
    return 'آ نوں';
  }

  // Neural TTS phonetic corrections for Persian-origin clitics ending in silent Heh (ہ):
  // Words like تاکہ (taakeh / so that), بلکہ (balkeh / rather), and چونکہ (choonkeh / since)
  // end in an /e/ or /eh/ vowel (majhool heh). Microsoft's neural G2P models (Asad, Uzma, Salman)
  // misclassify final Heh as an open /a/ or /ah/, pronouncing 'تاکہ' as 'taakah'.
  // Mapping the final Heh to Bari Yeh (ے) guarantees the authentic /e/ (eh) pronunciation across all neural voices.
  normalized = normalized.replace(/(^|\s)تاکہ(?=[\s،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!]|$)/gu, '$1تاکے');
  normalized = normalized.replace(/(^|\s)تا\s+کہ(?=[\s،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!]|$)/gu, '$1تاکے');
  normalized = normalized.replace(/(^|\s)بلکہ(?=[\s،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!]|$)/gu, '$1بلکے');
  normalized = normalized.replace(/(^|\s)چونکہ(?=[\s،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!]|$)/gu, '$1چونکے');

  return normalized.trim();
}

const handleTTS = async (
  vocalizedText: string,
  lang = 'ur-PK',
  voice = 'ur-asad',
  speed = 1.0,
  pitch = 1.0
) => {
  const rawText = (vocalizedText || '').trim();
  if (!rawText) {
    return { error: 'Text required', status: 400 };
  }

  // Sanitize text for neural TTS: strip problematic combining jazm/diacritics
  const textToSpeak = cleanUrduForTTS(rawText) || rawText;

  // 1. Compute deterministic SHA-256 hash using Bun.CryptoHasher
  // Uses v2-neural prefix to bust any stale CDN/Cloudflare caches from older Google audio
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(`v2-neural:${voice}:${speed}:${pitch}:${lang}:${textToSpeak}`);
  const hash = hasher.digest('hex');

  const cacheFileName = `${hash}.mp3`;
  const cacheFilePath = join(AUDIO_CACHE_DIR, cacheFileName);

  // Check if cache file exists
  if (existsSync(cacheFilePath)) {
    const fileStats = await Bun.file(cacheFilePath).size;
    if (fileStats > 500) {
      return { data: { audioUrl: `/audio/cache/${cacheFileName}`, cached: true, voice, speed } };
    }
  }

  // 2. High-Fidelity Neural TTS via edge-tts (100% Free, zero financial cost, zero resident RAM)
  const neuralVoiceMap: Record<string, string> = {
    'ur-asad': 'ur-PK-AsadNeural',
    'ur-uzma': 'ur-PK-UzmaNeural',
    'ur-salman': 'ur-IN-SalmanNeural',
    'ur-gul': 'ur-IN-GulNeural',
    'google-standard': 'ur-PK-UzmaNeural',
  };

  const neuralVoice = neuralVoiceMap[voice];
  if (neuralVoice && voice !== 'google-standard') {
    try {
      const ratePct = Math.round((speed - 1) * 100);
      const rateStr = ratePct >= 0 ? `+${ratePct}%` : `${ratePct}%`;
      const pitchHz = Math.round((pitch - 1) * 30);
      const pitchStr = pitchHz >= 0 ? `+${pitchHz}Hz` : `${pitchHz}Hz`;

      const proc = Bun.spawn([
        'edge-tts',
        '--voice',
        neuralVoice,
        '--rate',
        rateStr,
        '--pitch',
        pitchStr,
        '--text',
        textToSpeak,
        '--write-media',
        cacheFilePath,
      ]);

      const exitCode = await proc.exited;
      if (exitCode === 0 && existsSync(cacheFilePath)) {
        const stats = await Bun.file(cacheFilePath).size;
        if (stats > 500) {
          return { data: { audioUrl: `/audio/cache/${cacheFileName}`, cached: false, voice, speed } };
        }
      }
    } catch (edgeErr) {
      console.warn('Edge TTS neural synthesis error, attempting fallback:', edgeErr);
    }
  }

  // 3. Azure Speech API / TTS_API_KEY fallback if configured
  const azureKey = process.env.AZURE_SPEECH_KEY || process.env.TTS_API_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION || 'eastus';
  if (azureKey) {
    try {
      const azureVoiceMap: Record<string, string> = {
        'ur-asad': 'ur-PK-AsadNeural',
        'ur-uzma': 'ur-PK-UzmaNeural',
        'ur-salman': 'ur-IN-SalmanNeural',
        'ur-gul': 'ur-IN-GulNeural',
        'google-standard': 'ur-PK-UzmaNeural',
      };
      const azureVoice = azureVoiceMap[voice] || 'ur-PK-AsadNeural';
      const rateStr = speed !== 1.0 ? `${Math.round((speed - 1) * 100)}%` : '+0%';
      const pitchStr = pitch !== 1.0 ? `${Math.round((pitch - 1) * 50)}%` : '+0%';

      const ssml = `<speak version='1.0' xml:lang='ur-PK'>
        <voice xml:lang='ur-PK' name='${azureVoice}'>
          <prosody rate='${rateStr}' pitch='${pitchStr}'>${textToSpeak}</prosody>
        </voice>
      </speak>`;

      const res = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'AbjadLiteraryReader/1.0',
        },
        body: ssml,
      });

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        if (audioBuffer.byteLength > 0) {
          await Bun.write(cacheFilePath, audioBuffer);
          return { data: { audioUrl: `/audio/cache/${cacheFileName}`, cached: false, voice, speed } };
        }
      }
    } catch (azureErr) {
      console.warn('Azure TTS fetch failed, falling back to multi-voice stream:', azureErr);
    }
  }

  // 3. Spoken audio synthesis with voice persona profiles (streamed directly to disk, 0 server memory retention)
  try {
    const chunks = splitTextForTTS(textToSpeak, 160);
    const audioBuffers: Uint8Array[] = [];

    // Distinct voice nuances:
    // - ur-asad: measured, slower literary cadence (ttsspeed=0.28)
    // - ur-salman: Hindustani classical phonetic profile (tl=hi)
    // - ur-uzma / google-standard: standard fluent Urdu (tl=ur)
    let tl = 'ur';
    let extraParams = '';
    if (voice === 'ur-salman') {
      tl = 'hi';
    } else if (voice === 'ur-asad') {
      extraParams = '&ttsspeed=0.28';
    }

    for (const chunk of chunks) {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=${tl}&client=tw-ob${extraParams}`;
      const res = await fetch(ttsUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (buf.byteLength > 0) {
          audioBuffers.push(new Uint8Array(buf));
        }
      }
    }

    if (audioBuffers.length === chunks.length && audioBuffers.length > 0) {
      const totalLen = audioBuffers.reduce((acc, b) => acc + b.length, 0);
      const merged = new Uint8Array(totalLen);
      let offset = 0;
      for (const b of audioBuffers) {
        merged.set(b, offset);
        offset += b.length;
      }
      await Bun.write(cacheFilePath, merged);
      return { data: { audioUrl: `/audio/cache/${cacheFileName}`, cached: false, voice, speed } };
    }
  } catch (ttsErr) {
    console.warn('Spoken TTS fetch error:', ttsErr);
  }

  // 4. Fallback to Web Speech API format
  return {
    data: {
      fallback: 'web-speech',
      text: textToSpeak,
      lang: 'ur-PK',
      voice,
      speed,
      pitch,
      hash,
    },
  };
};

api.get('/tts', async (c) => {
  const text = c.req.query('text') || '';
  const lang = c.req.query('lang') || 'ur-PK';
  const voice = c.req.query('voice') || 'ur-asad';
  const speed = parseFloat(c.req.query('speed') || '1.0');
  const pitch = parseFloat(c.req.query('pitch') || '1.0');
  const result = await handleTTS(text, lang, voice, speed, pitch);
  if (result.error) return c.json({ success: false, error: result.error }, 400);
  return c.json({ success: true, ...result.data });
});

api.post('/tts', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const text = body.text || '';
  const lang = body.lang || 'ur-PK';
  const voice = body.voice || 'ur-asad';
  const speed = body.speed ?? 1.0;
  const pitch = body.pitch ?? 1.0;
  const result = await handleTTS(text, lang, voice, speed, pitch);
  if (result.error) return c.json({ success: false, error: result.error }, 400);
  return c.json({ success: true, ...result.data });
});

// -------------------------------------------------------------
// 4d. POST /api/phrase/decode - Decode multi-word phrases and idioms
// -------------------------------------------------------------
const PhraseDecodeSchema = z.object({
  phrase: z.string().min(1),
  storyId: z.string().optional(),
  sentenceContext: z.string().optional(),
});

api.post('/phrase/decode', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = PhraseDecodeSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.format() }, 400);
    }

    const rawPhrase = parsed.data.phrase.trim();
    const cleanPhrase = rawPhrase.replace(/^[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+|[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+$/gu, '').trim();
    const normPhrase = UrduLanguagePack.stripHarakatPreserveOrthography(cleanPhrase).trim();

    // 1. Direct match in CONTEXTUAL_VOCAB
    const directMatch =
      CONTEXTUAL_VOCAB[rawPhrase] ||
      CONTEXTUAL_VOCAB[cleanPhrase] ||
      CONTEXTUAL_VOCAB[normPhrase];

    if (directMatch) {
      const vocalized = directMatch.vocalizedForm || cleanPhrase;
      return c.json({
        success: true,
        data: {
          phraseText: rawPhrase,
          vocalizedForm: vocalized,
          phoneticBreakdownJson: makePhoneticBreakdown(vocalized),
          graphemesJson: UrduLanguagePack.decomposeWordToGraphemes(cleanPhrase).filter(
            (g) => g.raw.trim().length > 0
          ),
          spokenUrduSynonymsJson: directMatch.spokenUrduSynonymsJson || [],
          urduSimpleExplanation: directMatch.urduSimpleExplanation || '',
          englishContextualGloss: directMatch.englishContextualGloss || '',
          literaryNuanceNote: directMatch.literaryNuanceNote || null,
          tokenTier: 'idiom_phrase',
          isPhrase: true,
        },
      });
    }

    // 2. Pattern A: Reduplicative Emphatic [Noun] ہی [Noun] میں (e.g. دل ہی دل میں, باتوں ہی باتوں میں, آنکھوں ہی آنکھوں میں)
    const heInMatch = normPhrase.match(/^(\S+)\s+ہی\s+\1\s+میں$/u);
    if (heInMatch) {
      const base = heInMatch[1];
      const vocBase = vocalizeUrduWord(base);
      const vocPhrase = `${vocBase} ہی ${vocBase} میں`;
      return c.json({
        success: true,
        data: {
          phraseText: rawPhrase,
          vocalizedForm: vocPhrase,
          phoneticBreakdownJson: makePhoneticBreakdown(vocPhrase),
          graphemesJson: UrduLanguagePack.decomposeWordToGraphemes(cleanPhrase).filter(
            (g) => g.raw.trim().length > 0
          ),
          spokenUrduSynonymsJson: ['اپنے اندر ہی اندر', 'چپکے سے', 'خود میں'],
          urduSimpleExplanation: `${base} کے اندر بغیر کسی پر ظاہر کیے، خاموشی سے اپنے آپ میں`,
          englishContextualGloss: "in one's heart of hearts / secretly to oneself / inwardly",
          literaryNuanceNote: "اردو روزمرہ کی خاص ترکیب: لفظ کا اعادہ اور 'ہی' کا استعمال (X ہی X میں) یہ ظاہر کرتا ہے کہ کیفیت مکمل طور پر اندرونی ہے اور باہر بالکل ظاہر نہیں ہوئی۔",
          tokenTier: 'idiom_phrase',
          isPhrase: true,
        },
      });
    }

    // 3. Pattern B: Phrases containing 'دل ہی دل میں' + verbs (e.g. دل ہی دل میں مسکرانے لگے)
    if (normPhrase.includes('دل ہی دل میں')) {
      const isSmiling = normPhrase.includes('مسکرا') || normPhrase.includes('ہنس');
      const isThinking = normPhrase.includes('سوچ') || normPhrase.includes('کہا');
      const vocPhrase = normPhrase
        .replace('دل ہی دل میں', 'دِل ہی دِل میں')
        .replace('مسکرانے لگے', 'مُسکرانے لگے')
        .replace('مسکرانے لگا', 'مُسکرانے لگا');
      return c.json({
        success: true,
        data: {
          phraseText: rawPhrase,
          vocalizedForm: vocPhrase,
          phoneticBreakdownJson: makePhoneticBreakdown(vocPhrase),
          graphemesJson: UrduLanguagePack.decomposeWordToGraphemes(cleanPhrase).filter(
            (g) => g.raw.trim().length > 0
          ),
          spokenUrduSynonymsJson: isSmiling
            ? ['چپکے سے مسکرا دیے', 'اپنے آپ میں ہنسے']
            : isThinking
            ? ['اندر ہی اندر سوچا', 'اپنے آپ سے کہا']
            : ['اپنے اندر ہی اندر', 'چپکے سے'],
          urduSimpleExplanation: isSmiling
            ? 'خاموشی سے اور بغیر بتائے اپنے اندر ہی مسکرا دیے'
            : 'اپنے دل میں خاموشی سے کچھ سوچنا یا محسوس کرنا',
          englishContextualGloss: isSmiling
            ? 'began to smile secretly to himself / suppressed a quiet inner smile'
            : isThinking
            ? 'thought silently to oneself / pondered in one’s own heart'
            : "inwardly to oneself / in one's heart of hearts",
          literaryNuanceNote: "مرکب محاورہ: باطنی کیفیت 'دل ہی دل میں' کے ساتھ فعل کا امتزاج، جو اس کیفیت کے باطن میں شروع ہونے کو ظاہر کرتا ہے۔",
          tokenTier: 'idiom_phrase',
          isPhrase: true,
        },
      });
    }

    // 4. Pattern C: Prepositional Reduplication [Noun] بہ [Noun] (e.g. لمحہ بہ لمحہ, قدم بہ قدم, روز بہ روز, جا بہ جا, رو بہ رو)
    const baMatch = normPhrase.match(/^(\S+)\s+بہ\s+\1$/u);
    if (baMatch) {
      const base = baMatch[1];
      const vocBase = vocalizeUrduWord(base);
      const vocPhrase = `${vocBase} بَہ ${vocBase}`;
      const gloss =
        base === 'لمحہ'
          ? 'moment by moment / second by second / with each passing instant'
          : base === 'قدم'
          ? 'step by step / pace by pace / alongside'
          : base === 'روز'
          ? 'day by day / with each passing day'
          : base === 'رو'
          ? 'face to face / in direct confrontation'
          : `progressively / ${base} by ${base}`;
      return c.json({
        success: true,
        data: {
          phraseText: rawPhrase,
          vocalizedForm: vocPhrase,
          phoneticBreakdownJson: makePhoneticBreakdown(vocPhrase),
          graphemesJson: UrduLanguagePack.decomposeWordToGraphemes(cleanPhrase).filter(
            (g) => g.raw.trim().length > 0
          ),
          spokenUrduSynonymsJson: ['مسلسل', 'ساتھ ساتھ', 'ہر پل'],
          urduSimpleExplanation: `ہر ایک ${base} کے ساتھ، بتدریج اور مسلسل`,
          englishContextualGloss: gloss,
          literaryNuanceNote: "فارسی طرز کی ترکیب: حرفِ ربط 'بہ' کے ذریعے اسم کا تکرار مسلسل تسلسل اور تدریج کا مفہوم پیدا کرتا ہے۔",
          tokenTier: 'idiom_phrase',
          isPhrase: true,
        },
      });
    }

    // 5. Pattern D: Echo Pair / Exact Reduplication [Word] [Word] (e.g. پیارے پیارے, طرح طرح, تار تار, پائی پائی)
    const echoMatch = normPhrase.match(/^(\S+)\s+\1$/u);
    if (echoMatch) {
      const base = echoMatch[1];
      const vocBase = vocalizeUrduWord(base);
      const vocPhrase = `${vocBase} ${vocBase}`;
      return c.json({
        success: true,
        data: {
          phraseText: rawPhrase,
          vocalizedForm: vocPhrase,
          phoneticBreakdownJson: makePhoneticBreakdown(vocPhrase),
          graphemesJson: UrduLanguagePack.decomposeWordToGraphemes(cleanPhrase).filter(
            (g) => g.raw.trim().length > 0
          ),
          spokenUrduSynonymsJson: ['بہت سارے', 'مختلف قسم کے', 'بار بار'],
          urduSimpleExplanation: 'تکرارِ لفظی جو کثرت، شدت یا تنوع کو ظاہر کرتی ہے',
          englishContextualGloss: `all kinds of / various / intensified plural repetition of ${base}`,
          literaryNuanceNote: 'اردو میں تکرارِ لفظی معنی میں کثرت، شدت، یا تنوع پیدا کرنے کا خوبصورت اسلوب ہے۔',
          tokenTier: 'idiom_phrase',
          isPhrase: true,
        },
      });
    }

    // 6. General Multi-word Synthesis (lookup components from DB/vocab)
    const words = cleanPhrase.split(/\s+/);
    const vocalizedWords: string[] = [];
    const glosses: string[] = [];

    for (const w of words) {
      const entry = CONTEXTUAL_VOCAB[w];
      if (entry) {
        vocalizedWords.push(entry.vocalizedForm || w);
        if (entry.englishContextualGloss) glosses.push(entry.englishContextualGloss);
      } else {
        vocalizedWords.push(vocalizeUrduWord(w));
      }
    }

    const synthesizedVoc = vocalizedWords.join(' ');
    return c.json({
      success: true,
      data: {
        phraseText: rawPhrase,
        vocalizedForm: synthesizedVoc,
        phoneticBreakdownJson: makePhoneticBreakdown(synthesizedVoc),
        graphemesJson: UrduLanguagePack.decomposeWordToGraphemes(cleanPhrase).filter(
          (g) => g.raw.trim().length > 0
        ),
        spokenUrduSynonymsJson: [cleanPhrase],
        urduSimpleExplanation: `${cleanPhrase} کا مجموعی ادبی مفہوم`,
        englishContextualGloss: glosses.length > 0 ? glosses.join(' ') : lookupUrduWord(cleanPhrase, cleanPhrase).englishContextualGloss,
        literaryNuanceNote: 'ادبی عبارت یا کلام کا کثیر لفظی حصہ۔',
        tokenTier: 'idiom_phrase',
        isPhrase: true,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// -------------------------------------------------------------
const StoryIngestSchema = z.object({
  slug: z.string(),
  authorUrdu: z.string(),
  authorEnglish: z.string(),
  titleUrdu: z.string(),
  titleEnglish: z.string(),
  level: z.number().int().min(1).max(10),
  subLevel: z.string().optional(),
  format: z.string().optional(),
  targetVocabFocus: z.string().optional(),
  status: z.string().optional(),
  paragraphs: z.array(
    z.object({
      rawText: z.string(),
      audioUrl: z.string().optional(),
      sentences: z.array(
        z.object({
          index: z.number(),
          text: z.string(),
          startTimeMs: z.number().optional(),
          endTimeMs: z.number().optional(),
        })
      ).optional(),
    })
  ),
});

api.post('/stories/ingest', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = StoryIngestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.format() }, 400);
    }

    const input = parsed.data;
    const storyId = `story_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Ingest inside synchronous database operations
    db.insert(schema.stories)
      .values({
        id: storyId,
        slug: input.slug,
        authorUrdu: input.authorUrdu,
        authorEnglish: input.authorEnglish,
        titleUrdu: input.titleUrdu,
        titleEnglish: input.titleEnglish,
        level: input.level,
        subLevel: input.subLevel || `${input.level}.1`,
        format: input.format || 'short_story',
        targetVocabFocus: input.targetVocabFocus || null,
        status: input.status || 'ready',
        createdAt: new Date(),
      })
      .run();

    for (let pIdx = 0; pIdx < input.paragraphs.length; pIdx++) {
      const pData = input.paragraphs[pIdx];
      const pId = `p_${storyId}_${pIdx}`;
      const sentencesJson = pData.sentences || UrduLanguagePack.splitSentences(pData.rawText).map((sText, idx) => ({
        index: idx,
        text: sText,
        startTimeMs: 0,
        endTimeMs: Math.max(3500, sText.length * 85),
      }));

      db.insert(schema.paragraphs)
        .values({
          id: pId,
          storyId,
          paragraphIndex: pIdx,
          rawText: pData.rawText,
          audioUrl: pData.audioUrl || null,
          sentencesJson: sentencesJson,
        })
        .run();

      // Tokenize paragraph
      const tokens = UrduLanguagePack.tokenizeParagraph(pData.rawText);

      for (const tok of tokens) {
        const tokenId = `tok_${pId}_${tok.tokenIndex}`;

        db.insert(schema.tokens)
          .values({
            id: tokenId,
            paragraphId: pId,
            tokenIndex: tok.tokenIndex,
            surfaceForm: tok.surface,
            normalizedForm: tok.normalized,
            isWord: tok.isWord,
            sentenceIndex: tok.sentenceIndex,
            izafatGroupId: tok.izafatGroupId || null,
            compoundGroupId: tok.compoundGroupId || null,
          })
          .run();

        // If it's a word token, insert a rich token analysis
        if (tok.isWord) {
          const lexData = lookupUrduWord(tok.surface, tok.normalized, tok.compoundPhrase);
          const graphemes = UrduLanguagePack.decomposeWordToGraphemes(tok.compoundPhrase || tok.surface).filter(
            (g) => g.raw.trim().length > 0
          );
          const phonetic = makePhoneticBreakdown(lexData.vocalizedForm);

          db.insert(schema.tokenAnalyses)
            .values({
              id: `ana_${tokenId}`,
              tokenId,
              vocalizedForm: lexData.vocalizedForm,
              phoneticBreakdownJson: phonetic,
              graphemesJson: graphemes,
              spokenUrduSynonymsJson: lexData.spokenUrduSynonymsJson,
              urduSimpleExplanation: lexData.urduSimpleExplanation,
              izafatBreakdownUrdu: tok.izafatGroupId ? (lexData.izafatBreakdownUrdu || 'ترکیبِ اضافت کا جزو') : null,
              tokenTier: lexData.tokenTier,
              arabicRoot: lexData.arabicRoot || null,
              familiarCousinsJson: lexData.familiarCousinsJson || null,
              englishContextualGloss: lexData.englishContextualGloss,
              literaryNuanceNote: lexData.literaryNuanceNote || 'Ingested literary vocabulary item.',
            })
            .run();
        }
      }
    }

    return c.json({ success: true, storyId });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
