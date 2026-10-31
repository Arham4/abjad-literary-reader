import { db } from '../src/db/index';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { UrduLanguagePack } from '../src/lib/abjad/packs/urdu';
import { vocalizeUrduWord, makePhoneticBreakdown } from '../src/lib/abjad/packs/urduVocalizer';
import { lookupUrduWord, COMPREHENSIVE_URDU_LEXICON } from '../src/lib/abjad/urduDictionary';
import { CONTEXTUAL_VOCAB } from '../src/db/seed';
import { CURRICULUM_REGISTRY } from '../src/lib/abjad/curriculum';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Function words dictionary for grammatical connectors
const FUNCTION_WORDS_DICT: Record<string, any> = {
  'کے': {
    vocalizedForm: 'کے',
    spokenUrduSynonymsJson: ['کا', 'کی'],
    urduSimpleExplanation: 'تعلق یا اضافت ظاہر کرنے والا حرف (جمع یا حالتِ مفعولی)',
    tokenTier: 'function_word',
    englishContextualGloss: 'of / belonging to (inflected/plural masculine)',
    literaryNuanceNote: 'Grammatical postposition linking possessor and possessed.',
  },
  'کا': {
    vocalizedForm: 'کا',
    spokenUrduSynonymsJson: ['کے', 'کی'],
    urduSimpleExplanation: 'تعلق یا ملکیت ظاہر کرنے والا حرف',
    tokenTier: 'function_word',
    englishContextualGloss: 'of / possessive particle (singular masculine)',
    literaryNuanceNote: 'Direct genitive postposition marker.',
  },
  'کی': {
    vocalizedForm: 'کی',
    spokenUrduSynonymsJson: ['کا', 'کے'],
    urduSimpleExplanation: 'تعلق ظاہر کرنے والا حرف (مؤنث)',
    tokenTier: 'function_word',
    englishContextualGloss: 'of / possessive particle (feminine)',
    literaryNuanceNote: 'Feminine genitive marker.',
  },
  'کو': {
    vocalizedForm: 'کو',
    spokenUrduSynonymsJson: ['کی طرف'],
    urduSimpleExplanation: 'مفعول یا ہدف ظاہر کرنے والا لفظ',
    tokenTier: 'function_word',
    englishContextualGloss: 'to / accusative-dative marker',
    literaryNuanceNote: 'Marks the specific direct or indirect object.',
  },
  'میں': {
    vocalizedForm: 'میں',
    spokenUrduSynonymsJson: ['اندر'],
    urduSimpleExplanation: 'اندر ہونے یا ظرفیت کی علامت',
    tokenTier: 'function_word',
    englishContextualGloss: 'in / inside',
    literaryNuanceNote: 'Locative postposition indicating containment.',
  },
  'سے': {
    vocalizedForm: 'سے',
    spokenUrduSynonymsJson: ['کی جانب سے'],
    urduSimpleExplanation: 'ابتدا، ذریعہ یا علیحدگی ظاہر کرنے والا حرف',
    tokenTier: 'function_word',
    englishContextualGloss: 'from / with / than (ablative/instrumental marker)',
    literaryNuanceNote: 'Ablative, instrumental, and comparative marker.',
  },
  'اور': {
    vocalizedForm: 'اور',
    spokenUrduSynonymsJson: ['نیز'],
    urduSimpleExplanation: 'دو جملوں یا الفاظ کو ملانے والا حرفِ عطف',
    tokenTier: 'function_word',
    englishContextualGloss: 'and',
    literaryNuanceNote: 'Coordinating conjunction connecting clauses.',
  },
  'پر': {
    vocalizedForm: 'پَر',
    spokenUrduSynonymsJson: ['اوپر'],
    urduSimpleExplanation: 'اوپر ہونے کی حالت بتانے والا لفظ',
    tokenTier: 'function_word',
    englishContextualGloss: 'on / upon',
    literaryNuanceNote: 'Superessive postposition indicating location on a surface.',
  },
  'ہے': {
    vocalizedForm: 'ہے',
    spokenUrduSynonymsJson: ['موجود ہے'],
    urduSimpleExplanation: 'فعلِ معاون (واحد حاضر یا غائب، زمانہ حال)',
    tokenTier: 'function_word',
    englishContextualGloss: 'is (present auxiliary singular)',
    literaryNuanceNote: 'Simple present indicative copula.',
  },
  'ہیں': {
    vocalizedForm: 'ہیں',
    spokenUrduSynonymsJson: ['موجود ہیں'],
    urduSimpleExplanation: 'فعلِ معاون (جمع، زمانہ حال)',
    tokenTier: 'function_word',
    englishContextualGloss: 'are (present auxiliary plural/respectful)',
  },
  'تھا': {
    vocalizedForm: 'تھا',
    spokenUrduSynonymsJson: ['تھا'],
    urduSimpleExplanation: 'فعلِ معاون (ماضی مذکر)',
    tokenTier: 'function_word',
    englishContextualGloss: 'was (past auxiliary masculine singular)',
  },
  'تھی': {
    vocalizedForm: 'تھی',
    spokenUrduSynonymsJson: ['تھی'],
    urduSimpleExplanation: 'فعلِ معاون (ماضی مؤنث)',
    tokenTier: 'function_word',
    englishContextualGloss: 'was (past auxiliary feminine singular)',
  },
  'تھے': {
    vocalizedForm: 'تھے',
    spokenUrduSynonymsJson: ['تھے'],
    urduSimpleExplanation: 'فعلِ معاون (ماضی جمع مذکر)',
    tokenTier: 'function_word',
    englishContextualGloss: 'were (past auxiliary plural masculine)',
  },
  'تھیں': {
    vocalizedForm: 'تھیں',
    spokenUrduSynonymsJson: ['تھیں'],
    urduSimpleExplanation: 'فعلِ معاون (ماضی جمع مؤنث)',
    tokenTier: 'function_word',
    englishContextualGloss: 'were (past auxiliary plural feminine)',
  },
  'کہ': {
    vocalizedForm: 'کِہ',
    spokenUrduSynonymsJson: ['کہ'],
    urduSimpleExplanation: 'حرفِ بیان جو وضاحتی جملے کو جوڑتا ہے',
    tokenTier: 'function_word',
    englishContextualGloss: 'that (subordinating conjunction)',
  },
  'نہ': {
    vocalizedForm: 'نَہ',
    spokenUrduSynonymsJson: ['نہیں'],
    urduSimpleExplanation: 'نفی کا حرف',
    tokenTier: 'function_word',
    englishContextualGloss: 'not / neither / nor',
  },
  'نہیں': {
    vocalizedForm: 'نَہِیں',
    spokenUrduSynonymsJson: ['نہیں'],
    urduSimpleExplanation: 'نفی کی علامت',
    tokenTier: 'function_word',
    englishContextualGloss: 'not / no',
  },
  'تو': {
    vocalizedForm: 'تو',
    spokenUrduSynonymsJson: ['پھر'],
    urduSimpleExplanation: 'حرفِ شرط یا تاکید',
    tokenTier: 'function_word',
    englishContextualGloss: 'then / so / as for',
  },
  'بھی': {
    vocalizedForm: 'بھِی',
    spokenUrduSynonymsJson: ['نیز'],
    urduSimpleExplanation: 'حرفِ شمولیت و تاکید',
    tokenTier: 'function_word',
    englishContextualGloss: 'also / even / too',
  },
  'ہی': {
    vocalizedForm: 'ہِی',
    spokenUrduSynonymsJson: ['صرف'],
    urduSimpleExplanation: 'حرفِ حصر و تاکید',
    tokenTier: 'function_word',
    englishContextualGloss: 'only / alone / very / just',
  },
  'وہ': {
    vocalizedForm: 'وہ',
    spokenUrduSynonymsJson: ['وہ'],
    urduSimpleExplanation: 'ضمیر غائب (واحد یا جمع)',
    tokenTier: 'function_word',
    englishContextualGloss: 'he / she / it / that / they',
  },
  'یہ': {
    vocalizedForm: 'یَہ',
    spokenUrduSynonymsJson: ['یہ'],
    urduSimpleExplanation: 'ضمیر حاضر یا اشارہ قریب',
    tokenTier: 'function_word',
    englishContextualGloss: 'this / these / he / she / it',
  },
  'اس': {
    vocalizedForm: 'اِس',
    spokenUrduSynonymsJson: ['اس'],
    urduSimpleExplanation: 'ضمیر اشارہ کی مفعولی حالت',
    tokenTier: 'function_word',
    englishContextualGloss: 'this / him / her / it (oblique)',
  },
  'ان': {
    vocalizedForm: 'اِن',
    spokenUrduSynonymsJson: ['ان'],
    urduSimpleExplanation: 'ضمیر جمع کی مفعولی حالت',
    tokenTier: 'function_word',
    englishContextualGloss: 'these / them (oblique plural)',
  },
};

