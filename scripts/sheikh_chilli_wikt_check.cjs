const { Database } = require('bun:sqlite');
const devDb = new Database('dev.db');
const wiktDb = new Database('data/wiktionary.db');

const rows = devDb.query(`
  SELECT DISTINCT t.normalized_form
  FROM tokens t
  JOIN paragraphs p ON t.paragraph_id = p.id
  JOIN stories s ON p.story_id = s.id
  WHERE s.slug = 'sheikh-chilli' AND t.is_word = 1
  ORDER BY t.normalized_form;
`).all();

console.log(`Unique words in Sheikh Chilli: ${rows.length}`);

let inWikt = 0;
let missing = [];

for (const r of rows) {
  const hit = wiktDb.query("SELECT * FROM dictionary WHERE word = ?;").get(r.normalized_form);
  if (hit && hit.vocalized && hit.gloss) {
    inWikt++;
  } else {
    missing.push(r.normalized_form);
  }
}

console.log(`Found in Wiktionary: ${inWikt} / ${rows.length} (${((inWikt / rows.length) * 100).toFixed(1)}%)`);
console.log(`Missing from Wiktionary: ${missing.length}`);
console.log('Missing list:', JSON.stringify(missing));
