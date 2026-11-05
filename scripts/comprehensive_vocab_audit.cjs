const { Database } = require('bun:sqlite');

const db = new Database('dev.db');

function isFullyVocalized(word) {
  // Check for harakat: Zabar (U+064E), Zer (U+0650), Pesh (U+064F), Jazm/Sukun (U+0652), Tashdid (U+0651), Madda (آ), Khari Zabar (U+0670), Tanween (U+064B, U+064C, U+064D)
  const harakatRegex = /[\u064B-\u0652\u0670آ]/g;
  const matches = word.match(harakatRegex) || [];
  
  // Count base letters (consonants / long vowels)
  const lettersRegex = /[\u0621-\u064A\u0671-\u06D3]/g;
  const baseLetters = (word.match(lettersRegex) || []).length;

  if (baseLetters <= 2) {
    return matches.length >= 1;
  }
  // For words with >= 3 letters, expect at least 2 diacritic/vowel markers
  return matches.length >= 2;
}

function hasGenericGloss(gloss, surface) {
  if (!gloss || gloss.trim().length === 0) return true;
  if (gloss.includes('literary term / contextual expression')) return true;
  if (gloss.includes('contextual expression')) return true;
  if (gloss.startsWith('[') && gloss.endsWith(']')) return true;
  if (gloss.trim() === surface.trim()) return true;
  return false;
}

function runAudit() {
  console.log('=======================================================');
  console.log('COMPREHENSIVE CATALOG VOCABULARY & TRANSLATION AUDIT');
  console.log('=======================================================\n');

  const stories = db.query('SELECT id, slug, title_urdu, title_english, level, sub_level FROM stories ORDER BY level ASC, sub_level ASC;').all();

  let totalWordsInCatalog = 0;
  let totalMissingGloss = 0;
  let totalMissingVowel = 0;

  const missingGlossFreq = new Map();
  const missingVowelFreq = new Map();

  const storyStats = [];

  for (const s of stories) {
    const rows = db.query(`
      SELECT 
        ta.id,
        ta.vocalized_form,
        ta.english_contextual_gloss,
        t.surface_form,
        t.normalized_form
      FROM token_analyses ta
      JOIN tokens t ON ta.token_id = t.id
      JOIN paragraphs p ON t.paragraph_id = p.id
      WHERE p.story_id = ? AND t.is_word = 1;
    `).all(s.id);

    const count = rows.length;
    totalWordsInCatalog += count;

    let storyMissingGloss = 0;
    let storyMissingVowel = 0;

    for (const r of rows) {
      const norm = r.normalized_form.trim();
      const isGeneric = hasGenericGloss(r.english_contextual_gloss, r.surface_form);
      const isVocalized = isFullyVocalized(r.vocalized_form);

      if (isGeneric) {
        storyMissingGloss++;
        totalMissingGloss++;
        missingGlossFreq.set(norm, (missingGlossFreq.get(norm) || 0) + 1);
      }

      if (!isVocalized) {
        storyMissingVowel++;
        totalMissingVowel++;
        missingVowelFreq.set(norm, (missingVowelFreq.get(norm) || 0) + 1);
      }
    }

    const glossPct = count > 0 ? ((storyMissingGloss / count) * 100).toFixed(1) : '0';
    const vowelPct = count > 0 ? ((storyMissingVowel / count) * 100).toFixed(1) : '0';

    storyStats.push({
      slug: s.slug,
      title: `${s.sub_level} ${s.title_english}`,
      count,
      missingGloss: storyMissingGloss,
      glossPct: `${glossPct}%`,
      missingVowel: storyMissingVowel,
      vowelPct: `${vowelPct}%`,
    });
  }

  console.log('--- STORY BY STORY AUDIT TABLE ---');
  console.table(storyStats);

  console.log('\n--- CATALOG SUMMARY TOTALS ---');
  console.log(`Total Word Tokens Analyzed: ${totalWordsInCatalog}`);
  console.log(`Total with Missing/Generic English Gloss: ${totalMissingGloss} (${((totalMissingGloss / totalWordsInCatalog) * 100).toFixed(1)}%)`);
  console.log(`Total Lacking Proper Vowel Markings: ${totalMissingVowel} (${((totalMissingVowel / totalWordsInCatalog) * 100).toFixed(1)}%)`);

  // Sort unique missing words by frequency across the catalog
  const topMissingGloss = Array.from(missingGlossFreq.entries()).sort((a, b) => b[1] - a[1]);
  const topMissingVowels = Array.from(missingVowelFreq.entries()).sort((a, b) => b[1] - a[1]);

  console.log(`\nUnique Words with Missing English Gloss: ${topMissingGloss.length}`);
  console.log('Top 40 Most Frequent Words Missing English Gloss:');
  console.log(topMissingGloss.slice(0, 40).map(([w, c]) => `${w} (${c}x)`).join(', '));

  console.log(`\nUnique Words Lacking Proper Vowel Markings: ${topMissingVowels.length}`);
  console.log('Top 40 Most Frequent Words Lacking Proper Vowel Markings:');
  console.log(topMissingVowels.slice(0, 40).map(([w, c]) => `${w} (${c}x)`).join(', '));
}

runAudit();
