const puppeteer = require('puppeteer-core');

const TARGET_URL = 'http://abjad-literary-reader:4000';
const CHROME_PATH = process.env.CHROME_BIN || '/usr/bin/chromium-browser';

async function runTest() {
  console.log('=======================================================');
  console.log('Testing Token Lens for "بادشاہ" in Sheikh Chilli');
  console.log('Target URL:', TARGET_URL);
  console.log('Constraint: STRICT ZERO SCREENSHOTS');
  console.log('=======================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to Sheikh Chilli story page 2 (where بادشاہ appears in paragraph 7)...');
    await page.goto(`${TARGET_URL}/?story=sheikh-chilli&page=2`, { waitUntil: 'networkidle0', timeout: 15000 });

    console.log('Finding and clicking token for بادشاہ...');
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('.abjad-word-token'));
      const badshah = spans.find(s => s.textContent.trim().includes('بادشاہ'));
      if (!badshah) throw new Error('No token found containing بادشاہ');
      badshah.scrollIntoView({ block: 'center' });
      badshah.click();
    });

    await page.waitForSelector('.abjad-token-lens-popover', { timeout: 8000 });
    console.log('  ✓ Token Lens Popover opened successfully!');

    const popoverData = await page.evaluate(() => {
      const el = document.querySelector('.abjad-token-lens-popover');
      if (!el) return null;

      const calligraphicEl = el.querySelector('[dir="rtl"].text-4xl, [dir="rtl"].text-6xl, .font-nastaliq.text-4xl');
      const vocalizedText = calligraphicEl ? calligraphicEl.textContent.trim() : '';

      const pillDivs = Array.from(el.querySelectorAll('.inline-flex.items-center.gap-2.px-3'));
      const pills = pillDivs.map(p => {
        const letters = p.querySelector('.font-nastaliq')?.textContent?.trim() || '';
        const badge = p.querySelector('.font-sans')?.textContent?.trim() || '';
        return { letters, badge };
      });

      const fullText = el.innerText || el.textContent || '';

      return {
        vocalizedText,
        pills,
        fullText,
      };
    });

    console.log('\n--- Popover Inspection Results ---');
    console.log('Vocalized Display Text:', popoverData.vocalizedText);
    console.log('Vowel Pills:', JSON.stringify(popoverData.pills, null, 2));

    if (!popoverData.vocalizedText.includes('بَادْشَاہ')) {
      throw new Error(`Expected vocalized text to contain 'بَادْشَاہ', got: '${popoverData.vocalizedText}'`);
    }
    console.log("  ✓ Calligraphic display has full harakat: 'بَادْشَاہ'");

    if (popoverData.pills.length < 5) {
      throw new Error(`Expected at least 5-6 phonetic breakdown pills, got: ${popoverData.pills.length}`);
    }
    console.log(`  ✓ Phonetic pills count: ${popoverData.pills.length}`);

    // Verify all pills have badges
    const pillsWithoutBadge = popoverData.pills.filter(p => !p.badge);
    if (pillsWithoutBadge.length > 0) {
      throw new Error(`Found pills without vowel badges: ${JSON.stringify(pillsWithoutBadge)}`);
    }
    console.log('  ✓ All phonetic pills have valid vowel badges! (Zero missing badges)');

    // Advance to Tap 2
    console.log('\nAdvancing to Tap 2...');
    await page.evaluate(() => {
      const popover = document.querySelector('.abjad-token-lens-popover');
      const nextBtn = Array.from(popover.querySelectorAll('button')).find(b => b.textContent.includes('Next Clue'));
      if (nextBtn) nextBtn.click();
    });

    await page.waitForFunction(() => {
      const popover = document.querySelector('.abjad-token-lens-popover');
      return popover && popover.textContent.includes('Clue 2 of 3');
    }, { timeout: 3000 });

    // Advance to Tap 3
    console.log('Advancing to Tap 3...');
    await page.evaluate(() => {
      const popover = document.querySelector('.abjad-token-lens-popover');
      const nextBtn = Array.from(popover.querySelectorAll('button')).find(b => b.textContent.includes('Next Clue'));
      if (nextBtn) nextBtn.click();
    });

    await page.waitForFunction(() => {
      const popover = document.querySelector('.abjad-token-lens-popover');
      return popover && (popover.textContent.includes('Clue 3 of 3') || popover.textContent.includes('All 3 clues revealed'));
    }, { timeout: 3000 });

    const tap3Text = await page.$eval('.abjad-token-lens-popover', el => el.innerText);
    console.log('Tap 3 Text:\n', tap3Text);

    if (tap3Text.includes('[بادشاہ] literary term')) {
      throw new Error('English gloss is still showing generic fallback: [بادشاہ] literary term');
    }
    if (!tap3Text.toLowerCase().includes('king') && !tap3Text.toLowerCase().includes('monarch')) {
      throw new Error(`English gloss does not contain authentic meaning (king / monarch). Got:\n${tap3Text}`);
    }
    console.log('  ✓ English contextual gloss verified: contains authentic literary translation ("king / monarch")');

    console.log('\n=======================================================');
    console.log('ALL BADSHAH TOKEN LENS VERIFICATIONS PASSED! (0 failures)');
    console.log('=======================================================');
  } finally {
    await browser.close();
  }
}

runTest().catch(err => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
