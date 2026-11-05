const puppeteer = require('puppeteer-core');

const BASE_URL = process.env.BASE_URL || 'http://abjad-literary-reader:4000';
const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

async function run() {
  console.log('Testing Back-and-Forth Page Turning Integrity');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('1. Loading Abjad...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');

  // Helper to read all paragraph text contents
  const getParagraphs = async () => {
    return page.evaluate(() => {
      const blocks = Array.from(document.querySelectorAll('.abjad-paragraph-block'));
      return blocks.map(b => b.textContent.trim().slice(0, 35));
    });
  };

  const getPageNumber = async () => {
    return page.evaluate(() => {
      const bar = document.querySelector('.abjad-pagination-bar');
      const m = bar ? bar.innerText.match(/صفحہ (\d+) از (\d+)/) : null;
      return m ? parseInt(m[1], 10) : null;
    });
  };

  // Page 1
  let curP = await getPageNumber();
  let paras = await getParagraphs();
  console.log(`Current page: ${curP}`);
  console.log('Paragraphs on Page 1:', paras);
  if (curP !== 1 || paras.length !== 4 || paras.some(p => p.length === 0)) {
    throw new Error('Page 1 failed to load properly');
  }

  // Click Next Page -> Page 2
  console.log('\n2. Clicking "Next Page" -> Going to Page 2...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('.abjad-pagination-bar button');
    btns[btns.length - 1].click();
  });
  await page.waitForFunction(() => {
    const bar = document.querySelector('.abjad-pagination-bar');
    return bar && bar.innerText.includes('صفحہ 2 از');
  }, { timeout: 5000 });

  curP = await getPageNumber();
  paras = await getParagraphs();
  console.log(`Current page: ${curP}`);
  console.log('Paragraphs on Page 2:', paras);
  if (curP !== 2 || paras.length !== 4 || paras.some(p => p.length === 0)) {
    throw new Error('Page 2 failed to load properly');
  }

  // Click Prev Page -> Page 1
  console.log('\n3. Clicking "Previous Page" -> Going back to Page 1...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('.abjad-pagination-bar button');
    btns[0].click();
  });
  await page.waitForFunction(() => {
    const bar = document.querySelector('.abjad-pagination-bar');
    return bar && bar.innerText.includes('صفحہ 1 از');
  }, { timeout: 5000 });

  curP = await getPageNumber();
  paras = await getParagraphs();
  console.log(`Current page: ${curP}`);
  console.log('Paragraphs back on Page 1:', paras);
  if (curP !== 1 || paras.length !== 4 || paras.some(p => p.length === 0)) {
    throw new Error('Page 1 failed to load after navigating backward');
  }

  // Click Next Page again -> Page 2
  console.log('\n4. Clicking "Next Page" again -> Going back to Page 2...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('.abjad-pagination-bar button');
    btns[btns.length - 1].click();
  });
  await page.waitForFunction(() => {
    const bar = document.querySelector('.abjad-pagination-bar');
    return bar && bar.innerText.includes('صفحہ 2 از');
  }, { timeout: 5000 });

  curP = await getPageNumber();
  paras = await getParagraphs();
  console.log(`Current page: ${curP}`);
  console.log('Paragraphs back on Page 2:', paras);
  if (curP !== 2 || paras.length !== 4 || paras.some(p => p.length === 0)) {
    throw new Error('Page 2 failed to load after navigating forward again');
  }

  // Click Next Page -> Page 3
  console.log('\n5. Clicking "Next Page" -> Going to Page 3...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('.abjad-pagination-bar button');
    btns[btns.length - 1].click();
  });
  await page.waitForFunction(() => {
    const bar = document.querySelector('.abjad-pagination-bar');
    return bar && bar.innerText.includes('صفحہ 3 از');
  }, { timeout: 5000 });

  curP = await getPageNumber();
  paras = await getParagraphs();
  console.log(`Current page: ${curP}`);
  console.log('Paragraphs on Page 3:', paras);
  if (curP !== 3 || paras.length !== 4 || paras.some(p => p.length === 0)) {
    throw new Error('Page 3 failed to load properly');
  }

  console.log('\n✅ ALL PAGE TURNS LOADED 100% PERFECTLY!');
  await browser.close();
}

run().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
