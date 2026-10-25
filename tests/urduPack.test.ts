import { describe, expect, test } from 'bun:test';
import { UrduLanguagePack } from '../src/lib/abjad/packs/urdu';
import { cleanUrduForTTS } from '../src/server/api';
import { vocalizeUrduWord, makePhoneticBreakdown } from '../src/lib/abjad/packs/urduVocalizer';

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
});
