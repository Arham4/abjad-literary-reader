import { db, sqlite } from './index';
import * as schema from './schema';
import { UrduLanguagePack } from '../lib/abjad/packs/urdu';
import { PhoneticSyllablePill } from '../lib/abjad/types';

// Helper to create phonetic breakdown pills
function makePhoneticPills(vocalized: string): PhoneticSyllablePill[] {
  const pills: PhoneticSyllablePill[] = [];
  const chars = Array.from(vocalized);
  let currentLetter = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const isDiacritic = /[\u064B-\u0652\u0670]/.test(ch);

    if (isDiacritic) {
      let vName = 'اعراب';
      if (ch === '\u064E') vName = 'زبر';
      else if (ch === '\u0650') vName = 'زیر';
      else if (ch === '\u064F') vName = 'پیش';
      else if (ch === '\u0652') vName = 'جزم';
      else if (ch === '\u0651') vName = 'تشدید';
      else if (ch === '\u064B') vName = 'دو زبر';
      else if (ch === '\u0670') vName = 'کھڑی زبر';

      pills.push({
        letters: currentLetter + ch,
        vowelNameUrdu: vName,
      });
      currentLetter = '';
    } else {
      if (currentLetter) {
        pills.push({ letters: currentLetter });
      }
      currentLetter = ch;
    }
  }

  if (currentLetter) {
    pills.push({ letters: currentLetter });
  }

  return pills;
}

interface LexemeAnalysisData {
  vocalizedForm: string;
  spokenUrduSynonymsJson: string[];
  urduSimpleExplanation: string;
  izafatBreakdownUrdu?: string;
  tokenTier: 'function_word' | 'common_vocab' | 'literary_vocab';
  arabicRoot?: string;
  familiarCousinsJson?: string[];
  englishContextualGloss: string;
  literaryNuanceNote?: string;
}

// Function words dictionary
const FUNCTION_WORDS_DICT: Record<string, LexemeAnalysisData> = {
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
    spokenUrduSynonymsJson: ['نیز', 'تھ'],
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
    literaryNuanceNote: 'Plural or honorific present indicative copula.',
  },
  'تھا': {
    vocalizedForm: 'تھا',
    spokenUrduSynonymsJson: ['تھے'],
    urduSimpleExplanation: 'فعلِ معاون (زمانہ ماضی، واحد مذکر)',
    tokenTier: 'function_word',
    englishContextualGloss: 'was (past tense singular masculine)',
    literaryNuanceNote: 'Past tense copula.',
  },
  'تھی': {
    vocalizedForm: 'تھی',
    spokenUrduSynonymsJson: ['تھیں'],
    urduSimpleExplanation: 'فعلِ معاون (زمانہ ماضی، واحد مؤنث)',
    tokenTier: 'function_word',
    englishContextualGloss: 'was (past tense singular feminine)',
    literaryNuanceNote: 'Feminine past tense copula.',
  },
  'تھے': {
    vocalizedForm: 'تھے',
    spokenUrduSynonymsJson: ['تھا'],
    urduSimpleExplanation: 'فعلِ معاون (زمانہ ماضی، جمع مذکر)',
    tokenTier: 'function_word',
    englishContextualGloss: 'were (past tense plural masculine)',
    literaryNuanceNote: 'Plural past tense copula.',
  },
  'کہ': {
    vocalizedForm: 'کِہ',
    spokenUrduSynonymsJson: ['کہ'],
    urduSimpleExplanation: 'بیان یا وضاحت شروع کرنے والا کلمہ',
    tokenTier: 'function_word',
    englishContextualGloss: 'that / which (conjunction)',
    literaryNuanceNote: 'Subordinating complementizer introducing subordinate clauses.',
  },
  'بھی': {
    vocalizedForm: 'بھی',
    spokenUrduSynonymsJson: ['نیز'],
    urduSimpleExplanation: 'شمولیت یا تاکید کا کلمہ',
    tokenTier: 'function_word',
    englishContextualGloss: 'also / too / even',
    literaryNuanceNote: 'Additive focus enclitic particle.',
  },
  'جو': {
    vocalizedForm: 'جو',
    spokenUrduSynonymsJson: ['وہ شخص جو'],
    urduSimpleExplanation: 'اسمِ موصول (کسی چیز یا شخص کی طرف اشارہ)',
    tokenTier: 'function_word',
    englishContextualGloss: 'who / which / whatever (relative pronoun)',
    literaryNuanceNote: 'Relative pronoun introducing a relative clause.',
  },
  'کر': {
    vocalizedForm: 'کَر',
    spokenUrduSynonymsJson: ['کر کے'],
    urduSimpleExplanation: 'معطوفہ یا کام کرنے کی علامت',
    tokenTier: 'function_word',
    englishContextualGloss: 'having done / after doing (conjunctive participle)',
    literaryNuanceNote: 'Conjunctive participle former.',
  },
  'ہوا': {
    vocalizedForm: 'ہُوا',
    spokenUrduSynonymsJson: ['ہو گیا'],
    urduSimpleExplanation: 'ہونا مصدر سے ماضی کا صیغہ',
    tokenTier: 'function_word',
    englishContextualGloss: 'happened / occurred / became',
    literaryNuanceNote: 'Perfective form of the verb hona.',
  },
  'ہو': {
    vocalizedForm: 'ہو',
    spokenUrduSynonymsJson: ['ہونا'],
    urduSimpleExplanation: 'فعلِ ہونا کی متبادل صورت',
    tokenTier: 'function_word',
    englishContextualGloss: 'be / happen (subjunctive)',
    literaryNuanceNote: 'Subjunctive/potential mood marker.',
  },
  'ہونا': {
    vocalizedForm: 'ہونا',
    spokenUrduSynonymsJson: ['واقع ہونا'],
    urduSimpleExplanation: 'کام کا واقع ہونا',
    tokenTier: 'function_word',
    englishContextualGloss: 'to be / to happen',
    literaryNuanceNote: 'Infinitive base.',
  },
  'کر دیا جائے': {
    vocalizedForm: 'کَر دِیا جائے',
    spokenUrduSynonymsJson: ['سونپ دیں'],
    urduSimpleExplanation: 'مجہول صیغہ، کسی کے سپرد کر دینے کا عمل',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'be handed over / be done (passive subjunctive)',
    literaryNuanceNote: 'Passive compound verb construction.',
  },
};

