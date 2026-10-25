import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq, sql, desc, asc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import * as schema from '../db/schema';
import { UrduLanguagePack } from '../lib/abjad/packs/urdu';
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
      .orderBy(asc(schema.stories.level))
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
});

api.post('/telemetry', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = TelemetrySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.format() }, 400);
    }

    const { normalizedSurface, vocalizedSurface, tapLevel } = parsed.data;

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

    // Enrich with analysis data
    const enriched = items.map((item) => {
      const analysis = db
        .select()
        .from(schema.tokenAnalyses)
        .where(eq(schema.tokenAnalyses.vocalizedForm, item.vocalizedSurface))
        .get();

      return {
        ...item,
        englishGloss: analysis?.englishContextualGloss || null,
        urduExplanation: analysis?.urduSimpleExplanation || null,
        spokenSynonyms: analysis?.spokenUrduSynonymsJson || [],
        arabicRoot: analysis?.arabicRoot || null,
        cousins: analysis?.familiarCousinsJson || [],
      };
    });

    return c.json({ success: true, data: enriched });
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
  const normalized = text.normalize('NFC').trim();

  // Neural TTS phonetic correction for isolated 'آنوں' / 'آنُوں' (annas):
  // When spoken in isolation, neural models often slur 'آنوں' into 'ایِنو' (eeno),
  // dropping the crucial Alif Madda. Segmenting to 'آ نوں' guarantees that the neural voice
  // pronounces the open long vowel /aː/ (Alif with Madda) followed by 'noñ' (/aːnõː/).
  if (/^آن[ُ]?[و]?[ں]?$/u.test(normalized)) {
    return 'آ نوں';
  }

  // Strip combining diacritics / harakat / jazm (U+064B - U+0652, U+0656 - U+065F, U+06DF - U+06E8)
  // Standalone diacritics (especially jazm/sukūn \u0652) on isolated words cause neural Urdu TTS models
  // to spell out individual letter phonemes rather than reading the natural word vocabulary.
  // Note: Alif with Madda (\u0622) and Combining Madda (\u0653) are strictly preserved.
  return normalized.replace(/[\u064B-\u0652\u0656-\u065F\u06DF-\u06E8]/g, '').trim();
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
// 6. POST /api/stories/ingest - Ingest new story with paragraphs
// -------------------------------------------------------------
const StoryIngestSchema = z.object({
  slug: z.string(),
  authorUrdu: z.string(),
  authorEnglish: z.string(),
  titleUrdu: z.string(),
  titleEnglish: z.string(),
  level: z.number().int().min(1).max(3),
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
      ),
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
        createdAt: new Date(),
      })
      .run();

    for (let pIdx = 0; pIdx < input.paragraphs.length; pIdx++) {
      const pData = input.paragraphs[pIdx];
      const pId = `p_${storyId}_${pIdx}`;

      db.insert(schema.paragraphs)
        .values({
          id: pId,
          storyId,
          paragraphIndex: pIdx,
          rawText: pData.rawText,
          audioUrl: pData.audioUrl || null,
          sentencesJson: pData.sentences,
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
          const graphemes = UrduLanguagePack.decomposeWordToGraphemes(tok.surface);
          
          db.insert(schema.tokenAnalyses)
            .values({
              id: `ana_${tokenId}`,
              tokenId,
              vocalizedForm: tok.surface,
              phoneticBreakdownJson: [{ letters: tok.surface }],
              graphemesJson: graphemes,
              spokenUrduSynonymsJson: [tok.normalized],
              urduSimpleExplanation: `${tok.surface} کا وضاحتی مفہوم`,
              izafatBreakdownUrdu: tok.izafatGroupId ? 'ترکیبِ اضافت کا جزو' : null,
              tokenTier: 'common_vocab',
              arabicRoot: null,
              familiarCousinsJson: null,
              englishContextualGloss: tok.normalized,
              literaryNuanceNote: 'Ingested literary vocabulary item.',
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
