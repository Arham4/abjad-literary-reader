import { AbjadLanguagePack, GraphemeUnit, TokenSpan, ScriptTradition } from '../types';

// The 15 Urdu base consonants that pair with Doachashmee Heh (\u06BE)
const ASPIRATED_BASE_LETTERS = new Set([
  'ب', 'پ', 'ت', 'ٹ', 'ج', 'چ', 'د', 'ڈ', 'ر', 'ڑ', 'ل', 'م', 'ن', 'ک', 'گ'
]);

const DOACHASHMEE_HEH = '\u06BE'; // ھ

// Letter names mapping for Urdu graphemes
const URDU_LETTER_NAMES: Record<string, string> = {
  'آ': 'الف مد آ',
  'ا': 'الف',
  'ب': 'بے',
  'بھ': 'بھے',
  'پ': 'پے',
  'پھ': 'پھے',
  'ت': 'تے',
  'تھ': 'تھے',
  'ٹ': 'ٹے',
  'ٹھ': 'ٹھے',
  'ث': 'ثے',
  'ج': 'جیم',
  'جھ': 'جھے',
  'چ': 'چے',
  'چھ': 'چھے',
  'ح': 'بڑی حے',
  'خ': 'خے',
  'د': 'دال',
  'دھ': 'دھے',
  'ڈ': 'ڈال',
  'ڈھ': 'ڈھے',
  'ذ': 'ذال',
  'ر': 'رے',
  'رھ': 'رھے',
  'ڑ': 'ڑے',
  'ڑھ': 'ڑھے',
  'ز': 'زے',
  'ژ': 'ژے',
  'س': 'سین',
  'ش': 'شین',
  'ص': 'صاد',
  'ض': 'ضاد',
  'ط': 'طوئے',
  'ظ': 'ظوئے',
  'ع': 'عین',
  'غ': 'غین',
  'ف': 'فے',
  'ق': 'قاف',
  'ک': 'کاف',
  'کھ': 'کھے',
  'گ': 'گاف',
  'گھ': 'گھے',
  'ل': 'لام',
  'لھ': 'لھے',
  'م': 'میم',
  'مھ': 'مھے',
  'ن': 'نون',
  'نھ': 'نھے',
  'ں': 'نون غنہ',
  'و': 'واؤ',
  'ہ': 'چھوٹی گول ہ',
  'ۂ': 'ہائے مع ہمزہ',
  'ھ': 'دو چشمی ہے',
  'ء': 'ہمزہ',
  'ی': 'چھوٹی یے',
  'ئ': 'ہمزہ برائے یے',
  'ے': 'بڑی یے',
  'ۓ': 'بڑی یے مع ہمزہ',
};

// Safe harakat regex: strips short vowels, tanween, sukun, and shadda
// Explicitly NEVER strips \u0653 (Madda) or \u0654 (Hamza Above)
export const SAFE_HARAKAT_REGEX = /[\u064B-\u0652\u0656-\u0658\u0670]/g;

// Eastern Arabic to Urdu Extended Arabic-Indic digits
const DIGIT_MAP: Record<string, string> = {
  '\u0660': '\u06F0', // ٠ -> ۰
  '\u0661': '\u06F1', // ١ -> ۱
  '\u0662': '\u06F2', // ٢ -> ۲
  '\u0663': '\u06F3', // ٣ -> ۳
  '\u0664': '\u06F4', // ٤ -> ۴
  '\u0665': '\u06F5', // ٥ -> ۵
  '\u0666': '\u06F6', // ٦ -> ۶
  '\u0667': '\u06F7', // ٧ -> ۷
  '\u0668': '\u06F8', // ٨ -> ۸
  '\u0669': '\u06F9', // ٩ -> ۹
};