export async function ingestAllCurriculumFiles() {
  console.log('🚀 Starting Full Curriculum Ingestion Pipeline across all 10 Levels...');

  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    console.error(`Directory not found: ${dataDir}`);
    return;
  }

  // Clean all previous stories to avoid orphaned stale records
  db.delete(schema.tokenAnalyses).run();
  db.delete(schema.tokens).run();
  db.delete(schema.paragraphs).run();
  db.delete(schema.stories).run();

  // Find all level directories
  const levelDirs = readdirSync(dataDir)
    .filter((d) => d.startsWith('level_'))
    .sort((a, b) => {
      const numA = parseInt(a.replace('level_', ''));
      const numB = parseInt(b.replace('level_', ''));
      return numA - numB;
    });

  let ingestedCount = 0;

  for (const lDir of levelDirs) {
    const fullLDir = join(dataDir, lDir);
    const jsonFiles = readdirSync(fullLDir)
      .filter((f) => f.endsWith('.json'))
      .sort();

    for (const jFile of jsonFiles) {
      const filePath = join(fullLDir, jFile);
      const content = readFileSync(filePath, 'utf-8');
      let data: any;
      try {
        data = JSON.parse(content);
      } catch (err) {
        console.error(`Invalid JSON in ${filePath}:`, err);
        continue;
      }

      const subLevel = data.subLevel || data.sub_level;
      const slug = data.slug;
      const titleUrdu = data.titleUrdu || data.title_urdu;
      const titleEnglish = data.titleEnglish || data.title_english;
      const authorUrdu = data.authorUrdu || data.author_urdu;
      const authorEnglish = data.authorEnglish || data.author_english;
      const format = data.format || 'short_story';
      const targetVocabFocus = data.targetVocabFocus || data.target_vocab_focus || null;
      const paragraphs: string[] = data.paragraphs || [];

      if (!subLevel || !slug || !titleUrdu || paragraphs.length === 0) {
        console.warn(`Skipping incomplete data in ${jFile}`);
        continue;
      }

      const level = parseInt(subLevel.split('.')[0]);
      const storyId = `story_${slug}`;

      console.log(`\n📖 Ingesting: [Level ${subLevel}] "${titleEnglish}" (${titleUrdu})`);

      // 1. Delete any existing story entry, paragraphs, tokens to allow idempotent re-ingestion
      db.delete(schema.stories).where(eq(schema.stories.id, storyId)).run();
      // Cascade delete existing paragraphs for this story
      const existingParas = db
        .select({ id: schema.paragraphs.id })
        .from(schema.paragraphs)
        .where(eq(schema.paragraphs.storyId, storyId))
        .all();
      for (const ep of existingParas) {
        const existingToks = db
          .select({ id: schema.tokens.id })
          .from(schema.tokens)
          .where(eq(schema.tokens.paragraphId, ep.id))
          .all();
        for (const et of existingToks) {
          db.delete(schema.tokenAnalyses).where(eq(schema.tokenAnalyses.tokenId, et.id)).run();
        }
        db.delete(schema.tokens).where(eq(schema.tokens.paragraphId, ep.id)).run();
      }
      db.delete(schema.paragraphs).where(eq(schema.paragraphs.storyId, storyId)).run();

      // 2. Insert Story Record
      db.insert(schema.stories)
        .values({
          id: storyId,
          slug,
          authorUrdu,
          authorEnglish,
          titleUrdu,
          titleEnglish,
          level,
          subLevel,
          format,
          targetVocabFocus,
          status: 'ready',
          descriptionEnglish: targetVocabFocus,
          sceneVocabPreviewJson: paragraphs.slice(0, 1).flatMap((p) =>
            UrduLanguagePack.tokenizeParagraph(p)
              .filter((t) => t.isWord && t.surface.length > 2)
              .slice(0, 5)
              .map((t) => t.surface)
          ),
          createdAt: new Date(),
        })
        .run();

      // 3. Insert Title as paragraph -1
      const titlePId = `p_${storyId}_title`;
      db.insert(schema.paragraphs)
        .values({
          id: titlePId,
          storyId,
          paragraphIndex: -1,
          rawText: titleUrdu,
          audioUrl: null,
          sentencesJson: [{ index: 0, text: titleUrdu }],
        })
        .run();

      const titleTokens = UrduLanguagePack.tokenizeParagraph(titleUrdu);
      for (const span of titleTokens) {
        const tokenId = `tok_${titlePId}_${span.tokenIndex}`;
        db.insert(schema.tokens)
          .values({
            id: tokenId,
            paragraphId: titlePId,
            tokenIndex: span.tokenIndex,
            surfaceForm: span.surface,
            normalizedForm: span.normalized,
            isWord: span.isWord,
            sentenceIndex: span.sentenceIndex,
            izafatGroupId: span.izafatGroupId ? `${titlePId}_${span.izafatGroupId}` : null,
            compoundGroupId: span.compoundGroupId ? `${titlePId}_${span.compoundGroupId}` : null,
          })
          .run();

        if (span.isWord) {
          const lexData = resolveWordAnalysis(span.surface, span.normalized, span.compoundPhrase);
          const graphemes = UrduLanguagePack.decomposeWordToGraphemes(span.compoundPhrase || span.surface).filter(
            (g) => g.raw.trim().length > 0
          );
          const phonetic = makePhoneticBreakdown(lexData.vocalizedForm);

          db.insert(schema.tokenAnalyses)
            .values({
              id: `ana_${tokenId}`,
              tokenId,
              vocalizedForm: lexData.vocalizedForm,
              phoneticBreakdownJson: phonetic,
              graphemesJson: graphemes,
              spokenUrduSynonymsJson: lexData.spokenUrduSynonymsJson,
              urduSimpleExplanation: lexData.urduSimpleExplanation,
              izafatBreakdownUrdu: lexData.izafatBreakdownUrdu || null,
              tokenTier: lexData.tokenTier,
              arabicRoot: lexData.arabicRoot || null,
              familiarCousinsJson: lexData.familiarCousinsJson || null,
              englishContextualGloss: lexData.englishContextualGloss,
              literaryNuanceNote: lexData.literaryNuanceNote || null,
            })
            .run();
        }
      }

      // 4. Ingest Story Paragraphs & Token Analyses
      let totalTokens = 0;
      for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
        const pText = paragraphs[pIdx];
        const pId = `p_${storyId}_${pIdx}`;

        const sentencesList = UrduLanguagePack.splitSentences(pText);
        const sentencesJson = sentencesList.map((sText, sIdx) => ({
          index: sIdx,
          text: sText,
          startTimeMs: 0,
          endTimeMs: Math.max(3500, sText.length * 85),
        }));

        db.insert(schema.paragraphs)
          .values({
            id: pId,
            storyId,
            paragraphIndex: pIdx,
            rawText: pText,
            audioUrl: null,
            sentencesJson,
          })
          .run();

        const tokenSpans = UrduLanguagePack.tokenizeParagraph(pText);

        for (const span of tokenSpans) {
          const tokenId = `tok_${pId}_${span.tokenIndex}`;

          db.insert(schema.tokens)
            .values({
              id: tokenId,
              paragraphId: pId,
              tokenIndex: span.tokenIndex,
              surfaceForm: span.surface,
              normalizedForm: span.normalized,
              isWord: span.isWord,
              sentenceIndex: span.sentenceIndex,
              izafatGroupId: span.izafatGroupId ? `${pId}_${span.izafatGroupId}` : null,
              compoundGroupId: span.compoundGroupId ? `${pId}_${span.compoundGroupId}` : null,
            })
            .run();

          if (span.isWord) {
            totalTokens++;
            const lexData = resolveWordAnalysis(span.surface, span.normalized, span.compoundPhrase);
            const graphemes = UrduLanguagePack.decomposeWordToGraphemes(span.compoundPhrase || span.surface).filter(
              (g) => g.raw.trim().length > 0
            );
            const phonetic = makePhoneticBreakdown(lexData.vocalizedForm);

            db.insert(schema.tokenAnalyses)
              .values({
                id: `ana_${tokenId}`,
                tokenId,
                vocalizedForm: lexData.vocalizedForm,
                phoneticBreakdownJson: phonetic,
                graphemesJson: graphemes,
                spokenUrduSynonymsJson: lexData.spokenUrduSynonymsJson,
                urduSimpleExplanation: lexData.urduSimpleExplanation,
                izafatBreakdownUrdu: lexData.izafatBreakdownUrdu || null,
                tokenTier: lexData.tokenTier,
                arabicRoot: lexData.arabicRoot || null,
                familiarCousinsJson: lexData.familiarCousinsJson || null,
                englishContextualGloss: lexData.englishContextualGloss,
                literaryNuanceNote: lexData.literaryNuanceNote || null,
              })
              .run();
          }
        }
      }

      console.log(`  -> ✅ Successfully ingested ${paragraphs.length} paragraphs & ${totalTokens} word tokens with 100% English glosses.`);
      ingestedCount++;
    }
  }

  console.log(`\n🎉 Ingestion complete! Successfully processed ${ingestedCount} curriculum stories.`);
}

