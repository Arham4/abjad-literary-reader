const { Database } = require('bun:sqlite');
const db = new Database('dev.db');

const rows = db.query(`
  SELECT DISTINCT t.surface_form, t.normalized_form, a.vocalized_form, a.english_contextual_gloss, a.spoken_urdu_synonyms_json, a.urdu_simple_explanation, a.phonetic_breakdown_json
  FROM tokens t
  JOIN paragraphs p ON t.paragraph_id = p.id
  JOIN stories s ON p.story_id = s.id
  LEFT JOIN token_analyses a ON t.id = a.token_id
  WHERE s.slug = 'sheikh-chilli' AND t.is_word = 1
  ORDER BY t.normalized_form;
`).all();

console.log(`Total unique words in Sheikh Chilli: ${rows.length}`);

const problematic = [];
for (const r of rows) {
  const voc = r.vocalized_form || '';
  const hasVowels = /[\u064B-\u0652\u0670\u0653]/.test(voc) || voc.includes('آ');
  const eng = r.english_contextual_gloss || '';
  const isGenericEng = !eng || eng.includes('literary term') || eng.includes('contextual expression') || eng.startsWith(`[${r.normalized_form}]`);

  // Check if pills have missing vowel names
  let pills = [];
  try {
    pills = JSON.parse(r.phonetic_breakdown_json || '[]');
  } catch (e) {}

  if (!hasVowels || isGenericEng) {
    problematic.push({
      surface: r.surface_form,
      norm: r.normalized_form,
      voc,
      hasVowels,
      eng,
      isGenericEng
    });
  }
}

console.log(`Problematic unique words in Sheikh Chilli: ${problematic.length} out of ${rows.length}`);
console.log(JSON.stringify(problematic, null, 2));
