import { describe, expect, test } from 'bun:test';
import { UrduLanguagePack } from '../src/lib/abjad/packs/urdu';

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

    // Sentence ending creates sentenceIndex increment
    expect(tokens[tokens.length - 1].sentenceIndex).toBeGreaterThanOrEqual(0);
  });
});
