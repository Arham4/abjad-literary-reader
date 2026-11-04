const { performance } = require('perf_hooks');
const { db } = require('../src/db/index');
const schema = require('../src/db/schema');
const { eq, and, gte, asc, inArray, count } = require('drizzle-orm');

async function profileDrizzle(slug, page = 1, pageSize = 4) {
  console.log(`\n=== Profiling Drizzle ORM for ${slug} Page ${page} ===`);
  const t0 = performance.now();

  // 1. Story
  const story = db.select().from(schema.stories).where(eq(schema.stories.slug, slug)).get();
  const t1 = performance.now();
  console.log(`1. Drizzle Story: ${(t1 - t0).toFixed(2)}ms`);

  // 2. Title paragraph
  const titleParagraph = db
    .select()
    .from(schema.paragraphs)
    .where(and(eq(schema.paragraphs.storyId, story.id), eq(schema.paragraphs.paragraphIndex, -1)))
    .get();
  const t2 = performance.now();
  console.log(`2. Drizzle Title Paragraph: ${(t2 - t1).toFixed(2)}ms`);

  // 3. Count
  const bodyCountResult = db
    .select({ count: count() })
    .from(schema.paragraphs)
    .where(and(eq(schema.paragraphs.storyId, story.id), gte(schema.paragraphs.paragraphIndex, 0)))
    .get();
  const t3 = performance.now();
  console.log(`3. Drizzle Count: ${(t3 - t2).toFixed(2)}ms`);

  // 4. Body Paragraphs
  const offset = (page - 1) * pageSize;
  const bodyParagraphs = db
    .select()
    .from(schema.paragraphs)
    .where(and(eq(schema.paragraphs.storyId, story.id), gte(schema.paragraphs.paragraphIndex, 0)))
    .orderBy(asc(schema.paragraphs.paragraphIndex))
    .limit(pageSize)
    .offset(offset)
    .all();
  const t4 = performance.now();
  console.log(`4. Drizzle Body Paragraphs (${bodyParagraphs.length}): ${(t4 - t3).toFixed(2)}ms`);

  // 5. Tokens
  const pageParagraphs = titleParagraph ? [titleParagraph, ...bodyParagraphs] : bodyParagraphs;
  const paragraphIds = pageParagraphs.map((p) => p.id);
  const allTokens = db
    .select()
    .from(schema.tokens)
    .where(inArray(schema.tokens.paragraphId, paragraphIds))
    .orderBy(asc(schema.tokens.paragraphId), asc(schema.tokens.tokenIndex))
    .all();
  const t5 = performance.now();
  console.log(`5. Drizzle Tokens (${allTokens.length}): ${(t5 - t4).toFixed(2)}ms`);

  // 6. Token Analyses
  const wordTokenIds = allTokens.filter((t) => t.isWord).map((t) => t.id);
  const allAnalyses = {};
  const t6_start = performance.now();
  for (let i = 0; i < wordTokenIds.length; i += 300) {
    const chunk = wordTokenIds.slice(i, i + 300);
    if (chunk.length > 0) {
      const chunkStart = performance.now();
      const analysesChunk = db
        .select()
        .from(schema.tokenAnalyses)
        .where(inArray(schema.tokenAnalyses.tokenId, chunk))
        .all();
      const chunkEnd = performance.now();
      console.log(`   Chunk ${i / 300} (${chunk.length} IDs -> ${analysesChunk.length} rows): ${(chunkEnd - chunkStart).toFixed(2)}ms`);
      for (const a of analysesChunk) {
        allAnalyses[a.tokenId] = a;
      }
    }
  }
  const t6 = performance.now();
  console.log(`6. Drizzle Analyses (${Object.keys(allAnalyses).length} total): ${(t6 - t6_start).toFixed(2)}ms`);

  // 7. Response construction
  const data = {
    story: {
      ...story,
      sceneVocabPreview: story.sceneVocabPreviewJson,
    },
    paragraphs: pageParagraphs,
    tokens: allTokens,
    analyses: allAnalyses,
  };
  const jsonStr = JSON.stringify(data);
  const t7 = performance.now();
  console.log(`7. JSON stringify (${(jsonStr.length / 1024).toFixed(1)} KB): ${(t7 - t6).toFixed(2)}ms`);
  console.log(`Total Drizzle execution time: ${(t7 - t0).toFixed(2)}ms`);
}

profileDrizzle('idgah', 1);
profileDrizzle('baagh', 1);
