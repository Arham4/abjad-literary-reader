import { sqlite } from '../src/db';
import { performance } from 'perf_hooks';

const stmtStory = sqlite.prepare('SELECT * FROM stories WHERE slug = ?;');
const stmtTitleP = sqlite.prepare('SELECT * FROM paragraphs WHERE story_id = ? AND paragraph_index = -1;');
const stmtCount = sqlite.prepare('SELECT count(*) as count FROM paragraphs WHERE story_id = ? AND paragraph_index >= 0;');
const stmtBodyP = sqlite.prepare('SELECT * FROM paragraphs WHERE story_id = ? AND paragraph_index >= 0 ORDER BY paragraph_index ASC LIMIT ? OFFSET ?;');
const stmtAllBodyP = sqlite.prepare('SELECT * FROM paragraphs WHERE story_id = ? AND paragraph_index >= 0 ORDER BY paragraph_index ASC;');

function getStoryPage(slug: string, page = 1, pageSize = 4, isAll = false) {
  const t0 = performance.now();
  const storyRow: any = stmtStory.get(slug);
  if (!storyRow) return null;

  const story = {
    id: storyRow.id,
    slug: storyRow.slug,
    authorUrdu: storyRow.author_urdu,
    authorEnglish: storyRow.author_english,
    titleUrdu: storyRow.title_urdu,
    titleEnglish: storyRow.title_english,
    level: storyRow.level,
    subLevel: storyRow.sub_level,
    format: storyRow.format,
    targetVocabFocus: storyRow.target_vocab_focus,
    sourceUrl: storyRow.source_url,
    status: storyRow.status,
    descriptionEnglish: storyRow.description_english,
    sceneVocabPreview: storyRow.scene_vocab_preview_json ? JSON.parse(storyRow.scene_vocab_preview_json) : null,
    sceneVocabPreviewJson: storyRow.scene_vocab_preview_json ? JSON.parse(storyRow.scene_vocab_preview_json) : null,
    createdAt: storyRow.created_at,
  };

  const titleRow: any = stmtTitleP.get(story.id);
  const countRow: any = stmtCount.get(story.id);
  const totalBodyParagraphs = countRow?.count || 0;

  const totalPages = Math.max(1, Math.ceil(totalBodyParagraphs / pageSize));
  const currentPage = Math.max(1, Math.min(totalPages, page));

  let bodyRows: any[];
  if (isAll) {
    bodyRows = stmtAllBodyP.all(story.id);
  } else {
    const offset = (currentPage - 1) * pageSize;
    bodyRows = stmtBodyP.all(story.id, pageSize, offset);
  }

  const mapP = (p: any) => ({
    id: p.id,
    storyId: p.story_id,
    paragraphIndex: p.paragraph_index,
    rawText: p.raw_text,
    audioUrl: p.audio_url,
    sentencesJson: typeof p.sentences_json === 'string' ? JSON.parse(p.sentences_json) : p.sentences_json,
  });

  const pageParagraphs = titleRow ? [mapP(titleRow), ...bodyRows.map(mapP)] : bodyRows.map(mapP);
  const pIds = pageParagraphs.map(p => p.id);

  let allTokens: any[] = [];
  const allAnalyses: Record<string, any> = {};

  if (pIds.length > 0) {
    const pPlaceholders = pIds.map(() => '?').join(',');
    const tokenRows: any[] = sqlite.query(
      `SELECT * FROM tokens WHERE paragraph_id IN (${pPlaceholders}) ORDER BY paragraph_id ASC, token_index ASC;`
    ).all(...pIds);

    allTokens = tokenRows.map(t => ({
      id: t.id,
      paragraphId: t.paragraph_id,
      tokenIndex: t.token_index,
      surfaceForm: t.surface_form,
      normalizedForm: t.normalized_form,
      isWord: Boolean(t.is_word),
      sentenceIndex: t.sentence_index,
      izafatGroupId: t.izafat_group_id,
      compoundGroupId: t.compound_group_id,
    }));

    const wordTokenIds = allTokens.filter(t => t.isWord).map(t => t.id);

    for (let i = 0; i < wordTokenIds.length; i += 300) {
      const chunk = wordTokenIds.slice(i, i + 300);
      if (chunk.length > 0) {
        const chunkPlaceholders = chunk.map(() => '?').join(',');
        const analysisRows: any[] = sqlite.query(
          `SELECT * FROM token_analyses WHERE token_id IN (${chunkPlaceholders});`
        ).all(...chunk);

        for (const a of analysisRows) {
          allAnalyses[a.token_id] = {
            id: a.id,
            tokenId: a.token_id,
            vocalizedForm: a.vocalized_form,
            phoneticBreakdownJson: typeof a.phonetic_breakdown_json === 'string' ? JSON.parse(a.phonetic_breakdown_json) : a.phonetic_breakdown_json,
            graphemesJson: typeof a.graphemes_json === 'string' ? JSON.parse(a.graphemes_json) : a.graphemes_json,
            spokenUrduSynonymsJson: typeof a.spoken_urdu_synonyms_json === 'string' ? JSON.parse(a.spoken_urdu_synonyms_json) : a.spoken_urdu_synonyms_json,
            urduSimpleExplanation: a.urdu_simple_explanation,
            izafatBreakdownUrdu: a.izafat_breakdown_urdu,
            tokenTier: a.token_tier,
            arabicRoot: a.arabic_root,
            familiarCousinsJson: a.familiar_cousins_json ? (typeof a.familiar_cousins_json === 'string' ? JSON.parse(a.familiar_cousins_json) : a.familiar_cousins_json) : null,
            englishContextualGloss: a.english_contextual_gloss,
            literaryNuanceNote: a.literary_nuance_note,
          };
        }
      }
    }
  }

  const result = {
    story,
    paragraphs: pageParagraphs,
    tokens: allTokens,
    analyses: allAnalyses,
    pagination: {
      currentPage: isAll ? 1 : currentPage,
      pageSize: isAll ? totalBodyParagraphs : pageSize,
      totalParagraphs: totalBodyParagraphs,
      totalPages: isAll ? 1 : totalPages,
      hasNextPage: isAll ? false : currentPage < totalPages,
      hasPrevPage: isAll ? false : currentPage > 1,
    },
  };

  const elapsed = performance.now() - t0;
  return { result, elapsed };
}

console.log('Testing raw sqlite getStoryPage performance:');
for (const slug of ['sheikh-chilli', 'idgah', 'hathak', 'baagh']) {
  const res = getStoryPage(slug, 1, 4);
  console.log(`${slug}: ${res.elapsed.toFixed(2)}ms | tokens: ${res.result.tokens.length} | analyses: ${Object.keys(res.result.analyses).length}`);
}
