export type ScriptTradition = 'nastaliq' | 'naskh';

export interface GraphemeUnit {
  raw: string;          // Isolated letter or aspirated digraph (e.g., "بھ" or "م")
  name: string;         // Letter name in target language (e.g., "بھے" or "میم")
  isAspiratedDigraph?: boolean;
}

export interface PhoneticSyllablePill {
  letters: string;          // Vocalized syllable cluster (e.g., "مُ" or "خْ")
  vowelNameUrdu?: string;   // e.g., "پیش", "زبر", "زیر", "جزم"
}

export interface TokenSpan {
  id: string;
  tokenIndex: number;
  surface: string;
  normalized: string;
  isWord: boolean;      // false for punctuation/whitespace
  sentenceIndex: number;
  izafatGroupId?: string;
  compoundGroupId?: string;
}

export interface AbjadLanguagePack {
  code: 'ur' | 'fa' | 'ar' | 'ps' | 'sd';
  name: string;
  nativeName: string;
  defaultScriptTradition: ScriptTradition;
  fontStack: { nastaliq: string[]; naskh: string[]; };
  typographyDefaults: { baseFontSizePx: number; lineHeightMultiplier: number; wordSpacingEm: number; };
  normalizeUnicode(text: string): string;
  stripHarakatPreserveOrthography(text: string): string;
  decomposeWordToGraphemes(word: string): GraphemeUnit[];
  tokenizeParagraph(text: string): TokenSpan[];
  supportedMorphology: Array<'izafat' | 'triliteral_root' | 'persian_compounding' | 'spoken_bridge'>;
  buildLinguisticPrompt(paragraph: string, contextTitle?: string): string;
}
