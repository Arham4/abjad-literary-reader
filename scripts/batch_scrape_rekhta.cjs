const puppeteer = require('puppeteer-core');
const fs = require('fs');

const STORY_CANDIDATES = [
  { id: 'toba-tek-singh', url: 'https://www.rekhta.org/stories/toba-tek-singh-saadat-hasan-manto-stories?lang=ur' },
  { id: 'kafan', url: 'https://www.rekhta.org/stories/kafan-munshi-premchand-stories?lang=ur' },
  { id: 'overcoat', url: 'https://www.rekhta.org/stories/overcoat-ghulam-abbas-stories?lang=ur' },
  { id: 'anandi', url: 'https://www.rekhta.org/stories/anandi-ghulam-abbas-stories?lang=ur' },
  { id: 'hathak', url: 'https://www.rekhta.org/stories/hatak-saadat-hasan-manto-stories?lang=ur' },
  { id: 'thanda-gosht', url: 'https://www.rekhta.org/stories/thanda-gosht-saadat-hasan-manto-stories?lang=ur' },
  { id: 'sawere-kal-aankh', url: 'https://www.rekhta.org/stories/sawere-jo-kal-aankh-meri-khuli-patras-bokhari-stories?lang=ur' },
  { id: 'mureedpur-ka-peer', url: 'https://www.rekhta.org/stories/mureedpur-ka-peer-patras-bokhari-stories?lang=ur' },
  { id: 'chacha-chakkan', url: 'https://www.rekhta.org/stories/chacha-chakkan-ne-tasveer-tangi-syed-imtiaz-ali-taj-stories?lang=ur' },
  { id: 'peshawar-express', url: 'https://www.rekhta.org/stories/peshawar-express-krishan-chander-stories?lang=ur' },
  { id: 'lajwanti', url: 'https://www.rekhta.org/stories/lajwanti-rajinder-singh-bedi-stories?lang=ur' },
  { id: 'babu-gopinath', url: 'https://www.rekhta.org/stories/babu-gopinath-saadat-hasan-manto-stories?lang=ur' },
  { id: 'panchayat', url: 'https://www.rekhta.org/stories/panchayat-premchand-stories?lang=ur' },
  { id: 'namak-ka-darogha', url: 'https://www.rekhta.org/stories/namak-ka-darogha-premchand-stories?lang=ur' },
  { id: 'idgah', url: 'https://www.rekhta.org/stories/idgah-munshi-premchand-stories?lang=ur' },
  { id: 'eidgah', url: 'https://www.rekhta.org/stories/eidgah-munshi-premchand-stories?lang=ur' },
];

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    headless: true,
  });

  const results = {};

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    for (const item of STORY_CANDIDATES) {
      console.log(`\nFetching ${item.id}: ${item.url}`);
      try {
        const response = await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        const finalUrl = page.url();
        console.log(`  Resolved URL: ${finalUrl}`);

        if (finalUrl.includes('/ghazals/') || response.status() >= 400) {
          console.warn(`  Failed or redirected: ${finalUrl}`);
          results[item.id] = { status: 'failed_or_redirected', finalUrl };
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
        results[item.id] = {
          status: 'success',
          title: data.title,
          paragraphsCount: paragraphs.length,
          wordCount: totalWords,
          firstPara: paragraphs[0]?.slice(0, 80),
          paragraphs,
        };

        // Save raw scraped JSON if successful
        if (totalWords > 500) {
          fs.writeFileSync(`/app/data/scraped_${item.id}.json`, JSON.stringify(results[item.id], null, 2), 'utf-8');
        }
      } catch (e) {
        console.error(`  Error fetching ${item.id}:`, e.message);
        results[item.id] = { status: 'error', error: e.message };
      }
    }

    fs.writeFileSync('/app/data/scraped_summary.json', JSON.stringify(results, null, 2), 'utf-8');
    console.log('\nSummary saved to /app/data/scraped_summary.json');
  } finally {
    await browser.close();
  }
}

run();
