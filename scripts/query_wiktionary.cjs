const { Database } = require('bun:sqlite');
const db = new Database('data/wiktionary.db');

const testWords = ['انوکھے', 'انوکھا', 'انوکھی', 'کر', 'جو', 'ہوا', 'صاحب', 'مینا', 'بابو', 'سوگندھی', 'قفس', 'پیسوں', 'چمٹا'];
for (const w of testWords) {
  const row = db.query("SELECT * FROM dictionary WHERE word = ?;").get(w);
  console.log(`Word: "${w}" ->`, row ? { vocalized: row.vocalized, gloss: row.gloss, pos: row.pos } : 'NOT FOUND');
}