// Curated Literary Expressions, Fixed Binomials & Idioms
export const URDU_COMMON_IDIOMS_AND_COMPOUNDS = new Set([
  'چکنا چور',
  'دل ہی دل میں',
  'دیکھتے ہی دیکھتے',
  'لمحہ بہ لمحہ',
  'قدم بہ قدم',
  'روز بہ روز',
  'رو بہ رو',
  'جا بہ جا',
  'دم بہ دم',
  'طرح طرح',
  'پیارے پیارے',
  'سر پیٹنا',
  'سر پیٹ لیا',
  'مٹی میں مل گیا',
  'مٹی میں مل چکا',
  'مٹی میں مل جانا',
  'برباد ہو گئی',
  'برباد ہو گیا',
  'برباد ہو جانا',
  'شیخ چلی',
  'ہٹ جاؤ',
  'رگ و ریشے',
  'بھاگم بھاگ',
  'ازار بند',
  'عید گاہ',
  'حجِ اکبر',
  'مکہ معظمہ',
  'پائی پائی',
  'عزتِ نفس',
  'نم دیدہ',
  'بسترِ مرگ',
  'اوور کوٹ',
  'مال روڈ',
  'خوش پوش',
  'فلیٹ ہیٹ',
  'تار تار',
  'لت پت',
  'بے ہوش',
  'کر دیا جائے',
  'کھول دو',
  'باتوں ہی باتوں میں',
  'آنکھوں ہی آنکھوں میں',
  'ہوش اڑ جانا',
  'ہوش اڑ گئے',
  'بال بال بچنا',
  'دم بخود',
  'آناً فاناً',
  'آنا فاناً',
  'خون کے آنسو',
  'کلیجہ منہ کو آنا',
  'دل بیٹھ جانا',
  'دنگ رہ جانا',
  'سود و زیاں',
  'حیران و پریشان',
  'ادھر ادھر',
  'ٹوٹ پھوٹ',
  'دیکھ بھال',
  'الٹ پلٹ',
  'جاں بلب',
  'دست بردار',
  'چہل پہل',
  'ہنستے کھیلتے',
  'رو رو کر',
  'گلاب جامن',
  'بے حد',
  'بے شمار',
  'خیر و عافیت',
  'عزیز و اقارب',
  'چیخ پکار',
  'افرا تفری',
  'خاردار تاروں',
  'خاردار تار',
  'اوندھے منہ',
  'فلک شگاف',
  'بیچوں بیچ',
  'علم و حکمت',
  'اہل محلہ',
  'خون کی ہولی',
  'خونِ جگر',
  'زمین بوس',
  'سنگِ مرمر',
  'بے حس و حرکت',
  'خاک آلود',
  'بلک بلک کر',
  'ہاں میں ہاں',
  'نشان دہی',
  'تھک ہار کر',
  'میو اسپتال',
  'بارگاہِ الٰہی',
  'بارگاہِ الہی',
]);

