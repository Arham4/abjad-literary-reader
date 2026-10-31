const { Database } = require('bun:sqlite');
const devDb = new Database('dev.db');
const wiktDb = new Database('data/wiktionary.db');

const rows = devDb.query(`
  SELECT t.normalized_form, COUNT(*) as freq,
         a.vocalized_form, a.english_contextual_gloss
  FROM tokens t
  JOIN token_analyses a ON t.id = a.token_id
  WHERE t.is_word = 1
  GROUP BY t.normalized_form
  ORDER BY freq DESC;
`).all();

const missingEngWords = rows.filter(r => 
  !r.english_contextual_gloss || 
  r.english_contextual_gloss.includes('literary term') || 
  r.english_contextual_gloss.includes('contextual expression') || 
  r.english_contextual_gloss.startsWith(`[${r.normalized_form}]`)
);

console.log('Total words previously missing:', missingEngWords.length);

let nowFound = 0;
let stillMissing = [];

for (const r of missingEngWords) {
  const hit = wiktDb.query("SELECT * FROM dictionary WHERE word = ?;").get(r.normalized_form);
  if (hit && hit.gloss) {
    nowFound++;
  } else {
    stillMissing.push(r);
  }
}

console.log(`Now found in Wiktionary: ${nowFound} (${((nowFound / missingEngWords.length) * 100).toFixed(1)}%)`);
console.log(`Still missing: ${stillMissing.length}`);
console.log('Top 30 still missing by frequency:');
for (const w of stillMissing.slice(0, 30)) {
  console.log(`  - "${w.normalized_form}" (freq: ${w.freq})`);
}
