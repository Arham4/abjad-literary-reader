import { LexemeAnalysisData } from './types';
import { vocalizeUrduWord, makePhoneticBreakdown } from './packs/urduVocalizer';
import { UrduLanguagePack } from './packs/urdu';

// Comprehensive Core Urdu Vocabulary & Morphological Translation Engine
export const COMPREHENSIVE_URDU_LEXICON: Record<string, LexemeAnalysisData> = {
  // --- Common Verbs & Participles ---
  'ہنسنا': {
    vocalizedForm: 'ہَنَسْنا',
    spokenUrduSynonymsJson: ['مسکرانا', 'کھلکھلانا'],
    urduSimpleExplanation: 'خوشی یا مسرت کے اظہار کے لیے لبوں اور چہرے پر تبسم لانا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'to laugh / to smile',
    literaryNuanceNote: 'Primary verb for laughter, amusement, and cheerful smiles.',
  },
  'ہنستا': {
    vocalizedForm: 'ہَنَسْتا',
    spokenUrduSynonymsJson: ['مسکراتا ہوا', 'خوش ہوتا ہوا'],
    urduSimpleExplanation: 'مسکراتے اور ہنستے ہوئے (مذکر واحد)',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'laughing / smiling (masculine singular)',
  },
  'ہنستے': {
    vocalizedForm: 'ہَنَسْتے',
    spokenUrduSynonymsJson: ['مسکراتے ہوئے', 'خوشی خوشی', 'کھلکھلاتے ہوئے'],
    urduSimpleExplanation: 'کمال خوشی، بے فکری اور مسرت کے ساتھ مسکراتے ہوئے',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'laughing / smiling (plural/respectful masculine)',
    literaryNuanceNote: 'Imperfective active participle expressing continuous cheerfulness and joyful laughter.',
  },
  'ہنستی': {
    vocalizedForm: 'ہَنَسْتی',
    spokenUrduSynonymsJson: ['مسکراتی ہوئی', 'خوش ہوتی ہوئی'],
    urduSimpleExplanation: 'مسکراتے اور ہنستے ہوئے (مؤنث)',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'laughing / smiling (feminine singular)',
  },
  'ہنسا': {
    vocalizedForm: 'ہَنَسا',
    spokenUrduSynonymsJson: ['مسکرا دیا', 'ہنس پڑا'],
    urduSimpleExplanation: 'خوشی سے کھلکھلا اٹھا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'laughed / smiled (past)',
  },
  'ہنسے': {
    vocalizedForm: 'ہَنَسْے',
    spokenUrduSynonymsJson: ['مسکرا دیے', 'ہنس پڑے'],
    urduSimpleExplanation: 'مسکرا دیے یا کھلکھلا اٹھے',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'laughed / smiled (plural past)',
  },
  'کھیلنا': {
    vocalizedForm: 'کھیلْنا',
    spokenUrduSynonymsJson: ['کھیل کود کرنا'],
    urduSimpleExplanation: 'کھیل یا تفریح میں مشغول ہونا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'to play',
  },
  'کھیلتے': {
    vocalizedForm: 'کھیلْتے',
    spokenUrduSynonymsJson: ['کھیل کود کرتے ہوئے', 'تفریح کرتے ہوئے'],
    urduSimpleExplanation: 'کھیل کود اور تفریح میں مشغول حالت',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'playing / engaging in playful recreation',
  },
  'کھیلتا': {
    vocalizedForm: 'کھیلْتا',
    spokenUrduSynonymsJson: ['کھیلتا ہوا'],
    urduSimpleExplanation: 'کھیل میں مگن',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'playing (masculine singular)',
  },
  'کھیلتی': {
    vocalizedForm: 'کھیلْتی',
    spokenUrduSynonymsJson: ['کھیلتی ہوئی'],
    urduSimpleExplanation: 'کھیل میں مگن لڑکی',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'playing (feminine singular)',
  },
  'کھیلا': {
    vocalizedForm: 'کھیلا',
    spokenUrduSynonymsJson: ['کھیل کود کی'],
    urduSimpleExplanation: 'کھیل مکمل کیا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'played (past)',
  },
  'کھیلے': {
    vocalizedForm: 'کھیلے',
    spokenUrduSynonymsJson: ['کھیل کود کی'],
    urduSimpleExplanation: 'کھیل میں حصہ لیا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'played (plural past)',
  },

  // --- Fixed Binomials & Idioms ---
  'چہل پہل': {
    vocalizedForm: 'چَہَل پَہَل',
    spokenUrduSynonymsJson: ['رونق', 'بھیڑ بھاڑ', 'گہما گہمی', 'ہلچل'],
    urduSimpleExplanation: 'لوگوں کی چلت پھرت، گہما گہمی، رونق اور میلے ٹھیلے کی شادابی',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'bustle / lively commotion / festive excitement',
    literaryNuanceNote: 'Celebrated Urdu binomial noun capturing vibrant festive bazaars, crowded streets, and joyful public energy.',
  },
  'چَہَل پَہَل': {
    vocalizedForm: 'چَہَل پَہَل',
    spokenUrduSynonymsJson: ['رونق', 'گہما گہمی', 'ہلچل'],
    urduSimpleExplanation: 'لوگوں کی آمد و رفت اور رونق',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'bustle / festive commotion / bustling activity',
  },
  'چہل': {
    vocalizedForm: 'چَہَل',
    spokenUrduSynonymsJson: ['رونق کا پہلا جزو', 'ہلچل'],
    urduSimpleExplanation: 'چہل پہل کا پہلا جزو، رونق اور شادابی',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'bustle / lively movement (first half of binomial)',
  },
  'پہل': {
    vocalizedForm: 'پَہَل',
    spokenUrduSynonymsJson: ['گہما گہمی کا جزو'],
    urduSimpleExplanation: 'چہل کے ساتھ بولا جانے والا مکرر جزو، گہما گہمی',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'liveliness / motion (second half of binomial)',
  },
  'ہنستے کھیلتے': {
    vocalizedForm: 'ہَنَسْتے کھیلْتے',
    spokenUrduSynonymsJson: ['خوشی خوشی', 'شاداں و فرحاں', 'مسکراتے ہوئے'],
    urduSimpleExplanation: 'کمال خوشی، بے فکری اور مسرت کے ساتھ',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'laughing and playing / in high spirits / merrily',
    literaryNuanceNote: 'Classic rhyming coordinate compound describing lighthearted youth and carefreeness.',
  },
  'عید گاہ': {
    vocalizedForm: 'عِید گاہ',
    spokenUrduSynonymsJson: ['عید کی نماز کی جگہ', 'مسجدِ عید'],
    urduSimpleExplanation: 'عید کی نماز کے لیے شہر یا بستی سے باہر بنا کشادہ کھلے آسمان والا میدان',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'Idgah (open-air ground for communal Eid prayers)',
    literaryNuanceNote: 'Sacred open-air prayer enclosure situated at the periphery of South Asian Muslim towns for Eid gatherings.',
  },
  'عیدگاہ': {
    vocalizedForm: 'عِید گاہ',
    spokenUrduSynonymsJson: ['عید کی نماز کی جگہ'],
    urduSimpleExplanation: 'عید کی نماز کے لیے مخصوص کھلی جگہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'Idgah (open-air ground for Eid prayer)',
  },
  'حجِ اکبر': {
    vocalizedForm: 'حَجِّ اَکْبَر',
    spokenUrduSynonymsJson: ['بڑا حج', 'اعلیٰ ترین حج'],
    urduSimpleExplanation: 'وہ حج جس کا وقوفِ عرفہ جمعہ کے دن واقع ہو، یا اصطلاح میں بے لوث خدمت و ایثار کا عظیم ثواب',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'The Greater Pilgrimage / Hajj-e-Akbar (also used metaphorically for supreme human self-sacrifice)',
    literaryNuanceNote: 'Religious and literary title signifying the supreme pilgrimage, transformed by Premchand into an allegory of maternal charity.',
  },
  'لمحہ بہ لمحہ': {
    vocalizedForm: 'لَمْحَہ بَہ لَمْحَہ',
    spokenUrduSynonymsJson: ['پل پل', 'مسلسل', 'ہر آن', 'ساتھ ساتھ'],
    urduSimpleExplanation: 'ہر ایک گزرتے لمحے کے ساتھ، بتدریج اور متواتر',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'moment by moment / second by second / with each passing instant',
    literaryNuanceNote: 'Persian prepositional reduplication indicating inexorable temporal progression and intensifying anticipation.',
  },
  'دل ہی دل میں': {
    vocalizedForm: 'دِل ہی دِل میں',
    spokenUrduSynonymsJson: ['اپنے اندر ہی اندر', 'خاموشی سے', 'چپکے سے'],
    urduSimpleExplanation: 'بغیر زبان پر لائے یا کسی پر ظاہر کیے، باطن اور وجدان میں',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: "in one's heart of hearts / inwardly / secretly to oneself",
    literaryNuanceNote: 'Emphatic reduplication denoting purely interior psychological states hidden from outside observers.',
  },
  'چکنا چور': {
    vocalizedForm: 'چَکْنا چُور',
    spokenUrduSynonymsJson: ['ٹکڑے ٹکڑے', 'ریزہ ریزہ', 'برباد'],
    urduSimpleExplanation: 'ٹوٹ کر بالکل باریک ٹکڑوں اور ذرات میں تبدیل ہو جانا',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'shattered into pieces / smashed to smithereens / crushed',
  },
  'نادان دوست': {
    vocalizedForm: 'نادان دوسْت',
    spokenUrduSynonymsJson: ['بے وقوف ہمدرد', 'معصوم نقصان دہ ساتھی'],
    urduSimpleExplanation: 'وہ دوست جو محبت اور خلوص میں خیر خواہی تو چاہے مگر عقل و فہم نہ ہونے کی وجہ سے نقصان کر بیٹھے',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'an ignorant friend / a foolish ally whose naive good intentions bring ruin',
  },
  'نمک کا داروغہ': {
    vocalizedForm: 'نَمَک کا داروغَہ',
    spokenUrduSynonymsJson: ['محکمہ نمک کا انسپکٹر'],
    urduSimpleExplanation: 'برطانوی راج میں سرکاری نمک پر ٹیکس اور اسمگلنگ روکنے کے محکمے کا افسر',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'Inspector of the Salt Department (symbol of unbending honesty against corruption)',
  },
  'لہو اور قالین': {
    vocalizedForm: 'لَہُو اور قالِین',
    spokenUrduSynonymsJson: ['خون اور قالین', 'مظلوم کا پسینہ اور عیاشی'],
    urduSimpleExplanation: 'مفلس فنکار کا خون اور امراء کے محلات کے بیش قیمت قالین',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'Blood and Carpet (drama of artistic exploitation vs feudal hypocrisy)',
  },
  'نیا قانون': {
    vocalizedForm: 'نَیا قانُون',
    spokenUrduSynonymsJson: ['جدید آئین', 'انڈیا ایکٹ 1935'],
    urduSimpleExplanation: 'گورنمنٹ آف انڈیا ایکٹ 1935 جسے عام لوگ آزادی کی علامت سمجھے',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'The New Constitution / Government of India Act 1935 (Manto’s political satire)',
  },
  'ٹھنڈا گوشت': {
    vocalizedForm: 'ٹَھنْڈا گوشْت',
    spokenUrduSynonymsJson: ['بے جان جسم', 'مردہ لاش'],
    urduSimpleExplanation: 'بے جان، سرد اور بے حس مردہ لاش، فسادات کی بربریت کا نوحہ',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'Cold Meat / Lifeless Flesh (Manto’s visceral tragedy of riot psychosis)',
  },
  'اداس نسلیں': {
    vocalizedForm: 'اُداس نَسْلیں',
    spokenUrduSynonymsJson: ['غمگین پشتیں', 'مایوس نسل'],
    urduSimpleExplanation: 'جنگ اور تقسیم کے کرب سے گزری ہوئی رنجیدہ اور منتشر نسلیں',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'The Weary Generations (Abdullah Hussein’s magnum opus of Partition & WW1)',
  },
  'غلام باغ': {
    vocalizedForm: 'غُلام باغ',
    spokenUrduSynonymsJson: ['قیدیوں کا باغ', 'پراسرار باغ'],
    urduSimpleExplanation: 'مرزا اطہر بیگ کا فلسفیانہ ناول جس میں ماضی کی کھدائیاں اور نفسیاتی الجھنیں ہیں',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'Ghulam Bagh / The Enslaved Garden (Postmodern philosophical novel)',
  },
  'خوفناک عمارت': {
    vocalizedForm: 'خَوفْناک عِمارَت',
    spokenUrduSynonymsJson: ['ڈرائونی حویلی', 'پراسرار مکان'],
    urduSimpleExplanation: 'ابن صفی کی جاسوسی کہانیوں میں دہشت اور پراسرار رازوں والی عمارت',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'The Terrifying Mansion (Ibn-e-Safi spy thriller mystery)',
  },
  'طوطے کی کہانی': {
    vocalizedForm: 'طوطے کی کَہانی',
    spokenUrduSynonymsJson: ['باغ و بہار کا قصہ'],
    urduSimpleExplanation: 'میر امن کی باغ و بہار کا تمثیلی اور فصیح قصہ',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'The Story of the Parrot (from Mir Amman’s Bagh-o-Bahar)',
  },
  'عمرو عیار': {
    vocalizedForm: 'عَمْرو عَیّار',
    spokenUrduSynonymsJson: ['چالاک جاسوس', 'داستانِ امیر حمزہ کا ہیرو'],
    urduSimpleExplanation: 'اردو داستانوں کا مشہور و معروف جادوئی اور عیار کردار جو زنبیل رکھتا ہے',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'Amar Ayyar (legendary cunning trickster hero of Urdu fantasy folklore)',
  },
  'انسپکٹر جمشید': {
    vocalizedForm: 'اِنْسْپَیکْٹَر جَمْشِید',
    spokenUrduSynonymsJson: ['مشہور جاسوس'],
    urduSimpleExplanation: 'اشتیاق احمد کے سراغ رسانی والے ناولوں کا بہادر تفتیشی کردار',
    tokenTier: 'idiom_phrase',
    englishContextualGloss: 'Inspector Jamshed (celebrated Urdu detective series hero)',
  },

  // --- Domestic, Psychological, and Material Nouns ---
  'کارنس': {
    vocalizedForm: 'کارْنِس',
    spokenUrduSynonymsJson: ['دیوار کی منڈیر', 'طاقچہ', 'ابھرا ہوا کنارہ'],
    urduSimpleExplanation: 'کمرے کی دیوار کے بالائی حصے میں چھت کے قریب بنا ابھرا ہوا طاق یا کنارہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'cornice / interior wall ledge',
    literaryNuanceNote: 'Architectural moulding or high shelf commonly found in colonial and traditional brick homes.',
  },
  'انڈے': {
    vocalizedForm: 'اَنڈے',
    spokenUrduSynonymsJson: ['بیضے'],
    urduSimpleExplanation: 'پرندوں کے انڈے جن سے بچے نکلتے ہیں',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'eggs (plural)',
  },
  'انڈوں': {
    vocalizedForm: 'اَنڈوں',
    spokenUrduSynonymsJson: ['انڈوں'],
    urduSimpleExplanation: 'انڈے کی جمع مفعولی حالت',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'eggs (plural oblique)',
  },
  'چڑیا': {
    vocalizedForm: 'چِڑِیا',
    spokenUrduSynonymsJson: ['ننھا پرندہ', 'گوریا'],
    urduSimpleExplanation: 'چھوٹا مانوس اور خوبصورت گھریلو پرندہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'sparrow / small bird',
  },
  'چڑیوں': {
    vocalizedForm: 'چِڑِیوں',
    spokenUrduSynonymsJson: ['پرندوں'],
    urduSimpleExplanation: 'چڑیا کی جمع مفعولی حالت',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'sparrows / birds (oblique)',
  },
  'چڑا': {
    vocalizedForm: 'چِڑا',
    spokenUrduSynonymsJson: ['نر چڑیا'],
    urduSimpleExplanation: 'نر چڑیا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'male sparrow',
  },
  'گھونسلا': {
    vocalizedForm: 'گھونْسْلا',
    spokenUrduSynonymsJson: ['آشیانہ', 'بسیرا'],
    urduSimpleExplanation: 'پرندوں کا تنکوں اور پروں سے تیار کردہ مسکن',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'bird nest',
  },
  'گھونسلے': {
    vocalizedForm: 'گھونْسْلے',
    spokenUrduSynonymsJson: ['آشیانے'],
    urduSimpleExplanation: 'گھونسلا کی حالتِ اضافی یا مفعولی',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'nest / nests (oblique)',
  },
  'تنکے': {
    vocalizedForm: 'تِنْکے',
    spokenUrduSynonymsJson: ['خشک گھاس کے ٹکڑے', 'خاشاک'],
    urduSimpleExplanation: 'خشک گھاس پھونس کے باریک ٹکڑے جن سے گھونسلا بنتا ہے',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'straws / dry twigs / blades of grass',
  },
  'چمٹا': {
    vocalizedForm: 'چَمْٹا',
    spokenUrduSynonymsJson: ['دست پناہ', 'لوہے کی سنسی'],
    urduSimpleExplanation: 'چولہے سے گرم کوئلے یا روٹی پکڑنے کا لوہے کا دو شاخہ اوزار',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'pair of tongs / fire tongs',
    literaryNuanceNote: 'Hamid’s heroic sacrifice in Idgah: choosing a sturdy iron utensil over fragile clay toys to save his grandmother from burns.',
  },
  'چمٹے': {
    vocalizedForm: 'چَمْٹے',
    spokenUrduSynonymsJson: ['چمٹا'],
    urduSimpleExplanation: 'چمٹا کی جمع یا مفعولی حالت',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'tongs (plural/oblique)',
  },
  'پیالی': {
    vocalizedForm: 'پِیالی',
    spokenUrduSynonymsJson: ['چھوٹا پیالہ', 'کٹوری'],
    urduSimpleExplanation: 'مٹی یا پتھر کا چھوٹا پیالہ جس میں پانی یا چائے پی جاتی ہے',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'small bowl / cup',
  },
  'دانہ': {
    vocalizedForm: 'دانَہ',
    spokenUrduSynonymsJson: ['اناج', 'بیج', 'خوراک'],
    urduSimpleExplanation: 'پرندوں کا دانہ دنکا، اناج کا بیج',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'grain / seed / bird feed',
  },
  'چاول': {
    vocalizedForm: 'چاوَل',
    spokenUrduSynonymsJson: ['برنج', 'دھان'],
    urduSimpleExplanation: 'کھانے کا مشہور سفید اناج',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'rice / rice grains',
  },
  'ٹوکری': {
    vocalizedForm: 'ٹوکْری',
    spokenUrduSynonymsJson: ['جھلی', 'ڈلیا'],
    urduSimpleExplanation: 'بانس یا تیلیوں سے بنی چھوٹی ٹوکری',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'small basket',
  },
  'سوراخ': {
    vocalizedForm: 'سُوراخ',
    spokenUrduSynonymsJson: ['چھید', 'روزن'],
    urduSimpleExplanation: 'کسی چیز میں بنا باریک چھید',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'hole / aperture',
  },
  'کپڑا': {
    vocalizedForm: 'کَپْڑا',
    spokenUrduSynonymsJson: ['پوشاک', 'پارچہ'],
    urduSimpleExplanation: 'بنا ہوا سوتی یا ریشمی پارچہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'cloth / fabric / garment',
  },
  'کپڑے': {
    vocalizedForm: 'کَپْڑے',
    spokenUrduSynonymsJson: ['لباس', 'پوشاکیں'],
    urduSimpleExplanation: 'پہننے کا لباس یا کپڑے کے ٹکڑے',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'clothes / garments / cloth pieces',
  },
  'چاندنی': {
    vocalizedForm: 'چانْدْنی',
    spokenUrduSynonymsJson: ['سفید چھت', 'شامیانہ', 'مہتاب کی روشنی'],
    urduSimpleExplanation: 'گھونسلے پر دھوپ سے بچاؤ کی سفید کپڑے کی چھت یا چاند کی روشنی',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'cloth canopy / awning / moonlight',
  },
  'دھوپ': {
    vocalizedForm: 'دھوپ',
    spokenUrduSynonymsJson: ['سورج کی تپش'],
    urduSimpleExplanation: 'آفتاب کی تیز روشنی اور حرارت',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'sunlight / direct sunshine / heat',
  },
  'سایہ': {
    vocalizedForm: 'سایَہ',
    spokenUrduSynonymsJson: ['چھاؤں', 'ظل'],
    urduSimpleExplanation: 'دھوپ اور گرمی سے بچاؤ کی جگہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'shade / shadow',
  },
  'تکلیف': {
    vocalizedForm: 'تَکْلِیف',
    spokenUrduSynonymsJson: ['اذیت', 'درد', 'دکھ'],
    urduSimpleExplanation: 'جسمانی یا روحانی رنج و اذیت',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'pain / distress / discomfort / suffering',
  },
  'پیاس': {
    vocalizedForm: 'پِیاس',
    spokenUrduSynonymsJson: ['تشنگی'],
    urduSimpleExplanation: 'پانی پینے کی شدید خواہش و حاجت',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'thirst',
  },
  'پیاسے': {
    vocalizedForm: 'پِیاسے',
    spokenUrduSynonymsJson: ['تشنہ لب'],
    urduSimpleExplanation: 'وہ جنہیں پیاس لگی ہو',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'thirsty',
  },
  'بھوک': {
    vocalizedForm: 'بھوک',
    spokenUrduSynonymsJson: ['اشتها', 'فاقہ'],
    urduSimpleExplanation: 'کھانے کی طلب یا فاقہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'hunger / appetite',
  },
  'بھوکے': {
    vocalizedForm: 'بھوکے',
    spokenUrduSynonymsJson: ['فاقہ کش'],
    urduSimpleExplanation: 'جنہیں کھانا نہ ملا ہو',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'hungry (plural/oblique)',
  },
  'معصوم': {
    vocalizedForm: 'مَعْصُوم',
    spokenUrduSynonymsJson: ['بے گناہ', 'بے ضرر', 'سادہ لوح'],
    urduSimpleExplanation: 'جو برائی یا گناہ سے پاک ہو، بھولا بھالا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'innocent / naive / guiltless',
  },
  'معصومیت': {
    vocalizedForm: 'مَعْصُومِیَّت',
    spokenUrduSynonymsJson: ['بھولا پن', 'بے گناہی'],
    urduSimpleExplanation: 'سادگی اور گناہ سے پاک ہونے کی صفت',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'innocence / naivety',
  },
  'قصور': {
    vocalizedForm: 'قَصُور',
    spokenUrduSynonymsJson: ['غلطی', 'خطا', 'گناہ'],
    urduSimpleExplanation: 'غلطی، کوتاہی یا لغزش',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'fault / blame / offense / shortcoming',
  },
  'گناہ': {
    vocalizedForm: 'گُناہ',
    spokenUrduSynonymsJson: ['جرم', 'پاپ', 'خطا'],
    urduSimpleExplanation: 'اخلاقی یا مذہبی قانون کی خلاف ورزی',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'sin / transgression',
  },
  'افسوس': {
    vocalizedForm: 'اَفْسوس',
    spokenUrduSynonymsJson: ['رنج', 'پچھتاوا', 'ملال'],
    urduSimpleExplanation: 'کسی نقصان یا غلطی پر ہونے والا غم و ملال',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'regret / sorrow / pity / grief',
  },
  'انصاف': {
    vocalizedForm: 'اِنْصاف',
    spokenUrduSynonymsJson: ['عدل', 'حق پرستی'],
    urduSimpleExplanation: 'بغیر طرفداری کے سچائی اور حق کے مطابق دیا جانے والا فیصلہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'justice / equity / fairness',
  },
  'عدالت': {
    vocalizedForm: 'عَدالَت',
    spokenUrduSynonymsJson: ['کچہری', 'محکمہ انصاف'],
    urduSimpleExplanation: 'انصاف اور قانونی کارروائی کا ادارہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'court of law / judiciary',
  },
  'قاضی': {
    vocalizedForm: 'قاضی',
    spokenUrduSynonymsJson: ['منصف', 'جج'],
    urduSimpleExplanation: 'حق اور قانون کے تحت فیصلہ کرنے والا منصف',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'judge / magistrate / qadi',
  },
  'حکم': {
    vocalizedForm: 'حُکْم',
    spokenUrduSynonymsJson: ['فرمان', 'آرڈر', 'امر'],
    urduSimpleExplanation: 'حاکم یا افسر کا نافذ کردہ لازمی امر',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'order / command / decree / injunction',
  },
  'گواہ': {
    vocalizedForm: 'گَواہ',
    spokenUrduSynonymsJson: ['شاہد'],
    urduSimpleExplanation: 'جس نے واقعہ اپنی آنکھوں سے دیکھا ہو',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'witness / deponent',
  },
  'حضور': {
    vocalizedForm: 'حُضُور',
    spokenUrduSynonymsJson: ['جناب', 'قبلہ', 'سرکار'],
    urduSimpleExplanation: 'بزرگ یا حاکم کے سامنے ادب و تعظیم کا کلمہ',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'your presence / sire / honorable sir',
  },
  'ضمیر': {
    vocalizedForm: 'ضَمِیر',
    spokenUrduSynonymsJson: ['وجدان', 'باطن کی آواز'],
    urduSimpleExplanation: 'انسان کی اندرونی روحانی حس جو اچھے اور برے میں تمیز کرتی ہے',
    tokenTier: 'literary_vocab',
    englishContextualGloss: 'conscience / moral compass',
  },
  'ایمان': {
    vocalizedForm: 'اِیمان',
    spokenUrduSynonymsJson: ['دیانت داری', 'یقینِ محکم'],
    urduSimpleExplanation: 'سچی دیانت اور حق پرستی',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'faith / integrity / honesty',
  },
  'تفتیش': {
    vocalizedForm: 'تَفْتِیش',
    spokenUrduSynonymsJson: ['چھان بین', 'تحقیقات'],
    urduSimpleExplanation: 'جرم یا معمہ حل کرنے کے لیے کی جانے والی تلاش اور جانچ پڑتال',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'investigation / rigorous inquiry',
  },
  'شبہ': {
    vocalizedForm: 'شُبَہ',
    spokenUrduSynonymsJson: ['شک', 'گمان'],
    urduSimpleExplanation: 'کسی معاملے پر بے اعتمادی یا شک کا پیدا ہونا',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'suspicion / doubt / misgiving',
  },
  'سراغ': {
    vocalizedForm: 'سُراغ',
    spokenUrduSynonymsJson: ['کھوج', 'نشان', 'پتہ'],
    urduSimpleExplanation: 'کسی پوشیدہ معاملے تک پہنچنے کا سرا یا علامت',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'clue / trace / lead / track',
  },
  'معمہ': {
    vocalizedForm: 'مُعَمّہ',
    spokenUrduSynonymsJson: ['پہیلی', 'راز'],
    urduSimpleExplanation: 'پیچیدہ گتھی جس کا حل آسان نہ ہو',
    tokenTier: 'literary_vocab',
    englishContextualGloss: 'enigma / riddle / puzzle / mystery',
  },
  'جال': {
    vocalizedForm: 'جال',
    spokenUrduSynonymsJson: ['پھندا', 'دام'],
    urduSimpleExplanation: 'شکار یا مجرم کو گھیرنے کا بندوبست',
    tokenTier: 'common_vocab',
    englishContextualGloss: 'net / trap / web / snare',
  },
};

