const https = require('https');
const readline = require('readline');

https.get('https://kaikki.org/dictionary/Urdu/kaikki.org-dictionary-Urdu.jsonl', (res) => {
  const rl = readline.createInterface({ input: res });
  let count = 0;
  rl.on('line', (line) => {
    try {
      const entry = JSON.parse(line);
      console.log('--- Word:', entry.word);
      console.log('POS:', entry.pos);
      if (entry.forms) console.log('Forms:', entry.forms.map(f => f.form));
      if (entry.senses) console.log('Glosses:', entry.senses.map(s => s.glosses));
      count++;
      if (count >= 5) {
        rl.close();
        process.exit(0);
      }
    } catch (e) {
      console.error(e);
    }
  });
});
