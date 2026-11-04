const { Database } = require('bun:sqlite');
const { performance } = require('perf_hooks');

const db = new Database('dev.db');

function profileSlug(slug, page = 1, pageSize = 4) {
  console.log(`\n=== Profiling ${slug} Page ${page} ===`);
  const t0 = performance.now();

  // 1. Story lookup
  const story = db.query("SELECT * FROM stories WHERE slug = ?;").get(slug);
  const t1 = performance.now();
  console.log(`1. Story query: ${(t1 - t0).toFixed(2)}ms`);

  // 2. Title paragraph
  const titleP = db.query("SELECT * FROM paragraphs WHERE story_id = ? AND paragraph_index = -1;").get(story.id);
  const t2 = performance.now();
  console.log(`2. Title paragraph query: ${(t2 - t1).toFixed(2)}ms`);

  // 3. Count total body paragraphs
  const countRow = db.query("SELECT count(*) as count FROM paragraphs WHERE story_id = ? AND paragraph_index >= 0;").get(story.id);
  const totalCount = countRow.count;
  const t3 = performance.now();
  console.log(`3. Paragraph count (${totalCount}): ${(t3 - t2).toFixed(2)}ms`);

  // 4. Page body paragraphs
  const offset = (page - 1) * pageSize;
  const bodyParagraphs = db.query("SELECT * FROM paragraphs WHERE story_id = ? AND paragraph_index >= 0 ORDER BY paragraph_index ASC LIMIT ? OFFSET ?;").all(story.id, pageSize, offset);
  const t4 = performance.now();
  console.log(`4. Body paragraphs query (${bodyParagraphs.length}): ${(t4 - t3).toFixed(2)}ms`);

  // 5. Tokens query
  const pageParagraphs = titleP ? [titleP, ...bodyParagraphs] : bodyParagraphs;
  const pIds = pageParagraphs.map(p => p.id);
  const placeholders = pIds.map(() => '?').join(',');
  const tokens = db.query(`SELECT * FROM tokens WHERE paragraph_id IN (${placeholders}) ORDER BY paragraph_id ASC, token_index ASC;`).all(...pIds);
  const t5 = performance.now();
  console.log(`5. Tokens query (${tokens.length} tokens): ${(t5 - t4).toFixed(2)}ms`);

  // 6. Token analyses chunk query
  const wordTokens = tokens.filter(t => t.is_word === 1);
  const analyses = {};
  for (let i = 0; i < wordTokens.length; i += 300) {
    const chunk = wordTokens.slice(i, i + 300);
    const chunkPlaceholders = chunk.map(() => '?').join(',');
    const chunkIds = chunk.map(t => t.id);
    const chunkAnalyses = db.query(`SELECT * FROM token_analyses WHERE token_id IN (${chunkPlaceholders});`).all(...chunkIds);
    for (const a of chunkAnalyses) {
      analyses[a.token_id] = a;
    }
  }
  const t6 = performance.now();
  console.log(`6. Token analyses query (${Object.keys(analyses).length} analyses): ${(t6 - t5).toFixed(2)}ms`);

  // 7. JSON stringify
  const payload = {
    story,
    paragraphs: pageParagraphs,
    tokens,
    analyses,
  };
  const jsonStr = JSON.stringify(payload);
  const t7 = performance.now();
  console.log(`7. JSON stringify (${(jsonStr.length / 1024).toFixed(1)} KB): ${(t7 - t6).toFixed(2)}ms`);
  console.log(`TOTAL DB + SERIALIZE TIME: ${(t7 - t0).toFixed(2)}ms`);
}

profileSlug('idgah', 1);
profileSlug('hathak', 1);
profileSlug('baagh', 1);