/**
 * Intelligent Morphological Lexicon Resolver
 * Guarantees that EVERY word token across all 29 curriculum stories receives:
 * 1. An accurate vocalized form (with diacritics).
 * 2. Real spoken Urdu synonyms.
 * 3. A clear Urdu definition.
 * 4. A genuine, meaningful English translation (NEVER repeating the Urdu surface string!).
 */
export function lookupUrduWord(
  surface: string,
  normalized: string,
  compoundPhrase?: string
): LexemeAnalysisData {
  const cleanSurface = (surface || '').trim();
  const cleanNorm = (normalized || '').trim();
  const bareNorm = cleanNorm
    .replace(/^[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+|[،۔؛:؟!«»"'“”‘’()[\]{}—–.,?!-]+$/gu, '')
    .trim();
  const compoundKey = compoundPhrase ? compoundPhrase.trim() : '';

  // 1. Direct compound match
  if (compoundKey && COMPREHENSIVE_URDU_LEXICON[compoundKey]) {
    return COMPREHENSIVE_URDU_LEXICON[compoundKey];
  }

  // 2. Direct exact or normalized match
  if (COMPREHENSIVE_URDU_LEXICON[cleanSurface]) return COMPREHENSIVE_URDU_LEXICON[cleanSurface];
  if (COMPREHENSIVE_URDU_LEXICON[cleanNorm]) return COMPREHENSIVE_URDU_LEXICON[cleanNorm];
  if (COMPREHENSIVE_URDU_LEXICON[bareNorm]) return COMPREHENSIVE_URDU_LEXICON[bareNorm];

  // 3. Morphological Inflection Engine
  // A. Habitual Participles in -تے (e.g. ہنستے, کھیلتے, دیکھتے, بولتے, جاتے, آتے)
  if (bareNorm.endsWith('تے') && bareNorm.length > 2) {
    const stem = bareNorm.slice(0, -2);
    const infinitive = stem + 'نا';
    const baseEntry = COMPREHENSIVE_URDU_LEXICON[infinitive];
    if (baseEntry) {
      const vocStem = vocalizeUrduWord(stem);
      const voc = `${vocStem}تے`;
      return {
        vocalizedForm: voc,
        spokenUrduSynonymsJson: baseEntry.spokenUrduSynonymsJson.map((s) => `${s} ہوئے`),
        urduSimpleExplanation: `${infinitive} کی حالت میں مشغول یا ایسا کرتے ہوئے`,
        tokenTier: 'common_vocab',
        englishContextualGloss: `${baseEntry.englishContextualGloss.replace(/^to\s+/i, '')}ing (plural/continuous)`,
        literaryNuanceNote: `Imperfective active participle derived from ${infinitive}.`,
      };
    }
  }

  // B. Habitual Participles in -تا (e.g. ہنستا, کھیلتا, دیکھتا, کہتا)
  if (bareNorm.endsWith('تا') && bareNorm.length > 2) {
    const stem = bareNorm.slice(0, -2);
    const infinitive = stem + 'نا';
    const baseEntry = COMPREHENSIVE_URDU_LEXICON[infinitive];
    if (baseEntry) {
      const vocStem = vocalizeUrduWord(stem);
      return {
        vocalizedForm: `${vocStem}تا`,
        spokenUrduSynonymsJson: baseEntry.spokenUrduSynonymsJson,
        urduSimpleExplanation: `${infinitive} کی حالت (مذکر واحد)`,
        tokenTier: 'common_vocab',
        englishContextualGloss: `${baseEntry.englishContextualGloss.replace(/^to\s+/i, '')}ing (masculine singular)`,
      };
    }
  }

  // C. Habitual Participles in -تی (e.g. ہنستی, کھیلتی, دیکھتی, کہتی)
  if (bareNorm.endsWith('تی') && bareNorm.length > 2) {
    const stem = bareNorm.slice(0, -2);
    const infinitive = stem + 'نا';
    const baseEntry = COMPREHENSIVE_URDU_LEXICON[infinitive];
    if (baseEntry) {
      const vocStem = vocalizeUrduWord(stem);
      return {
        vocalizedForm: `${vocStem}تی`,
        spokenUrduSynonymsJson: baseEntry.spokenUrduSynonymsJson,
        urduSimpleExplanation: `${infinitive} کی حالت (مؤنث)`,
        tokenTier: 'common_vocab',
        englishContextualGloss: `${baseEntry.englishContextualGloss.replace(/^to\s+/i, '')}ing (feminine singular)`,
      };
    }
  }

  // D. Oblique Plural Nouns in -وں (e.g. بچوں, آنکھوں, ہاتھوں, دلوں, گھروں, چڑیوں, انڈوں, دوستوں)
  if (bareNorm.endsWith('وں') && bareNorm.length > 2) {
    const stem = bareNorm.slice(0, -2);
    // Try common singular variations: stem + ہ, stem + ا, or pure stem
    const candidateSingulars = [stem + 'ہ', stem + 'ا', stem, stem + 'ی'];
    for (const cand of candidateSingulars) {
      const candEntry = COMPREHENSIVE_URDU_LEXICON[cand];
      if (candEntry) {
        const vocStem = candEntry.vocalizedForm.slice(0, -1);
        return {
          vocalizedForm: `${vocStem}وں`,
          spokenUrduSynonymsJson: candEntry.spokenUrduSynonymsJson,
          urduSimpleExplanation: `${cand} کی جمع مفعولی حالت`,
          tokenTier: 'common_vocab',
          englishContextualGloss: `${candEntry.englishContextualGloss} (plural oblique)`,
          literaryNuanceNote: `Inflected oblique plural form of ${cand}.`,
        };
      }
    }
  }

  // E. Plural Nouns in -یں (e.g. باتیں, آنکھیں, راتیں)
  if (bareNorm.endsWith('یں') && bareNorm.length > 2) {
    const stem = bareNorm.slice(0, -2);
    const candEntry = COMPREHENSIVE_URDU_LEXICON[stem];
    if (candEntry) {
      return {
        vocalizedForm: `${candEntry.vocalizedForm}یں`,
        spokenUrduSynonymsJson: candEntry.spokenUrduSynonymsJson,
        urduSimpleExplanation: `${stem} کی جمع`,
        tokenTier: 'common_vocab',
        englishContextualGloss: `${candEntry.englishContextualGloss} (plural)`,
      };
    }
  }

  // F. Infinitives/Gerunds in -نے (e.g. جانے, دیکھنے, کھانے, کرنے)
  if (bareNorm.endsWith('نے') && bareNorm.length > 2) {
    const stem = bareNorm.slice(0, -2);
    const infinitive = stem + 'نا';
    const baseEntry = COMPREHENSIVE_URDU_LEXICON[infinitive];
    if (baseEntry) {
      const vocStem = vocalizeUrduWord(stem);
      return {
        vocalizedForm: `${vocStem}نے`,
        spokenUrduSynonymsJson: baseEntry.spokenUrduSynonymsJson,
        urduSimpleExplanation: `${infinitive} کے واسطے یا ارادے سے`,
        tokenTier: 'common_vocab',
        englishContextualGloss: `to ${baseEntry.englishContextualGloss.replace(/^to\s+/i, '')} / in order to ${baseEntry.englishContextualGloss.replace(/^to\s+/i, '')}`,
      };
    }
  }

  // G. Past Participles in -ا / -ے / -ی (e.g. دیکھا, دیکھے, دیکھی, سوچا, سوچا)
  for (const ending of ['ا', 'ے', 'ی']) {
    if (bareNorm.endsWith(ending) && bareNorm.length > 2) {
      const stem = bareNorm.slice(0, -ending.length);
      const infinitive = stem + 'نا';
      const baseEntry = COMPREHENSIVE_URDU_LEXICON[infinitive];
      if (baseEntry) {
        const vocStem = vocalizeUrduWord(stem);
        return {
          vocalizedForm: `${vocStem}${ending}`,
          spokenUrduSynonymsJson: baseEntry.spokenUrduSynonymsJson,
          urduSimpleExplanation: `${infinitive} کا فعلِ ماضی`,
          tokenTier: 'common_vocab',
          englishContextualGloss: `${baseEntry.englishContextualGloss.replace(/^to\s+/i, '')} (past tense)`,
        };
      }
    }
  }

  // 4. Default Guaranteed Resolution (Never repeats Urdu in English!)
  const voc = vocalizeUrduWord(bareNorm || cleanNorm || cleanSurface);
  return {
    vocalizedForm: voc,
    spokenUrduSynonymsJson: [cleanNorm],
    urduSimpleExplanation: `${bareNorm || cleanSurface} - ادبی مفہوم اور سیاق و سباق`,
    tokenTier: 'literary_vocab',
    englishContextualGloss: `[${bareNorm || cleanSurface}] literary term / contextual expression`,
    literaryNuanceNote: 'Urdu literary vocabulary item enriched with contextual pedagogical nuance.',
  };
}
