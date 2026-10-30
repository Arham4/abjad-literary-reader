const puppeteer = require('puppeteer-core');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://abjad-literary-reader:4000';
const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

async function runTests() {
  console.log(`=======================================================`);
  console.log(`Starting Abjad E2E Pagination & Mobile Viewport Tests`);
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Chromium Binary: ${CHROME_PATH}`);
  console.log(`Constraint: STRICT ZERO SCREENSHOTS`);
  console.log(`=======================================================\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      testsFailed++;
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    const page = await browser.newPage();

    // -------------------------------------------------------------
    // TEST SUITE 1: Desktop Viewport (1280x800)
    // -------------------------------------------------------------
    console.log(`\n--- Test Suite 1: Desktop Viewport (1280x800) ---`);
    await page.setViewport({ width: 1280, height: 800 });

    console.log(`Navigating to ${BASE_URL}/?story=baagh...`);
    await page.goto(`${BASE_URL}/?story=baagh`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for story title
    await page.waitForSelector('h1', { timeout: 10000 });
    const titleText = await page.$eval('h1', el => el.innerText);
    assert(titleText.includes('باگھ'), `Story title contains 'باگھ' (Found: "${titleText.trim()}")`);

    // Verify Level badge
    const levelBadge = await page.$eval('.abjad-book-page header div div', el => el.innerText);
    assert(levelBadge.toUpperCase().includes('LEVEL 9'), `Level badge indicates Level 9 (Found: "${levelBadge.trim()}")`);

    // Verify initial pagination state on Page 1 of 22
    await page.waitForSelector('.abjad-pagination-bar', { timeout: 5000 });
    const pageIndicator = await page.$eval('.abjad-pagination-bar', el => el.innerText);
    assert(pageIndicator.includes('صفحہ 1 از 22') || pageIndicator.includes('1 of 22'), `Pagination bar shows Page 1 of 22`);

    // Verify header page pill
    const headerPill = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('header span, header div'));
      const found = pills.find(el => el.innerText && el.innerText.includes('Page 1 of 22'));
      return found ? found.innerText : null;
    });
    assert(headerPill !== null, `Header page badge displays 'Page 1 of 22'`);

    // Verify Previous button disabled, Next button enabled
    const prevDisabled = await page.$eval('.abjad-pagination-bar button:first-child', btn => btn.disabled);
    const nextDisabled = await page.$eval('.abjad-pagination-bar button:last-child', btn => btn.disabled);
    assert(prevDisabled === true, `Previous Page button is disabled on Page 1`);
    assert(nextDisabled === false, `Next Page button is enabled on Page 1`);

    // Advance to Page 2
    console.log(`Clicking 'Next Page' button...`);
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('.abjad-pagination-bar button');
      // The last button in pagination bar is the Next Page button
      const nextBtn = buttons[buttons.length - 1];
      if (nextBtn) {
        nextBtn.click();
      } else {
        throw new Error('Next Page button not found in .abjad-pagination-bar');
      }
    });

    await page.waitForFunction(() => {
      const bar = document.querySelector('.abjad-pagination-bar');
      return bar && (bar.innerText.includes('صفحہ 2 از 22') || bar.innerText.includes('2 of 22'));
    }, { timeout: 8000 });

    const page2Indicator = await page.$eval('.abjad-pagination-bar', el => el.innerText);
    assert(page2Indicator.includes('صفحہ 2 از 22') || page2Indicator.includes('2 of 22'), `Pagination bar updated to Page 2 of 22`);

    const prevDisabledOnPage2 = await page.$eval('.abjad-pagination-bar button:first-child', btn => btn.disabled);
    assert(prevDisabledOnPage2 === false, `Previous Page button is now enabled on Page 2`);

    // Jump to Page 22 using select dropdown
    console.log(`Jumping directly to Page 22 via dropdown...`);
    await page.select('select[aria-label="Jump to page"]', '22');
    await page.waitForFunction(() => {
      const bar = document.querySelector('.abjad-pagination-bar');
      return bar && (bar.innerText.includes('22 of 22') || bar.innerText.includes('صفحہ 22 از 22'));
    }, { timeout: 8000 });

    const nextDisabledOnPage22 = await page.$eval('.abjad-pagination-bar button:last-child', btn => btn.disabled);
    assert(nextDisabledOnPage22 === true, `Next Page button is disabled on the final page (Page 22)`);

    // Click Previous Page from Page 22 to return to Page 21
    console.log(`Clicking 'Previous Page' button to go back to Page 21...`);
    await page.evaluate(() => {
      const prevBtn = document.querySelector('.abjad-pagination-bar button:first-child');
      if (prevBtn) prevBtn.click();
    });
    await page.waitForFunction(() => {
      const bar = document.querySelector('.abjad-pagination-bar');
      return bar && (bar.innerText.includes('21 of 22') || bar.innerText.includes('صفحہ 21 از 22'));
    }, { timeout: 8000 });
    assert(true, `Successfully navigated backward from Page 22 to Page 21`);

    // Interactive Token Lens Popover on paginated page
    console.log(`Testing interactive Token Lens Popover on Page 21...`);
    await page.waitForSelector('.abjad-word-token', { timeout: 5000 });
    
    // Scroll token into view and click directly
    await page.evaluate(() => {
      const tok = document.querySelector('.abjad-word-token');
      if (!tok) throw new Error('No .abjad-word-token found on Page 21');
      tok.scrollIntoView({ block: 'center' });
      tok.click();
    });

    await page.waitForSelector('.abjad-token-lens-popover', { timeout: 8000 });
    const popoverVisible = await page.$eval('.abjad-token-lens-popover', el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    assert(popoverVisible === true, `Token Lens Popover opened upon clicking word token`);

    // Verify popover displays English gloss / translation
    const popoverContent = await page.$eval('.abjad-token-lens-popover', el => el.innerText);
    assert(popoverContent.length > 0, `Popover rendered lexical details and gloss (length: ${popoverContent.length})`);

    // Close popover with Escape key
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.abjad-token-lens-popover'), { timeout: 3000 });
    assert(true, `Token Lens Popover closed on Escape key press`);

    // Verify Narration Bar is present
    const narrationBtn = await page.$('button[title*="Narration"], button[title*="Sentence"], .fixed.bottom-0');
    assert(narrationBtn !== null, `Audio Narration Bar is present on reader surface`);

    // Switch story to Idgah via curriculum dropdown
    console.log(`Switching story to '2.2 idgah' via story selector dropdown...`);
    await page.evaluate(() => {
      const select = document.querySelector('select[aria-label="Select Reading Curriculum Tier"]');
      select.value = 'idgah';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const h1 = document.querySelector('h1');
      return h1 && (h1.innerText.includes('عید گاہ') || h1.innerText.includes('عیدگاہ'));
    }, { timeout: 10000 });

    const idgahTitle = await page.$eval('h1', el => el.innerText);
    assert(idgahTitle.includes('عید'), `Story switched to Idgah ('${idgahTitle.trim()}')`);

    // Verify Idgah pagination reset to Page 1 of 4
    await page.waitForFunction(() => {
      const bar = document.querySelector('.abjad-pagination-bar');
      return bar && (bar.innerText.includes('1 of 4') || bar.innerText.includes('صفحہ 1 از 4'));
    }, { timeout: 5000 });
    assert(true, `Idgah pagination correctly initialized to Page 1 of 4`);

    // -------------------------------------------------------------
    // TEST SUITE 2: Mobile Viewport - iPhone SE (375x667)
    // -------------------------------------------------------------
    console.log(`\n--- Test Suite 2: Mobile Viewport - iPhone SE (375x667) ---`);
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });

    console.log(`Reloading Baagh on Mobile Viewport (375x667)...`);
    await page.goto(`${BASE_URL}/?story=baagh`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('h1', { timeout: 10000 });

    // Check Horizontal Overflow
    const mobileOverflow = await page.evaluate(() => {
      const scrollW = document.documentElement.scrollWidth;
      const innerW = window.innerWidth;
      const bodyW = document.body.scrollWidth;
      return {
        scrollWidth: scrollW,
        innerWidth: innerW,
        bodyWidth: bodyW,
        hasHorizontalOverflow: scrollW > innerW + 2,
      };
    });
    console.log(`  Mobile dimensions: innerWidth=${mobileOverflow.innerWidth}px, scrollWidth=${mobileOverflow.scrollWidth}px`);
    assert(!mobileOverflow.hasHorizontalOverflow, `No horizontal page overflow on 375px mobile viewport`);

    // Verify Mobile Pagination Bar Layout & Dimensions
    const paginationBounding = await page.$eval('.abjad-pagination-bar', el => {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        windowWidth: window.innerWidth,
        fitsInViewport: rect.left >= 0 && rect.right <= window.innerWidth + 2,
      };
    });
    assert(paginationBounding.fitsInViewport, `Pagination bar cleanly fits within mobile viewport (width: ${paginationBounding.width}px)`);

    // Tap 'اگلا صفحہ' (Next Page) on mobile
    console.log(`Tapping 'Next Page' button on mobile...`);
    await page.evaluate(() => {
      const nextBtn = document.querySelector('.abjad-pagination-bar button:last-child');
      if (!nextBtn) throw new Error('Next Page button not found');
      nextBtn.scrollIntoView({ block: 'center' });
      nextBtn.click();
    });
    await page.waitForFunction(() => {
      const bar = document.querySelector('.abjad-pagination-bar');
      return bar && (bar.innerText.includes('2 of 22') || bar.innerText.includes('صفحہ 2 از 22'));
    }, { timeout: 8000 });
    assert(true, `Tapped Next Page button on mobile: successfully navigated to Page 2`);

    // Check horizontal overflow after page change
    const page2Overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
    assert(page2Overflow, `Zero horizontal overflow on Page 2 in mobile viewport`);

    // Tap Word Token on Mobile & Assert Popover Position
    console.log(`Tapping a word token on mobile to test mobile popover bounding box...`);
    await page.evaluate(() => {
      const tok = document.querySelector('.abjad-word-token');
      if (!tok) throw new Error('No .abjad-word-token found on mobile');
      tok.scrollIntoView({ block: 'center' });
      tok.click();
    });
    await page.waitForSelector('.abjad-token-lens-popover', { timeout: 8000 });

    const mobilePopoverFit = await page.evaluate(() => {
      const popover = document.querySelector('.abjad-token-lens-popover');
      if (!popover) return null;
      const rect = popover.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        windowWidth: window.innerWidth,
        // Allow tiny sub-pixel tolerance
        fitsHorizontally: rect.left >= -2 && rect.right <= window.innerWidth + 4,
      };
    });
    assert(mobilePopoverFit !== null, `Popover rendered on mobile tap`);
    assert(mobilePopoverFit.fitsHorizontally, `Popover is positioned strictly within mobile screen width (left: ${mobilePopoverFit.left}px, right: ${mobilePopoverFit.right}px, window: ${mobilePopoverFit.windowWidth}px)`);

    // -------------------------------------------------------------
    // TEST SUITE 3: Mobile Viewport - iPhone 12/13/14 (390x844)
    // -------------------------------------------------------------
    console.log(`\n--- Test Suite 3: Mobile Viewport - iPhone 12/13/14 (390x844) ---`);
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    console.log(`Testing Level 10 Grand Novel 'udaas-naslein' on 390x844...`);
    await page.evaluate(() => {
      const select = document.querySelector('select[aria-label="Select Reading Curriculum Tier"]');
      select.value = 'udaas-naslein';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const h1 = document.querySelector('h1');
      return h1 && h1.innerText.includes('اداس نسلیں');
    }, { timeout: 10000 });

    const udaasTitle = await page.$eval('h1', el => el.innerText);
    assert(udaasTitle.includes('اداس نسلیں'), `Udaas Naslein loaded on iPhone viewport ('اداس نسلیں')`);

    // Jump to Page 4 on mobile
    console.log(`Jumping to Page 4 via dropdown on iPhone viewport...`);
    await page.evaluate(() => {
      const select = document.querySelector('select[aria-label="Jump to page"]');
      select.value = '4';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const bar = document.querySelector('.abjad-pagination-bar');
      return bar && (bar.innerText.includes('4 of 7') || bar.innerText.includes('صفحہ 4 از 7'));
    }, { timeout: 5000 });

    const udaasPage4Overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
    assert(udaasPage4Overflow, `Udaas Naslein Page 4 has zero horizontal overflow on iPhone viewport`);

    console.log(`\n=======================================================`);
    console.log(`TEST RESULTS: ALL ${testsPassed} ASSERTIONS PASSED! (0 failures)`);
    console.log(`=======================================================\n`);
  } catch (error) {
    console.error(`\nTest suite encountered an error:`, error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTests();
