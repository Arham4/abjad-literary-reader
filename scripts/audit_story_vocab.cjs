const { Database } = require('bun:sqlite');
const sqlite = new Database('dev.db');

const stories = sqlite.query("SELECT id, slug, title_urdu, title_english, level, sub_level FROM stories ORDER BY level, sub_level;").all();

console.log(`Auditing ${stories.length} stories in dev.db:\n`);

const summary = [];

for (const s of stories) {
  const tokens = sqlite.query(`
    SELECT t.id, t.surface_form, t.normalized_form, t.is_word,
           a.vocalized_form, a.phonetic_breakdown_json, a.english_contextual_gloss, a.spoken_urdu_synonyms_json
    FROM tokens t
    JOIN paragraphs p ON t.paragraph_id = p.id
    LEFT JOIN token_analyses a ON t.id = a.token_id
    WHERE p.story_id = '${s.id}' AND t.is_word = 1;
  `).all();

  const totalWords = tokens.length;
  let missingVowels = 0;
  let missingEnglish = 0;
  let missingSynonyms = 0;
  const sampleMissing = [];

  for (const t of tokens) {
    const voc = t.vocalized_form || '';
    const hasVowels = /[\u064B-\u0652\u0670\u0653]/.test(voc) || voc.includes('آ');
    
    // Check if English is a generic fallback or missing
    const eng = t.english_contextual_gloss || '';
    const isGenericEng = !eng || eng.includes('literary term') || eng.includes('contextual expression') || eng.startsWith(`[${t.normalized_form}]`);

    // Check if synonyms just repeat the surface/normalized form
    let syns = [];
    try {
      syns = JSON.parse(t.spoken_urdu_synonyms_json || '[]');
    } catch (e) {}
    const isGenericSyn = syns.length === 0 || (syns.length === 1 && (syns[0] === t.surface_form || syns[0] === t.normalized_form));

    if (!hasVowels) missingVowels++;
    if (isGenericEng) missingEnglish++;
    if (isGenericSyn) missingSynonyms++;

    if ((!hasVowels || isGenericEng) && sampleMissing.length < 5) {
      sampleMissing.push({
        word: t.surface_form,
        hasVowels,
        voc,
        eng
      });
    }
  }

  summary.push({
    subLevel: s.sub_level,
    slug: s.slug,
    titleEnglish: s.title_english,
    totalWords,
    missingVowels,
    pctMissingVowels: ((missingVowels / totalWords) * 100).toFixed(1) + '%',
    missingEnglish,
    pctMissingEnglish: ((missingEnglish / totalWords) * 100).toFixed(1) + '%',
    sampleMissing
  });
}

console.log(JSON.stringify(summary, null, 2));
