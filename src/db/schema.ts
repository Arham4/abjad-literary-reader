import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { GraphemeUnit, PhoneticSyllablePill } from '../lib/abjad/types';

export interface SentenceTiming {
  index: number;
  text: string;
  startTimeMs?: number;
  endTimeMs?: number;
}

export const stories = sqliteTable('stories', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  authorUrdu: text('author_urdu').notNull(),
  authorEnglish: text('author_english').notNull(),
  titleUrdu: text('title_urdu').notNull(),
  titleEnglish: text('title_english').notNull(),
  level: integer('level').notNull(), // 1 (Novice), 2 (Literary), 3 (High Classical)
  descriptionEnglish: text('description_english'),
  sceneVocabPreviewJson: text('scene_vocab_preview_json', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const paragraphs = sqliteTable('paragraphs', {
  id: text('id').primaryKey(),
  storyId: text('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  paragraphIndex: integer('paragraph_index').notNull(),
  rawText: text('raw_text').notNull(),
  audioUrl: text('audio_url'),
  sentencesJson: text('sentences_json', { mode: 'json' }).$type<SentenceTiming[]>().notNull(),
}, (table) => [
  index('idx_paragraphs_story').on(table.storyId, table.paragraphIndex),
]);

export const tokens = sqliteTable('tokens', {
  id: text('id').primaryKey(),
  paragraphId: text('paragraph_id').notNull().references(() => paragraphs.id, { onDelete: 'cascade' }),
  tokenIndex: integer('token_index').notNull(),
  surfaceForm: text('surface_form').notNull(),
  normalizedForm: text('normalized_form').notNull(),
  isWord: integer('is_word', { mode: 'boolean' }).notNull(),
  sentenceIndex: integer('sentence_index').notNull(),
  izafatGroupId: text('izafat_group_id'),
  compoundGroupId: text('compound_group_id'),
}, (table) => [
  index('idx_tokens_paragraph').on(table.paragraphId, table.tokenIndex),
]);

export const tokenAnalyses = sqliteTable('token_analyses', {
  id: text('id').primaryKey(),
  tokenId: text('token_id').notNull().unique().references(() => tokens.id, { onDelete: 'cascade' }),
  vocalizedForm: text('vocalized_form').notNull(),
  phoneticBreakdownJson: text('phonetic_breakdown_json', { mode: 'json' }).$type<PhoneticSyllablePill[]>().notNull(),
  graphemesJson: text('graphemes_json', { mode: 'json' }).$type<GraphemeUnit[]>().notNull(),
  spokenUrduSynonymsJson: text('spoken_urdu_synonyms_json', { mode: 'json' }).$type<string[]>().notNull(),
  urduSimpleExplanation: text('urdu_simple_explanation').notNull(),
  izafatBreakdownUrdu: text('izafat_breakdown_urdu'),
  tokenTier: text('token_tier').$type<'function_word' | 'common_vocab' | 'literary_vocab'>().notNull(),
  arabicRoot: text('arabic_root'),
  familiarCousinsJson: text('familiar_cousins_json', { mode: 'json' }).$type<string[]>(),
  englishContextualGloss: text('english_contextual_gloss').notNull(),
  literaryNuanceNote: text('literary_nuance_note'),
});

export const userTelemetry = sqliteTable('user_telemetry', {
  id: text('id').primaryKey(),
  normalizedSurface: text('normalized_surface').notNull(),
  vocalizedSurface: text('vocalized_surface').notNull(),
  lookupCount: integer('lookup_count').notNull().default(1),
  maxTapLevel: integer('max_tap_level').notNull().default(1),
  lastTapLevel: integer('last_tap_level').notNull().default(1),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex('idx_telemetry_lexeme').on(table.normalizedSurface, table.vocalizedSurface),
]);
