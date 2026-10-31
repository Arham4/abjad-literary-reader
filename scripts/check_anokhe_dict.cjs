const https = require('https');

https.get('https://rekhtadictionary.com/meaning-of-anokhaa?lang=ur', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const titles = data.match(/<title>([^<]+)<\/title>/);
    console.log('Title:', titles ? titles[1] : 'no title');
    const words = data.match(/class="c_wrd"[^>]*>([^<]+)</g);
    console.log('Words:', words);
    const meanings = data.match(/class="meaning"[^>]*>([^<]+)</g);
    console.log('Meanings:', meanings ? meanings.slice(0, 5) : 'no meanings');
  });
});
