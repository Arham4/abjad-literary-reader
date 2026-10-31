import { Database } from 'bun:sqlite';
import { SHEIKH_CHILLI_VOCAB } from './sheikh_vocab_master';

const devDb = new Database('dev.db');
const wiktDb = new Database('data/wiktionary.db');

const rows = devDb.query(`
  SELECT t.normalized_form, count(*) as freq
  FROM tokens t
  WHERE t.is_word = 1
  GROUP BY t.normalized_form
  ORDER BY freq DESC;
`).all() as any[];

const topUnmatched: any[] = [];

for (const r of rows) {
  const w = r.normalized_form.trim();
  if (SHEIKH_CHILLI_VOCAB[w]) continue;
  const hit = wiktDb.query("SELECT * FROM dictionary WHERE word = ?;").get(w) as any;
  if (hit && hit.gloss && !hit.gloss.includes('literary term')) continue;
  topUnmatched.push({ word: w, freq: r.freq });
  if (topUnmatched.length >= 50) break;
}

console.log('Top 50 most frequent unmatched words across the corpus:');
console.log(JSON.stringify(topUnmatched, null, 2));
