const puppeteer = require('puppeteer-core');

const TARGET_URL = 'http://abjad-literary-reader:4000';
const CHROME_PATH = process.env.CHROME_BIN || '/usr/bin/chromium-browser';

async function runTest() {
  console.log('=======================================================');
  console.log('Testing Token Lens for "انوکھے" in Sheikh Chilli');
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

    // Navigate to Sheikh Chilli
    console.log('Navigating to Sheikh Chilli story...');
    await page.goto(`${TARGET_URL}/?story=sheikh-chilli`, { waitUntil: 'networkidle0', timeout: 15000 });

    console.log('Finding and clicking token for انوکھے...');
    await page.evaluate(() => {
      // Find token span with text containing انوکھے
      const spans = Array.from(document.querySelectorAll('.abjad-word-token'));
      const anokhe = spans.find(s => s.textContent.trim().includes('انوکھے'));
      if (!anokhe) throw new Error('No token found containing انوکھے');
      anokhe.scrollIntoView({ block: 'center' });
      anokhe.click();
    });

    // Wait for Token Lens Popover to be visible
    await page.waitForSelector('.abjad-token-lens-popover', { timeout: 8000 });
    console.log('  ✓ Token Lens Popover opened successfully!');

    // Extract content inside popover
    const popoverData = await page.evaluate(() => {
      const el = document.querySelector('.abjad-token-lens-popover');
      if (!el) return null;

      // Calligraphic display
      const calligraphicEl = el.querySelector('[dir="rtl"].text-4xl, [dir="rtl"].text-6xl, .font-nastaliq.text-4xl');
      const vocalizedText = calligraphicEl ? calligraphicEl.textContent.trim() : '';

      // Vowel pills
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
    console.log('Popover Full Text:\n', popoverData.fullText);

    // Assertions
    if (!popoverData.vocalizedText.includes('اَنُوکھِے')) {
      throw new Error(`Expected vocalized text to contain 'اَنُوکھِے', got: '${popoverData.vocalizedText}'`);
    }
    console.log("  ✓ Calligraphic display has full harakat: 'اَنُوکھِے'");

    if (popoverData.pills.length < 4) {
      throw new Error(`Expected at least 4-5 phonetic breakdown pills, got: ${popoverData.pills.length}`);
    }
    console.log(`  ✓ Phonetic pills count: ${popoverData.pills.length}`);

    // Verify all pills have badges
    const pillsWithoutBadge = popoverData.pills.filter(p => !p.badge);
    if (pillsWithoutBadge.length > 0) {
      throw new Error(`Found pills without vowel badges: ${JSON.stringify(pillsWithoutBadge)}`);
    }
    console.log('  ✓ All phonetic pills have valid vowel badges! (Zero missing badges)');

    // Advance to Tap 2: Spoken Bridge
    console.log('\nClicking "Next Clue" to advance to Tap 2 (Spoken Bridge)...');
    await page.evaluate(() => {
      const popover = document.querySelector('.abjad-token-lens-popover');
      const nextBtn = Array.from(popover.querySelectorAll('button')).find(b => b.textContent.includes('Next Clue'));
      if (nextBtn) nextBtn.click();
    });

    await page.waitForFunction(() => {
      const popover = document.querySelector('.abjad-token-lens-popover');
      return popover && popover.textContent.includes('Clue 2 of 3');
    }, { timeout: 3000 });

    const tap2Text = await page.$eval('.abjad-token-lens-popover', el => el.innerText);
    console.log('Tap 2 Text contains synonyms:', tap2Text.includes('عجیب و غریب'));
    if (!tap2Text.includes('عجیب و غریب') && !tap2Text.includes('نرالے')) {
      throw new Error(`Expected Tap 2 to display spoken synonyms like عجیب و غریب / نرالے, got:\n${tap2Text}`);
    }
    console.log('  ✓ Spoken Bridge (Tap 2) displays authentic conversational synonyms: عجیب و غریب / نرالے');

    // Advance to Tap 3: English Meaning & Literary Nuance
    console.log('\nClicking "Next Clue" to advance to Tap 3 (English Meaning & Literary Nuance)...');
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

    // Verify English does not contain fallback
    if (tap3Text.includes('[انوکھے] literary term')) {
      throw new Error('English gloss is still showing generic fallback: [انوکھے] literary term');
    }
    if (!tap3Text.toLowerCase().includes('unique') && !tap3Text.toLowerCase().includes('extraordinary')) {
      throw new Error(`English gloss does not contain authentic meaning (unique / extraordinary). Got:\n${tap3Text}`);
    }
    console.log('  ✓ English contextual gloss verified: contains authentic literary translation ("unique / extraordinary")');

    console.log('\n=======================================================');
    console.log('ALL ANOKHE TOKEN LENS VERIFICATIONS PASSED! (0 failures)');
    console.log('=======================================================');
  } finally {
    await browser.close();
  }
}

runTest().catch(err => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
