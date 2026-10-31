const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', err => resolve({ status: 500, error: err.message }));
  });
}

async function test() {
  const r1 = await fetchUrl('https://rekhtadictionary.com/api/dictionary/search?keyword=anokha');
  console.log('Search anokha:', r1.status, r1.data ? r1.data.slice(0, 200) : '');

  const r2 = await fetchUrl('https://rekhtadictionary.com/search?keyword=انوکھا');
  console.log('Search urdu anokha:', r2.status, r2.data ? r2.data.slice(0, 200) : '');
}

test();
