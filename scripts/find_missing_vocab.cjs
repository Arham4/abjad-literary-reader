const { Database } = require('bun:sqlite');
const sqlite = new Database('dev.db');

const rows = sqlite.query(`
  SELECT t.normalized_form, COUNT(*) as freq,
         a.vocalized_form, a.english_contextual_gloss
  FROM tokens t
  JOIN token_analyses a ON t.id = a.token_id
  WHERE t.is_word = 1
  GROUP BY t.normalized_form
  ORDER BY freq DESC;
`).all();

console.log('Total unique words in corpus:', rows.length);

const missingEngWords = rows.filter(r => 
  !r.english_contextual_gloss || 
  r.english_contextual_gloss.includes('literary term') || 
  r.english_contextual_gloss.includes('contextual expression') || 
  r.english_contextual_gloss.startsWith(`[${r.normalized_form}]`)
);

console.log('Unique words with generic/missing English:', missingEngWords.length);
console.log('Top 40 missing English words by frequency:');
for (const w of missingEngWords.slice(0, 40)) {
  console.log(`  - "${w.normalized_form}" (freq: ${w.freq})`);
}
