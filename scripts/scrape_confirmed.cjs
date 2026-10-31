const puppeteer = require('puppeteer-core');
const fs = require('fs');

const URLS = [
  { id: 'eidgaah', slug: 'idgah', url: 'https://www.rekhta.org/stories/eidgaah-premchand-stories?lang=ur' },
  { id: 'kafan', slug: 'kafan', url: 'https://www.rekhta.org/stories/kafan-premchand-stories?lang=ur' },
  { id: 'overcoat', slug: 'overcoat', url: 'https://www.rekhta.org/stories/over-coat-ghulam-abbas-stories?lang=ur' },
  { id: 'katba', slug: 'katba', url: 'https://www.rekhta.org/stories/katba-ghulam-abbas-stories?lang=ur' },
  { id: 'naya-qanoon', slug: 'naya-qanoon', url: 'https://www.rekhta.org/stories/nayaa-qanoon-saadat-hasan-manto-stories?lang=ur' },
  { id: 'peshawar-express', slug: 'peshawar-express', url: 'https://www.rekhta.org/stories/peshaawar-express-krishn-chander-stories?lang=ur' },
  { id: 'chauthi-ka-joda', slug: 'chauthi-ka-jora', url: 'https://www.rekhta.org/stories/chauthi-ka-joda-ismat-chughtai-stories?lang=ur' },
];

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    for (const item of URLS) {
      console.log(`\nFetching ${item.id}: ${item.url}`);
      try {
        await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const finalUrl = page.url();
        console.log(`  Resolved: ${finalUrl}`);
        if (finalUrl.includes('/ghazals/')) {
          console.warn(`  Redirected to ghazals!`);
          continue;
        }

        await new Promise((r) => setTimeout(r, 3000));

        const data = await page.evaluate(() => {
          const pMCs = Array.from(document.querySelectorAll('.pMC')).map((el) => el.innerText.trim());
          const title = document.title;
          return { pMCs, title };
        });

        const fullStoryRaw = data.pMCs[1] || data.pMCs[0] || '';
        const paragraphs = fullStoryRaw
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        const totalWords = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0);

        console.log(`  ✓ Title: "${data.title}" | Paragraphs: ${paragraphs.length} | Words: ${totalWords}`);
        if (totalWords > 500) {
          fs.writeFileSync(`/app/data/scraped_${item.id}.json`, JSON.stringify({
            id: item.id,
            slug: item.slug,
            title: data.title,
            paragraphsCount: paragraphs.length,
            wordCount: totalWords,
            firstPara: paragraphs[0]?.slice(0, 80),
            paragraphs,
          }, null, 2), 'utf-8');
          console.log(`  -> Saved to /app/data/scraped_${item.id}.json`);
        }
      } catch (err) {
        console.error(`  Error fetching ${item.id}:`, err.message);
      }
    }
  } finally {
    await browser.close();
  }
}

run();
