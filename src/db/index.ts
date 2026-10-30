import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

const sqlite = new Database('dev.db', { create: true });
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA synchronous = NORMAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');
sqlite.exec('PRAGMA cache_size = -2000;');
sqlite.exec('PRAGMA mmap_size = 0;');

// Create tables automatically if not already created
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    author_urdu TEXT NOT NULL,
    author_english TEXT NOT NULL,
    title_urdu TEXT NOT NULL,
    title_english TEXT NOT NULL,
    level INTEGER NOT NULL,
    sub_level TEXT NOT NULL DEFAULT '1.1',
    format TEXT NOT NULL DEFAULT 'short_story',
    target_vocab_focus TEXT,
    source_url TEXT,
    status TEXT NOT NULL DEFAULT 'ready',
    description_english TEXT,
    scene_vocab_preview_json TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS paragraphs (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    paragraph_index INTEGER NOT NULL,
    raw_text TEXT NOT NULL,
    audio_url TEXT,
    sentences_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_paragraphs_story ON paragraphs(story_id, paragraph_index);

  CREATE TABLE IF NOT EXISTS tokens (
    id TEXT PRIMARY KEY,
    paragraph_id TEXT NOT NULL REFERENCES paragraphs(id) ON DELETE CASCADE,
    token_index INTEGER NOT NULL,
    surface_form TEXT NOT NULL,
    normalized_form TEXT NOT NULL,
    is_word INTEGER NOT NULL,
    sentence_index INTEGER NOT NULL,
    izafat_group_id TEXT,
    compound_group_id TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_tokens_paragraph ON tokens(paragraph_id, token_index);

  CREATE TABLE IF NOT EXISTS token_analyses (
    id TEXT PRIMARY KEY,
    token_id TEXT NOT NULL UNIQUE REFERENCES tokens(id) ON DELETE CASCADE,
    vocalized_form TEXT NOT NULL,
    phonetic_breakdown_json TEXT NOT NULL,
    graphemes_json TEXT NOT NULL,
    spoken_urdu_synonyms_json TEXT NOT NULL,
    urdu_simple_explanation TEXT NOT NULL,
    izafat_breakdown_urdu TEXT,
    token_tier TEXT NOT NULL,
    arabic_root TEXT,
    familiar_cousins_json TEXT,
    english_contextual_gloss TEXT NOT NULL,
    literary_nuance_note TEXT
  );

  CREATE TABLE IF NOT EXISTS user_telemetry (
    id TEXT PRIMARY KEY,
    normalized_surface TEXT NOT NULL,
    vocalized_surface TEXT NOT NULL,
    lookup_count INTEGER NOT NULL DEFAULT 1,
    max_tap_level INTEGER NOT NULL DEFAULT 1,
    last_tap_level INTEGER NOT NULL DEFAULT 1,
    story_id TEXT,
    story_slug TEXT,
    story_title_urdu TEXT,
    source_sentence_urdu TEXT,
    mastery_status TEXT NOT NULL DEFAULT 'learning',
    is_starred INTEGER NOT NULL DEFAULT 0,
    last_seen_at INTEGER NOT NULL,
    last_reviewed_at INTEGER
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_telemetry_lexeme ON user_telemetry(normalized_surface, vocalized_surface);
`);

// Safe migrations for newly added columns
try {
  sqlite.exec("ALTER TABLE stories ADD COLUMN sub_level TEXT NOT NULL DEFAULT '1.1';");
} catch (_) {}
try {
  sqlite.exec("ALTER TABLE stories ADD COLUMN format TEXT NOT NULL DEFAULT 'short_story';");
} catch (_) {}
try {
  sqlite.exec('ALTER TABLE stories ADD COLUMN target_vocab_focus TEXT;');
} catch (_) {}
try {
  sqlite.exec('ALTER TABLE stories ADD COLUMN source_url TEXT;');
} catch (_) {}
try {
  sqlite.exec("ALTER TABLE stories ADD COLUMN status TEXT NOT NULL DEFAULT 'ready';");
} catch (_) {}
try {
  sqlite.exec('ALTER TABLE stories ADD COLUMN description_english TEXT;');
} catch (_) {}
try {
  sqlite.exec('ALTER TABLE stories ADD COLUMN scene_vocab_preview_json TEXT;');
} catch (_) {}
try {
  sqlite.exec('ALTER TABLE user_telemetry ADD COLUMN story_id TEXT;');
} catch (_) {}
try {
  sqlite.exec('ALTER TABLE user_telemetry ADD COLUMN story_slug TEXT;');
} catch (_) {}
try {
  sqlite.exec('ALTER TABLE user_telemetry ADD COLUMN story_title_urdu TEXT;');
} catch (_) {}
try {
  sqlite.exec('ALTER TABLE user_telemetry ADD COLUMN source_sentence_urdu TEXT;');
} catch (_) {}
try {
  sqlite.exec("ALTER TABLE user_telemetry ADD COLUMN mastery_status TEXT NOT NULL DEFAULT 'learning';");
} catch (_) {}
try {
  sqlite.exec('ALTER TABLE user_telemetry ADD COLUMN is_starred INTEGER NOT NULL DEFAULT 0;');
} catch (_) {}
try {
  sqlite.exec('ALTER TABLE user_telemetry ADD COLUMN last_reviewed_at INTEGER;');
} catch (_) {}

export const db = drizzle(sqlite, { schema });
export { sqlite };