export const UrduLanguagePack: AbjadLanguagePack = {
  code: 'ur',
  name: 'Urdu',
  nativeName: 'اردو',
  defaultScriptTradition: 'nastaliq' as ScriptTradition,
  fontStack: {
    nastaliq: ['"Mehr Nastaliq Web"', '"Noto Nastaliq Urdu"', 'Gulzar', 'system-ui', 'sans-serif'],
    naskh: ['"Amiri"', '"Noto Sans Arabic"', 'system-ui', 'sans-serif'],
  },
  typographyDefaults: {
    baseFontSizePx: 28,
    lineHeightMultiplier: 2.6,
    wordSpacingEm: 0.14,
  },

  normalizeUnicode(text: string): string {
    if (!text) return '';

    // Step 1: NFC Normalization
    let normalized = text.normalize('NFC');

    // Step 2: Map Arabic variants to Urdu equivalents
    // Arabic Kaf \u0643 -> Urdu Keheh \u06A9
    normalized = normalized.replace(/\u0643/g, '\u06A9');

    // Arabic Yeh \u064A and Alef Maksura \u0649 -> Urdu Farsi Yeh \u06CC
    normalized = normalized.replace(/[\u064A\u0649]/g, '\u06CC');

    // Arabic Heh \u0647 and Ae \u06D5 -> Urdu Heh Goal \u06C1
    normalized = normalized.replace(/[\u0647\u06D5]/g, '\u06C1');

    // Arabic Heh with Yeh Above \u06C0 -> Urdu Heh Goal with Hamza Above \u06C2
    normalized = normalized.replace(/\u06C0/g, '\u06C2');

    // Eastern Arabic digits \u0660-\u0669 -> Extended Arabic-Indic Urdu digits \u06F0-\u06F9
    normalized = normalized.replace(/[\u0660-\u0669]/g, (ch) => DIGIT_MAP[ch] || ch);

    // Note: \u06D2 (Bari Yeh ے), \u06C1 (Heh Goal ہ), \u06C2 (Izafat Heh ۂ),
    // \u06D3 (Bari Yeh with Hamza ۓ), and \u200C (ZWNJ) are strictly preserved.

    return normalized;
  },

  stripHarakatPreserveOrthography(text: string): string {
    if (!text) return '';
    // Strip ONLY short vowels, tanween, sukun, and shadda
    // Preserves \u0653 (Combining Madda) and \u0654 (Combining Hamza)
    return text.replace(SAFE_HARAKAT_REGEX, '');
  },

  decomposeWordToGraphemes(word: string): GraphemeUnit[] {
    if (!word) return [];

    // Step 1: Normalize and strip harakat (including Shadda \u0651)
    const normalized = this.normalizeUnicode(word);
    const bare = this.stripHarakatPreserveOrthography(normalized);

    const graphemes: GraphemeUnit[] = [];
    const chars = Array.from(bare);

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const nextCh = chars[i + 1];

      // Check for aspirated digraph (Urdu base consonant + Doachashmee Heh)
      if (ASPIRATED_BASE_LETTERS.has(ch) && nextCh === DOACHASHMEE_HEH) {
        const digraph = ch + nextCh;
        graphemes.push({
          raw: digraph,
          name: URDU_LETTER_NAMES[digraph] || `${digraph} (مرکب آواز)`,
          isAspiratedDigraph: true,
        });
        i++; // skip next character
      } else {
        graphemes.push({
          raw: ch,
          name: URDU_LETTER_NAMES[ch] || ch,
          isAspiratedDigraph: false,
        });
      }
    }

    return graphemes;
  },

  tokenizeParagraph(text: string): TokenSpan[] {
    if (!text) return [];

    const normalizedText = this.normalizeUnicode(text);
    const tokens: TokenSpan[] = [];

    // Regex to capture words (including ZWNJ \u200C, trailing Zer \u0650, Madda, Hamza, etc.)
    // versus punctuation and whitespace
    const wordPattern = /[\u0621-\u064A\u0671-\u06D3\u06D5\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u064B-\u065F\u0670]+|[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!/\\\-]+|\s+|[^\s\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/gu;

    const sentencePunctuation = new Set(['۔', '؟', '?', '!', '\n']);
    let sentenceIndex = 0;
    let tokenIndex = 0;

    let match: RegExpExecArray | null;
    const rawMatches: { text: string; isWord: boolean }[] = [];

    while ((match = wordPattern.exec(normalizedText)) !== null) {
      const str = match[0];
      const isWord =
        /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/u.test(str) &&
        !/^[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!/\\\-\s\d]+$/u.test(str);
      rawMatches.push({ text: str, isWord });
    }

    // Now convert into TokenSpan with Izafat group detection
    let izafatCounter = 1;

    for (let i = 0; i < rawMatches.length; i++) {
      const item = rawMatches[i];

      if (!item.isWord) {
        tokens.push({
          id: `t_${tokenIndex}`,
          tokenIndex,
          surface: item.text,
          normalized: item.text,
          isWord: false,
          sentenceIndex,
        });

        // Check if punctuation ends a sentence
        if (sentencePunctuation.has(item.text.trim()) || item.text.includes('\n')) {
          sentenceIndex++;
        }

        tokenIndex++;
        continue;
      }

      const surface = item.text;
      const endsWithZer = surface.endsWith('\u0650'); // Zer-e-Izafat
      const endsWithHehHamza = surface.endsWith('ۂ'); // e.g. خانۂ
      
      // Verbal forms ending with 'ئے' must not be tagged as izafat
      const nonIzafatVerbalForms = new Set(['ہوئے', 'گئے', 'آئے', 'لیئے', 'دیئے', 'چاہئے', 'ہوئی', 'ہوئے']);
      const isHamzaIzafat = surface.endsWith('ئے') && surface.length > 2 && !nonIzafatVerbalForms.has(surface); // e.g. روئے زمین

      let normalized: string;
      let izafatGroupId: string | undefined;

      // Special rule: for tokens.normalizedForm, strip harakat EXCEPT trailing Zer (\u0650)
      // when used as zer-e-izafat (e.g. شہرِ retains its trailing zer)
      if (endsWithZer) {
        const withoutTrailingZer = surface.slice(0, -1);
        const strippedBase = this.stripHarakatPreserveOrthography(withoutTrailingZer);
        normalized = strippedBase + '\u0650'; // retain trailing zer!
      } else {
        normalized = this.stripHarakatPreserveOrthography(surface);
      }

      // Check if this token forms an Izafat with the next word
      const nextItemIndex = rawMatches.findIndex((m, idx) => idx > i && m.isWord);
      const isIzafatHead = (endsWithZer || endsWithHehHamza || isHamzaIzafat) && nextItemIndex !== -1;

      if (isIzafatHead) {
        const groupId = `izafat_${izafatCounter++}`;
        izafatGroupId = groupId;
      }

      tokens.push({
        id: `t_${tokenIndex}`,
        tokenIndex,
        surface,
        normalized,
        isWord: true,
        sentenceIndex,
        izafatGroupId,
      });

      tokenIndex++;
    }

    // Pass 2: Propagate izafatGroupId only from head to its immediate modifier word
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].izafatGroupId && tokens[i].isWord) {
        const gid = tokens[i].izafatGroupId;
        // Find immediate next word token and attach to the pair
        for (let j = i + 1; j < tokens.length; j++) {
          if (tokens[j].isWord) {
            tokens[j].izafatGroupId = gid;
            i = j; // Advance past the modifier so we don't cascade down the whole sentence
            break;
          }
        }
      }
    }

    // Pass 2.5: Multi-Word Idioms, Reduplications & Compound Expressions Detection Pass
    // Identifies fixed binomials (e.g. 'چکنا چور'), reduplications ('دل ہی دل میں', 'طرح طرح'), and idioms
    let compoundCounter = 1;
    const wordIndices: number[] = [];
    for (let idx = 0; idx < tokens.length; idx++) {
      if (tokens[idx].isWord) wordIndices.push(idx);
    }

    for (let wIdx = 0; wIdx < wordIndices.length; wIdx++) {
      let matched = false;
      // Evaluate sliding windows of length 4, 3, 2 words
      for (const winSize of [4, 3, 2]) {
        if (wIdx + winSize <= wordIndices.length) {
          const sliceIndices = wordIndices.slice(wIdx, wIdx + winSize);
          const rawWords = sliceIndices.map((idx) =>
            tokens[idx].normalized
              .replace(/^[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+|[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+$/gu, '')
              .trim()
          );
          const joinedPhrase = rawWords.join(' ');

          const isKnownCompound = URDU_COMMON_IDIOMS_AND_COMPOUNDS.has(joinedPhrase);
          // Reduplicative emphatic [word] ہی [word] میں (e.g. دل ہی دل میں, باتوں ہی باتوں میں)
          const isReduplicativeHeIn =
            winSize === 4 &&
            rawWords[1] === 'ہی' &&
            rawWords[3] === 'میں' &&
            rawWords[0] === rawWords[2];
          // Persian prepositional reduplication: [Noun] بہ [Noun] (e.g. لمحہ بہ لمحہ, قدم بہ قدم, روز بہ روز, جا بہ جا, رو بہ رو)
          const isBaReduplication =
            winSize === 3 &&
            rawWords[1] === 'بہ' &&
            rawWords[0] === rawWords[2];
          // Waw-e-Atf compound pair: [Noun] و [Noun] (e.g. رگ و ریشے, سود و زیاں, حیران و پریشان)
          const isWawAtfCompound =
            winSize === 3 &&
            rawWords[1] === 'و' &&
            URDU_COMMON_IDIOMS_AND_COMPOUNDS.has(joinedPhrase);
          // Echo pair / identical words (e.g. پیارے پیارے, طرح طرح, تار تار, پائی پائی)
          const isEchoPair =
            winSize === 2 &&
            rawWords[0] === rawWords[1] &&
            rawWords[0].length >= 2;

          if (isKnownCompound || isReduplicativeHeIn || isBaReduplication || isWawAtfCompound || isEchoPair) {
            const cid = `compound_${tokens[sliceIndices[0]].tokenIndex}_${compoundCounter++}`;
            const canonicalPhrase = joinedPhrase;
            for (const idx of sliceIndices) {
              tokens[idx].compoundGroupId = cid;
              tokens[idx].compoundPhrase = canonicalPhrase;
            }
            wIdx += winSize - 1; // Advance past window
            matched = true;
            break;
          }
        }
      }
    }

    // Pass 3: Align tokens with robust sentence boundaries so token.sentenceIndex is 100% synchronized!
    const sentencesList = this.splitSentences(normalizedText);
    let currentSIdx = 0;
    let accumulatedText = '';

    for (const token of tokens) {
      token.sentenceIndex = currentSIdx;
      accumulatedText += token.surface;

      const targetSentence = sentencesList[currentSIdx] || '';
      if (
        currentSIdx + 1 < sentencesList.length &&
        accumulatedText.replace(/\s+/g, '').endsWith(targetSentence.replace(/\s+/g, ''))
      ) {
        currentSIdx++;
        accumulatedText = '';
      }
    }

    return tokens;
  },

  splitSentences(text: string): string[] {
    if (!text) return [];
    const normalized = this.normalizeUnicode(text);
    // A sentence ends with [۔؟!؟!\n] followed by optional closing quotation marks and brackets
    const regex = /[^۔؟!؟!\n]+[۔؟!؟!\n]+["”'’»“”‘)…—–]*/gu;
    const matches: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(normalized)) !== null) {
      const s = match[0].trim();
      if (s) {
        matches.push(s);
      }
      lastIndex = regex.lastIndex;
    }
    const remaining = normalized.slice(lastIndex).trim();
    if (remaining) {
      matches.push(remaining);
    }
    return matches.length > 0 ? matches : [normalized.trim()];
  },

  supportedMorphology: ['izafat', 'triliteral_root', 'persian_compounding', 'spoken_bridge'],

  buildLinguisticPrompt(paragraph: string, contextTitle?: string): string {
    return `You are an expert Urdu lexicographer and literary linguist analyzing a paragraph from: "${contextTitle || 'Urdu Literature'}".
Target Reader: Conversational Urdu speaker seeking scaffolded literary reading comprehension.
Input Paragraph:
"${paragraph}"

Analyze each unique token and output a JSON object mapping tokens to:
1. vocalizedForm (with full harakat/aeraab)
2. phoneticBreakdownJson: Array of { letters: string, vowelNameUrdu?: string }
3. spokenUrduSynonymsJson: Array of everyday conversational Urdu words
4. urduSimpleExplanation: Explanation in simple, conversational Urdu
5. izafatBreakdownUrdu: If izafat, explain head and modifier connection
6. tokenTier: 'function_word' | 'common_vocab' | 'literary_vocab'
7. arabicRoot: Triliteral root if Arabic-origin (e.g., 'ش-ہ-ر')
8. familiarCousinsJson: 2-4 everyday Urdu cousin words sharing the root
9. englishContextualGloss: Concise English meaning in context
10. literaryNuanceNote: Stylistic, emotional, or cultural nuance note`;
  },
};
