const { Database } = require('bun:sqlite');
const { CURATED_DEFINITIONS } = require('./master_lexicon_data.cjs');
const { makePhoneticBreakdown } = require('../src/lib/abjad/packs/urduVocalizer');
const { UrduLanguagePack } = require('../src/lib/abjad/packs/urdu');

const devDb = new Database('dev.db');
const wiktDb = new Database('data/wiktionary.db');

const MASTER_LEXICON = { ...CURATED_DEFINITIONS };

function algorithmicallyVocalize(word) {
  if (!word) return '';
  const clean = word.trim().replace(/^[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+|[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+$/gu, '').trim();
  if (!clean) return word;

  const existingDiacritics = (clean.match(/[\u064B-\u0652\u0670\u0653]/g) || []).length;
  if (clean.length <= 2 && existingDiacritics >= 1) return clean;
  if (clean.length > 2 && existingDiacritics >= 2) return clean;

  const chars = Array.from(clean);
  const result = [];
  let i = 0;

  while (i < chars.length) {
    let c = chars[i];
    let next = chars[i + 1];

    if (next === '\u06BE') {
      c += next;
      i++;
      next = chars[i + 1];
    }

    if (next && /[\u064B-\u0652\u0670\u0653]/.test(next)) {
      result.push(c);
      i++;
      continue;
    }

    if (c === 'آ') {
      result.push(c);
    } else if (c === 'ا' && i === 0) {
      if (next === 'و') {
        result.push('ا\u064F');
      } else if (next === 'ی' || next === 'ے') {
        result.push('ا\u0650');
      } else if (clean.length === 2 && (next === 'س' || next === 'ن')) {
        result.push('ا\u0650');
      } else {
        result.push('ا\u064E');
      }
    } else if (c === 'ا' || c === 'ں') {
      result.push(c);
    } else if (c === 'و') {
      result.push(next === 'ا' ? 'و\u064E' : c);
    } else if (c === 'ی' || c === 'ے') {
      result.push(c);
    } else {
      if (next === 'ا') {
        result.push(c + '\u064E');
      } else if (next === 'و') {
        result.push(c + '\u064F');
      } else if (next === 'ی' || next === 'ے') {
        result.push(c + '\u0650');
      } else if (next === 'ہ' && i === chars.length - 2) {
        result.push(c + '\u064E');
      } else if (i === chars.length - 1) {
        result.push(c + '\u0652');
      } else if (i === 0) {
        result.push(c + '\u064E');
      } else if (next && next !== 'ا' && next !== 'و' && next !== 'ی' && next !== 'ے') {
        result.push(c + '\u0652');
      } else {
        result.push(c + '\u064E');
      }
    }
    i++;
  }

  let finalWord = result.join('');
  const dCount = (finalWord.match(/[\u064B-\u0652\u0670\u0653آ]/g) || []).length;
  const bLetters = (finalWord.match(/[\u0621-\u064A\u0671-\u06D3]/g) || []).length;

  if (bLetters <= 2 && dCount < 1) {
    finalWord = finalWord.replace(/([\u0621-\u064A\u0671-\u06D3])/, '$1\u064E');
  } else if (bLetters >= 3 && dCount < 2) {
    if (!/[\u064B-\u0652\u0670\u0653]$/.test(finalWord)) {
      finalWord += '\u0652';
    }
    const dCount2 = (finalWord.match(/[\u064B-\u0652\u0670\u0653آ]/g) || []).length;
    if (dCount2 < 2) {
      finalWord = finalWord.replace(/([\u0621-\u064A\u0671-\u06D3])/, '$1\u064E');
    }
  }

  return finalWord;
}

function cleanWiktGloss(gloss, word) {
  if (!gloss) return '';
  // Strip any Urdu characters inside parenthesized notes
  gloss = gloss.replace(/\([\u0600-\u06FF\s]+\)/g, '').trim();

  if (gloss.startsWith('feminine of')) {
    const root = gloss.replace(/feminine of\s+([^\s,(]+).*/, '$1').replace(/[()“”,]/g, '').trim();
    const rHit = wiktDb.query("SELECT gloss FROM dictionary WHERE word = ?;").get(root);
    if (rHit && rHit.gloss) return `${cleanWiktGloss(rHit.gloss, root)} (feminine)`;
  }
  if (gloss.startsWith('oblique plural of')) {
    const root = gloss.replace(/oblique plural of\s+([^\s,(]+).*/, '$1').replace(/[()“”,]/g, '').trim();
    const rHit = wiktDb.query("SELECT gloss FROM dictionary WHERE word = ?;").get(root);
    if (rHit && rHit.gloss) return `${cleanWiktGloss(rHit.gloss, root)} (plural oblique)`;
  }
  if (gloss.includes('plural of') || gloss.includes('masculine of')) {
    const root = gloss.replace(/.*(?:plural|masculine)\s+of\s+([^\s,(]+).*/i, '$1').replace(/[()“”,]/g, '').trim();
    if (root && root !== word) {
      const rHit = wiktDb.query("SELECT gloss FROM dictionary WHERE word = ?;").get(root);
      if (rHit && rHit.gloss && !rHit.gloss.includes('plural of')) {
        return `${cleanWiktGloss(rHit.gloss, root)} (plural/inflected)`;
      }
    }
  }
  if (gloss.startsWith('direct masculine plural') || gloss.startsWith('oblique masculine')) {
    return `${word} (plural/inflected)`;
  }
  return gloss.split(';')[0].replace(/^to\s+/i, '').trim();
}

const resolutionCache = new Map();

function resolveToken(surface, norm, depth = 0) {
  if (depth > 2) {
    const voc = algorithmicallyVocalize(norm);
    return {
      vocalized: voc,
      eng: `${norm} (Urdu literary term)`,
      syns: [norm],
      expl: `${norm} کا ادبی مفہوم`,
      tier: 'literary_vocab',
    };
  }

  const cleanNorm = norm.replace(/^[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+|[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+$/gu, '').trim();
  const cleanSurf = surface.replace(/^[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+|[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+$/gu, '').trim();

  if (resolutionCache.has(cleanNorm)) {
    return resolutionCache.get(cleanNorm);
  }

  let result = null;

  // 1. Check Master Lexicon
  const hit = MASTER_LEXICON[cleanNorm] || MASTER_LEXICON[norm] || MASTER_LEXICON[cleanSurf] || MASTER_LEXICON[surface];
  if (hit) {
    let voc = hit.vocalizedForm || hit.vocalized || cleanNorm;
    voc = algorithmicallyVocalize(voc);
    result = {
      vocalized: voc,
      eng: hit.englishContextualGloss || hit.eng || cleanNorm,
      syns: hit.spokenUrduSynonymsJson || hit.syns || [cleanNorm],
      expl: hit.urduSimpleExplanation || hit.expl || cleanNorm,
      tier: hit.tokenTier || hit.tier || 'common_vocab',
    };
  }

  // 2. Check Wiktionary
  if (!result) {
    const wHit = wiktDb.query("SELECT * FROM dictionary WHERE word = ?;").get(cleanNorm);
    if (wHit && wHit.gloss && !wHit.gloss.includes('literary term')) {
      const cleanG = cleanWiktGloss(wHit.gloss, cleanNorm);
      if (cleanG && !cleanG.includes('direct masculine')) {
        let voc = wHit.vocalized || cleanNorm;
        voc = algorithmicallyVocalize(voc);
        result = {
          vocalized: voc,
          eng: cleanG,
          syns: [cleanNorm],
          expl: `${cleanNorm} کے معنی`,
          tier: 'common_vocab',
        };
      }
    }
  }

  // 3. Morphological Stemming
  if (!result && cleanNorm.endsWith('وں') && cleanNorm.length > 2) {
    const stem = cleanNorm.slice(0, -2);
    for (const cand of [stem, stem + 'ہ', stem + 'ا', stem + 'ی']) {
      const c = resolveToken(cand, cand, depth + 1);
      if (c && !c.eng.includes('literary term')) {
        result = {
          vocalized: `${c.vocalized.replace(/[\u064B-\u0652\u0670\u0653]*[اہی]?$/, '')}ُوں`,
          eng: `${c.eng.split('/')[0].split('(')[0].trim()} (plural oblique)`,
          syns: [cand],
          expl: `${cand} کی جمع مفعولی حالت`,
          tier: 'common_vocab',
        };
        break;
      }
    }
  }

  if (!result && cleanNorm.endsWith('یں') && cleanNorm.length > 2) {
    const stem = cleanNorm.slice(0, -2);
    for (const cand of [stem, stem + 'ی']) {
      const c = resolveToken(cand, cand, depth + 1);
      if (c && !c.eng.includes('literary term')) {
        result = {
          vocalized: `${c.vocalized}ِیں`,
          eng: `${c.eng.split('/')[0].split('(')[0].trim()} (plural)`,
          syns: [cand],
          expl: `${cand} کی جمع`,
          tier: 'common_vocab',
        };
        break;
      }
    }
  }

  if (!result && cleanNorm.endsWith('ے') && cleanNorm.length > 2) {
    const stem = cleanNorm.slice(0, -1);
    for (const cand of [stem + 'ا', stem + 'ہ']) {
      const c = resolveToken(cand, cand, depth + 1);
      if (c && !c.eng.includes('literary term')) {
        result = {
          vocalized: `${c.vocalized.replace(/[\u064B-\u0652\u0670\u0653]*[اہ]$/, '')}ِے`,
          eng: `${c.eng.split('/')[0].split('(')[0].trim()} (plural/inflected)`,
          syns: [cand],
          expl: `${cand} کی حالتِ جمع یا مفعولی`,
          tier: 'common_vocab',
        };
        break;
      }
    }
  }

  if (!result) {
    for (const part of ['تا', 'تی', 'تے']) {
      if (cleanNorm.endsWith(part) && cleanNorm.length > 2) {
        const inf = cleanNorm.slice(0, -part.length) + 'نا';
        const c = resolveToken(inf, inf, depth + 1);
        if (c && !c.eng.includes('literary term')) {
          const action = c.eng.replace(/^to\s+/i, '').split('/')[0].split('(')[0].trim();
          result = {
            vocalized: `${c.vocalized.replace(/[\u064B-\u0652\u0670\u0653]*نا$/, '')}${part === 'تے' ? 'تِے' : part === 'تی' ? 'تِی' : 'تَا'}`,
            eng: `${action}ing (${part === 'تے' ? 'plural/continuous' : part === 'تی' ? 'feminine' : 'masculine'})`,
            syns: [inf],
            expl: `${inf} کی حالت`,
            tier: 'common_vocab',
          };
          break;
        }
      }
    }
  }

  // 4. Default Guaranteed Literary Fallback
  if (!result) {
    const voc = algorithmicallyVocalize(cleanNorm);
    result = {
      vocalized: voc,
      eng: `${cleanNorm} (literary term / contextual Urdu expression)`,
      syns: [cleanNorm],
      expl: `${cleanNorm} کا ادبی سیاق و سباق`,
      tier: 'literary_vocab',
    };
  }

  resolutionCache.set(cleanNorm, result);
  return result;
}

const breakdownCache = new Map();
function getBreakdown(vocalized) {
  if (breakdownCache.has(vocalized)) return breakdownCache.get(vocalized);
  const pb = makePhoneticBreakdown(vocalized);
  const jsonStr = JSON.stringify(pb);
  breakdownCache.set(vocalized, jsonStr);
  return jsonStr;
}

const graphemeCache = new Map();
function getGraphemes(surface) {
  if (graphemeCache.has(surface)) return graphemeCache.get(surface);
  const g = UrduLanguagePack.decomposeWordToGraphemes(surface).filter(unit => unit.raw.trim().length > 0);
  const jsonStr = JSON.stringify(g);
  graphemeCache.set(surface, jsonStr);
  return jsonStr;
}

console.log('🚀 Starting Catalog Enrichment across dev.db...');

const stories = devDb.query("SELECT id, slug, title_english FROM stories ORDER BY level, sub_level;").all();
console.log(`Found ${stories.length} stories to process.`);

const stmtUpdateAnalysis = devDb.prepare(`
  UPDATE token_analyses
  SET vocalized_form = ?,
      phonetic_breakdown_json = ?,
      graphemes_json = ?,
      spoken_urdu_synonyms_json = ?,
      urdu_simple_explanation = ?,
      token_tier = ?,
      english_contextual_gloss = ?
  WHERE id = ?;
`);

const stmtInsertAnalysis = devDb.prepare(`
  INSERT INTO token_analyses (
    id, token_id, vocalized_form, phonetic_breakdown_json, graphemes_json,
    spoken_urdu_synonyms_json, urdu_simple_explanation, token_tier, english_contextual_gloss
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
`);

let totalUpdated = 0;
let totalInserted = 0;
const startTime = Date.now();

for (let sIdx = 0; sIdx < stories.length; sIdx++) {
  const story = stories[sIdx];
  
  const tokens = devDb.query(`
    SELECT t.id, t.surface_form, t.normalized_form, a.id as analysis_id
    FROM tokens t
    JOIN paragraphs p ON t.paragraph_id = p.id
    LEFT JOIN token_analyses a ON a.token_id = t.id
    WHERE p.story_id = ? AND t.is_word = 1
    ORDER BY p.paragraph_index ASC, t.token_index ASC;
  `).all(story.id);

  let storyUpdated = 0;
  let storyInserted = 0;

  devDb.transaction(() => {
    for (const t of tokens) {
      const res = resolveToken(t.surface_form, t.normalized_form);
      const pbJson = getBreakdown(res.vocalized);
      const gJson = getGraphemes(t.surface_form);
      const synsJson = JSON.stringify(res.syns);

      if (t.analysis_id) {
        stmtUpdateAnalysis.run(
          res.vocalized,
          pbJson,
          gJson,
          synsJson,
          res.expl,
          res.tier,
          res.eng,
          t.analysis_id
        );
        storyUpdated++;
      } else {
        const newAnalysisId = `ana_${t.id}`;
        stmtInsertAnalysis.run(
          newAnalysisId,
          t.id,
          res.vocalized,
          pbJson,
          gJson,
          synsJson,
          res.expl,
          res.tier,
          res.eng
        );
        storyInserted++;
      }
    }
  })();

  totalUpdated += storyUpdated;
  totalInserted += storyInserted;

  const memMb = (process.memoryUsage().rss / (1024 * 1024)).toFixed(1);
  console.log(`[${sIdx + 1}/${stories.length}] ${story.slug} (${story.title_english}): ${tokens.length} tokens (updated ${storyUpdated}, inserted ${storyInserted}) | RSS: ${memMb} MB`);
}

const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n🎉 Catalog Enrichment Complete in ${elapsedSec}s!`);
console.log(`Total Updated: ${totalUpdated}, Total Inserted: ${totalInserted}`);
console.log(`Unique words resolved in cache: ${resolutionCache.size}`);
