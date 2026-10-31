const https = require('https');
const readline = require('readline');

https.get('https://kaikki.org/dictionary/Urdu/kaikki.org-dictionary-Urdu.jsonl', (res) => {
  const rl = readline.createInterface({ input: res });
  rl.on('line', (line) => {
    try {
      const entry = JSON.parse(line);
      if (entry.word && entry.word.includes('انوکھ')) {
        console.log('MATCH:', JSON.stringify(entry, null, 2));
      }
    } catch (e) {}
  });
  rl.on('close', () => {
    console.log('Finished stream');
  });
});
