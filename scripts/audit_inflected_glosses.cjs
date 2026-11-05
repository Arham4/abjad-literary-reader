const { Database } = require('bun:sqlite');
const db = new Database('dev.db');

const rows = db.query(`
  SELECT t.surface_form, ta.vocalized_form, ta.english_contextual_gloss
  FROM tokens t
  JOIN token_analyses ta ON ta.token_id = t.id
  WHERE t.is_word = 1 AND (
    ta.english_contextual_gloss LIKE '%(plural/inflected)%' OR
    ta.english_contextual_gloss LIKE '%(plural oblique)%' OR
    ta.english_contextual_gloss LIKE '%(plural)%' OR
    ta.english_contextual_gloss LIKE '%(feminine)%' OR
    ta.english_contextual_gloss LIKE '%(Urdu literary%'
  );
`).all();

console.log('Total inflected/literary fallbacks:', rows.length);
const freq = new Map();
for (const r of rows) {
  // Check if English gloss still contains Urdu characters
  if (/[\u0600-\u06FF]/.test(r.english_contextual_gloss)) {
    freq.set(r.english_contextual_gloss, (freq.get(r.english_contextual_gloss) || 0) + 1);
  }
}

console.log('Unique glosses containing Urdu characters:', freq.size);
console.log('Top 30:', Array.from(freq.entries()).sort((a,b) => b[1] - a[1]).slice(0, 30));
