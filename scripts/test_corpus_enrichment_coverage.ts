import { Database } from 'bun:sqlite';
import { SHEIKH_CHILLI_VOCAB } from './sheikh_vocab_master';

const devDb = new Database('dev.db');
const wiktDb = new Database('data/wiktionary.db');

const rows = devDb.query("SELECT DISTINCT normalized_form FROM tokens WHERE is_word = 1;").all() as any[];
const uniqueWords = rows.map(r => r.normalized_form.trim()).filter(Boolean);

console.log(`Total unique words across all 30 stories: ${uniqueWords.length}`);

let inCurated = 0;
let inWikt = 0;
let inMorphWikt = 0;
const misses: string[] = [];

// Morphological candidates generator
function getMorphCandidates(w: string): { cand: string; suffixType: string }[] {
  const res: { cand: string; suffixType: string }[] = [];
  if (w.endsWith('وں') && w.length > 2) {
    const s = w.slice(0, -2);
    res.push({ cand: s + 'ہ', suffixType: 'oblique_plural' });
    res.push({ cand: s + 'ا', suffixType: 'oblique_plural' });
    res.push({ cand: s, suffixType: 'oblique_plural' });
    res.push({ cand: s + 'ی', suffixType: 'oblique_plural' });
  }
  if (w.endsWith('یں') && w.length > 2) {
    const s = w.slice(0, -2);
    res.push({ cand: s, suffixType: 'plural_fem' });
    res.push({ cand: s + 'ی', suffixType: 'plural_fem' });
  }
  if (w.endsWith('ے') && w.length > 2) {
    const s = w.slice(0, -1);
    res.push({ cand: s + 'ا', suffixType: 'plural_masc' });
    res.push({ cand: s + 'ہ', suffixType: 'plural_masc' });
    res.push({ cand: s + 'نا', suffixType: 'infinitive_oblique' });
  }
  if (w.endsWith('ات') && w.length > 3) {
    const s = w.slice(0, -2);
    res.push({ cand: s + 'ہ', suffixType: 'arabic_plural' });
    res.push({ cand: s, suffixType: 'arabic_plural' });
  }
  if ((w.endsWith('تا') || w.endsWith('تی') || w.endsWith('تے')) && w.length > 2) {
    const s = w.slice(0, -2);
    res.push({ cand: s + 'نا', suffixType: 'participle' });
  }
  return res;
}

for (const w of uniqueWords) {
  if (SHEIKH_CHILLI_VOCAB[w]) {
    inCurated++;
    continue;
  }
  const hit = wiktDb.query("SELECT * FROM dictionary WHERE word = ?;").get(w) as any;
  if (hit && hit.gloss && !hit.gloss.includes('literary term')) {
    inWikt++;
    continue;
  }

  // Try morph candidates
  const cands = getMorphCandidates(w);
  let matched = false;
  for (const c of cands) {
    const mHit = wiktDb.query("SELECT * FROM dictionary WHERE word = ?;").get(c.cand) as any;
    if (mHit && mHit.gloss && !mHit.gloss.includes('literary term')) {
      inMorphWikt++;
      matched = true;
      break;
    }
  }

  if (!matched) {
    misses.push(w);
  }
}

console.log(`Matched in Master Curated Lexicon: ${inCurated}`);
console.log(`Matched directly in Wiktionary: ${inWikt}`);
console.log(`Matched via Morphological Inflection in Wiktionary: ${inMorphWikt}`);
console.log(`Total resolved: ${inCurated + inWikt + inMorphWikt} / ${uniqueWords.length} (${(((inCurated + inWikt + inMorphWikt) / uniqueWords.length) * 100).toFixed(1)}%)`);
console.log(`Remaining unmatched: ${misses.length}`);
