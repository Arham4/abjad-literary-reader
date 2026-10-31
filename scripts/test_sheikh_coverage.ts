import { Database } from 'bun:sqlite';
import fs from 'fs';

const devDb = new Database('dev.db');
const wiktDb = new Database('data/wiktionary.db');

// Read sheikh chilli words
const words: string[] = JSON.parse(fs.readFileSync('scripts/sheikh_chilli_words.json', 'utf8'));

console.log(`Total words to check: ${words.length}`);

// Check wiktionary
const wiktHits: Record<string, any> = {};
const wiktMisses: string[] = [];

for (const w of words) {
  const hit = wiktDb.query("SELECT * FROM dictionary WHERE word = ?;").get(w) as any;
  if (hit && hit.vocalized && hit.gloss && !hit.gloss.includes('literary term')) {
    wiktHits[w] = hit;
  } else {
    wiktMisses.push(w);
  }
}

console.log(`Wiktionary coverage: ${Object.keys(wiktHits).length} / ${words.length}`);
console.log(`Misses count: ${wiktMisses.length}`);
console.log('Misses:', JSON.stringify(wiktMisses));