// Rich contextual vocabulary dictionary for all 3 canonical stories
const CONTEXTUAL_VOCAB: Record<string, LexemeAnalysisData> = {
  // Story 1: Toba Tek Singh
  'بٹوارے': {
    vocalizedForm: 'بَٹْوارے',
    spokenUrduSynonymsJson: ['تقسیم', 'بانٹنے کا عمل'],
    urduSimpleExplanation: 'ملک یا زمین کے دو ٹکڑوں میں تقسیم ہونے کا عمل (۱۹۴۷ء کا بٹوارا)',
    tokenTier: 'common_vocab',
    arabicRoot: 'ب-ٹ-و',
    familiarCousinsJson: ['بانٹنا', 'بٹوارا', 'بانٹ'],
    englishContextualGloss: 'Partition (specifically 1947 division of British India)',
    literaryNuanceNote: 'Evokes the traumatic physical, emotional, and psychological rupture of the 1947 subcontinent partition.',
  },
  'دو': {
    vocalizedForm: 'دو',
    spokenUrduSynonymsJson: ['۲', 'گنتی کا عدد'],
    urduSimpleExplanation: 'گنتی کا دوسرا عدد',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'two',
    literaryNuanceNote: 'Cardinal number.',
  },
  'تین': {
    vocalizedForm: 'تین',
    spokenUrduSynonymsJson: ['۳'],
    urduSimpleExplanation: 'گنتی کا تیسرا عدد',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'three',
    literaryNuanceNote: 'Cardinal number.',
  },
  'سال': {
    vocalizedForm: 'سال',
    spokenUrduSynonymsJson: ['برس'],
    urduSimpleExplanation: 'بارہ مہینوں کا عرصہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'year',
    literaryNuanceNote: 'Denotes passage of calendar time.',
  },
  'بعد': {
    vocalizedForm: 'بَعْد',
    spokenUrduSynonymsJson: ['پیچھے', 'آگے جا کر'],
    urduSimpleExplanation: 'کسی وقت یا واقعے کے گزر جانے کے بعد',
    tokenTier: 'common_vocab',
    arabicRoot: 'ب-ع-د',
    familiarCousinsJson: ['بعید', 'بعد میں', 'ابعاد'],
    englishContextualGloss: 'after / later',
    literaryNuanceNote: 'Temporal marker indicating elapsed interval.',
  },
  'پاکستان': {
    vocalizedForm: 'پاکِسْتان',
    spokenUrduSynonymsJson: ['وطنِ عزیز'],
    urduSimpleExplanation: '۱۹۴۷ء میں قائم ہونے والا نیا ملک',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['پاک', 'ستان'],
    englishContextualGloss: 'Pakistan',
    literaryNuanceNote: 'Newly formed state emerging from the 1947 partition.',
  },
  'ہندوستان': {
    vocalizedForm: 'ہِنْدُوسْتان',
    spokenUrduSynonymsJson: ['بھارت'],
    urduSimpleExplanation: 'برصغیر کا ہمسایہ ملک',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'Hindustan / India',
    literaryNuanceNote: 'Historic and geographic designation for India in Urdu literature.',
  },
  'حکومتوں': {
    vocalizedForm: 'حُکُومَتوں',
    spokenUrduSynonymsJson: ['سرکاروں', 'حکمرانوں'],
    urduSimpleExplanation: 'ریاست کا نظام چلانے والے سرکاری ادارے',
    tokenTier: 'common_vocab',
    arabicRoot: 'ح-ک-م',
    familiarCousinsJson: ['حکم', 'حاکم', 'محکمہ', 'حکمت'],
    englishContextualGloss: 'governments / state authorities',
    literaryNuanceNote: 'Emphasizes cold, bureaucratic state machinery contrasting with human tragedy.',
  },
  'خیال': {
    vocalizedForm: 'خَیال',
    spokenUrduSynonymsJson: ['سوچ', 'دھیان'],
    urduSimpleExplanation: 'ذہن میں آنے والی بات یا سوچ',
    tokenTier: 'common_vocab',
    arabicRoot: 'خ-ی-ل',
    familiarCousinsJson: ['خیالات', 'تخیل'],
    englishContextualGloss: 'thought / idea / notion',
    literaryNuanceNote: 'Used here ironically to depict the sudden bureaucratic whims of states.',
  },
  'آیا': {
    vocalizedForm: 'آیا',
    spokenUrduSynonymsJson: ['پہنچا', 'وارد ہوا'],
    urduSimpleExplanation: 'آنا کا ماضی، ذہن میں وارد ہونا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'came / struck (one’s mind)',
    literaryNuanceNote: 'Idiomatic: "خیال آیا" = a thought occurred.',
  },
  'جس': {
    vocalizedForm: 'جِس',
    spokenUrduSynonymsJson: ['جس طرح'],
    urduSimpleExplanation: 'اسمِ موصول کی مفعولی حالت',
    tokenTier: 'function_word',
    englishContextualGloss: 'which / whom (oblique relative)',
    literaryNuanceNote: 'Oblique relative pronoun.',
  },
  'طرح': {
    vocalizedForm: 'طَرَح',
    spokenUrduSynonymsJson: ['طریقہ', 'انداز'],
    urduSimpleExplanation: 'انداز یا طریقہ بتانے والا لفظ',
    tokenTier: 'common_vocab',
    arabicRoot: 'ط-ر-ح',
    familiarCousinsJson: ['طرح دار', 'اطوار'],
    englishContextualGloss: 'manner / way / fashion',
    literaryNuanceNote: 'Prepositional idiom: "جس طرح" = in the same way as.',
  },
  'عام': {
    vocalizedForm: 'عام',
    spokenUrduSynonymsJson: ['معمولی', 'سادہ'],
    urduSimpleExplanation: 'جو خاص نہ ہو، عام شہری یا قیدی',
    tokenTier: 'common_vocab',
    arabicRoot: 'ع-م-م',
    familiarCousinsJson: ['عوام', 'عمومی'],
    englishContextualGloss: 'ordinary / general / regular',
    literaryNuanceNote: 'Distinguishes everyday political prisoners from the institutionalized asylum inmates.',
  },
  'قیدیوں': {
    vocalizedForm: 'قَیْدِیوں',
    spokenUrduSynonymsJson: ['بندیوں', 'اسیروں'],
    urduSimpleExplanation: 'جیل میں بند افراد کی جمع',
    tokenTier: 'common_vocab',
    arabicRoot: 'ق-ی-د',
    familiarCousinsJson: ['قید', 'قیدی', 'قید خانہ'],
    englishContextualGloss: 'prisoners / inmates',
    literaryNuanceNote: 'Refers to prisoners of partition swapped under inter-governmental pacts.',
  },
  'تبادلہ': {
    vocalizedForm: 'تَبادَلَہ',
    spokenUrduSynonymsJson: ['لین دین', 'ایک دوسرے کے بدلے دینا'],
    urduSimpleExplanation: 'ایک چیز یا شخص دے کر دوسرا لینا',
    tokenTier: 'literary_vocab',
    arabicRoot: 'ب-د-ل',
    familiarCousinsJson: ['بدلنا', 'تبدیلی', 'بدلہ', 'متبادل'],
    englishContextualGloss: 'exchange / mutual transfer',
    literaryNuanceNote: 'Central thematic metaphor: treating human beings and sanity as geopolitical swap currency.',
  },
  'اسی': {
    vocalizedForm: 'اِسی',
    spokenUrduSynonymsJson: ['اسی انداز میں'],
    urduSimpleExplanation: 'اشارہِ قریب کی تاکیدی صورت',
    tokenTier: 'function_word',
    englishContextualGloss: 'this very / in this same',
    literaryNuanceNote: 'Emphatic demonstrative adverb.',
  },
  'پاگلوں': {
    vocalizedForm: 'پاگَلوں',
    spokenUrduSynonymsJson: ['دماغی مریضوں', 'دیوانوں'],
    urduSimpleExplanation: 'ذہنی توازن کھو بیٹھنے والے افراد',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['پاگل', 'پاگل پن', 'پاگل خانہ'],
    englishContextualGloss: 'the mad / insane asylum patients',
    literaryNuanceNote: 'In Manto’s fiction, the lunatics mirror the collective madness of the outside world.',
  },
  'چاہیے': {
    vocalizedForm: 'چاہِیے',
    spokenUrduSynonymsJson: ['ضروری ہے'],
    urduSimpleExplanation: 'ضرورت یا مناسبت ظاہر کرنے والا فعل',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'ought to / should be',
    literaryNuanceNote: 'Modal auxiliary expressing bureaucratic obligation.',
  },
  'یعنی': {
    vocalizedForm: 'یَعْنی',
    spokenUrduSynonymsJson: ['مطلب یہ کہ'],
    urduSimpleExplanation: 'پہلی بات کی وضاحت کرنے والا کلمہ',
    tokenTier: 'common_vocab',
    arabicRoot: 'ع-ن-ی',
    familiarCousinsJson: ['معنی', 'عنایت'],
    englishContextualGloss: 'that is to say / namely / meaning',
    literaryNuanceNote: 'Explanatory transition marker.',
  },
  'مسلمان': {
    vocalizedForm: 'مُسَلْمان',
    spokenUrduSynonymsJson: ['اہلِ اسلام'],
    urduSimpleExplanation: 'دینِ اسلام کا پیروکار',
    tokenTier: 'common_vocab',
    arabicRoot: 'س-ل-م',
    familiarCousinsJson: ['اسلام', 'سلام', 'سلامتی'],
    englishContextualGloss: 'Muslim',
    literaryNuanceNote: 'Religious identity categorized by bureaucrats to carve up asylum populations.',
  },
  'پاگل': {
    vocalizedForm: 'پاگَل',
    spokenUrduSynonymsJson: ['دیوانہ', 'باؤلا'],
    urduSimpleExplanation: 'جس کا ذہنی توازن درست نہ ہو',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['پاگل پن', 'پاگل خانہ'],
    englishContextualGloss: 'insane person / madman',
    literaryNuanceNote: 'Central character descriptor in Toba Tek Singh.',
  },
  'خانوں': {
    vocalizedForm: 'خانوں',
    spokenUrduSynonymsJson: ['مکانوں', 'جگہوں'],
    urduSimpleExplanation: 'مرکب لفظ پاگل خانوں کا دوسرا جز، گھر یا ادارہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'houses / institutions (as in madhouses)',
    literaryNuanceNote: 'Persian suffix khana denoting dwelling or institutional structure.',
  },
  'انہیں': {
    vocalizedForm: 'اُنْہیں',
    spokenUrduSynonymsJson: ['ان لوگوں کو'],
    urduSimpleExplanation: 'ضمیرِ غائب جمع مفعولی حالت',
    tokenTier: 'function_word',
    englishContextualGloss: 'them (third-person plural dative)',
    literaryNuanceNote: 'Pronoun referring to the transferred inmates.',
  },
  'پہنچا': {
    vocalizedForm: 'پَہُنْچا',
    spokenUrduSynonymsJson: ['بھیج دیا'],
    urduSimpleExplanation: 'پہنچانے کا عمل',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'delivered / conveyed',
    literaryNuanceNote: 'Causative transitive verbal root.',
  },
  'دیا': {
    vocalizedForm: 'دِیا',
    spokenUrduSynonymsJson: ['سونپا'],
    urduSimpleExplanation: 'دینا کا ماضی',
    tokenTier: 'function_word',
    englishContextualGloss: 'given / rendered',
    literaryNuanceNote: 'Auxiliary giving completed aspect.',
  },
  'جائے': {
    vocalizedForm: 'جائے',
    spokenUrduSynonymsJson: ['کیا جائے'],
    urduSimpleExplanation: 'جانا کا امکانی یا مجہول صیغہ',
    tokenTier: 'function_word',
    englishContextualGloss: 'be (passive subjunctive)',
    literaryNuanceNote: 'Passive subjunctive marker.',
  },
  'ہندو': {
    vocalizedForm: 'ہِنْدُو',
    spokenUrduSynonymsJson: ['اہلِ ہنود'],
    urduSimpleExplanation: 'ہندو مت کا پیروکار',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'Hindu',
    literaryNuanceNote: 'Religious demographic classified for geographic segregation.',
  },
  'سکھ': {
    vocalizedForm: 'سِکھ',
    spokenUrduSynonymsJson: ['سکھ مت کے ماننے والے'],
    urduSimpleExplanation: 'سکھ مذہب کا پیروکار',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'Sikh',
    literaryNuanceNote: 'Bishan Singh (the protagonist) is a Sikh in the Lahore asylum.',
  },
  'حوالے': {
    vocalizedForm: 'حَوالے',
    spokenUrduSynonymsJson: ['سپرد'],
    urduSimpleExplanation: 'کسی کے سپرد کرنا، حوالے کرنا',
    tokenTier: 'common_vocab',
    arabicRoot: 'ح-و-ل',
    familiarCousinsJson: ['تحویل', 'حوالات'],
    englishContextualGloss: 'custody / handover',
    literaryNuanceNote: 'Administrative phrase: "حوالے کرنا" = to hand over into official custody.',
  },

  // Story 2: Gadaria
  'داؤ': {
    vocalizedForm: 'داؤ',
    spokenUrduSynonymsJson: ['استاد جی'],
    urduSimpleExplanation: 'عزت کا لقب، پیار سے بزرگ استاد کو دیا جانے والا نام',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'Dau (affectionate elder/teacher title)',
    literaryNuanceNote: 'Title of endearment used by the narrator for his learned tutor Chint Ram.',
  },
  'جی': {
    vocalizedForm: 'جی',
    spokenUrduSynonymsJson: ['صاحب'],
    urduSimpleExplanation: 'تعظیم و احترام کا کلمہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'honorific suffix (Sir / revered one)',
    literaryNuanceNote: 'Respectful post-nominal honorific.',
  },
  'بڑے': {
    vocalizedForm: 'بَڑے',
    spokenUrduSynonymsJson: ['بہت'],
    urduSimpleExplanation: 'بہت زیادہ، علی الصبح کے معنی میں',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'very / exceptionally (early)',
    literaryNuanceNote: 'Intensifier modifying temporal adverb.',
  },
  'سویرے': {
    vocalizedForm: 'سَویرے',
    spokenUrduSynonymsJson: ['صبح کے وقت', 'تڑکے'],
    urduSimpleExplanation: 'صبح کا ابتدائی وقت، فجر کے بعد کا وقت',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['سویرا'],
    englishContextualGloss: 'early morning / daybreak',
    literaryNuanceNote: 'Denotes dawn devotion and the scholarly discipline of early rising.',
  },
  'اٹھتے': {
    vocalizedForm: 'اُٹھْتے',
    spokenUrduSynonymsJson: ['جاگتے'],
    urduSimpleExplanation: 'نیند سے بیدار ہونے کا معمول',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'used to awaken / rise',
    literaryNuanceNote: 'Imperfective habitual aspect.',
  },
  'اپنے': {
    vocalizedForm: 'اَپْنے',
    spokenUrduSynonymsJson: ['ذاتی'],
    urduSimpleExplanation: 'ضمیرِ مشترک، اپنی ذاتی ملکیت',
    tokenTier: 'function_word',
    englishContextualGloss: 'his own (reflexive possessive)',
    literaryNuanceNote: 'Reflexive possessive pronoun.',
  },
  'مختصر': {
    vocalizedForm: 'مُخْتَصَر',
    spokenUrduSynonymsJson: ['چھوٹا سا', 'تھوڑا'],
    urduSimpleExplanation: 'چھوٹا، جس میں زیادہ پھیلاؤ نہ ہو',
    tokenTier: 'literary_vocab',
    arabicRoot: 'خ-ص-ر',
    familiarCousinsJson: ['اختصار', 'خلاصہ'],
    englishContextualGloss: 'modest / compact / small',
    literaryNuanceNote: 'Highlights ascetic simplicity and humble living conditions.',
  },
  'کمرے': {
    vocalizedForm: 'کَمْرے',
    spokenUrduSynonymsJson: ['حجرے', 'کوٹھڑی'],
    urduSimpleExplanation: 'رہائش کی چھوٹی جگہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'room / study chamber',
    literaryNuanceNote: 'Denotes the modest personal sanctuary of the scholar.',
  },
  'چٹائی': {
    vocalizedForm: 'چَٹائی',
    spokenUrduSynonymsJson: ['صف', 'بوریا'],
    urduSimpleExplanation: 'گھاس پھونس یا کھجور کے پتوں سے بنی بیٹھنے کی چیز',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'straw mat / woven reed mat',
    literaryNuanceNote: 'Traditional eastern symbol of ascetic learning and humility.',
  },
  'بیٹھ': {
    vocalizedForm: 'بیٹھ',
    spokenUrduSynonymsJson: ['تشریف رکھ کر'],
    urduSimpleExplanation: 'بیٹھنے کا عمل',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'sitting / seated',
    literaryNuanceNote: 'Root verb in compound action.',
  },
  'پڑھنے': {
    vocalizedForm: 'پَڑھْنے',
    spokenUrduSynonymsJson: ['مطالعہ کرنے'],
    urduSimpleExplanation: 'کتابیں دیکھنے اور علم حاصل کرنے کا عمل',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['پڑھنا', 'پڑھائی'],
    englishContextualGloss: 'reading / studying',
    literaryNuanceNote: 'Continuous intellectual pursuit.',
  },
  'لکھنے': {
    vocalizedForm: 'لِکھْنے',
    spokenUrduSynonymsJson: ['قلم بند کرنے'],
    urduSimpleExplanation: 'قلم سے تحریر کرنے کا عمل',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['لکھنا', 'لکھائی', 'لکھاری'],
    englishContextualGloss: 'writing / scholarly drafting',
    literaryNuanceNote: 'Scholarly companion activity to reading.',
  },
  'مصروف': {
    vocalizedForm: 'مَصْرُوف',
    spokenUrduSynonymsJson: ['مشغول', 'کام میں لگا ہوا'],
    urduSimpleExplanation: 'کسی کام میں محو اور مگن ہونا',
    tokenTier: 'literary_vocab',
    arabicRoot: 'ص-ر-ف',
    familiarCousinsJson: ['صرف', 'تصرف', 'مصارف'],
    englishContextualGloss: 'immersed / deeply engaged / occupied',
    literaryNuanceNote: 'Reflects total spiritual and intellectual absorption.',
  },
  'جاتے': {
    vocalizedForm: 'جاتے',
    spokenUrduSynonymsJson: ['ہو جاتے'],
    urduSimpleExplanation: 'معمول کا ظاہر ہونا',
    tokenTier: 'function_word',
    englishContextualGloss: 'would become (habitual auxiliary)',
    literaryNuanceNote: 'Compound verb finishing element.',
  },
  'ان': {
    vocalizedForm: 'اُن',
    spokenUrduSynonymsJson: ['اس شخص کے'],
    urduSimpleExplanation: 'ضمیرِ غائب اشارہِ بعید، تعظیمی صیغہ',
    tokenTier: 'function_word',
    englishContextualGloss: 'his / their (respectful)',
    literaryNuanceNote: 'Honorific third-person pronoun.',
  },
  'چہرے': {
    vocalizedForm: 'چِہْرے',
    spokenUrduSynonymsJson: ['روئے', 'مکھڑے'],
    urduSimpleExplanation: 'منھ، رخسار اور پیشانی کا حصہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'face / countenance',
    literaryNuanceNote: 'The mirror of inner calm in literary character portrayal.',
  },
  'ایک': {
    vocalizedForm: 'ایک',
    spokenUrduSynonymsJson: ['۱', 'واحد'],
    urduSimpleExplanation: 'گنتی کا پہلا عدد یا غیر معین اسم',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'a / one / singular',
    literaryNuanceNote: 'Indefinite article equivalent.',
  },
  'پروقار': {
    vocalizedForm: 'پُرْوَقار',
    spokenUrduSynonymsJson: ['باوقار', 'سنجیدہ', 'عزت والی'],
    urduSimpleExplanation: 'وقار اور عزت سے بھرا ہوا، جس میں سنجیدگی اور دبدبہ ہو',
    tokenTier: 'literary_vocab',
    arabicRoot: 'و-ق-ر',
    familiarCousinsJson: ['وقار', 'توقیر'],
    englishContextualGloss: 'dignified / majestic / serene',
    literaryNuanceNote: 'Persian compound prefix "پُر" (full of) + Arabic "وقار" (dignity).',
  },
  'پرسکون': {
    vocalizedForm: 'پُرْسُکُون',
    spokenUrduSynonymsJson: ['شریفانہ', 'پرسکون', 'آرام دہ'],
    urduSimpleExplanation: 'مکمل چین اور اطمینان والی کیفیت',
    tokenTier: 'literary_vocab',
    arabicRoot: 'س-ک-ن',
    familiarCousinsJson: ['سکون', 'ساکن', 'مسکن'],
    englishContextualGloss: 'tranquil / serene / deeply calm',
    literaryNuanceNote: 'Compound describing undisturbed inner peace.',
  },
  'مسکراہٹ': {
    vocalizedForm: 'مُسْکُراہَٹ',
    spokenUrduSynonymsJson: ['تبسم', 'دھیمی ہنسی'],
    urduSimpleExplanation: 'ہلکی سی پرنور ہنسی جس میں دانت نہ کھلیں',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['مسکرانا', 'مسکراہٹیں'],
    englishContextualGloss: 'smile / gentle warmth',
    literaryNuanceNote: 'Expresses benevolent tenderness toward students.',
  },
  'ہمیشہ': {
    vocalizedForm: 'ہَمیشَہ',
    spokenUrduSynonymsJson: ['سدا', 'ہر وقت'],
    urduSimpleExplanation: 'جو کبھی ختم نہ ہو، ہر دم',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'always / perpetually',
    literaryNuanceNote: 'Denotes constancy of gentle temper.',
  },
  'کھیلتی': {
    vocalizedForm: 'کھیلْتی',
    spokenUrduSynonymsJson: ['چھائی رہتی'],
    urduSimpleExplanation: 'چہرے پر مسکراہٹ کا رقصاں ہونا',
    tokenTier: 'literary_vocab',
    englishContextualGloss: 'playing / hovering gracefully',
    literaryNuanceNote: 'Metaphorical: smile "playing" upon the lips.',
  },
  'رہتی': {
    vocalizedForm: 'رَہْتی',
    spokenUrduSynonymsJson: ['قائم رہتی'],
    urduSimpleExplanation: 'مسلسل ہونے کا عمل',
    tokenTier: 'function_word',
    englishContextualGloss: 'remained / lingered',
    literaryNuanceNote: 'Durative aspect marker.',
  },
  'ہر': {
    vocalizedForm: 'ہَر',
    spokenUrduSynonymsJson: ['تمام'],
    urduSimpleExplanation: 'ہر ایک، تمام آنے والے',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'every / each',
    literaryNuanceNote: 'Universal distributive quantifier.',
  },
  'آنے': {
    vocalizedForm: 'آنے',
    spokenUrduSynonymsJson: ['پہنچنے'],
    urduSimpleExplanation: 'قریب حاضر ہونے والا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'arriving / visiting',
    literaryNuanceNote: 'Infinitive in oblique modifier role.',
  },
  'والے': {
    vocalizedForm: 'والے',
    spokenUrduSynonymsJson: ['شخص'],
    urduSimpleExplanation: 'نسبت یا فاعل ظاہر کرنے والا لاحقہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'one who comes / visitor',
    literaryNuanceNote: 'Agentive postposition forming substantives.',
  },
  'دل': {
    vocalizedForm: 'دِل',
    spokenUrduSynonymsJson: ['قلب', 'جی'],
    urduSimpleExplanation: 'انسانی جذبات کا مرکز',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'heart / spirit',
    literaryNuanceNote: 'Center of human affection and sensibility.',
  },
  'موہ': {
    vocalizedForm: 'موہ',
    spokenUrduSynonymsJson: ['متاثر کر لینا', 'اپنا بنا لینا'],
    urduSimpleExplanation: 'دل کو بھا جانا، دل جیت لینا',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['موہنا', 'من موہن'],
    englishContextualGloss: 'captivating / charming / enchanting',
    literaryNuanceNote: 'Classic Indic idiom: "دل موہ لینا" = to win over someone’s whole heart completely.',
  },
  'لیتی': {
    vocalizedForm: 'لیتی',
    spokenUrduSynonymsJson: ['لے لیتی'],
    urduSimpleExplanation: 'فعلِ لینا کا صیغہ',
    tokenTier: 'function_word',
    englishContextualGloss: 'would take / capture',
    literaryNuanceNote: 'Telic compound verb vector.',
  },
  'یوں': {
    vocalizedForm: 'یُوں',
    spokenUrduSynonymsJson: ['اس طرح'],
    urduSimpleExplanation: 'اس انداز میں، ایسا لگتا تھا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'in such a manner / as if',
    literaryNuanceNote: 'Adverb introducing simile.',
  },
  'محسوس': {
    vocalizedForm: 'مَحْسُوس',
    spokenUrduSynonymsJson: ['معلوم', 'احساس ہونا'],
    urduSimpleExplanation: 'حواس سے جانا ہوا، دلی تاثر',
    tokenTier: 'common_vocab',
    arabicRoot: 'ح-س-س',
    familiarCousinsJson: ['احساس', 'حواس', 'حساس'],
    englishContextualGloss: 'felt / perceived',
    literaryNuanceNote: 'Sensory perception transition.',
  },
  'ہوتا': {
    vocalizedForm: 'ہوتا',
    spokenUrduSynonymsJson: ['لگتا'],
    urduSimpleExplanation: 'ہونا کا معمول',
    tokenTier: 'function_word',
    englishContextualGloss: 'seemed / felt like',
    literaryNuanceNote: 'Imperfective predicate.',
  },
  'جیسے': {
    vocalizedForm: 'جَیسے',
    spokenUrduSynonymsJson: ['گویا', 'جس طرح'],
    urduSimpleExplanation: 'تشبیہ دینے والا لفظ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'as though / as if',
    literaryNuanceNote: 'Comparative simile particle.',
  },
  'علم': {
    vocalizedForm: 'عِلْم',
    spokenUrduSynonymsJson: ['دانش', 'معلومات'],
    urduSimpleExplanation: 'جاننا، بصیرت اور پڑھائی لکھائی کا نور',
    tokenTier: 'literary_vocab',
    arabicRoot: 'ع-ل-م',
    familiarCousinsJson: ['عالم', 'معلوم', 'تعلیم', 'معلم'],
    englishContextualGloss: 'knowledge / sacred learning / scholarship',
    literaryNuanceNote: 'High cultural register in Islamic-Urdu intellectual tradition.',
  },
  'و': {
    vocalizedForm: 'وَ',
    spokenUrduSynonymsJson: ['اور'],
    urduSimpleExplanation: 'واؤ عاطفہ (دو الفاظ کو جوڑنے والا فارسی حرف)',
    tokenTier: 'function_word',
    englishContextualGloss: 'and (classical copula)',
    literaryNuanceNote: 'Vav-e-Atf connecting high literary binomials ("علم و حکمت").',
  },
  'حکمت': {
    vocalizedForm: 'حِکْمَت',
    spokenUrduSynonymsJson: ['دانائی', 'عقل و شعور'],
    urduSimpleExplanation: 'گہری دانائی اور بصیرت',
    tokenTier: 'literary_vocab',
    arabicRoot: 'ح-ک-م',
    familiarCousinsJson: ['حکیم', 'حاکم', 'محکمہ'],
    englishContextualGloss: 'wisdom / philosophy / profound discernment',
    literaryNuanceNote: 'Philosophical insight transcending rote book knowledge.',
  },
  'کوئی': {
    vocalizedForm: 'کوئی',
    spokenUrduSynonymsJson: ['ایک'],
    urduSimpleExplanation: 'غیر معین شے یا شخص',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'some / a certain',
    literaryNuanceNote: 'Indefinite pronoun.',
  },
  'خاموش': {
    vocalizedForm: 'خاموش',
    spokenUrduSynonymsJson: ['چپ چاپ', 'بے آواز'],
    urduSimpleExplanation: 'جس میں شور نہ ہو، باوقار خاموشی',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['خاموشی', 'خاموشاں'],
    englishContextualGloss: 'silent / tranquil / quiet',
    literaryNuanceNote: 'Evokes unboastful modesty in scholarship.',
  },
  'چشمہ': {
    vocalizedForm: 'چَشْمَہ',
    spokenUrduSynonymsJson: ['سوتا', 'پانی کا ابال'],
    urduSimpleExplanation: 'زمین سے پھوٹنے والا تازہ اور میٹھا پانی',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['چشم', 'چشمِ نم'],
    englishContextualGloss: 'fountain / fresh spring',
    literaryNuanceNote: 'Poetic metaphor for endless, effortless source of illumination.',
  },
  'رواں': {
    vocalizedForm: 'رَواں',
    spokenUrduSynonymsJson: ['بہتا ہوا', 'جاری'],
    urduSimpleExplanation: 'مسلسل بہنے والا، چلتا ہوا',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['روانی', 'روانہ'],
    englishContextualGloss: 'flowing / smoothly coursing',
    literaryNuanceNote: 'Part of the poetic pair "رواں دواں".',
  },
  'دواں': {
    vocalizedForm: 'دَواں',
    spokenUrduSynonymsJson: ['تیزی سے چلنے والا'],
    urduSimpleExplanation: 'تیزی اور تسلسل سے آگے بڑھنے والا',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['دوان'],
    englishContextualGloss: 'streaming / onward rushing',
    literaryNuanceNote: 'Binomial pairing forming the classic compound "رواں دواں" (perpetually coursing).',
  },

  // Story 3: Shehr-e-Afsos
  'جب': {
    vocalizedForm: 'جَب',
    spokenUrduSynonymsJson: ['جس وقت'],
    urduSimpleExplanation: 'وقت کی قید بتانے والا حرف',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'when / at the time that',
    literaryNuanceNote: 'Temporal clause connector.',
  },
  'ہم': {
    vocalizedForm: 'ہَم',
    spokenUrduSynonymsJson: ['ہم سب'],
    urduSimpleExplanation: 'ضمیرِ متکلم مع الغیر (پہلا شخص جمع)',
    tokenTier: 'function_word',
    englishContextualGloss: 'we / us',
    literaryNuanceNote: 'Collective narrative voice of traumatized witnesses.',
  },
  'اس': {
    vocalizedForm: 'اُس',
    spokenUrduSynonymsJson: ['اس جگہ'],
    urduSimpleExplanation: 'اشارہِ بعید، اس ویران جگہ کی طرف اشارہ',
    tokenTier: 'function_word',
    englishContextualGloss: 'that (distal demonstrative)',
    literaryNuanceNote: 'Points to the haunting distant city.',
  },
  'ویران': {
    vocalizedForm: 'ویران',
    spokenUrduSynonymsJson: ['سنسان', 'اجاڑ'],
    urduSimpleExplanation: 'جہاں کوئی آبادی نہ ہو، خالی اور برباد جگہ',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['ویرانی', 'ویرانہ'],
    englishContextualGloss: 'desolate / barren / forsaken',
    literaryNuanceNote: 'Deep psychological desolation characteristic of Intizar Husain’s post-1971 melancholia.',
  },
  'اجڑے': {
    vocalizedForm: 'اُجْڑے',
    spokenUrduSynonymsJson: ['برباد ہوئے', 'تباہ حال'],
    urduSimpleExplanation: 'جس کی رونقیں لٹ چکی ہوں اور آبادی تباہ ہو گئی ہو',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['اجڑنا', 'اجاڑ'],
    englishContextualGloss: 'ruined / devastated / plundered',
    literaryNuanceNote: 'Evokes the catastrophic loss of ancestral neighborhoods and civilizational memory.',
  },
  'ہوئے': {
    vocalizedForm: 'ہُوئے',
    spokenUrduSynonymsJson: ['ہو چکے'],
    urduSimpleExplanation: 'صفتِ مفعولی بنانے والا معاون لفظ',
    tokenTier: 'function_word',
    englishContextualGloss: 'having become / in the state of',
    literaryNuanceNote: 'Participial state marker.',
  },
  'شہرِ': {
    vocalizedForm: 'شَہْرِ',
    spokenUrduSynonymsJson: ['شہر', 'بلدیہ'],
    urduSimpleExplanation: 'بڑی آبادی والا علاقہ، زیرِ اضافت کے ساتھ مضاف',
    izafatBreakdownUrdu: 'زیرِ اضافت (ِ) جو لفظ "شہر" کو اپنے مضاف الیہ "افسوس" سے جوڑتا ہے، یعنی افسوس اور پچھتاوے کا شہر۔',
    tokenTier: 'literary_vocab',
    arabicRoot: 'ش-ہ-ر',
    familiarCousinsJson: ['شہری', 'شہرت', 'مشہور'],
    englishContextualGloss: 'City of (with Persian genitive izafat enclitic)',
    literaryNuanceNote: 'The title phrase of Intizar Husain’s allegorical masterpiece reflecting mourning over national collapse.',
  },
  'افسوس': {
    vocalizedForm: 'اَفْسوس',
    spokenUrduSynonymsJson: ['پچھتاوا', 'غم', 'ملال'],
    urduSimpleExplanation: 'گہرا دکھ، ملال اور حسرت',
    izafatBreakdownUrdu: 'مضاف الیہ، جو شہر کی کیفیت بتاتا ہے کہ یہ ندامت اور غم کا مسکن ہے۔',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['افسوسناک'],
    englishContextualGloss: 'Sorrow / Mourning / Regret',
    literaryNuanceNote: 'Embodied grief; the collective remorse of history.',
  },
  'اندر': {
    vocalizedForm: 'اَنْدَر',
    spokenUrduSynonymsJson: ['بیچ میں'],
    urduSimpleExplanation: 'حدود کے اندر داخل ہونا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'inside / within',
    literaryNuanceNote: 'Locative boundary traversal.',
  },
  'داخل': {
    vocalizedForm: 'داخِل',
    spokenUrduSynonymsJson: ['اندر گئے'],
    urduSimpleExplanation: 'کسی احاطے یا مقام کے اندر جانا',
    tokenTier: 'common_vocab',
    arabicRoot: 'د-خ-ل',
    familiarCousinsJson: ['داخلہ', 'دخول', 'مدخل'],
    englishContextualGloss: 'entered / stepping inside',
    literaryNuanceNote: 'Mark of crossing into an oneiric, ruined psychological territory.',
  },
  'تو': {
    vocalizedForm: 'تو',
    spokenUrduSynonymsJson: ['پھر'],
    urduSimpleExplanation: 'جوابِ شرط یا نتیجے کا کلمہ',
    tokenTier: 'function_word',
    englishContextualGloss: 'then / thereupon',
    literaryNuanceNote: 'Correlative conjunction.',
  },
  'چاروں': {
    vocalizedForm: 'چاروں',
    spokenUrduSynonymsJson: ['ہر طرف'],
    urduSimpleExplanation: 'مشرق، مغرب، شمال، جنوب یعنی ہر سمت',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'all four (directions)',
    literaryNuanceNote: 'Totalizing spatial expression ("چاروں طرف").',
  },
  'طرف': {
    vocalizedForm: 'طَرَف',
    spokenUrduSynonymsJson: ['جانب', 'سمت'],
    urduSimpleExplanation: 'سمت یا رخ',
    tokenTier: 'common_vocab',
    arabicRoot: 'ط-ر-ف',
    familiarCousinsJson: ['اطراف', 'طرفین'],
    englishContextualGloss: 'side / direction',
    literaryNuanceNote: 'Spatial orienting noun.',
  },
  'ہو': {
    vocalizedForm: 'ہُو',
    spokenUrduSynonymsJson: ['سناٹا', 'خوفناک چپ'],
    urduSimpleExplanation: 'سنسان اور پرہول خاموشی، جہاں کوئی آواز نہ ہو (ہو کا عالم)',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['ہو کا عالم'],
    englishContextualGloss: 'desolation / eerie emptiness',
    literaryNuanceNote: 'Sufic and literary idiom: "ہو کا عالم" evokes complete ontological abandonment where only the cosmic breath remains.',
  },
  'عالم': {
    vocalizedForm: 'عالَم',
    spokenUrduSynonymsJson: ['کیفیت', 'سماں', 'دنیا'],
    urduSimpleExplanation: 'حالت، کیفیت یا سماں',
    tokenTier: 'literary_vocab',
    arabicRoot: 'ع-ل-م',
    familiarCousinsJson: ['عالمی', 'عوالم'],
    englishContextualGloss: 'state / atmosphere / realm',
    literaryNuanceNote: 'Describes the pervasive psychic landscape.',
  },
  'طاری': {
    vocalizedForm: 'طاری',
    spokenUrduSynonymsJson: ['چھا گیا', 'مسلط ہو گیا'],
    urduSimpleExplanation: 'کسی کیفیت کا پوری طرح چھا جانا',
    tokenTier: 'literary_vocab',
    arabicRoot: 'ط-ر-ا',
    familiarCousinsJson: ['طراوت'],
    englishContextualGloss: 'pervading / reigning over / fell upon',
    literaryNuanceNote: 'Suggests an overwhelming metaphysical weight descending upon the scene.',
  },
  'گلی': {
    vocalizedForm: 'گَلی',
    spokenUrduSynonymsJson: ['کوچہ', 'راستہ'],
    urduSimpleExplanation: 'گھروں کے درمیان کا تنگ راستہ',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['گلیاں', 'گلی کوچہ'],
    englishContextualGloss: 'lane / alleyway',
    literaryNuanceNote: 'Part of the historic urban fabric descriptor "گلی کوچوں".',
  },
  'کوچوں': {
    vocalizedForm: 'کوچوں',
    spokenUrduSynonymsJson: ['راستوں', 'محلوں'],
    urduSimpleExplanation: 'کوچہ کی جمع، بازار اور محلے کے راستے',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['کوچہ', 'کوچہ گرد'],
    englishContextualGloss: 'alleys / byways / quarters',
    literaryNuanceNote: 'Persian loanword evocative of ancient walled South Asian cities.',
  },
  'سناٹا': {
    vocalizedForm: 'سَناٹا',
    spokenUrduSynonymsJson: ['مکمل خاموشی', 'چپ'],
    urduSimpleExplanation: 'گہری اور خوفناک خاموشی جس میں کوئی جنبش نہ ہو',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['سناٹے'],
    englishContextualGloss: 'dead silence / eerie stillness',
    literaryNuanceNote: 'Oppressive, tangible silence that feels physical.',
  },
  'چیخ': {
    vocalizedForm: 'چیخ',
    spokenUrduSynonymsJson: ['پکار', 'بلند آواز'],
    urduSimpleExplanation: 'درد یا خوف سے زور سے پکارنا، استعارہ خاموشی کی شدت کے لیے',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['چیخنا', 'چیخ و پکار'],
    englishContextualGloss: 'screaming / shrieking',
    literaryNuanceNote: 'Stunning synesthesia: silence is so loud and unbearable that it "screams".',
  },
  'رہا': {
    vocalizedForm: 'رَہا',
    spokenUrduSynonymsJson: ['جاری تھا'],
    urduSimpleExplanation: 'فعلِ استمرار، کام کا جاری رہنا',
    tokenTier: 'function_word',
    englishContextualGloss: 'was continuously (aspectual auxiliary)',
    literaryNuanceNote: 'Continuous aspectual verb marker.',
  },
  'گمان': {
    vocalizedForm: 'گُمان',
    spokenUrduSynonymsJson: ['وہم', 'خیال', 'شک'],
    urduSimpleExplanation: 'ایسا خیال یا وہم جو دل میں گزرے',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['گمان کرنا', 'بدگمان', 'خوش گمان'],
    englishContextualGloss: 'illusion / conjecture / impression',
    literaryNuanceNote: 'Denotes the blurring of waking reality and ghostly hallucination.',
  },
  'گزرتا': {
    vocalizedForm: 'گُزَرْتا',
    spokenUrduSynonymsJson: ['محسوس ہوتا'],
    urduSimpleExplanation: 'دل پر بیتنا یا خیال کا آنا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['گزرنا', 'گزارنا'],
    englishContextualGloss: 'passed through (the mind) / occurred',
    literaryNuanceNote: 'Idiom: "گمان گزرنا" = an eerie suspicion crossed the mind.',
  },
  'وقت': {
    vocalizedForm: 'وَقْت',
    spokenUrduSynonymsJson: ['زمانہ', 'گھڑی'],
    urduSimpleExplanation: 'گزرتا ہوا زمانہ یا لمحہ',
    tokenTier: 'common_vocab',
    arabicRoot: 'و-ق-ت',
    familiarCousinsJson: ['اوقات', 'وقتی'],
    englishContextualGloss: 'time / temporal epoch',
    literaryNuanceNote: 'Time itself is treated as a halted entity in this story.',
  },
  'رفتار': {
    vocalizedForm: 'رَفْتار',
    spokenUrduSynonymsJson: ['چال', 'تیزی', 'حرکت'],
    urduSimpleExplanation: 'چلنے کی رفتار یا آگے بڑھنے کی حرکت',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['رفتہ رفتہ', 'روش'],
    englishContextualGloss: 'pace / speed / temporal flow',
    literaryNuanceNote: 'Persian root raftan (to go); symbolizes the irreversible progression of human history.',
  },
  'یکایک': {
    vocalizedForm: 'یَکایَک',
    spokenUrduSynonymsJson: ['اچانک', 'ناگہاں'],
    urduSimpleExplanation: 'اچانک، بغیر کسی پیشگی اطلاع کے',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['ایک', 'یکبارگی'],
    englishContextualGloss: 'suddenly / abruptly / all at once',
    literaryNuanceNote: 'Emphasizes the sudden apocalyptic freeze of historical progression.',
  },
  'تھم': {
    vocalizedForm: 'تھَم',
    spokenUrduSynonymsJson: ['رک گئی', 'ٹھہر گئی'],
    urduSimpleExplanation: 'رک جانا، جامد ہو جانا',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['تھمنا', 'تھامنا'],
    englishContextualGloss: 'halted / frozen in place',
    literaryNuanceNote: 'Physical cessation of movement.',
  },
  'گئی': {
    vocalizedForm: 'گَئی',
    spokenUrduSynonymsJson: ['چلی گئی'],
    urduSimpleExplanation: 'جانا کا ماضی مؤنث',
    tokenTier: 'function_word',
    englishContextualGloss: 'went / became (auxiliary)',
    literaryNuanceNote: 'Telic completion auxiliary.',
  },
  'صدیوں': {
    vocalizedForm: 'صَدِیوں',
    spokenUrduSynonymsJson: ['سو سال کے زمانوں'],
    urduSimpleExplanation: 'صدی کی جمع، سیکڑوں سال کا عرصہ',
    tokenTier: 'literary_vocab',
    arabicRoot: 'ص-د-د',
    familiarCousinsJson: ['صدی'],
    englishContextualGloss: 'centuries / eons',
    literaryNuanceNote: 'Expands the localized ruin into deep civilizational antiquity.',
  },
  'گرد': {
    vocalizedForm: 'گَرْد',
    spokenUrduSynonymsJson: ['دھول', 'مٹی'],
    urduSimpleExplanation: 'باریک مٹی یا غبار جو پرانی چیزوں پر جم جائے',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['گرد و غبار', 'گرد آلود'],
    englishContextualGloss: 'dust / layer of ashes',
    literaryNuanceNote: 'Powerful metaphor for oblivion, neglect, and historical decay.',
  },
  'نے': {
    vocalizedForm: 'نے',
    spokenUrduSynonymsJson: ['نے'],
    urduSimpleExplanation: 'علامتِ فاعل (زمانہ ماضی میں متعدی فعل کے ساتھ)',
    tokenTier: 'function_word',
    englishContextualGloss: 'ergative case marker',
    literaryNuanceNote: 'Urdu ergative postposition marking the agent of a transitive perfective verb.',
  },
  'زندہ': {
    vocalizedForm: 'زِنْدَہ',
    spokenUrduSynonymsJson: ['حیات', 'جیتا جاگتا'],
    urduSimpleExplanation: 'جس میں جان ہو، حیات رکھنے والا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['زندگی', 'زندگانی'],
    englishContextualGloss: 'living / animate / breathing',
    literaryNuanceNote: 'Contrast between vibrant life and smothering historical dust.',
  },
  'وجود': {
    vocalizedForm: 'وُجُود',
    spokenUrduSynonymsJson: ['ہستی', 'جسم'],
    urduSimpleExplanation: 'ہستی یا قائم رہنے والی شے',
    tokenTier: 'literary_vocab',
    arabicRoot: 'و-ج-د',
    familiarCousinsJson: ['موجود', 'ایجاد', 'وجد'],
    englishContextualGloss: 'existence / being / entity',
    literaryNuanceNote: 'Philosophical category of ontological being.',
  },
  'اپنی': {
    vocalizedForm: 'اَپْنی',
    spokenUrduSynonymsJson: ['ذاتی'],
    urduSimpleExplanation: 'ضمیرِ مشترک مؤنث',
    tokenTier: 'function_word',
    englishContextualGloss: 'its own (reflexive feminine)',
    literaryNuanceNote: 'Reflexive possessive concordant with گرد (dust).',
  },
  'لپیٹ': {
    vocalizedForm: 'لَپیٹ',
    spokenUrduSynonymsJson: ['گھیرے', 'قبضے'],
    urduSimpleExplanation: 'اپنے اندر لپیٹ لینے کا عمل، گھیرے میں لینا',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['لپیٹنا', 'لپیٹا'],
    englishContextualGloss: 'embrace / shroud / envelopment',
    literaryNuanceNote: 'Idiom: "اپنی لپیٹ میں لے کر" = completely swallowing and smothering within its grasp.',
  },
  'لے': {
    vocalizedForm: 'لے',
    spokenUrduSynonymsJson: ['لے کر'],
    urduSimpleExplanation: 'لینا کا جزو',
    tokenTier: 'function_word',
    englishContextualGloss: 'taking / clasping',
    literaryNuanceNote: 'Part of compound verb construction.',
  },
  'خاکستر': {
    vocalizedForm: 'خاکِسْتَر',
    spokenUrduSynonymsJson: ['راکھ', 'جل کر خاک ہو جانا'],
    urduSimpleExplanation: 'جل کر راکھ ہو جانا، فنا کے گھاٹ اتر جانا',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['خاک', 'خاکی', 'خاکسار'],
    englishContextualGloss: 'reduced to ashes / burnt to cinders / annihilated',
    literaryNuanceNote: 'Persian compound evoking absolute catastrophic annihilation and smoldering ruins.',
  },

  // Story: Khol Do (Level 1)
  'کھول': {
    vocalizedForm: 'کھول',
    spokenUrduSynonymsJson: ['کھولنا', 'وا کرنا'],
    urduSimpleExplanation: 'کسی بند چیز کو کھولنا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['کھولنا', 'کھلا', 'کھلی'],
    englishContextualGloss: 'open / unfasten',
    literaryNuanceNote: 'Imperative form; the central double-meaning motif of the story.',
  },
  'امرتسر': {
    vocalizedForm: 'امْرِتْسَر',
    spokenUrduSynonymsJson: ['پنجاب کا تاریخی شہر'],
    urduSimpleExplanation: 'پنجاب کا ایک تاریخی اور معروف شہر',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'Amritsar (historic city in Punjab)',
  },
  'اسپیشل': {
    vocalizedForm: 'اِسْپیشَل',
    spokenUrduSynonymsJson: ['خاص ٹرین'],
    urduSimpleExplanation: 'خاص طور پر چلائی جانے والی پناہ گزینوں کی ریل گاڑی',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'special (partition refugee train)',
  },
  'ٹرین': {
    vocalizedForm: 'ٹرین',
    spokenUrduSynonymsJson: ['ریل گاڑی'],
    urduSimpleExplanation: 'پٹری پر چلنے والی گاڑی',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'train',
  },
  'دوپہر': {
    vocalizedForm: 'دوپَہَر',
    spokenUrduSynonymsJson: ['دن کا درمیانی وقت'],
    urduSimpleExplanation: 'بارہ بجے کے بعد کا وقت، نصف النہار',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'afternoon / midday',
  },
  'مغل پورہ': {
    vocalizedForm: 'مُغَل پُورَہ',
    spokenUrduSynonymsJson: ['لاہور کا ریلوے علاقہ'],
    urduSimpleExplanation: 'لاہور کا ایک ریلوے اسٹیشن اور علاقہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'Mughalpura (suburb and railway junction in Lahore)',
  },
  'مارے': {
    vocalizedForm: 'مارے',
    spokenUrduSynonymsJson: ['قتل کیے گئے'],
    urduSimpleExplanation: 'جان سے مارے جانا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'killed / murdered',
  },
  'متعدد': {
    vocalizedForm: 'مُتَعَدِّد',
    spokenUrduSynonymsJson: ['بہت سے', 'کئی'],
    urduSimpleExplanation: 'ایک سے زیادہ، کئی ایک',
    tokenTier: 'common_vocab',
    arabicRoot: 'ع-د-د',
    familiarCousinsJson: ['تعداد', 'عدد'],
    englishContextualGloss: 'numerous / several',
  },
  'زخمی': {
    vocalizedForm: 'زَخْمی',
    spokenUrduSynonymsJson: ['گھائل'],
    urduSimpleExplanation: 'چوٹ کھایا ہوا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['زخم', 'زخموں'],
    englishContextualGloss: 'injured / wounded',
  },
  'بھٹک': {
    vocalizedForm: 'بَھٹَک',
    spokenUrduSynonymsJson: ['راستہ بھول گئے'],
    urduSimpleExplanation: 'سیدھے راستے سے بے راہ ہو جانا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['بھٹکنا'],
    englishContextualGloss: 'wandered off / lost their way',
  },
  'کیمپ': {
    vocalizedForm: 'کَیمپ',
    spokenUrduSynonymsJson: ['پناہ گاہ'],
    urduSimpleExplanation: 'مہاجرین کی عارضی جائے پناہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'refugee camp',
  },
  'ٹھنڈی': {
    vocalizedForm: 'ٹَھنْڈی',
    spokenUrduSynonymsJson: ['سرد'],
    urduSimpleExplanation: 'سرد، جس میں حرارت نہ ہو',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['ٹھنڈا', 'ٹھنڈک'],
    englishContextualGloss: 'cold / chilled',
  },
  'زمین': {
    vocalizedForm: 'زَمِین',
    spokenUrduSynonymsJson: ['فرش', 'دھرتی'],
    urduSimpleExplanation: 'فرش یا مٹی کی سطح',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'ground / earth / floor',
  },
  'سراج الدین': {
    vocalizedForm: 'سِراجُ الدِّین',
    spokenUrduSynonymsJson: ['بوڑھا باپ'],
    urduSimpleExplanation: 'منٹو کے افسانے کا غمزدہ بوڑھا باپ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'Sirajuddin (the elderly, grieving father)',
  },
  'آنکھیں': {
    vocalizedForm: 'آنْکھیں',
    spokenUrduSynonymsJson: ['چشم'],
    urduSimpleExplanation: 'دیکھنے کا عضو',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['آنکھ'],
    englishContextualGloss: 'eyes',
  },
  'مردوں': {
    vocalizedForm: 'مَرْدوں',
    spokenUrduSynonymsJson: ['آدمیوں'],
    urduSimpleExplanation: 'مرد کی جمع',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'men',
  },
  'عورتوں': {
    vocalizedForm: 'عَورَتوں',
    spokenUrduSynonymsJson: ['خواتین'],
    urduSimpleExplanation: 'عورت کی جمع',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'women',
  },
  'بچوں': {
    vocalizedForm: 'بَچّوں',
    spokenUrduSynonymsJson: ['چھوٹے لڑکے لڑکیاں'],
    urduSimpleExplanation: 'بچہ کی جمع',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'children',
  },
  'متلاطم': {
    vocalizedForm: 'مُتَلاطِم',
    spokenUrduSynonymsJson: ['طوفانی', 'موجیں مارتا ہوا'],
    urduSimpleExplanation: 'جس میں شدید لہریں اور طوفان اٹھ رہا ہو',
    tokenTier: 'literary_vocab',
    arabicRoot: 'ل-ط-م',
    familiarCousinsJson: ['تلاطم'],
    englishContextualGloss: 'surging / tempestuous / storm-tossed like an ocean',
  },
  'سمندر': {
    vocalizedForm: 'سَمَنْدَر',
    spokenUrduSynonymsJson: ['بحر'],
    urduSimpleExplanation: 'پانی کا وسیع ذخیرہ، بے پناہ ہجوم',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'ocean / sea (crowd metaphor)',
  },
  'سوچنے': {
    vocalizedForm: 'سوچنے',
    spokenUrduSynonymsJson: ['غور کرنے'],
    urduSimpleExplanation: 'سوچ بچار کرنا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['سوچ', 'سوچنا'],
    englishContextualGloss: 'thinking / reflecting',
  },
  'سمجھنے': {
    vocalizedForm: 'سَمَجْھنے',
    spokenUrduSynonymsJson: ['جاننے'],
    urduSimpleExplanation: 'عقل میں بات آنا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['سمجھ', 'سمجھنا'],
    englishContextualGloss: 'comprehending / understanding',
  },
  'قوتیں': {
    vocalizedForm: 'قُوَّتیں',
    spokenUrduSynonymsJson: ['طاقتیں'],
    urduSimpleExplanation: 'سوچنے سمجھنے کی صلاحیتیں',
    tokenTier: 'common_vocab',
    arabicRoot: 'ق-و-ی',
    familiarCousinsJson: ['قوت', 'قوی'],
    englishContextualGloss: 'faculties / mental strength',
  },
  'ضعیف': {
    vocalizedForm: 'ضَعِیف',
    spokenUrduSynonymsJson: ['کمزور'],
    urduSimpleExplanation: 'ناتواں اور کمزور ہو جانا',
    tokenTier: 'literary_vocab',
    arabicRoot: 'ض-ع-ف',
    familiarCousinsJson: ['ضعف'],
    englishContextualGloss: 'frail / feeble / weakened',
  },
  'گدلے': {
    vocalizedForm: 'گَدْلے',
    spokenUrduSynonymsJson: ['دھندلے', 'مٹیالے'],
    urduSimpleExplanation: 'دھول سے اٹا ہوا، میلا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['گدلا'],
    englishContextualGloss: 'murky / dusty / hazy',
  },
  'ٹکٹکی': {
    vocalizedForm: 'ٹِکْٹِکی',
    spokenUrduSynonymsJson: ['مسلسل گھورنا'],
    urduSimpleExplanation: 'بغیر پلک جھپکائے نظر جمائے رکھنا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'unblinking stare / fixed gaze',
  },
  'باندھے': {
    vocalizedForm: 'بانْدھے',
    spokenUrduSynonymsJson: ['جمائے ہوئے'],
    urduSimpleExplanation: 'ٹکٹکی باندھنا (نظریں جما لینا)',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'fixing (one’s gaze)',
  },
  'شور': {
    vocalizedForm: 'شور',
    spokenUrduSynonymsJson: ['ہنگامہ', 'آوازیں'],
    urduSimpleExplanation: 'بلند آوازوں کا ہنگامہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'clamor / uproar / din',
  },
  'برپا': {
    vocalizedForm: 'بَرْپا',
    spokenUrduSynonymsJson: ['قائم', 'جاری'],
    urduSimpleExplanation: 'کھڑا ہونا، طوفان یا شور اٹھنا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'erupted / raging',
  },
  'بوڑھے': {
    vocalizedForm: 'بُوڑھے',
    spokenUrduSynonymsJson: ['بزرگ'],
    urduSimpleExplanation: 'جس کی عمر زیادہ ہو',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['بوڑھا', 'بڑھاپا'],
    englishContextualGloss: 'elderly / old man',
  },
  'کان': {
    vocalizedForm: 'کان',
    spokenUrduSynonymsJson: ['گوش'],
    urduSimpleExplanation: 'سننے کا عضو',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'ears',
  },
  'سنائی': {
    vocalizedForm: 'سُنائی',
    spokenUrduSynonymsJson: ['سننے میں آنا'],
    urduSimpleExplanation: 'کانوں میں آواز آنا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['سننا', 'سنا'],
    englishContextualGloss: 'audible / hearing',
  },
  'شل': {
    vocalizedForm: 'شَل',
    spokenUrduSynonymsJson: ['بے حس', 'سن'],
    urduSimpleExplanation: 'جس میں حرکت یا حس نہ رہے',
    tokenTier: 'literary_vocab',
    englishContextualGloss: 'paralyzed / numb / stunned',
  },
  'معلق': {
    vocalizedForm: 'مُعَلَّق',
    spokenUrduSynonymsJson: ['لٹکا ہوا'],
    urduSimpleExplanation: 'جو فضا میں لٹکا ہوا ہو',
    tokenTier: 'literary_vocab',
    arabicRoot: 'ع-ل-ق',
    familiarCousinsJson: ['تعلق'],
    englishContextualGloss: 'suspended / adrift in emptiness',
  },
  'خلا': {
    vocalizedForm: 'خَلا',
    spokenUrduSynonymsJson: ['خالی پن'],
    urduSimpleExplanation: 'خالی جگہ، سونا پن',
    tokenTier: 'common_vocab',
    arabicRoot: 'خ-ل-و',
    familiarCousinsJson: ['خالی', 'خلوت'],
    englishContextualGloss: 'vacuum / empty void',
  },
  'سورج': {
    vocalizedForm: 'سُورَج',
    spokenUrduSynonymsJson: ['آفتاب'],
    urduSimpleExplanation: 'دن کا روشن ستارہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'sun',
  },
  'رگ و ریشے': {
    vocalizedForm: 'رَگ و رِیشے',
    spokenUrduSynonymsJson: ['ہر نس اور تار میں'],
    urduSimpleExplanation: 'جسم کی ہر رگ اور عضو میں',
    tokenTier: 'literary_vocab',
    englishContextualGloss: 'every fiber, vein, and sinew',
  },
  'تصویریں': {
    vocalizedForm: 'تَصْوِیریں',
    spokenUrduSynonymsJson: ['نقوش', 'یادیں'],
    urduSimpleExplanation: 'تصویر کی جمع، ذہن میں آنے والے مناظر',
    tokenTier: 'common_vocab',
    arabicRoot: 'ص-و-ر',
    familiarCousinsJson: ['تصویر', 'مصور', 'صورت'],
    englishContextualGloss: 'images / scenes',
  },
  'لوٹ': {
    vocalizedForm: 'لُوٹ',
    spokenUrduSynonymsJson: ['ڈاکہ', 'چھینا جھپٹی'],
    urduSimpleExplanation: 'مال چھین لینا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['لوٹنا'],
    englishContextualGloss: 'plunder / looting',
  },
  'آگ': {
    vocalizedForm: 'آگ',
    spokenUrduSynonymsJson: ['شعلے', 'آتش'],
    urduSimpleExplanation: 'آگ اور شعلے',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'fire / arson',
  },
  'بھاگم بھاگ': {
    vocalizedForm: 'بھاگَم بھاگ',
    spokenUrduSynonymsJson: ['افراتفری', 'بھاگ دوڑ'],
    urduSimpleExplanation: 'ہر طرف خوف سے بھاگنے کا عالم',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'chaotic stampede / mad panic',
  },
  'اسٹیشن': {
    vocalizedForm: 'اِسْٹیشن',
    spokenUrduSynonymsJson: ['گاڑی کی جگہ'],
    urduSimpleExplanation: 'ریلوے اسٹیشن',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'railway station',
  },
  'گولیاں': {
    vocalizedForm: 'گولِیاں',
    spokenUrduSynonymsJson: ['بندوق کی گولیاں'],
    urduSimpleExplanation: 'بندوق یا پستول کی گولی کی جمع',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['گولی'],
    englishContextualGloss: 'bullets / gunfire',
  },
  'سکینہ': {
    vocalizedForm: 'سَکِینَہ',
    spokenUrduSynonymsJson: ['بیٹی کا نام'],
    urduSimpleExplanation: 'سراج الدین کی نوجوان مظلوم بیٹی',
    tokenTier: 'common_vocab',
    arabicRoot: 'س-ک-ن',
    familiarCousinsJson: ['سکون', 'مسکن'],
    englishContextualGloss: 'Sakina (the tragic protagonist daughter)',
  },
  'اکلوتی': {
    vocalizedForm: 'اِکْلَوتی',
    spokenUrduSynonymsJson: ['اکیلی بیٹی'],
    urduSimpleExplanation: 'تنہا اولاد، جس کا کوئی اور بھائی بہن نہ ہو',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['اکلوتا'],
    englishContextualGloss: 'only child / sole daughter',
  },
  'دھاندلی': {
    vocalizedForm: 'دھانْدْلی',
    spokenUrduSynonymsJson: ['بے نظمی', 'افراتفری'],
    urduSimpleExplanation: 'بے ترتیبی کا ہنگامہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'disorder / chaos',
  },
  'انتڑیاں': {
    vocalizedForm: 'اَنْتْڑِیاں',
    spokenUrduSynonymsJson: ['آنتیں'],
    urduSimpleExplanation: 'پیٹ کی اندرونی آنتیں',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'entrails / intestines',
  },
  'لاش': {
    vocalizedForm: 'لاش',
    spokenUrduSynonymsJson: ['مردہ جسم', 'جنازہ'],
    urduSimpleExplanation: 'بے جان انسانی جسم',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'corpse / dead body',
  },
  'ننگے': {
    vocalizedForm: 'نَن٘گے',
    spokenUrduSynonymsJson: ['برہنہ'],
    urduSimpleExplanation: 'بغیر جوتے یا کپڑے کے',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'bare (barefoot)',
  },
  'پاؤں': {
    vocalizedForm: 'پاؤں',
    spokenUrduSynonymsJson: ['قدم'],
    urduSimpleExplanation: 'چلنے کا عضو',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'feet',
  },
  'دوپٹہ': {
    vocalizedForm: 'دُو پَٹَّہ',
    spokenUrduSynonymsJson: ['اوڑھنی', 'چادر'],
    urduSimpleExplanation: 'سر اور سینے کا کپڑا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'dupatta (traditional scarf/veil)',
  },
  'ابا جی': {
    vocalizedForm: 'اَبّا جی',
    spokenUrduSynonymsJson: ['والد صاحب'],
    urduSimpleExplanation: 'والد کو محبت سے پکارنے کا نام',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'father / papa (affectionate)',
  },
  'چھوڑیے': {
    vocalizedForm: 'چھوڑیے',
    spokenUrduSynonymsJson: ['رہنے دیں'],
    urduSimpleExplanation: 'چھوڑ دینے کی التجا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['چھوڑنا'],
    englishContextualGloss: 'leave it / let it be',
  },
  'کوٹ': {
    vocalizedForm: 'کوٹ',
    spokenUrduSynonymsJson: ['اوپر کا لباس'],
    urduSimpleExplanation: 'سردی میں پہنا جانے والا لباس',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'coat / jacket',
  },
  'جیب': {
    vocalizedForm: 'جِیب',
    spokenUrduSynonymsJson: ['کپڑے کا خانہ'],
    urduSimpleExplanation: 'کپڑے میں بنی تھیلی',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'pocket',
  },
  'کپڑا': {
    vocalizedForm: 'کَپْڑا',
    spokenUrduSynonymsJson: ['پارچہ'],
    urduSimpleExplanation: 'کپڑے کا ٹکڑا',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['کپڑے'],
    englishContextualGloss: 'cloth / fabric',
  },
  'بلوائی': {
    vocalizedForm: 'بَلْوائی',
    spokenUrduSynonymsJson: ['فسادی'],
    urduSimpleExplanation: 'ہنگامہ کرنے والے شرپسند',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['بلوا'],
    englishContextualGloss: 'rioters / mob marauders',
  },
  'رضاکار': {
    vocalizedForm: 'رَضا کار',
    spokenUrduSynonymsJson: ['مددگار نوجوان'],
    urduSimpleExplanation: 'اپنی مرضی سے بلا معاوضہ خدمت کرنے والا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'volunteers / rescue workers',
  },
  'بندوقیں': {
    vocalizedForm: 'بَنْدُوقیں',
    spokenUrduSynonymsJson: ['رائفلیں'],
    urduSimpleExplanation: 'ہتھیار',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['بندوق'],
    englishContextualGloss: 'guns / rifles',
  },
  'دعائیں': {
    vocalizedForm: 'دُعائیں',
    spokenUrduSynonymsJson: ['نیک تمنائیں'],
    urduSimpleExplanation: 'دعا کی جمع',
    tokenTier: 'common_vocab',
    arabicRoot: 'د-ع-و',
    familiarCousinsJson: ['دعا', 'داعی'],
    englishContextualGloss: 'prayers / blessings',
  },
  'حلیہ': {
    vocalizedForm: 'حُلْیَہ',
    spokenUrduSynonymsJson: ['شکل و صورت'],
    urduSimpleExplanation: 'چہرے مہرے کا نقشہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'physical description',
  },
  'گورا': {
    vocalizedForm: 'گورا',
    spokenUrduSynonymsJson: ['سفید رنگت'],
    urduSimpleExplanation: 'صاف اور سفید رنگ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'fair-complexioned',
  },
  'خوبصورت': {
    vocalizedForm: 'خُوبْصُورَت',
    spokenUrduSynonymsJson: ['حسین', 'پیاری'],
    urduSimpleExplanation: 'اچھی صورت والی',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'beautiful',
  },
  'سیاہ': {
    vocalizedForm: 'سِیاہ',
    spokenUrduSynonymsJson: ['کالے'],
    urduSimpleExplanation: 'کالا رنگ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'black (hair)',
  },
  'داہنے': {
    vocalizedForm: 'داہْنے',
    spokenUrduSynonymsJson: ['سیدھے'],
    urduSimpleExplanation: 'سیدھی طرف، دایاں رخ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'right (right-hand side)',
  },
  'گال': {
    vocalizedForm: 'گال',
    spokenUrduSynonymsJson: ['رخسار'],
    urduSimpleExplanation: 'چہرے کا رخسار',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'cheek',
  },
  'تل': {
    vocalizedForm: 'تِل',
    spokenUrduSynonymsJson: ['کالا نشان'],
    urduSimpleExplanation: 'چہرے پر پیدائشی نشان',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'mole / beauty spot',
  },
  'ہتھیلیوں': {
    vocalizedForm: 'ہَتھِیلِیوں',
    spokenUrduSynonymsJson: ['ہاتھ کے تلوے'],
    urduSimpleExplanation: 'جان ہتھیلی پر رکھنا (شدید خطرہ مول لینا)',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'palms (idiom: risking one’s life)',
  },
  'محفوظ': {
    vocalizedForm: 'مَحْفُوظ',
    spokenUrduSynonymsJson: ['سلامت'],
    urduSimpleExplanation: 'جو خطرے سے محفوظ ہو',
    tokenTier: 'common_vocab',
    arabicRoot: 'ح-ف-ظ',
    familiarCousinsJson: ['حفاظت'],
    englishContextualGloss: 'safe / secure',
  },
  'کھیت': {
    vocalizedForm: 'کھیت',
    spokenUrduSynonymsJson: ['فصل والی زمین'],
    urduSimpleExplanation: 'اناج اگانے کی جگہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'field',
  },
  'اسٹریچر': {
    vocalizedForm: 'اِسْٹْریچَر',
    spokenUrduSynonymsJson: ['مریض لٹانے کا تختہ'],
    urduSimpleExplanation: 'بیمار یا زخمی کو لے جانے والا تختہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'stretcher',
  },
  'نبض': {
    vocalizedForm: 'نَبْض',
    spokenUrduSynonymsJson: ['رگ کی حرکت'],
    urduSimpleExplanation: 'کلائی کی وہ رگ جس سے زندگی معلوم ہوتی ہے',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'pulse',
  },
  'کھڑکی': {
    vocalizedForm: 'کھِڑْکی',
    spokenUrduSynonymsJson: ['دریچہ'],
    urduSimpleExplanation: 'دیوار میں ہوا اور روشنی کا چھوٹا دروازہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'window',
  },
  'جنبش': {
    vocalizedForm: 'جُنْبِش',
    spokenUrduSynonymsJson: ['ہلکی حرکت'],
    urduSimpleExplanation: 'ہلکا سا ہلنا',
    tokenTier: 'literary_vocab',
    familiarCousinsJson: ['جنبش دینا'],
    englishContextualGloss: 'slight twitch / faint movement',
  },
  'ازار بند': {
    vocalizedForm: 'اِزار بَنْد',
    spokenUrduSynonymsJson: ['شلوار کا ناڑا'],
    urduSimpleExplanation: 'شلوار باندھنے کی ڈوری',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'trouser drawstring / salwar cord',
  },
  'سرکا': {
    vocalizedForm: 'سَرکا',
    spokenUrduSynonymsJson: ['نیچے کھسکا دینا'],
    urduSimpleExplanation: 'آہستہ سے نیچے سرکانا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'slid down / pushed down',
  },
  'زندہ': {
    vocalizedForm: 'زِنْدَہ',
    spokenUrduSynonymsJson: ['حیات'],
    urduSimpleExplanation: 'جو مرا نہ ہو، جس میں سانس ہو',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['زندگی'],
    englishContextualGloss: 'alive / living',
  },
  'پسینے': {
    vocalizedForm: 'پَسِینے',
    spokenUrduSynonymsJson: ['عرق'],
    urduSimpleExplanation: 'خوف یا گرمی سے جسم سے نکلنے والی بوندیں',
    tokenTier: 'common_vocab',
    familiarCousinsJson: ['پسینہ'],
    englishContextualGloss: 'cold sweat',
  },
};

