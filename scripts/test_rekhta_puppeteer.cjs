const puppeteer = require('puppeteer-core');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://rekhtadictionary.com/search?keyword=%D8%A7%D9%86%D9%88%DA%A9%DA%BE%D8%A7', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 4000));
    const results = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.rdSrchResultCard, .rdWordCard, a[href*="meaning-of"]'));
      return cards.map(c => ({
        text: c.innerText.replace(/\s+/g, ' ').trim(),
        href: c.href
      }));
    });
    console.log(`Results: ${results.length}`);
    for (const r of results.slice(0, 10)) {
      console.log(r);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

main();
