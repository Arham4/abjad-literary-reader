const fs = require('fs');
const https = require('https');
const readline = require('readline');
const { Database } = require('bun:sqlite');

async function main() {
  console.log('Downloading and streaming kaikki.org-dictionary-Urdu.jsonl...');

  // Connect to dev.db to get all unique normalized words from our corpus
  const devDb = new Database('dev.db');
  const corpusWords = new Set(
    devDb.query("SELECT DISTINCT normalized_form FROM tokens WHERE is_word = 1;").all().map(r => r.normalized_form)
  );
  console.log(`Target corpus unique words to resolve: ${corpusWords.size}`);

  // Create an output SQLite table or map for fast lookups
  const outDb = new Database('data/wiktionary.db');
  outDb.exec(`
    CREATE TABLE IF NOT EXISTS dictionary (
      word TEXT PRIMARY KEY,
      vocalized TEXT,
      pos TEXT,
      gloss TEXT,
      synonyms_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_dict_word ON dictionary(word);
  `);

  const insertStmt = outDb.prepare(`
    INSERT OR REPLACE INTO dictionary (word, vocalized, pos, gloss, synonyms_json)
    VALUES (?, ?, ?, ?, ?);
  `);

  const url = 'https://kaikki.org/dictionary/Urdu/kaikki.org-dictionary-Urdu.jsonl';

  https.get(url, (res) => {
    const rl = readline.createInterface({ input: res });
    let totalEntries = 0;
    let matchedWords = 0;

    outDb.exec('BEGIN TRANSACTION;');

    rl.on('line', (line) => {
      totalEntries++;
      try {
        const item = JSON.parse(line);
        const word = (item.word || '').trim();
        if (!word) return;

        // Extract vocalized form: from head_templates or forms
        let vocalized = word;
        if (item.head_templates && item.head_templates[0]?.args?.head) {
          vocalized = item.head_templates[0].args.head;
        } else if (item.forms) {
          const canon = item.forms.find(f => f.tags?.includes('canonical'));
          if (canon && canon.form) vocalized = canon.form;
        }

        // Clean vocalized form: remove bullet points or wiki markup
        vocalized = vocalized.replace(/[•*]/g, '').trim();

        // Extract glosses
        const glosses = [];
        if (item.senses) {
          for (const s of item.senses) {
            if (s.glosses) {
              for (const g of s.glosses) {
                if (typeof g === 'string' && !g.startsWith('inflection of') && !g.startsWith('no-table-tags')) {
                  glosses.push(g);
                }
              }
            }
          }
        }
        const gloss = glosses.slice(0, 3).join('; ') || (item.senses?.[0]?.glosses?.[0] || '');

        // Extract synonyms if any
        const syns = [];
        if (item.senses) {
          for (const s of item.senses) {
            if (s.synonyms) {
              for (const sy of s.synonyms) {
                if (sy.word) syns.push(sy.word);
              }
            }
          }
        }

        if (gloss || vocalized !== word) {
          insertStmt.run(word, vocalized, item.pos || '', gloss, JSON.stringify(syns));
          if (corpusWords.has(word)) {
            matchedWords++;
          }
        }

        // Also check inflection forms (e.g. anokhe -> anokha)
        if (item.forms) {
          for (const f of item.forms) {
            const fWord = (f.form || '').replace(/[•*]/g, '').trim();
            const fVoc = fWord;
            const fNorm = fWord.replace(/[\u064B-\u0652\u0670\u0653]/g, '').trim();
            if (fNorm && (gloss || fVoc !== fNorm)) {
              insertStmt.run(fNorm, fVoc, item.pos || '', gloss, JSON.stringify(syns));
              if (corpusWords.has(fNorm)) {
                matchedWords++;
              }
            }
          }
        }

        if (totalEntries % 5000 === 0) {
          console.log(`Processed ${totalEntries} Wiktionary lines, matched ${matchedWords} corpus words so far...`);
        }
      } catch (err) {}
    });

    rl.on('close', () => {
      outDb.exec('COMMIT;');
      console.log(`\n✅ Finished! Processed ${totalEntries} entries.`);
      console.log(`Matched corpus words: ${matchedWords} out of ${corpusWords.size}`);
    });
  });
}

main();
