import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq, sql, desc } from 'drizzle-orm';
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
    const allStories = db.select().from(schema.stories).all().map((s) => ({
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
// 5. GET/POST /api/tts - Audio synthesis with SHA-256 caching
// -------------------------------------------------------------
const handleTTS = async (vocalizedText: string, lang = 'ur-PK') => {
  if (!vocalizedText) {
    return { error: 'Text required', status: 400 };
  }

  // 1. Compute deterministic SHA-256 hash using Bun.CryptoHasher
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(`${lang}:${vocalizedText.trim()}`);
  const hash = hasher.digest('hex');

  const cacheFileName = `${hash}.mp3`;
  const cacheFilePath = join(AUDIO_CACHE_DIR, cacheFileName);

  // Check if cache file exists
  if (existsSync(cacheFilePath)) {
    return { data: { audioUrl: `/audio/cache/${cacheFileName}`, cached: true } };
  }

  // 2. If Bun.env.TTS_API_KEY is configured, synthesize audio and write via Bun.write()
  const apiKey = process.env.TTS_API_KEY;
  if (apiKey) {
    try {
      // Example external TTS API synthesis hook
      const res = await fetch(`https://api.tts-provider.com/synthesize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: vocalizedText, language: lang }),
      });
      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        await Bun.write(cacheFilePath, audioBuffer);
        return { data: { audioUrl: `/audio/cache/${cacheFileName}`, cached: false } };
      }
    } catch {
      // Fallback if synthesis failed
    }
  }

  // 3. Fetch native spoken Urdu MP3 from Google Translate TTS endpoint (with chunking for long sentences)
  try {
    const chunks = splitTextForTTS(vocalizedText.trim(), 160);
    const audioBuffers: Uint8Array[] = [];

    for (const chunk of chunks) {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=ur&client=tw-ob`;
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
      return { data: { audioUrl: `/audio/cache/${cacheFileName}`, cached: false } };
    }
  } catch (ttsErr) {
    console.warn('Google TTS fetch error:', ttsErr);
  }

  // 4. Fallback to Web Speech API format
  return {
    data: {
      fallback: 'web-speech',
      text: vocalizedText,
      lang: 'ur-PK',
      hash,
    },
  };
};

api.get('/tts', async (c) => {
  const text = c.req.query('text') || '';
  const lang = c.req.query('lang') || 'ur-PK';
  const result = await handleTTS(text, lang);
  if (result.error) return c.json({ success: false, error: result.error }, 400);
  return c.json({ success: true, ...result.data });
});

api.post('/tts', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const text = body.text || '';
  const lang = body.lang || 'ur-PK';
  const result = await handleTTS(text, lang);
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