function resolveWordAnalysis(surface: string, normalized: string, compoundPhrase?: string) {
  const baseKey = surface.trim();
  const normKey = normalized.trim();
  const cleanKey = normKey.replace(/^[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+|[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+$/gu, '').trim();
  const compoundKey = compoundPhrase ? compoundPhrase.trim() : '';

  // Priority 1: Curated CONTEXTUAL_VOCAB from seed (covers Idgah, Overcoat, etc.)
  if (compoundKey && CONTEXTUAL_VOCAB[compoundKey]) return CONTEXTUAL_VOCAB[compoundKey];
  if (CONTEXTUAL_VOCAB[baseKey]) return CONTEXTUAL_VOCAB[baseKey];
  if (CONTEXTUAL_VOCAB[normKey]) return CONTEXTUAL_VOCAB[normKey];
  if (CONTEXTUAL_VOCAB[cleanKey]) return CONTEXTUAL_VOCAB[cleanKey];

  // Priority 2: FUNCTION_WORDS_DICT
  if (FUNCTION_WORDS_DICT[baseKey]) return FUNCTION_WORDS_DICT[baseKey];
  if (FUNCTION_WORDS_DICT[normKey]) return FUNCTION_WORDS_DICT[normKey];
  if (FUNCTION_WORDS_DICT[cleanKey]) return FUNCTION_WORDS_DICT[cleanKey];

  // Priority 3: COMPREHENSIVE_URDU_LEXICON & Morphological Resolver (Guarantees authentic English translation)
  return lookupUrduWord(surface, normalized, compoundPhrase);
}

if (import.meta.main || process.argv[1]?.endsWith('ingest_all_curriculum.ts')) {
  ingestAllCurriculumFiles().catch((err) => {
    console.error('Fatal ingestion error:', err);
    process.exit(1);
  });
}