// Canonical Stories Specifications
const STORIES_DATA = [
  {
    slug: 'khol-do',
    authorUrdu: 'سعادت حسن منٹو',
    authorEnglish: 'Saadat Hasan Manto',
    titleUrdu: 'کھول دو',
    titleEnglish: 'Khol Do',
    level: 1,
    descriptionEnglish: 'The ultimate script warm-up: conversational vocabulary with an unforgettable psychological narrative.',
    sceneVocabPreview: ['کھڑکی', 'دوپٹہ', 'زندہ', 'رضاکار', 'سراج الدین'],
    paragraphsList: [
      {
        paragraphText:
          'امرتسر سے اسپیشل ٹرین دوپہر دو بجے کو چلی اور آٹھ گھنٹوں کے بعد مغل پورہ پہنچی۔ راستے میں کئی آدمی مارے گئے۔ متعدد زخمی ہوئے اور کچھ ادھر ادھر بھٹک گئے۔',
        sentences: [
          {
            index: 0,
            text: 'امرتسر سے اسپیشل ٹرین دوپہر دو بجے کو چلی اور آٹھ گھنٹوں کے بعد مغل پورہ پہنچی۔',
            startTimeMs: 0,
            endTimeMs: 6500,
          },
          {
            index: 1,
            text: 'راستے میں کئی آدمی مارے گئے۔ متعدد زخمی ہوئے اور کچھ ادھر ادھر بھٹک گئے۔',
            startTimeMs: 6500,
            endTimeMs: 13000,
          },
        ],
      },
      {
        paragraphText:
          'صبح دس بجے کیمپ کی ٹھنڈی زمین پر جب سراج الدین نے آنکھیں کھولیں اور اپنے چاروں طرف مردوں، عورتوں اور بچوں کا ایک متلاطم سمندر دیکھا تو اس کی سوچنے سمجھنے کی قوتیں اور بھی ضعیف ہو گئیں۔ وہ دیر تک گدلے آسمان کو ٹکٹکی باندھے دیکھتا رہا۔ یوں تو کیمپ میں ہر طرف شور برپا تھا، لیکن بوڑھے سراج الدین کے کان جیسے بند تھے، اسے کچھ سنائی نہیں دیتا تھا۔ کوئی اسے دیکھتا تو یہ خیال کرتا کہ وہ کسی گہری فکر میں غرق ہے، مگر ایسا نہیں تھا۔ اس کے ہوش و حواس شل تھے۔ اس کا سارا وجود خلا میں معلق تھا۔',
        sentences: [
          {
            index: 0,
            text: 'صبح دس بجے کیمپ کی ٹھنڈی زمین پر جب سراج الدین نے آنکھیں کھولیں اور اپنے چاروں طرف مردوں، عورتوں اور بچوں کا ایک متلاطم سمندر دیکھا تو اس کی سوچنے سمجھنے کی قوتیں اور بھی ضعیف ہو گئیں۔',
            startTimeMs: 0,
            endTimeMs: 11000,
          },
          {
            index: 1,
            text: 'وہ دیر تک گدلے آسمان کو ٹکٹکی باندھے دیکھتا رہا۔',
            startTimeMs: 11000,
            endTimeMs: 15000,
          },
          {
            index: 2,
            text: 'یوں تو کیمپ میں ہر طرف شور برپا تھا، لیکن بوڑھے سراج الدین کے کان جیسے بند تھے، اسے کچھ سنائی نہیں دیتا تھا۔',
            startTimeMs: 15000,
            endTimeMs: 22000,
          },
          {
            index: 3,
            text: 'کوئی اسے دیکھتا تو یہ خیال کرتا کہ وہ کسی گہری فکر میں غرق ہے، مگر ایسا نہیں تھا، اس کے ہوش و حواس شل تھے اور اس کا سارا وجود خلا میں معلق تھا۔',
            startTimeMs: 22000,
            endTimeMs: 31000,
          },
        ],
      },
      {
        paragraphText:
          'گدلے آسمان کی طرف بغیر کسی ارادے کے دیکھتے دیکھتے سراج الدین کی نگاہیں سورج سے ٹکرائیں۔ تیز روشنی اس کے وجود کے رگ و ریشے میں اتر گئی اور وہ جاگ اٹھا۔ اوپر تلے اس کے دماغ پر کئی تصویریں دوڑ گئیں۔ لوٹ… آگ… بھاگم بھاگ… اسٹیشن… گولیاں… رات اور سکینہ…',
        sentences: [
          {
            index: 0,
            text: 'گدلے آسمان کی طرف بغیر کسی ارادے کے دیکھتے دیکھتے سراج الدین کی نگاہیں سورج سے ٹکرائیں۔',
            startTimeMs: 0,
            endTimeMs: 6500,
          },
          {
            index: 1,
            text: 'تیز روشنی اس کے وجود کے رگ و ریشے میں اتر گئی اور وہ جاگ اٹھا۔',
            startTimeMs: 6500,
            endTimeMs: 12000,
          },
          {
            index: 2,
            text: 'اوپر تلے اس کے دماغ پر کئی تصویریں دوڑ گئیں۔ لوٹ… آگ… بھاگم بھاگ… اسٹیشن… گولیاں… رات اور سکینہ…',
            startTimeMs: 12000,
            endTimeMs: 20000,
          },
        ],
      },
      {
        paragraphText:
          'سراج الدین ایک دم اٹھ کھڑا ہوا اور پاگلوں کی طرح اس نے اپنے چاروں طرف پھیلے ہوئے انسانوں کے سمندر کو کھنگالنا شروع کیا۔ پورے تین گھنٹے وہ ”سکینہ، سکینہ“ پکارتا کیمپ کی خاک چھانتا رہا، مگر اسے اپنی جوان اکلوتی بیٹی کا کوئی پتا نہ مل سکا۔ چاروں طرف ایک دھاندلی سی مچی تھی۔ کوئی اپنا بچہ ڈھونڈ رہا تھا، کوئی ماں، کوئی بیوی اور کوئی بیٹی۔ سراج الدین تھک ہار کر ایک طرف بیٹھ گیا اور حافظے پر زور دے کر سوچنے لگا کہ سکینہ اس سے کب اور کہاں جدا ہوئی تھی؟',
        sentences: [
          {
            index: 0,
            text: 'سراج الدین ایک دم اٹھ کھڑا ہوا اور پاگلوں کی طرح اس نے اپنے چاروں طرف پھیلے ہوئے انسانوں کے سمندر کو کھنگالنا شروع کیا۔',
            startTimeMs: 0,
            endTimeMs: 8000,
          },
          {
            index: 1,
            text: 'پورے تین گھنٹے وہ ”سکینہ، سکینہ“ پکارتا کیمپ کی خاک چھانتا رہا، مگر اسے اپنی جوان اکلوتی بیٹی کا کوئی پتا نہ مل سکا۔',
            startTimeMs: 8000,
            endTimeMs: 16000,
          },
          {
            index: 2,
            text: 'چاروں طرف ایک دھاندلی سی مچی تھی؛ کوئی اپنا بچہ ڈھونڈ رہا تھا، کوئی ماں، کوئی بیوی اور کوئی بیٹی۔',
            startTimeMs: 16000,
            endTimeMs: 24000,
          },
          {
            index: 3,
            text: 'سراج الدین تھک ہار کر ایک طرف بیٹھ گیا اور حافظے پر زور دے کر سوچنے لگا کہ سکینہ اس سے کب اور کہاں جدا ہوئی تھی؟',
            startTimeMs: 24000,
            endTimeMs: 32000,
          },
        ],
      },
      {
        paragraphText:
          'لیکن سوچتے سوچتے اس کا دماغ سکینہ کی ماں کی لاش پر جا کر جم جاتا، جس کی ساری انتڑیاں باہر نکلی ہوئی تھیں۔ اس سے آگے وہ اور کچھ نہ سوچ سکا۔ سکینہ کی ماں مر چکی تھی۔ اس نے سراج الدین کی آنکھوں کے سامنے دم توڑا تھا، لیکن سکینہ کہاں تھی، جس کے متعلق مرتے وقت اس کی ماں نے کہا تھا، ”مجھے چھوڑو اور سکینہ کو لے کر جلدی سے یہاں سے بھاگ جاؤ۔“',
        sentences: [
          {
            index: 0,
            text: 'لیکن سوچتے سوچتے اس کا دماغ سکینہ کی ماں کی لاش پر جا کر جم جاتا، جس کی ساری انتڑیاں باہر نکلی ہوئی تھیں۔',
            startTimeMs: 0,
            endTimeMs: 8000,
          },
          {
            index: 1,
            text: 'اس سے آگے وہ اور کچھ نہ سوچ سکا۔ سکینہ کی ماں مر چکی تھی اور اس نے سراج الدین کی آنکھوں کے سامنے دم توڑا تھا۔',
            startTimeMs: 8000,
            endTimeMs: 17000,
          },
          {
            index: 2,
            text: 'لیکن سکینہ کہاں تھی، جس کے متعلق مرتے وقت اس کی ماں نے کہا تھا، ”مجھے چھوڑو اور سکینہ کو لے کر جلدی سے یہاں سے بھاگ جاؤ۔“',
            startTimeMs: 17000,
            endTimeMs: 27000,
          },
        ],
      },
      {
        paragraphText:
          'سکینہ اس کے ساتھ تھی۔ دونوں ننگے پاؤں بھاگ رہے تھے۔ سکینہ کا دوپٹہ گر پڑا تھا۔ اسے اٹھانے کے لیے سراج الدین نے رکنا چاہا تھا مگر سکینہ نے چلا کر کہا تھا، ”ابا جی! چھوڑیے۔“ لیکن اس نے دوپٹہ اٹھا لیا تھا… یہ سوچتے سوچتے اس نے اپنے کوٹ کی ابھری ہوئی جیب کی طرف دیکھا اور اس میں ہاتھ ڈال کر ایک کپڑا نکالا… سکینہ کا وہی دوپٹہ تھا… مگر سکینہ کہاں تھی؟',
        sentences: [
          {
            index: 0,
            text: 'سکینہ اس کے ساتھ تھی اور دونوں ننگے پاؤں بھاگ رہے تھے۔',
            startTimeMs: 0,
            endTimeMs: 5000,
          },
          {
            index: 1,
            text: 'سکینہ کا دوپٹہ گر پڑا تھا اور اسے اٹھانے کے لیے سراج الدین نے رکنا چاہا تھا مگر سکینہ نے چلا کر کہا تھا، ”ابا جی! چھوڑیے۔“',
            startTimeMs: 5000,
            endTimeMs: 14000,
          },
          {
            index: 2,
            text: 'لیکن اس نے دوپٹہ اٹھا لیا تھا… یہ سوچتے سوچتے اس نے اپنے کوٹ کی ابھری ہوئی جیب میں ہاتھ ڈال کر ایک کپڑا نکالا… سکینہ کا وہی دوپٹہ تھا… مگر سکینہ کہاں تھی؟',
            startTimeMs: 14000,
            endTimeMs: 25000,
          },
        ],
      },
      {
        paragraphText:
          'سراج الدین نے اپنے تھکے ہوئے دماغ پر بہت زور دیا، لیکن وہ کسی نتیجے پر نہ پہنچ سکا۔ کیا وہ سکینہ کو اپنے ساتھ اسٹیشن تک لے آیا تھا؟ کیا وہ اس کے ساتھ گاڑی میں سوار تھی؟ راستے میں جب گاڑی روکی گئی تھی اور بلوائی اندر گھس آئے تھے تو کیا وہ بے ہوش ہو گیا تھا جو سکینہ کو وہ اٹھا کر لے گئے؟ سراج الدین کے دماغ میں سوال ہی سوال تھے، لیکن جواب ایک بھی نہیں تھا۔',
        sentences: [
          {
            index: 0,
            text: 'سراج الدین نے اپنے تھکے ہوئے دماغ پر بہت زور دیا، لیکن وہ کسی نتیجے پر نہ پہنچ سکا۔',
            startTimeMs: 0,
            endTimeMs: 6500,
          },
          {
            index: 1,
            text: 'کیا وہ سکینہ کو اپنے ساتھ اسٹیشن تک لے آیا تھا؟ کیا وہ اس کے ساتھ گاڑی میں سوار تھی؟',
            startTimeMs: 6500,
            endTimeMs: 14000,
          },
          {
            index: 2,
            text: 'راستے میں جب گاڑی روکی گئی تھی اور بلوائی اندر گھس آئے تھے تو کیا وہ بے ہوش ہو گیا تھا جو سکینہ کو وہ اٹھا کر لے گئے؟',
            startTimeMs: 14000,
            endTimeMs: 23000,
          },
          {
            index: 3,
            text: 'سراج الدین کے دماغ میں سوال ہی سوال تھے، لیکن جواب ایک بھی نہیں تھا۔',
            startTimeMs: 23000,
            endTimeMs: 29000,
          },
        ],
      },
      {
        paragraphText:
          'چھ روز کے بعد جب ہوش و حواس کسی قدر درست ہوئے تو سراج الدین ان لوگوں سے ملا جو اس کی مدد کرنے کے لیے تیار تھے۔ آٹھ نوجوان تھے، جن کے پاس لاری تھی، بندوقیں تھیں۔ سراج الدین نے ان کو لاکھ لاکھ دعائیں دیں اور سکینہ کا حلیہ بتایا: ”گورا رنگ ہے اور بہت ہی خوبصورت ہے… مجھ پر نہیں اپنی ماں پر تھی… عمر سترہ برس کے قریب ہے… آنکھیں بڑی بڑی… بال سیاہ، داہنے گال پر موٹا سا تل… میری اکلوتی لڑکی ہے، ڈھونڈ لاؤ، تمہارا خدا بھلا کرے گا۔“',
        sentences: [
          {
            index: 0,
            text: 'چھ روز کے بعد جب ہوش و حواس کسی قدر درست ہوئے تو سراج الدین ان لوگوں سے ملا جو اس کی مدد کرنے کے لیے تیار تھے۔',
            startTimeMs: 0,
            endTimeMs: 8000,
          },
          {
            index: 1,
            text: 'آٹھ نوجوان تھے جن کے پاس لاری تھی اور بندوقیں تھیں۔ سراج الدین نے ان کو دعائیں دیں اور سکینہ کا حلیہ بتایا۔',
            startTimeMs: 8000,
            endTimeMs: 16000,
          },
          {
            index: 2,
            text: '”گورا رنگ ہے اور بہت ہی خوبصورت ہے… عمر سترہ برس کے قریب ہے… بال سیاہ، داہنے گال پر موٹا سا تل… میری اکلوتی لڑکی ہے، ڈھونڈ لاؤ، تمہارا خدا بھلا کرے گا۔“',
            startTimeMs: 16000,
            endTimeMs: 28000,
          },
        ],
      },
      {
        paragraphText:
          'نوجوان رضاکاروں نے بڑے جذبے کے ساتھ بوڑھے سراج الدین کو یقین دلایا کہ اگر اس کی بیٹی زندہ ہوئی تو چند ہی دنوں میں اس کے پاس ہوگی۔ آٹھوں نوجوانوں نے کوشش کی۔ جان ہتھیلیوں پر رکھ کر وہ امرتسر گئے۔ کئی عورتوں، کئی مردوں اور کئی بچوں کو نکال نکال کر انہوں نے محفوظ مقاموں پر پہنچایا۔ دس روز گزر گئے مگر انہیں سکینہ کہیں نہ ملی۔',
        sentences: [
          {
            index: 0,
            text: 'نوجوان رضاکاروں نے بڑے جذبے کے ساتھ بوڑھے سراج الدین کو یقین دلایا کہ اگر اس کی بیٹی زندہ ہوئی تو چند ہی دنوں میں اس کے پاس ہوگی۔',
            startTimeMs: 0,
            endTimeMs: 9000,
          },
          {
            index: 1,
            text: 'آٹھوں نوجوانوں نے کوشش کی۔ جان ہتھیلیوں پر رکھ کر وہ امرتسر گئے اور کئی بے گناہوں کو محفوظ مقاموں پر پہنچایا۔',
            startTimeMs: 9000,
            endTimeMs: 18000,
          },
          {
            index: 2,
            text: 'دس روز گزر گئے مگر انہیں سکینہ کہیں نہ ملی۔',
            startTimeMs: 18000,
            endTimeMs: 23000,
          },
        ],
      },
      {
        paragraphText:
          'ایک روز وہ اسی خدمت کے لیے لاری پر امرتسر جا رہے تھے کہ چھ ہرٹہ کے پاس سڑک پر انہیں ایک لڑکی دکھائی دی۔ لاری کی آواز سن کر وہ بدکی اور بھاگنا شروع کر دیا۔ رضاکاروں نے موٹر روکی اور سب کے سب اس کے پیچھے بھاگے۔ کھیت میں انہوں نے اس لڑکی کو پکڑ لیا۔ دیکھا تو بہت خوبصورت تھی… داہنے گال پر موٹا سا تل تھا۔ ایک نوجوان نے اس سے کہا، ”ڈرو نہیں… کیا تمہارا نام سکینہ ہے؟“ لڑکی نے اقرار کیا کہ وہ سراج الدین کی بیٹی ہے۔',
        sentences: [
          {
            index: 0,
            text: 'ایک روز وہ لاری پر جا رہے تھے کہ چھ ہرٹہ کے پاس سڑک پر انہیں ایک لڑکی دکھائی دی۔',
            startTimeMs: 0,
            endTimeMs: 7000,
          },
          {
            index: 1,
            text: 'لاری کی آواز سن کر وہ بدکی اور بھاگنا شروع کر دیا۔ رضاکاروں نے موٹر روکی اور سب کے سب اس کے پیچھے بھاگے۔',
            startTimeMs: 7000,
            endTimeMs: 15000,
          },
          {
            index: 2,
            text: 'کھیت میں انہوں نے اس لڑکی کو پکڑ لیا؛ دیکھا تو بہت خوبصورت تھی اور داہنے گال پر موٹا سا تل تھا۔',
            startTimeMs: 15000,
            endTimeMs: 23000,
          },
          {
            index: 3,
            text: 'ایک نوجوان نے اس سے کہا، ”ڈرو نہیں… کیا تمہارا نام سکینہ ہے؟“ لڑکی نے اقرار کیا کہ وہ سراج الدین کی بیٹی ہے۔',
            startTimeMs: 23000,
            endTimeMs: 31000,
          },
        ],
      },
      {
        paragraphText:
          'آٹھوں نوجوانوں نے اس کے ساتھ بڑی محبت کا برتاؤ کیا۔ اس کو کھانا کھلایا، دودھ پلایا اور لاری میں بٹھا دیا۔ ایک نے اپنا کوٹ اتار کر اس کو دیا، کیونکہ اس کے پاس دوپٹہ نہیں تھا اور وہ بار بار اپنے سینے کو ہاتھوں سے ڈھانکنے کی ناکام کوشش کر رہی تھی۔ کئی دن گزر گئے۔ سراج الدین کو سکینہ کی کوئی خبر نہ ملی۔ وہ دن بھر مختلف کیمپوں کے چکر کاٹتا رہا۔ رات کو وہ ان نوجوان رضاکاروں کے لیے دیر تک دعائیں مانگتا رہتا۔',
        sentences: [
          {
            index: 0,
            text: 'آٹھوں نوجوانوں نے اس کو کھانا کھلایا، دودھ پلایا اور لاری میں بٹھا دیا۔',
            startTimeMs: 0,
            endTimeMs: 6500,
          },
          {
            index: 1,
            text: 'ایک نے اپنا کوٹ اتار کر اس کو دیا، کیونکہ اس کے پاس دوپٹہ نہیں تھا اور وہ بار بار اپنے سینے کو ہاتھوں سے ڈھانکنے کی کوشش کر رہی تھی۔',
            startTimeMs: 6500,
            endTimeMs: 16000,
          },
          {
            index: 2,
            text: 'کئی دن گزر گئے اور سراج الدین کو سکینہ کی کوئی خبر نہ ملی۔ وہ دن بھر کیمپوں کے چکر کاٹتا رہا اور رات کو رضاکاروں کے لیے دعائیں مانگتا رہا۔',
            startTimeMs: 16000,
            endTimeMs: 27000,
          },
        ],
      },
      {
        paragraphText:
          'ایک دن سراج الدین نے دیکھا کہ رضاکاروں کی لاری چلی آ رہی ہے۔ سراج الدین نے دوڑ کر ان سے پوچھا، ”بیٹا! کیا میری سکینہ کا کچھ پتا چلا؟“ رضاکاروں نے نظریں چرا کر سر جھکا لیا اور بولے، ”مل جائے گی، مل جائے گی…“ اور وہ آگے بڑھ گئے۔',
        sentences: [
          {
            index: 0,
            text: 'ایک دن سراج الدین نے دیکھا کہ رضاکاروں کی لاری چلی آ رہی ہے۔',
            startTimeMs: 0,
            endTimeMs: 5000,
          },
          {
            index: 1,
            text: 'سراج الدین نے دوڑ کر ان سے پوچھا، ”بیٹا! کیا میری سکینہ کا کچھ پتا چلا؟“',
            startTimeMs: 5000,
            endTimeMs: 11000,
          },
          {
            index: 2,
            text: 'رضاکاروں نے نظریں چرا کر سر جھکا لیا اور بولے، ”مل جائے گی، مل جائے گی…“ اور وہ آگے بڑھ گئے۔',
            startTimeMs: 11000,
            endTimeMs: 19000,
          },
        ],
      },
      {
        paragraphText:
          'اسی شام کیمپ کے ہسپتال میں سراج الدین کے سامنے ایک اسٹریچر لایا گیا جس پر ایک لڑکی بے حس و حرکت پڑی تھی۔ ڈاکٹر نے لیمپ کی روشنی اس کے چہرے پر ڈالی۔ سراج الدین نے جھک کر دیکھا… داہنے گال پر موٹا سا تل تھا! اس کے منہ سے ایک چیخ نکلی، ”سکینہ!…“ ڈاکٹر نے اسٹریچر کے قریب آ کر لڑکی کی نبض ٹٹولی اور سراج الدین سے کہا: ”کھڑکی کھول دو۔“ اسٹریچر پر پڑی ہوئی نیم مردہ لڑکی کے جسم میں ایک ہلکی سی جنبش ہوئی۔ اس کے بے جان ہاتھوں نے آہستہ سے اپنا ازار بند کھولا اور شلوار نیچے سرکا دی۔ بوڑھا سراج الدین خوشی سے چلایا: ”زندہ ہے… میری بیٹی زندہ ہے!…“ ڈاکٹر کے ماتھے پر سرد پسینے کے قطرے نمودار ہو گئے۔',
        sentences: [
          {
            index: 0,
            text: 'اسی شام کیمپ کے ہسپتال میں سراج الدین کے سامنے ایک اسٹریچر لایا گیا جس پر ایک لڑکی بے حس و حرکت پڑی تھی۔',
            startTimeMs: 0,
            endTimeMs: 8000,
          },
          {
            index: 1,
            text: 'ڈاکٹر نے لیمپ کی روشنی اس کے چہرے پر ڈالی۔ سراج الدین نے جھک کر دیکھا… داہنے گال پر موٹا سا تل تھا! اس کے منہ سے چیخ نکلی، ”سکینہ!…“',
            startTimeMs: 8000,
            endTimeMs: 18000,
          },
          {
            index: 2,
            text: 'ڈاکٹر نے لڑکی کی نبض ٹٹولی اور سراج الدین سے کہا: ”کھڑکی کھول دو۔“',
            startTimeMs: 18000,
            endTimeMs: 24000,
          },
          {
            index: 3,
            text: 'اسٹریچر پر پڑی ہوئی نیم مردہ لڑکی کے جسم میں جنبش ہوئی۔ اس کے بے جان ہاتھوں نے آہستہ سے اپنا ازار بند کھولا اور شلوار نیچے سرکا دی۔',
            startTimeMs: 24000,
            endTimeMs: 34000,
          },
          {
            index: 4,
            text: 'بوڑھا سراج الدین خوشی سے چلایا: ”زندہ ہے… میری بیٹی زندہ ہے!…“ اور ڈاکٹر کے ماتھے پر سرد پسینے کے قطرے نمودار ہو گئے۔',
            startTimeMs: 34000,
            endTimeMs: 44000,
          },
        ],
      },
    ],
  },
  {
    slug: 'toba-tek-singh',
    authorUrdu: 'سعادت حسن منٹو',
    authorEnglish: 'Saadat Hasan Manto',
    titleUrdu: 'ٹوبہ ٹیک سنگھ',
    titleEnglish: 'Toba Tek Singh',
    level: 2,
    descriptionEnglish: 'Saadat Hasan Manto’s masterwork on the absurdities of partition, sanity, and human belonging.',
    sceneVocabPreview: ['تبادلہ', 'پاگل خانہ', 'بٹوارے', 'حکومتوں'],
    paragraphText:
      'بٹوارے کے دو تین سال بعد پاکستان اور ہندوستان کی حکومتوں کو خیال آیا کہ جس طرح عام قیدیوں کا تبادلہ ہوا ہے اسی طرح پاگلوں کا بھی تبادلہ ہونا چاہیے یعنی جو مسلمان پاگل ہندوستان کے پاگل خانوں میں ہیں انہیں پاکستان پہنچا دیا جائے اور جو ہندو اور سکھ پاکستان کے پاگل خانوں میں ہیں انہیں ہندوستان کے حوالے کر دیا جائے۔',
    sentences: [
      {
        index: 0,
        text: 'بٹوارے کے دو تین سال بعد پاکستان اور ہندوستان کی حکومتوں کو خیال آیا کہ جس طرح عام قیدیوں کا تبادلہ ہوا ہے اسی طرح پاگلوں کا بھی تبادلہ ہونا چاہیے یعنی جو مسلمان پاگل ہندوستان کے پاگل خانوں میں ہیں انہیں پاکستان پہنچا دیا جائے اور جو ہندو اور سکھ پاکستان کے پاگل خانوں میں ہیں انہیں ہندوستان کے حوالے کر دیا جائے۔',
        startTimeMs: 0,
        endTimeMs: 14500,
      },
    ],
  },
  {
    slug: 'gadaria',
    authorUrdu: 'اشفاق احمد',
    authorEnglish: 'Ashfaq Ahmed',
    titleUrdu: 'گڈریا',
    titleEnglish: 'Gadaria',
    level: 2,
    descriptionEnglish: 'Ashfaq Ahmed’s revered portrait of scholarly grace, cultural synthesis, and heartbreaking displacement.',
    sceneVocabPreview: ['چٹائی', 'پروقار', 'پرسکون', 'چشمہ'],
    paragraphText:
      'داؤ جی بڑے سویرے اٹھتے اور اپنے مختصر سے کمرے میں چٹائی پر بیٹھ کر پڑھنے لکھنے میں مصروف ہو جاتے۔ ان کے چہرے پر ایک پروقار اور پرسکون مسکراہٹ ہمیشہ کھیلتی رہتی تھی جو ہر آنے والے کا دل موہ لیتی اور یوں محسوس ہوتا جیسے علم و حکمت کا کوئی خاموش چشمہ رواں دواں ہو۔',
    sentences: [
      {
        index: 0,
        text: 'داؤ جی بڑے سویرے اٹھتے اور اپنے مختصر سے کمرے میں چٹائی پر بیٹھ کر پڑھنے لکھنے میں مصروف ہو جاتے۔',
        startTimeMs: 0,
        endTimeMs: 6500,
      },
      {
        index: 1,
        text: 'ان کے چہرے پر ایک پروقار اور پرسکون مسکراہٹ ہمیشہ کھیلتی رہتی تھی جو ہر آنے والے کا دل موہ لیتی اور یوں محسوس ہوتا جیسے علم و حکمت کا کوئی خاموش چشمہ رواں دواں ہو۔',
        startTimeMs: 6500,
        endTimeMs: 16000,
      },
    ],
  },
  {
    slug: 'shehr-e-afsos',
    authorUrdu: 'انتظار حسین',
    authorEnglish: 'Intizar Husain',
    titleUrdu: 'شہرِ افسوس',
    titleEnglish: 'Shehr-e-Afsos',
    level: 3,
    descriptionEnglish: 'Intizar Husain’s allegorical masterpiece on grief, desolate ruined cities, and historic memory.',
    sceneVocabPreview: ['شہرِ افسوس', 'خاکستر', 'سناٹا', 'ویران'],
    paragraphText:
      'جب ہم اس ویران اور اجڑے ہوئے شہرِ افسوس کے اندر داخل ہوئے تو چاروں طرف ہو کا عالم طاری تھا اور گلی کوچوں میں سناٹا چیخ رہا تھا۔ یوں گمان گزرتا تھا جیسے وقت کی رفتار یکایک تھم گئی ہو اور صدیوں کی گرد نے ہر زندہ وجود کو اپنی لپیٹ میں لے کر خاکستر کر دیا ہو۔',
    sentences: [
      {
        index: 0,
        text: 'جب ہم اس ویران اور اجڑے ہوئے شہرِ افسوس کے اندر داخل ہوئے تو چاروں طرف ہو کا عالم طاری تھا اور گلی کوچوں میں سناٹا چیخ رہا تھا۔',
        startTimeMs: 0,
        endTimeMs: 8200,
      },
      {
        index: 1,
        text: 'یوں گمان گزرتا تھا جیسے وقت کی رفتار یکایک تھم گئی ہو اور صدیوں کی گرد نے ہر زندہ وجود کو اپنی لپیٹ میں لے کر خاکستر کر دیا ہو۔',
        startTimeMs: 8200,
        endTimeMs: 18000,
      },
    ],
  },
];

