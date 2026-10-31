const { Database } = require('bun:sqlite');
const fs = require('fs');
const db = new Database('dev.db');

const rows = db.query(`
  SELECT DISTINCT t.normalized_form
  FROM tokens t
  JOIN paragraphs p ON t.paragraph_id = p.id
  JOIN stories s ON p.story_id = s.id
  WHERE s.slug = 'sheikh-chilli' AND t.is_word = 1
  ORDER BY t.normalized_form;
`).all().map(r => r.normalized_form);

console.log('Unique words count:', rows.length);
fs.writeFileSync('scripts/sheikh_chilli_words.json', JSON.stringify(rows, null, 2), 'utf8');
console.log('Wrote scripts/sheikh_chilli_words.json');
