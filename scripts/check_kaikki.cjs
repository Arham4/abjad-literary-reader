const https = require('https');

function checkHead(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ url, status: res.statusCode, length: res.headers['content-length'], type: res.headers['content-type'] });
    });
    req.on('error', err => resolve({ url, status: 500, error: err.message }));
    req.end();
  });
}

async function main() {
  const urls = [
    'https://kaikki.org/dictionary/Urdu/kaikki.org-dictionary-Urdu.jsonl',
    'https://kaikki.org/dictionary/Urdu/kaikki.org-dictionary-Urdu.json',
    'https://kaikki.org/dictionary/Urdu/kaikki-org-dictionary-Urdu.jsonl',
    'https://kaikki.org/dictionary/Urdu/words/kaikki.org-dictionary-Urdu-words.jsonl'
  ];
  for (const u of urls) {
    console.log(await checkHead(u));
  }
}

main();
