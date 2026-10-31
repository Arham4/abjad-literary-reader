import { Database } from 'bun:sqlite';
import { SHEIKH_CHILLI_VOCAB } from './sheikh_vocab_master';
import { makePhoneticBreakdown } from '../src/lib/abjad/packs/urduVocalizer';
import { UrduLanguagePack } from '../src/lib/abjad/packs/urdu';

const db = new Database('dev.db');

console.log('--- Starting Sheikh Chilli Enrichment ---');

// Get all word tokens for sheikh-chilli
const tokens = db.query(`
  SELECT t.id, t.surface_form, t.normalized_form, t.compound_group_id, a.id as analysis_id
  FROM tokens t
  JOIN paragraphs p ON t.paragraph_id = p.id
  JOIN stories s ON p.story_id = s.id
  LEFT JOIN token_analyses a ON t.id = a.token_id
  WHERE s.slug = 'sheikh-chilli' AND t.is_word = 1
  ORDER BY t.token_index;
`).all() as any[];

console.log(`Found ${tokens.length} word tokens in Sheikh Chilli`);

const updateStmt = db.prepare(`
  INSERT INTO token_analyses (
    id, token_id, vocalized_form, phonetic_breakdown_json, graphemes_json,
    spoken_urdu_synonyms_json, urdu_simple_explanation, token_tier,
    english_contextual_gloss, literary_nuance_note
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  )
  ON CONFLICT(id) DO UPDATE SET
    vocalized_form = excluded.vocalized_form,
    phonetic_breakdown_json = excluded.phonetic_breakdown_json,
    graphemes_json = excluded.graphemes_json,
    spoken_urdu_synonyms_json = excluded.spoken_urdu_synonyms_json,
    urdu_simple_explanation = excluded.urdu_simple_explanation,
    token_tier = excluded.token_tier,
    english_contextual_gloss = excluded.english_contextual_gloss,
    literary_nuance_note = excluded.literary_nuance_note;
`);

db.exec('BEGIN TRANSACTION;');

let enrichedCount = 0;

for (const t of tokens) {
  const norm = (t.normalized_form || '').trim();
  const cleanNorm = norm.replace(/^[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+|[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+$/gu, '').trim();
  
  let entry = SHEIKH_CHILLI_VOCAB[norm] || SHEIKH_CHILLI_VOCAB[cleanNorm];
  if (!entry) {
    // If surface matches
    entry = SHEIKH_CHILLI_VOCAB[t.surface_form];
  }

  if (!entry) {
    console.warn(`WARNING: Missing curated entry for "${norm}" (surface: "${t.surface_form}")`);
    continue;
  }

  const vocalized = entry.vocalized;
  const pills = makePhoneticBreakdown(vocalized);
  const graphemes = UrduLanguagePack.decomposeWordToGraphemes(t.surface_form).filter((g) => g.raw.trim().length > 0);
  const tier = ['کَا', 'کِے', 'کِی', 'کُو', 'مَیں', 'سِے', 'اَور', 'پَر', 'ہَے', 'ہَیں', 'تھَا', 'تھِی', 'تھِے', 'نِے', 'وَ'].includes(vocalized)
    ? 'function_word'
    : 'common_vocab';

  const anaId = t.analysis_id || `ana_${t.id}`;

  updateStmt.run(
    anaId,
    t.id,
    vocalized,
    JSON.stringify(pills),
    JSON.stringify(graphemes),
    JSON.stringify(entry.syns),
    entry.expl,
    tier,
    entry.eng,
    `Curated literary analysis for Sheikh Chilli: ${entry.eng}`
  );

  enrichedCount++;
}

db.exec('COMMIT;');

console.log(`✅ Successfully enriched ${enrichedCount} / ${tokens.length} tokens for Sheikh Chilli!`);
