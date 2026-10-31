import { describe, expect, test } from 'bun:test';
import { UrduLanguagePack } from '../src/lib/abjad/packs/urdu';
import { cleanUrduForTTS, api } from '../src/server/api';
import { vocalizeUrduWord, makePhoneticBreakdown } from '../src/lib/abjad/packs/urduVocalizer';
import { db } from '../src/db/index';
import * as schema from '../src/db/schema';
import { eq, and, gte } from 'drizzle-orm';

describe('UrduLanguagePack Grapheme & Orthography Tests', () => {
  test('Aspirated digraph grouping: پڑھنا -> ["پڑھ", "ن", "ا"]', () => {
    const units = UrduLanguagePack.decomposeWordToGraphemes('پڑھنا');
    const raws = units.map((u) => u.raw);
    expect(raws).toEqual(['پ', 'ڑھ', 'ن', 'ا']);
    expect(units[1].isAspiratedDigraph).toBe(true);
    expect(units[1].name).toBe('ڑھے');
  });

  test('Geminated aspirate with shadda: مکھن -> ["م", "کھ", "ن"]', () => {
    // Both bare and vocalized with shadda: مَکَّھن
    const units1 = UrduLanguagePack.decomposeWordToGraphemes('مکھن');
    expect(units1.map((u) => u.raw)).toEqual(['م', 'کھ', 'ن']);
    expect(units1[1].isAspiratedDigraph).toBe(true);

    const units2 = UrduLanguagePack.decomposeWordToGraphemes('مَکَّھن');
    expect(units2.map((u) => u.raw)).toEqual(['م', 'کھ', 'ن']);
    expect(units2[1].isAspiratedDigraph).toBe(true);
  });

  test('Safe harakat stripping preserves Madda (آ) and Hamza (ۂ)', () => {
    // آئینہ with zabar/zer
    const strippedAina = UrduLanguagePack.stripHarakatPreserveOrthography('آئِینَہ');
    expect(strippedAina.startsWith('آ')).toBe(true);
    expect(strippedAina).toContain('آ');

    // خانۂ خدا: ۂ (Heh Goal with Hamza) must be retained
    const strippedKhana = UrduLanguagePack.stripHarakatPreserveOrthography('خانۂ خُدا');
    expect(strippedKhana).toContain('ۂ');
    expect(strippedKhana).not.toContain('\u064F'); // Pesh stripped

    // شہرِ افسوس: Madda in افسوس preserved
    const strippedShehr = UrduLanguagePack.stripHarakatPreserveOrthography('شَہْرِ اَفْسوس');
    expect(strippedShehr).toBe('شہر افسوس');
  });

  test('Unicode normalization converts Arabic Kaf, Yeh, Heh to Urdu forms', () => {
    // Arabic Kaf \u0643 -> Urdu Keheh \u06A9
    expect(UrduLanguagePack.normalizeUnicode('\u0643\u062A\u0627\u0628')).toBe('کتاب');

    // Arabic Yeh \u064A -> Urdu Farsi Yeh \u06CC
    expect(UrduLanguagePack.normalizeUnicode('\u067E\u0627\u0646\u064A')).toBe('پانی');

    // Arabic Heh \u0647 -> Urdu Heh Goal \u06C1
    expect(UrduLanguagePack.normalizeUnicode('\u0647\u0645')).toBe('ہم');

    // Eastern Arabic digits to Extended Arabic-Indic digits
    expect(UrduLanguagePack.normalizeUnicode('١٩٤٧')).toBe('۱۹۴۷');
  });

  test('Tokenization preserves trailing Zer-e-Izafat in normalizedForm and tags izafatGroupId', () => {
    const tokens = UrduLanguagePack.tokenizeParagraph('شہرِ افسوس کی کہانی۔');
    const wordTokens = tokens.filter((t) => t.isWord);

    // First word is 'شہرِ'
    expect(wordTokens[0].surface).toBe('شہرِ');
    expect(wordTokens[0].normalized).toBe('شہرِ'); // Trailing zer preserved!
    expect(wordTokens[0].izafatGroupId).toBeDefined();

    // Second word 'افسوس' shares the same izafatGroupId
    expect(wordTokens[1].surface).toBe('افسوس');
    expect(wordTokens[1].izafatGroupId).toBe(wordTokens[0].izafatGroupId);

    // Subsequent words 'کی' and 'کہانی' must NOT have izafatGroupId
    expect(wordTokens[2].surface).toBe('کی');
    expect(wordTokens[2].izafatGroupId).toBeUndefined();
    expect(wordTokens[3].surface).toContain('کہانی');
    expect(wordTokens[3].izafatGroupId).toBeUndefined();

    // Sentence ending creates sentenceIndex increment
    expect(tokens[tokens.length - 1].sentenceIndex).toBeGreaterThanOrEqual(0);
  });

  test('Tokenization detaches punctuation marks like "۔", "،", "؟" from word tokens', () => {
    const tokens = UrduLanguagePack.tokenizeParagraph('مغل پورہ پہنچی۔ بہت لوگ مارے گئے تھے۔');
    const words = tokens.filter((t) => t.isWord).map((t) => t.surface);
    expect(words).toContain('مغل');
    expect(words).toContain('پورہ');
    expect(words).toContain('پہنچی');
    expect(words).not.toContain('پہنچی۔');
    expect(words).toContain('تھے');
    expect(words).not.toContain('تھے۔');

    const nonWords = tokens.filter((t) => !t.isWord).map((t) => t.surface);
    expect(nonWords).toContain('۔');
  });

  test('splitSentences and tokenizeParagraph synchronize sentenceIndex with 100% precision', () => {
    const text = 'امرتسر سے اسپیشل ٹرین دوپہر دو بجے کو چلی اور آٹھ گھنٹوں کے بعد مغل پورہ پہنچی۔ راستے میں کئی آدمی مارے گئے۔ متعدد زخمی ہوئے اور کچھ ادھر ادھر بھٹک گئے۔';
    const sentences = UrduLanguagePack.splitSentences(text);
    expect(sentences.length).toBe(3);
    expect(sentences[0]).toBe('امرتسر سے اسپیشل ٹرین دوپہر دو بجے کو چلی اور آٹھ گھنٹوں کے بعد مغل پورہ پہنچی۔');
    expect(sentences[1]).toBe('راستے میں کئی آدمی مارے گئے۔');
    expect(sentences[2]).toBe('متعدد زخمی ہوئے اور کچھ ادھر ادھر بھٹک گئے۔');

    const tokens = UrduLanguagePack.tokenizeParagraph(text);
    const s0Tokens = tokens.filter((t) => t.sentenceIndex === 0).map((t) => t.surface).join('').trim();
    const s1Tokens = tokens.filter((t) => t.sentenceIndex === 1).map((t) => t.surface).join('').trim();
    const s2Tokens = tokens.filter((t) => t.sentenceIndex === 2).map((t) => t.surface).join('').trim();

    expect(s0Tokens).toBe(sentences[0]);
    expect(s1Tokens).toBe(sentences[1]);
    expect(s2Tokens).toBe(sentences[2]);
  });

  test('cleanUrduForTTS strips distracting jazm and diacritics for neural speech models', () => {
    // Amritsar with jazm and diacritics
    expect(cleanUrduForTTS('امْرِتْسَر')).toBe('امرتسر');

    // Special with zer, jazm, zabar
    expect(cleanUrduForTTS('اِسْپیشَل')).toBe('اسپیشل');

    // Train with jazm and zer
    expect(cleanUrduForTTS('ٹْرِین')).toBe('ٹرین');

    // Afternoon with zabars
    expect(cleanUrduForTTS('دَوپَہَر')).toBe('دوپہر');

    // Mughalpura with pesh and zabar
    expect(cleanUrduForTTS('مُغَل پُورَہ')).toBe('مغل پورہ');

    // Annas with Madda: guarantees Madda on Alif is preserved and segmented for neural speech
    expect(cleanUrduForTTS('آنوں')).toBe('آ نوں');
    expect(cleanUrduForTTS('آنُوں')).toBe('آ نوں');
    expect(cleanUrduForTTS('\u0627\u0653نوں')).toBe('آ نوں');

    // Persian-origin clitics: تاکہ (taakeh), بلکہ (balkeh), چونکہ (choonkeh)
    expect(cleanUrduForTTS('تاکہ')).toBe('تاکے');
    expect(cleanUrduForTTS('تاکِہ')).toBe('تاکے');
    expect(cleanUrduForTTS('تا کہ')).toBe('تاکے');
    expect(cleanUrduForTTS('محنت کرو تاکہ کامیاب ہو سکو۔')).toBe('محنت کرو تاکے کامیاب ہو سکو۔');
    expect(cleanUrduForTTS('بلکہ')).toBe('بلکے');
    expect(cleanUrduForTTS('چونکہ')).toBe('چونکے');

    // Sentence with preserved Madda (آ) and consonants
    const sentence = 'امرتسر سے اسپیشل ٹرین دوپہر دو بجے کو چلی اور آٹھ گھنٹوں کے بعد مغل پورہ پہنچی۔';
    expect(cleanUrduForTTS(sentence)).toBe(sentence);
  });

  test('vocalizeUrduWord and makePhoneticBreakdown accurately vocalize words like پیسوں', () => {
    // 1. پیسوں resolves to full diacritics
    const vocalizedPaison = vocalizeUrduWord('پیسوں');
    expect(vocalizedPaison).toBe('پَیْسُوں');

    // 2. Breakdown creates structured pills with accurate vowel names
    const pills = makePhoneticBreakdown(vocalizedPaison);
    expect(pills.length).toBe(5);
    expect(pills[0].letters).toBe('پَ');
    expect(pills[0].vowelNameUrdu).toBe('زبر');
    expect(pills[1].letters).toBe('یْ');
    expect(pills[1].vowelNameUrdu).toBe('جزم');
    expect(pills[2].letters).toBe('سُ');
    expect(pills[2].vowelNameUrdu).toBe('پیش');
    expect(pills[3].letters).toBe('و');
    expect(pills[3].vowelNameUrdu).toBe('واؤ');
    expect(pills[4].letters).toBe('ں');
    expect(pills[4].vowelNameUrdu).toBe('نون غنہ');

    // 3. Aspirated digraphs (گھَر) kept together with diacritic
    const gharPills = makePhoneticBreakdown('گھَرْ');
    expect(gharPills[0].letters).toBe('گھَ');
    expect(gharPills[0].vowelNameUrdu).toBe('زبر');
    expect(gharPills[1].letters).toBe('رْ');
    expect(gharPills[1].vowelNameUrdu).toBe('جزم');

    // 4. Combined tashdid and vowel (مِٹِّی) without orphaned pills
    const mittiPills = makePhoneticBreakdown('مِٹِّی');
    expect(mittiPills.length).toBe(3);
    expect(mittiPills[0].letters).toBe('مِ');
    expect(mittiPills[0].vowelNameUrdu).toBe('زیر');
    expect(mittiPills[1].letters).toBe('ٹِّ');
    expect(mittiPills[1].vowelNameUrdu).toBe('تشدید و زیر');
    expect(mittiPills[2].letters).toBe('ی');
    expect(mittiPills[2].vowelNameUrdu).toBe('چھوٹی یے');
  });

  test(
    'Vocabulary Vault API: Contextual Ingestion, Enrichment, Patching & Anki Export',
    async () => {
      // 1. Ingest contextual telemetry for an item
    const postRes = await api.fetch(
      new Request('http://localhost/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          normalizedSurface: 'چمٹا',
          vocalizedSurface: 'چِمْٹَا',
          tapLevel: 2,
          storyId: 'story_idgah',
          storySlug: 'idgah',
          storyTitleUrdu: 'عید گاہ',
          sourceSentenceUrdu: 'حامد نے تین پیسوں میں چمٹا خریدا۔',
        }),
      })
    );
    expect(postRes.status).toBe(200);

    // 2. Fetch enriched items
    const getRes = await api.fetch(new Request('http://localhost/telemetry'));
    expect(getRes.status).toBe(200);
    const getData: any = await getRes.json();
    expect(getData.success).toBe(true);

    const chimta = getData.data.find((it: any) => it.normalizedSurface === 'چمٹا');
    expect(chimta).toBeDefined();
    expect(chimta.storyTitleUrdu).toBe('عید گاہ');
    expect(chimta.sourceSentenceUrdu).toBe('حامد نے تین پیسوں میں چمٹا خریدا۔');

    // 3. Patch star status
    const patchRes = await api.fetch(
      new Request(`http://localhost/telemetry/${chimta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: true, masteryStatus: 'mastered' }),
      })
    );
    expect(patchRes.status).toBe(200);

    // 4. Verify Anki CSV Export
    const exportRes = await api.fetch(new Request('http://localhost/telemetry/export'));
    expect(exportRes.status).toBe(200);
    expect(exportRes.headers.get('Content-Type')).toContain('text/csv');
    const csvText = await exportRes.text();
    expect(csvText).toContain('Urdu Headword');
    expect(csvText).toContain('چمٹا');
    expect(csvText).toContain('عید گاہ');

    // 5. Delete word from vault
    const deleteRes = await api.fetch(
      new Request(`http://localhost/telemetry/${chimta.id}`, {
        method: 'DELETE',
      })
    );
    expect(deleteRes.status).toBe(200);
  }, 15000);

  test('Multi-word compound & idiom grouping: چکنا چور, دل ہی دل میں, لمحہ بہ لمحہ', () => {
    // 1. Binomial compound: چکنا چور
    const tokensChakna = UrduLanguagePack.tokenizeParagraph('گھڑا گر پڑا اور چکنا چور ہو گیا۔');
    const chakna = tokensChakna.find((t) => t.surface === 'چکنا');
    const choor = tokensChakna.find((t) => t.surface === 'چور');
    expect(chakna).toBeDefined();
    expect(choor).toBeDefined();
    expect(chakna!.compoundGroupId).toBeDefined();
    expect(choor!.compoundGroupId).toBe(chakna!.compoundGroupId);
    expect(chakna!.compoundPhrase).toBe('چکنا چور');

    // 2. Reduplicative emphatic: دل ہی دل میں
    const tokensDil = UrduLanguagePack.tokenizeParagraph('وہ دل ہی دل میں مسکرانے لگے۔');
    const dilWords = tokensDil.filter((t) => t.isWord && ['دل', 'ہی', 'میں'].includes(t.surface));
    expect(dilWords.length).toBe(4);
    const firstCid = dilWords[0].compoundGroupId;
    expect(firstCid).toBeDefined();
    for (const w of dilWords) {
      expect(w.compoundGroupId).toBe(firstCid);
      expect(w.compoundPhrase).toBe('دل ہی دل میں');
    }

    // 3. Persian prepositional reduplication: لمحہ بہ لمحہ
    const tokensLamha = UrduLanguagePack.tokenizeParagraph('خوشی لمحہ بہ لمحہ بڑھتی گئی۔');
    const lamhaWords = tokensLamha.filter((t) => t.isWord && ['لمحہ', 'بہ'].includes(t.surface));
    expect(lamhaWords.length).toBe(3);
    const lamhaCid = lamhaWords[0].compoundGroupId;
    expect(lamhaCid).toBeDefined();
    for (const w of lamhaWords) {
      expect(w.compoundGroupId).toBe(lamhaCid);
      expect(w.compoundPhrase).toBe('لمحہ بہ لمحہ');
    }

    // 4. Distinct compound occurrences must have unique compoundGroupIds
    const tokensMultiple = UrduLanguagePack.tokenizeParagraph('طرح طرح کی باتیں اور پیارے پیارے بچے۔');
    const tarah1 = tokensMultiple.find((t) => t.surface === 'طرح');
    const pyare1 = tokensMultiple.find((t) => t.surface === 'پیارے');
    expect(tarah1!.compoundGroupId).toBeDefined();
    expect(pyare1!.compoundGroupId).toBeDefined();
    expect(tarah1!.compoundGroupId).not.toBe(pyare1!.compoundGroupId);
  });

  test('Phrase Decoding Engine: POST /api/phrase/decode', async () => {
    // 1. Direct compound: چکنا چور
    const resChakna = await api.fetch(
      new Request('http://localhost/phrase/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: 'چکنا چور' }),
      })
    );
    expect(resChakna.status).toBe(200);
    const dataChakna: any = await resChakna.json();
    expect(dataChakna.success).toBe(true);
    expect(dataChakna.data.vocalizedForm).toBe('چَکْنا چُور');
    expect(dataChakna.data.englishContextualGloss).toContain('shattered');
    expect(dataChakna.data.spokenUrduSynonymsJson).toContain('ٹکڑے ٹکڑے');

    // 2. Synthesized verb phrase: دل ہی دل میں مسکرانے لگے
    const resDil = await api.fetch(
      new Request('http://localhost/phrase/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: 'دل ہی دل میں مسکرانے لگے' }),
      })
    );
    expect(resDil.status).toBe(200);
    const dataDil: any = await resDil.json();
    expect(dataDil.success).toBe(true);
    expect(dataDil.data.englishContextualGloss).toContain('smile');
    expect(dataDil.data.spokenUrduSynonymsJson).toContain('چپکے سے مسکرا دیے');

    // 3. Prepositional reduplication: لمحہ بہ لمحہ
    const resLamha = await api.fetch(
      new Request('http://localhost/phrase/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: 'لمحہ بہ لمحہ' }),
      })
    );
    expect(resLamha.status).toBe(200);
    const dataLamha: any = await resLamha.json();
    expect(dataLamha.success).toBe(true);
    expect(dataLamha.data.englishContextualGloss).toContain('moment by moment');
  });

  test('Pagination API: GET /stories/:slug?page=1&pageSize=4 returns pagination metadata and bounded tokens', async () => {
    const res = await api.fetch(new Request('http://localhost/stories/baagh?page=1&pageSize=4'));
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.pagination).toBeDefined();
    expect(data.data.pagination.currentPage).toBe(1);
    expect(data.data.pagination.pageSize).toBe(4);
    expect(data.data.pagination.totalPages).toBeGreaterThanOrEqual(1);
    expect(data.data.paragraphs.length).toBeLessThanOrEqual(5); // title (-1) + 4 body paragraphs
  });

  describe('Curriculum Canon Unabridged Word Counts & Swaps Verification', () => {
    function getStoryStats(slug: string) {
      const story = db.select().from(schema.stories).where(eq(schema.stories.slug, slug)).get();
      expect(story).toBeDefined();
      const bodyParagraphs = db
        .select({ rawText: schema.paragraphs.rawText })
        .from(schema.paragraphs)
        .where(and(eq(schema.paragraphs.storyId, story!.id), gte(schema.paragraphs.paragraphIndex, 0)))
        .all();
      const wordCount = bodyParagraphs
        .map((p) => p.rawText)
        .join(' ')
        .split(/\s+/)
        .filter(Boolean).length;
      return { paragraphCount: bodyParagraphs.length, wordCount };
    }

    test('2.2 Idgah (Munshi Premchand) unabridged: > 4,200 words', async () => {
      const stats = await getStoryStats('idgah');
      expect(stats.wordCount).toBeGreaterThan(4200);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(60);
    });

    test('3.2 Mureedpur Ka Peer (Patras Bukhari swap) unabridged: > 3,000 words', async () => {
      const stats = await getStoryStats('mureedpur-ka-peer');
      expect(stats.wordCount).toBeGreaterThan(3000);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(70);
    });

    test('3.3 Chacha Chakkan (Imtiaz Ali Taj swap) unabridged: > 1,500 words', async () => {
      const stats = await getStoryStats('chacha-chakkan');
      expect(stats.wordCount).toBeGreaterThan(1500);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(20);
    });

    test('4.1 Panchayat (Munshi Premchand) unabridged: > 3,500 words', async () => {
      const stats = await getStoryStats('panchayat');
      expect(stats.wordCount).toBeGreaterThan(3500);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(40);
    });

    test('4.2 Namak Ka Darogha (Munshi Premchand) unabridged: > 3,000 words', async () => {
      const stats = await getStoryStats('namak-ka-darogha');
      expect(stats.wordCount).toBeGreaterThan(3000);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(40);
    });

    test('5.1 Sawere Jo Kal Aankh Meri Khuli (Patras Bukhari) unabridged: > 2,500 words', async () => {
      const stats = await getStoryStats('sawere-kal-aankh');
      expect(stats.wordCount).toBeGreaterThan(2500);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(50);
    });

    test('5.2 Overcoat (Ghulam Abbas) unabridged: > 2,500 words', async () => {
      const stats = await getStoryStats('overcoat');
      expect(stats.wordCount).toBeGreaterThan(2500);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(45);
    });

    test('6.2 Anandi (Ghulam Abbas) unabridged: > 3,800 words', async () => {
      const stats = await getStoryStats('anandi');
      expect(stats.wordCount).toBeGreaterThan(3800);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(50);
    });

    test('6.3 Kafan (Munshi Premchand) unabridged: > 2,800 words', async () => {
      const stats = await getStoryStats('kafan');
      expect(stats.wordCount).toBeGreaterThan(2800);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(50);
    });

    test('7.3 Toba Tek Singh (Saadat Hasan Manto) unabridged: > 2,400 words & > 35 paragraphs', async () => {
      const stats = await getStoryStats('toba-tek-singh');
      expect(stats.wordCount).toBeGreaterThan(2400);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(35);
    });

    test('7.4 Peshawar Express (Krishan Chander swap) unabridged: > 4,000 words', async () => {
      const stats = await getStoryStats('peshawar-express');
      expect(stats.wordCount).toBeGreaterThan(4000);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(50);
    });

    test('8.1 Hathak (Saadat Hasan Manto) unabridged: > 6,000 words & > 100 paragraphs', async () => {
      const stats = await getStoryStats('hathak');
      expect(stats.wordCount).toBeGreaterThan(6000);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(100);
    });

    test('8.2 Thanda Gosht (Saadat Hasan Manto) unabridged: > 2,000 words', async () => {
      const stats = await getStoryStats('thanda-gosht');
      expect(stats.wordCount).toBeGreaterThan(2000);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(50);
    });

    test('8.3 Lajwanti (Rajinder Singh Bedi swap) unabridged: > 4,500 words', async () => {
      const stats = await getStoryStats('lajwanti');
      expect(stats.wordCount).toBeGreaterThan(4500);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(60);
    });

    test('9.2 Seemiya / Taaoos Chaman Ki Maina (Naiyer Masud) unabridged: > 10,000 words', async () => {
      const stats = await getStoryStats('seemiya');
      expect(stats.wordCount).toBeGreaterThan(10000);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(300);
    });

    test('9.3 Patjhar Ki Awaz (Qurratulain Hyder swap) unabridged: > 5,000 words', async () => {
      const stats = await getStoryStats('patjhar-ki-awaz');
      expect(stats.wordCount).toBeGreaterThan(5000);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(65);
    });

    test('10.1 Babu Gopinath (Saadat Hasan Manto swap) unabridged: > 5,500 words', async () => {
      const stats = await getStoryStats('babu-gopinath');
      expect(stats.wordCount).toBeGreaterThan(5500);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(85);
    });

    test('10.2 Baagh (Abdullah Hussein) full multi-chapter arc: > 5,000 words', async () => {
      const stats = await getStoryStats('baagh');
      expect(stats.wordCount).toBeGreaterThan(5000);
      expect(stats.paragraphCount).toBeGreaterThanOrEqual(80);
    });
  });
});
