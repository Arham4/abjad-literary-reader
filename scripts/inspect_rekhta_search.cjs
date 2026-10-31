const https = require('https');

https.get('https://rekhtadictionary.com/search?keyword=انوکھا', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Look for search result word cards
    const matches = data.match(/class="[^"]*(?:word|meaning|search)[^"]*"[^>]*>[\s\S]*?<\//gi) || [];
    console.log('Matches count:', matches.length);
    for (const m of matches.slice(0, 15)) {
      console.log('---', m.replace(/\s+/g, ' ').slice(0, 150));
    }

    // Look for links to word pages
    const links = data.match(/href="\/meaning-of-[^"]+"/gi) || [];
    console.log('Links found:', links);
  });
});
