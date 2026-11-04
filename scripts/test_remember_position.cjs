const puppeteer = require('puppeteer-core');

const BASE_URL = process.env.BASE_URL || 'http://abjad-literary-reader:4000';
const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

async function run() {
  console.log('=======================================================');
  console.log('Testing Last Reading Position Persistence (Down to Page)');
  console.log(`Target: ${BASE_URL}`);
  console.log('Constraint: STRICT ZERO SCREENSHOTS');
  console.log('=======================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  let passed = 0;
  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Step 1: Initial visit without saved position
    console.log('Step 1: Visiting root URL without query params (fresh session)...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('h1', { timeout: 10000 });

    // Verify initial default is Level 1.1 Sheikh Chilli Page 1
    const initialTitle = await page.$eval('h1', (el) => el.innerText);
    assert(initialTitle.includes('شیخ چلی'), `Fresh visit defaults to Sheikh Chilli (Found: "${initialTitle.trim()}")`);

    // Step 2: Switch story to Idgah via curriculum dropdown
    console.log('\nStep 2: Selecting story "Idgah" via dropdown...');
    await page.evaluate(() => {
      const select = document.querySelector('select[aria-label="Select Reading Curriculum Tier"]');
      select.value = 'idgah';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.waitForFunction(() => {
      const h1 = document.querySelector('h1');
      return h1 && (h1.innerText.includes('عید گاہ') || h1.innerText.includes('عیدگاہ'));
    }, { timeout: 10000 });
    assert(true, 'Story successfully changed to Idgah');

    // Step 3: Advance Idgah to Page 2
    console.log('\nStep 3: Advancing Idgah to Page 2...');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('.abjad-pagination-bar button');
      const nextBtn = buttons[buttons.length - 1];
      if (!nextBtn) throw new Error('Next button not found');
      nextBtn.click();
    });

    await page.waitForFunction(() => {
      const bar = document.querySelector('.abjad-pagination-bar');
      return bar && (bar.innerText.includes('صفحہ 2 از 18') || bar.innerText.includes('2 of 18'));
    }, { timeout: 8000 });
    assert(true, 'Idgah advanced to Page 2 of 18');

    // Verify localStorage has saved { slug: 'idgah', page: 2 }
    const savedPos1 = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('abjad_last_position') || '{}');
    });
    assert(savedPos1.slug === 'idgah' && savedPos1.page === 2, `localStorage saved position is idgah Page 2 (Found: ${JSON.stringify(savedPos1)})`);

    // Verify URL bar is synchronized with story and page
    const curUrl = page.url();
    assert(curUrl.includes('story=idgah') && curUrl.includes('page=2'), `URL is synchronized to ?story=idgah&page=2 (Found: ${curUrl})`);

    // Step 4: Advance to Page 3
    console.log('\nStep 4: Advancing Idgah to Page 3...');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('.abjad-pagination-bar button');
      const nextBtn = buttons[buttons.length - 1];
      nextBtn.click();
    });

    await page.waitForFunction(() => {
      const bar = document.querySelector('.abjad-pagination-bar');
      return bar && (bar.innerText.includes('صفحہ 3 از 18') || bar.innerText.includes('3 of 18'));
    }, { timeout: 8000 });
    assert(true, 'Idgah advanced to Page 3 of 18');

    const savedPos2 = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('abjad_last_position') || '{}');
    });
    assert(savedPos2.slug === 'idgah' && savedPos2.page === 3, `localStorage updated to idgah Page 3 (Found: ${JSON.stringify(savedPos2)})`);

    // Step 5: Simulate closing the browser and returning to Abjad directly at root URL (NO query params!)
    console.log('\nStep 5: Simulating user returning to Abjad at root URL http://abjad-literary-reader:4000/ ...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for story title and pagination bar
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForSelector('.abjad-pagination-bar', { timeout: 10000 });

    const restoredTitle = await page.$eval('h1', (el) => el.innerText);
    assert(restoredTitle.includes('عید'), `Returning to root restored last story "Idgah" instead of Sheikh Chilli! (Found: "${restoredTitle.trim()}")`);

    const restoredBar = await page.$eval('.abjad-pagination-bar', (el) => el.innerText);
    assert(restoredBar.includes('صفحہ 3 از 18') || restoredBar.innerText?.includes('3 of 18') || restoredBar.includes('3 of 18'), `Returning to root restored down to exact Page 3! (Found: "${restoredBar.trim()}")`);

    // Step 6: Test switching to Baagh and advancing to Page 2
    console.log('\nStep 6: Switching to Baagh and navigating to Page 2...');
    await page.evaluate(() => {
      const select = document.querySelector('select[aria-label="Select Reading Curriculum Tier"]');
      select.value = 'baagh';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.waitForFunction(() => {
      const h1 = document.querySelector('h1');
      return h1 && h1.innerText.includes('باگھ');
    }, { timeout: 10000 });

    // Click Next Page on Baagh
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('.abjad-pagination-bar button');
      const nextBtn = buttons[buttons.length - 1];
      nextBtn.click();
    });

    await page.waitForFunction(() => {
      const bar = document.querySelector('.abjad-pagination-bar');
      return bar && (bar.innerText.includes('صفحہ 2 از 22') || bar.innerText.includes('2 of 22'));
    }, { timeout: 8000 });
    assert(true, 'Baagh advanced to Page 2 of 22');

    // Step 7: Re-visit root URL again
    console.log('\nStep 7: Re-visiting root URL again without query params...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('h1', { timeout: 10000 });

    const restoredTitle2 = await page.$eval('h1', (el) => el.innerText);
    assert(restoredTitle2.includes('باگھ'), `Restored last story "Baagh" (Found: "${restoredTitle2.trim()}")`);

    const restoredBar2 = await page.$eval('.abjad-pagination-bar', (el) => el.innerText);
    assert(restoredBar2.includes('صفحہ 2 از 22') || restoredBar2.includes('2 of 22'), `Restored Baagh down to Page 2 of 22! (Found: "${restoredBar2.trim()}")`);

    console.log(`\n=======================================================`);
    console.log(`ALL ${passed} PERSISTENCE ASSERTIONS PASSED!`);
    console.log(`=======================================================`);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