async function seed() {
  console.log('🌱 Starting Abjad Literary Reader Seed...');

  // Clear existing records to ensure fresh idempotent seed
  sqlite.exec(`
    DELETE FROM user_telemetry;
    DELETE FROM token_analyses;
    DELETE FROM tokens;
    DELETE FROM paragraphs;
    DELETE FROM stories;
  `);

  for (const sData of STORIES_DATA) {
    const storyId = `story_${sData.slug}`;
    console.log(`Inserting story: ${sData.titleEnglish} (${sData.titleUrdu}) [Level ${sData.level}]`);

    db.insert(schema.stories)
      .values({
        id: storyId,
        slug: sData.slug,
        authorUrdu: sData.authorUrdu,
        authorEnglish: sData.authorEnglish,
        titleUrdu: sData.titleUrdu,
        titleEnglish: sData.titleEnglish,
        level: sData.level,
        descriptionEnglish: sData.descriptionEnglish || null,
        sceneVocabPreviewJson: sData.sceneVocabPreview || null,
        createdAt: new Date(),
      })
      .run();

    const pList = (sData as any).paragraphsList || [
      {
        paragraphText: (sData as any).paragraphText!,
        sentences: (sData as any).sentences!,
      },
    ];

    let pIdx = 0;
    for (const pItem of pList) {
      const paragraphId = `p_${storyId}_${pIdx}`;
      db.insert(schema.paragraphs)
        .values({
          id: paragraphId,
          storyId,
          paragraphIndex: pIdx,
          rawText: pItem.paragraphText,
          audioUrl: null, // triggers synthesized simulation timer fallback
          sentencesJson: pItem.sentences,
        })
        .run();

      // Tokenize paragraph using UrduLanguagePack
      const tokenSpans = UrduLanguagePack.tokenizeParagraph(pItem.paragraphText);

      for (const span of tokenSpans) {
        const tokenId = `tok_${paragraphId}_${span.tokenIndex}`;

        db.insert(schema.tokens)
          .values({
            id: tokenId,
            paragraphId,
            tokenIndex: span.tokenIndex,
            surfaceForm: span.surface,
            normalizedForm: span.normalized,
            isWord: span.isWord,
            sentenceIndex: span.sentenceIndex,
            izafatGroupId: span.izafatGroupId || null,
            compoundGroupId: span.compoundGroupId || null,
          })
          .run();

        if (span.isWord) {
          // Resolve analysis from contextual vocab, function words, or fallback
          const baseKey = span.surface.trim();
          const normKey = span.normalized.trim();

          const lexData: LexemeAnalysisData =
            CONTEXTUAL_VOCAB[baseKey] ||
            CONTEXTUAL_VOCAB[normKey] ||
            FUNCTION_WORDS_DICT[baseKey] ||
            FUNCTION_WORDS_DICT[normKey] || {
              vocalizedForm: span.surface,
              spokenUrduSynonymsJson: [span.normalized],
              urduSimpleExplanation: `${span.surface} کا لفظی مطلب`,
              tokenTier: 'common_vocab',
              englishContextualGloss: span.surface,
              literaryNuanceNote: 'Contextual Urdu literary vocabulary item.',
            };

          // Graphemes are ALWAYS computed deterministically via UrduLanguagePack
          const graphemes = UrduLanguagePack.decomposeWordToGraphemes(span.surface);

          // Phonetic breakdown computed from vocalized form
          const phoneticBreakdown = makePhoneticPills(lexData.vocalizedForm);

          db.insert(schema.tokenAnalyses)
            .values({
              id: `ana_${tokenId}`,
              tokenId,
              vocalizedForm: lexData.vocalizedForm,
              phoneticBreakdownJson: phoneticBreakdown,
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
      pIdx++;
    }
    console.log(`  -> Inserted ${pList.length} paragraphs`);
  }

  // Pre-seed a few sample telemetry items for Vocabulary Vault display
  db.insert(schema.userTelemetry)
    .values([
      {
        id: 'tel_sample_1',
        normalizedSurface: 'شہرِ',
        vocalizedSurface: 'شَہْرِ',
        lookupCount: 4,
        maxTapLevel: 3, // Full Gloss
        lastTapLevel: 3,
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: 'tel_sample_2',
        normalizedSurface: 'تبادلہ',
        vocalizedSurface: 'تَبادَلَہ',
        lookupCount: 2,
        maxTapLevel: 2, // Urdu Bridge
        lastTapLevel: 2,
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 120),
      },
      {
        id: 'tel_sample_3',
        normalizedSurface: 'پڑھنا',
        vocalizedSurface: 'پَڑھْنا',
        lookupCount: 1,
        maxTapLevel: 1, // Sounded Out
        lastTapLevel: 1,
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 240),
      },
    ])
    .run();

  console.log('✅ Canonical Seed completed successfully!');
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
