export type StoryFormat = 'short_story' | 'essay' | 'novella_arc' | 'novel_arc';
export type CurriculumStatus = 'ready' | 'coming_soon';

export interface CurriculumEntry {
  level: number; // 1 to 10
  subLevel: string; // e.g. "1.1", "2.2"
  id: string; // Unique slug identifier
  titleEnglish: string;
  titleUrdu: string;
  authorEnglish: string;
  authorUrdu: string;
  format: StoryFormat;
  targetVocabFocus: string;
  sourceUrl?: string | null;
  status: CurriculumStatus;
  levelThemeEnglish: string;
  levelThemeUrdu: string;
  gradeLevelDescription: string;
  descriptionEnglish?: string;
  sceneVocabPreview?: string[];
}

export const CURRICULUM_REGISTRY: CurriculumEntry[] = [
  // =========================================================================
  // LEVEL 1: Folklore & Wit (98% Spoken Vocab + Basic Written Connectors)
  // =========================================================================
  {
    level: 1,
    subLevel: '1.1',
    id: 'sheikh-chilli',
    titleEnglish: "Sheikh Chilli's Dream",
    titleUrdu: 'شیخ چلی کا خواب',
    authorEnglish: 'Folk Tradition',
    authorUrdu: 'لوک روایت',
    format: 'short_story',
    targetVocabFocus:
      '98% spoken vocabulary to build effortless eye-speed and master high-frequency written connectors like چنانچہ, البتہ, مگر, and اتفاق.',
    status: 'ready',
    levelThemeEnglish: 'Folklore & Wit',
    levelThemeUrdu: 'لوک کہانیاں اور ظرافت',
    gradeLevelDescription: 'Foundation / 98% Spoken Vocabulary',
    descriptionEnglish:
      '98% spoken vocabulary to build effortless eye-speed and master high-frequency written connectors like چنانچہ, البتہ, مگر, and اتفاق.',
    sceneVocabPreview: ['خواب', 'انڈوں', 'مرغیاں', 'بکری', 'گائے', 'حویلی'],
  },
  {
    level: 1,
    subLevel: '1.2',
    id: 'mulla-nasruddin',
    titleEnglish: 'Mulla Nasruddin Ke Waqiat',
    titleUrdu: 'ملا نصیر الدین کے واقعات',
    authorEnglish: 'Folk Tradition',
    authorUrdu: 'لوک روایت',
    format: 'short_story',
    targetVocabFocus:
      'Conversational wit, basic narrative connectors, and everyday transactional bazaar humor.',
    status: 'ready',
    levelThemeEnglish: 'Folklore & Wit',
    levelThemeUrdu: 'لوک کہانیاں اور ظرافت',
    gradeLevelDescription: 'Foundation / 98% Spoken Vocabulary',
    descriptionEnglish:
      'Classic humorous anecdotes demonstrating wisdom through apparent foolishness and witty subversions of everyday logic.',
    sceneVocabPreview: ['دانائی', 'گدھا', 'حکمت', 'قاضی', 'بازار'],
  },
  {
    level: 1,
    subLevel: '1.3',
    id: 'birbal-hazir-jawabi',
    titleEnglish: 'Birbal Ki Hazir Jawabi',
    titleUrdu: 'بیربل کی حاضر جوابی',
    authorEnglish: 'Folk Tradition',
    authorUrdu: 'لوک روایت',
    format: 'short_story',
    targetVocabFocus:
      'Introduces fundamental courtroom, justice, and statecraft vocabulary: انصاف، حضور، حکم، قاضی، گواہ.',
    status: 'ready',
    levelThemeEnglish: 'Folklore & Wit',
    levelThemeUrdu: 'لوک کہانیاں اور ظرافت',
    gradeLevelDescription: 'Foundation / 98% Spoken Vocabulary',
    descriptionEnglish:
      'Sharp courtroom dialogues at Emperor Akbar’s court introducing formal Persianized address and justice terminology.',
    sceneVocabPreview: ['دربار', 'انصاف', 'حضور', 'حکم', 'گواہ'],
  },

  // =========================================================================
  // LEVEL 2: Household Realism (Grade 5–6 / Everyday Domestic & Emotional Vocab)
  // =========================================================================
  {
    level: 2,
    subLevel: '2.1',
    id: 'nadan-dost',
    titleEnglish: 'Nadan Dost',
    titleUrdu: 'نادان دوست',
    authorEnglish: 'Munshi Premchand',
    authorUrdu: 'منشی پریم چند',
    format: 'short_story',
    targetVocabFocus:
      'Domestic childhood curiosity, compassion, household objects, and tragic innocence.',
    status: 'ready',
    levelThemeEnglish: 'Household Realism',
    levelThemeUrdu: 'گھریلو حقیقت پسندی',
    gradeLevelDescription: 'Grade 5–6 / Everyday Domestic Realism',
    descriptionEnglish:
      'Keshav and Shyama’s innocent attempt to protect a bird nest on their cornice, ending in gentle domestic heartbreak.',
    sceneVocabPreview: ['گھونسلا', 'چڑیا', 'انڈے', 'نادانی', 'چھت'],
  },
  {
    level: 2,
    subLevel: '2.2',
    id: 'idgah',
    titleEnglish: 'Idgah',
    titleUrdu: 'عیدگاہ',
    authorEnglish: 'Munshi Premchand',
    authorUrdu: 'منشی پریم چند',
    format: 'short_story',
    targetVocabFocus:
      'Empathetic domestic realism, festival excitement, selflessness, and familial sacrifice.',
    status: 'ready',
    levelThemeEnglish: 'Household Realism',
    levelThemeUrdu: 'گھریلو حقیقت پسندی',
    gradeLevelDescription: 'Grade 5–6 / Everyday Domestic Realism',
    descriptionEnglish:
      'Hamid chooses a pair of tongs for his grandmother over fairground toys on Eid morning.',
    sceneVocabPreview: ['عیدگاہ', 'چمٹا', 'کھلونے', 'محبت', 'دادی'],
  },
  {
    level: 2,
    subLevel: '2.3',
    id: 'hajj-e-akbar',
    titleEnglish: 'Hajj-e-Akbar',
    titleUrdu: 'حجِ اکبر',
    authorEnglish: 'Munshi Premchand',
    authorUrdu: 'منشی پریم چند',
    format: 'short_story',
    targetVocabFocus:
      'Domestic devotion, nursemaid loyalty, pilgrimage vs human charity, and societal moral obligations.',
    status: 'ready',
    levelThemeEnglish: 'Household Realism',
    levelThemeUrdu: 'گھریلو حقیقت پسندی',
    gradeLevelDescription: 'Grade 5–6 / Everyday Domestic Realism',
    descriptionEnglish:
      'An old nursemaid gives away her lifetime pilgrimage savings to rescue the sick child she raised.',
    sceneVocabPreview: ['حج', 'قربانی', 'بیماری', 'دایہ', 'ثواب'],
  },

  // =========================================================================
  // LEVEL 3: Middle-Grade Mystery & Adventure (Grade 7–8 / Plot, Strategy & Investigation Vocab)
  // =========================================================================
  {
    level: 3,
    subLevel: '3.1',
    id: 'totay-ki-kahani',
    titleEnglish: 'Totay Ki Kahani',
    titleUrdu: 'طوطے کی کہانی',
    authorEnglish: 'Mir Amman',
    authorUrdu: 'میر امن دہلوی',
    format: 'short_story',
    targetVocabFocus:
      'Classic dastan narrative framework, animal fable wisdom, and early Fort William Delhi idiom.',
    status: 'ready',
    levelThemeEnglish: 'Middle-Grade Mystery & Adventure',
    levelThemeUrdu: 'مہم جوئی اور تجسس',
    gradeLevelDescription: 'Grade 7–8 / Plot & Strategy',
    descriptionEnglish:
      'From Bagh-o-Bahar: a wise parrot outsmarts merchants and kings with cunning allegorical riddles.',
    sceneVocabPreview: ['طوطا', 'سوداگر', 'پنجرہ', 'آزادی', 'حکمت'],
  },
  {
    level: 3,
    subLevel: '3.2',
    id: 'amar-ayyar',
    titleEnglish: 'Amar Ayyar Tales',
    titleUrdu: 'عمرو عیار کی کہانیاں',
    authorEnglish: 'Maqbool Jahangir',
    authorUrdu: 'مقبول جہانگیر',
    format: 'short_story',
    targetVocabFocus:
      'Dastan trickery, disguise, enchanted strategy, and tactical verbs (عیاری، زنبیل، سحر، کمند).',
    status: 'ready',
    levelThemeEnglish: 'Middle-Grade Mystery & Adventure',
    levelThemeUrdu: 'مہم جوئی اور تجسس',
    gradeLevelDescription: 'Grade 7–8 / Plot & Strategy',
    descriptionEnglish:
      'The legendary trickster Amar Ayyar deploys his boundless bag (زنبیل) and quick wits against sinister sorcerers.',
    sceneVocabPreview: ['زنبیل', 'عیاری', 'سحر', 'کمند', 'طلسم'],
  },
  {
    level: 3,
    subLevel: '3.3',
    id: 'inspector-jamshed',
    titleEnglish: 'Inspector Jamshed Mystery',
    titleUrdu: 'انسپکٹر جمشید کا معمہ',
    authorEnglish: 'Ishtiaq Ahmed',
    authorUrdu: 'اشتیاق احمد',
    format: 'short_story',
    targetVocabFocus:
      'Pre-teaches modern investigation and deduction vocabulary: تفتیش، شبہ، سراغ، معمہ، جال.',
    status: 'ready',
    levelThemeEnglish: 'Middle-Grade Mystery & Adventure',
    levelThemeUrdu: 'مہم جوئی اور تجسس',
    gradeLevelDescription: 'Grade 7–8 / Plot & Strategy',
    descriptionEnglish:
      'Pakistan’s quintessential detective unravels a baffling locked-room theft with his three children.',
    sceneVocabPreview: ['تفتیش', 'شبہ', 'سراغ', 'معمہ', 'چور'],
  },

  // =========================================================================
  // LEVEL 4: Matric Textbook Classics — Ethics & Conscience (Grade 9–10 / Legal & Moral Vocab)
  // =========================================================================
  {
    level: 4,
    subLevel: '4.1',
    id: 'panchayat',
    titleEnglish: 'Panchayat',
    titleUrdu: 'پنچایت',
    authorEnglish: 'Munshi Premchand',
    authorUrdu: 'منشی پریم چند',
    format: 'short_story',
    targetVocabFocus:
      'Pre-teaches judicial and conscience vocabulary: ضمیر، عدالت، انصاف، سرپنچ، حق، فیصلہ.',
    status: 'ready',
    levelThemeEnglish: 'Matric Classics: Ethics & Conscience',
    levelThemeUrdu: 'میٹرک کلاسیکی ادب: اخلاقیات و ضمیر',
    gradeLevelDescription: 'Grade 9–10 Matric / Judicial & Moral Dilemmas',
    descriptionEnglish:
      'Jumman Sheikh and Algu Chaudhary find their sacred friendship tested when seated on the judge’s bench.',
    sceneVocabPreview: ['پنچایت', 'ضمیر', 'عدالت', 'انصاف', 'سرپنچ'],
  },
  {
    level: 4,
    subLevel: '4.2',
    id: 'namak-ka-darogha',
    titleEnglish: 'Namak Ka Darogha',
    titleUrdu: 'نمک کا داروغہ',
    authorEnglish: 'Munshi Premchand',
    authorUrdu: 'منشی پریم چند',
    format: 'short_story',
    targetVocabFocus:
      'Integrity vs systemic corruption, law enforcement terminology: رشوت، داروغہ، ایمان، قانون.',
    status: 'ready',
    levelThemeEnglish: 'Matric Classics: Ethics & Conscience',
    levelThemeUrdu: 'میٹرک کلاسیکی ادب: اخلاقیات و ضمیر',
    gradeLevelDescription: 'Grade 9–10 Matric / Judicial & Moral Dilemmas',
    descriptionEnglish:
      'An incorruptible young salt inspector arrests a wealthy landlord and faces the crushing cost of honesty.',
    sceneVocabPreview: ['داروغہ', 'رشوت', 'ایمان', 'قانون', 'عدالت'],
  },
  {
    level: 4,
    subLevel: '4.3',
    id: 'lahu-aur-qaleen',
    titleEnglish: 'Lahu Aur Qaleen',
    titleUrdu: 'لہو اور قالین',
    authorEnglish: 'Mirza Adeeb',
    authorUrdu: 'مرزا ادیب',
    format: 'short_story',
    targetVocabFocus:
      'Artistic exploitation, societal hypocrisy, and the tragedy of uncredited creative labor.',
    status: 'ready',
    levelThemeEnglish: 'Matric Classics: Ethics & Conscience',
    levelThemeUrdu: 'میٹرک کلاسیکی ادب: اخلاقیات و ضمیر',
    gradeLevelDescription: 'Grade 9–10 Matric / Judicial & Moral Dilemmas',
    descriptionEnglish:
      'A dramatic critique of high-society art collectors who exploit starving artists to buy prestige.',
    sceneVocabPreview: ['مصور', 'فنکار', 'قالین', 'منافقت', 'خون'],
  },

  // =========================================================================
  // LEVEL 5: Urban Observation & Irony (Grade 10 / Light Persianized Phrasing & Twist Endings)
  // =========================================================================
  {
    level: 5,
    subLevel: '5.1',
    id: 'sawere-kal-aankh',
    titleEnglish: 'Sawere Jo Kal Aankh Meri Khuli',
    titleUrdu: 'سویرے جو کل آنکھ میری کھلی',
    authorEnglish: 'Patras Bukhari',
    authorUrdu: 'پطرس بخاری',
    format: 'essay',
    targetVocabFocus:
      'Witty satirical prose, student life, Persianized humorous compounding, and morning routine irony.',
    status: 'ready',
    levelThemeEnglish: 'Urban Observation & Irony',
    levelThemeUrdu: 'شہری مشاہدہ اور طنز و ظرافت',
    gradeLevelDescription: 'Grade 10 / Satire & Light Persianized Idiom',
    descriptionEnglish:
      'Patras Bukhari’s legendary essay on an ambitious student preparing for exams who fails at waking up.',
    sceneVocabPreview: ['امتحان', 'سویرا', 'نیند', 'لالہ', 'طنز'],
  },
  {
    level: 5,
    subLevel: '5.2',
    id: 'overcoat',
    titleEnglish: 'Overcoat',
    titleUrdu: 'اوور کوٹ',
    authorEnglish: 'Ghulam Abbas',
    authorUrdu: 'غلام عباس',
    format: 'short_story',
    targetVocabFocus:
      'Urban illusion, Mall Road promenade, pretense vs tragic destitution, and devastating irony.',
    status: 'ready',
    levelThemeEnglish: 'Urban Observation & Irony',
    levelThemeUrdu: 'شہری مشاہدہ اور طنز و ظرافت',
    gradeLevelDescription: 'Grade 10 / Satire & Light Persianized Idiom',
    descriptionEnglish:
      'A suave young gentleman promenades down Lahore’s Mall Road until a hit-and-run exposes his reality.',
    sceneVocabPreview: ['اوور کوٹ', 'مال روڈ', 'خوش پوش', 'لاہور', 'مفلسی'],
  },
  {
    level: 5,
    subLevel: '5.3',
    id: 'katba',
    titleEnglish: 'Katba',
    titleUrdu: 'کتبہ',
    authorEnglish: 'Ghulam Abbas',
    authorUrdu: 'غلام عباس',
    format: 'short_story',
    targetVocabFocus:
      'Middle-class aspiration, lifetime deferred dreams, mortality, and quiet psychological resignation.',
    status: 'ready',
    levelThemeEnglish: 'Urban Observation & Irony',
    levelThemeUrdu: 'شہری مشاہدہ اور طنز و ظرافت',
    gradeLevelDescription: 'Grade 10 / Satire & Light Persianized Idiom',
    descriptionEnglish:
      'A clerk buys a polished marble nameplate for the home he dreams of building, which eventually becomes his gravestone.',
    sceneVocabPreview: ['سنگِ مرمر', 'کتبہ', 'خواب', 'ملازمت', 'موت'],
  },

  // =========================================================================
  // LEVEL 6: Social Hypocrisy & Bleak Realism (Grade 11 FSc / Biting Satire & Nihilism)
  // =========================================================================
  {
    level: 6,
    subLevel: '6.1',
    id: 'sifarish',
    titleEnglish: 'Sifarish',
    titleUrdu: 'سفارش',
    authorEnglish: 'Ahmad Nadeem Qasmi',
    authorUrdu: 'احمد ندیم قاسمی',
    format: 'short_story',
    targetVocabFocus:
      'Bureaucratic favoritism, rural helplessness, psychological devastation, and social paralysis.',
    status: 'ready',
    levelThemeEnglish: 'Social Hypocrisy & Bleak Realism',
    levelThemeUrdu: 'سماجی منافقت اور تلخ حقیقت نگاری',
    gradeLevelDescription: 'Grade 11 FSc / Biting Satire & Socio-Political Critique',
    descriptionEnglish:
      'An impoverished coachman pins his entire family’s survival on a false promise of bureaucratic favor.',
    sceneVocabPreview: ['سفارش', 'کوچوان', 'دفتر', 'امید', 'مایوسی'],
  },
  {
    level: 6,
    subLevel: '6.2',
    id: 'anandi',
    titleEnglish: 'Anandi',
    titleUrdu: 'آنندی',
    authorEnglish: 'Ghulam Abbas',
    authorUrdu: 'غلام عباس',
    format: 'short_story',
    targetVocabFocus:
      'Municipal hypocrisy, town planning satire, and the cyclic displacement of marginalized women.',
    status: 'ready',
    levelThemeEnglish: 'Social Hypocrisy & Bleak Realism',
    levelThemeUrdu: 'سماجی منافقت اور تلخ حقیقت نگاری',
    gradeLevelDescription: 'Grade 11 FSc / Biting Satire & Socio-Political Critique',
    descriptionEnglish:
      'A city council bans red-light courtesans to the barren outskirts, where a vibrant new metropolis sprouts around them.',
    sceneVocabPreview: ['بلدیہ', 'شہر', 'بازار', 'آبادی', 'منافقت'],
  },
  {
    level: 6,
    subLevel: '6.3',
    id: 'kafan',
    titleEnglish: 'Kafan',
    titleUrdu: 'کفن',
    authorEnglish: 'Munshi Premchand',
    authorUrdu: 'منشی پریم چند',
    format: 'short_story',
    targetVocabFocus:
      'Lethal cynicism, dehumanizing destitution, unsparing peasant realism, and moral numbness.',
    status: 'ready',
    levelThemeEnglish: 'Social Hypocrisy & Bleak Realism',
    levelThemeUrdu: 'سماجی منافقت اور تلخ حقیقت نگاری',
    gradeLevelDescription: 'Grade 11 FSc / Biting Satire & Socio-Political Critique',
    descriptionEnglish:
      'Ghisu and Madhav spend the shroud donation money on alcohol and fried fish while mourning Budhia.',
    sceneVocabPreview: ['کفن', 'شراب', 'مفلسی', 'لاش', 'بھوک'],
  },

  // =========================================================================
  // LEVEL 7: Accessible Manto & Pulp Thrillers (Grade 12 FSc / Psychological Trauma & Mad Science)
  // =========================================================================
  {
    level: 7,
    subLevel: '7.1',
    id: 'naya-qanoon',
    titleEnglish: 'Naya Qanoon',
    titleUrdu: 'نیا قانون',
    authorEnglish: 'Saadat Hasan Manto',
    authorUrdu: 'سعادت حسن منٹو',
    format: 'short_story',
    targetVocabFocus:
      'Political naivety, colonial Government of India Act 1935, and streetwise disillusionment.',
    status: 'ready',
    levelThemeEnglish: 'Accessible Manto & Pulp Thrillers',
    levelThemeUrdu: 'منٹو اور تجسس خیز ادب',
    gradeLevelDescription: 'Grade 12 FSc / Historical Trauma & Suspense',
    descriptionEnglish:
      'Ustad Mangu the tongawala eagerly anticipates the New Constitution of 1935, only to meet the same colonial baton.',
    sceneVocabPreview: ['تانگہ', 'گورا', 'قانون', 'انگریز', 'آزادی'],
  },
  {
    level: 7,
    subLevel: '7.2',
    id: 'khol-do',
    titleEnglish: 'Khol Do',
    titleUrdu: 'کھول دو',
    authorEnglish: 'Saadat Hasan Manto',
    authorUrdu: 'سعادت حسن منٹو',
    format: 'short_story',
    targetVocabFocus:
      'Partition trauma, refugee camp dehumanization, and conditioned bodily reflex of violence.',
    status: 'ready',
    levelThemeEnglish: 'Accessible Manto & Pulp Thrillers',
    levelThemeUrdu: 'منٹو اور تجسس خیز ادب',
    gradeLevelDescription: 'Grade 12 FSc / Historical Trauma & Suspense',
    descriptionEnglish:
      'Sirajuddin searches for his lost daughter Sakina amid the chaotic train convoys of 1947.',
    sceneVocabPreview: ['کیمپ', 'رضاکار', 'سکینہ', 'ڈاکٹر', 'کھڑکی'],
  },
  {
    level: 7,
    subLevel: '7.3',
    id: 'toba-tek-singh',
    titleEnglish: 'Toba Tek Singh',
    titleUrdu: 'ٹوبہ ٹیک سنگھ',
    authorEnglish: 'Saadat Hasan Manto',
    authorUrdu: 'سعادت حسن منٹو',
    format: 'short_story',
    targetVocabFocus:
      'Partition lunacy, border absurdity, existential displacement, and asylum alienation.',
    status: 'ready',
    levelThemeEnglish: 'Accessible Manto & Pulp Thrillers',
    levelThemeUrdu: 'منٹو اور تجسس خیز ادب',
    gradeLevelDescription: 'Grade 12 FSc / Historical Trauma & Suspense',
    descriptionEnglish:
      'Bishan Singh refuses to choose between India and Pakistan in the Lahore mental asylum exchange.',
    sceneVocabPreview: ['پاگل خانہ', 'بارڈر', 'تبادلہ', 'زمین', 'تار'],
  },
  {
    level: 7,
    subLevel: '7.4',
    id: 'khaufnak-imarat',
    titleEnglish: 'Khaufnak Imarat',
    titleUrdu: 'خوفناک عمارت',
    authorEnglish: 'Ibn-e-Safi',
    authorUrdu: 'ابنِ صفی',
    format: 'novella_arc',
    targetVocabFocus:
      'Pulp detective jargon, fast-paced dialogue, espionage pacing, and colloquial Urdu suspense.',
    status: 'ready',
    levelThemeEnglish: 'Accessible Manto & Pulp Thrillers',
    levelThemeUrdu: 'منٹو اور تجسس خیز ادب',
    gradeLevelDescription: 'Grade 12 FSc / Historical Trauma & Suspense',
    descriptionEnglish:
      'Colonel Faridi and Captain Hameed investigate a sinister mansion concealing mad science and criminal syndicates.',
    sceneVocabPreview: ['فریدی', 'حمید', 'جاسوس', 'عمارت', 'زہر'],
  },

  // =========================================================================
  // LEVEL 8: Deep Psychological Studies (Early College / Unflinching Character Dissections)
  // =========================================================================
  {
    level: 8,
    subLevel: '8.1',
    id: 'hathak',
    titleEnglish: 'Hathak',
    titleUrdu: 'ہتک',
    authorEnglish: 'Saadat Hasan Manto',
    authorUrdu: 'سعادت حسن منٹو',
    format: 'short_story',
    targetVocabFocus:
      'Rejection trauma, self-worth collapse, nocturnal urban psychology, and rebellion against humiliation.',
    status: 'ready',
    levelThemeEnglish: 'Deep Psychological Studies',
    levelThemeUrdu: 'گہرے نفسیاتی مطالعات',
    gradeLevelDescription: 'Early College / Unflinching Character Dissections',
    descriptionEnglish:
      'Saugandhi, a prostitute in Bombay, experiences an unbearable rejection that fractures her view of herself and men.',
    sceneVocabPreview: ['ہتک', 'سوگندھی', 'سیٹھ', 'شیشہ', 'غصہ'],
  },
  {
    level: 8,
    subLevel: '8.2',
    id: 'thanda-gosht',
    titleEnglish: 'Thanda Gosht',
    titleUrdu: 'ٹھنڈا گوشت',
    authorEnglish: 'Saadat Hasan Manto',
    authorUrdu: 'سعادت حسن منٹو',
    format: 'short_story',
    targetVocabFocus:
      'Visceral guilt, sexual impotence from communal atrocities, and primal psychological horror.',
    status: 'ready',
    levelThemeEnglish: 'Deep Psychological Studies',
    levelThemeUrdu: 'گہرے نفسیاتی مطالعات',
    gradeLevelDescription: 'Early College / Unflinching Character Dissections',
    descriptionEnglish:
      'Ishwar Singh returns home to Kulwant Kaur consumed by the horrifying realization of what he did during the riots.',
    sceneVocabPreview: ['گوشت', 'تلوار', 'خون', 'خوف', 'سردی'],
  },
  {
    level: 8,
    subLevel: '8.3',
    id: 'gadaria',
    titleEnglish: 'Gadaria',
    titleUrdu: 'گڈریا',
    authorEnglish: 'Ashfaq Ahmed',
    authorUrdu: 'اشفاق احمد',
    format: 'short_story',
    targetVocabFocus:
      'Sufic devotion, erudite mentor tragedy, communal betrayal, and Sanskrit/Arabic/Urdu scholastic synthesis.',
    status: 'ready',
    levelThemeEnglish: 'Deep Psychological Studies',
    levelThemeUrdu: 'گہرے نفسیاتی مطالعات',
    gradeLevelDescription: 'Early College / Unflinching Character Dissections',
    descriptionEnglish:
      'Dau Ji, a learned scholar of Persian and Sanskrit, tutors young Muslim boys before partition engulfs the village.',
    sceneVocabPreview: ['داؤ جی', 'استاد', 'فارسی', 'گڈریا', 'فسادات'],
  },

  // =========================================================================
  // LEVEL 9: Existential Novellas (Upper College / Atmospheric, Non-Preachy Novellas)
  // =========================================================================
  {
    level: 9,
    subLevel: '9.1',
    id: 'baagh',
    titleEnglish: 'Baagh',
    titleUrdu: 'باگھ',
    authorEnglish: 'Abdullah Hussein',
    authorUrdu: 'عبداللہ حسین',
    format: 'novella_arc',
    targetVocabFocus:
      'Forest solitude, psychological feral alienation, political metaphor, and existential drift.',
    status: 'ready',
    levelThemeEnglish: 'Existential Novellas',
    levelThemeUrdu: 'وجودیت پسند ناولٹ',
    gradeLevelDescription: 'Upper College / Atmospheric Novellas & Classical Prose',
    descriptionEnglish:
      'Curated opening arc: Asad retreats into the northern forests where the presence of a mysterious tiger mirrors his inner turmoil.',
    sceneVocabPreview: ['جنگل', 'باگھ', 'تنہائی', 'شکار', 'دریا'],
  },
  {
    level: 9,
    subLevel: '9.2',
    id: 'seemiya',
    titleEnglish: 'Seemiya',
    titleUrdu: 'سیمیا',
    authorEnglish: 'Naiyer Masud',
    authorUrdu: 'نیر مسعود',
    format: 'short_story',
    targetVocabFocus:
      'Oneiric Lucknow decay, occult illusion, uncanny sensory atmosphere, and hypnotic dream-like syntax.',
    status: 'ready',
    levelThemeEnglish: 'Existential Novellas',
    levelThemeUrdu: 'وجودیت پسند ناولٹ',
    gradeLevelDescription: 'Upper College / Atmospheric Novellas & Classical Prose',
    descriptionEnglish:
      'A masterclass in eerie, quiet Gothic realism where forgotten courtyards and optical illusions blend seamlessly.',
    sceneVocabPreview: ['حویلی', 'سیمیا', 'سایہ', 'طلسم', 'خواب'],
  },
  {
    level: 9,
    subLevel: '9.3',
    id: 'umrao-jan-ada',
    titleEnglish: 'Umrao Jan Ada',
    titleUrdu: 'امراؤ جان ادا',
    authorEnglish: 'Mirza Hadi Ruswa',
    authorUrdu: 'مرزا ہادی رسوا',
    format: 'novel_arc',
    targetVocabFocus:
      'Courtesan salon culture, 19th-century Awadh idioms, classical poetic high culture, and autobiographical voice.',
    status: 'ready',
    levelThemeEnglish: 'Existential Novellas',
    levelThemeUrdu: 'وجودیت پسند ناولٹ',
    gradeLevelDescription: 'Upper College / Atmospheric Novellas & Classical Prose',
    descriptionEnglish:
      'Opening chapters: Ameeran is kidnapped from Faizabad and brought to the cultural salons of Lucknow to become Umrao Jan.',
    sceneVocabPreview: ['لکھنؤ', 'طوائف', 'ساز', 'غزل', 'فیض آباد'],
  },

  // =========================================================================
  // LEVEL 10: Grand Philosophical Novels (Endgame Literary Masterpieces)
  // =========================================================================
  {
    level: 10,
    subLevel: '10.1',
    id: 'udaas-naslein',
    titleEnglish: 'Udaas Naslein',
    titleUrdu: 'اداس نسلیں',
    authorEnglish: 'Abdullah Hussein',
    authorUrdu: 'عبداللہ حسین',
    format: 'novel_arc',
    targetVocabFocus:
      'Historical sweep, WW1 European trenches to Partition, intergenerational trauma, and monumental prose rhythm.',
    status: 'ready',
    levelThemeEnglish: 'Grand Philosophical Novels',
    levelThemeUrdu: 'عظیم فلسفیانہ شاہکار',
    gradeLevelDescription: 'Endgame / Magnum Opus Literary Masterpieces',
    descriptionEnglish:
      'The seminal Urdu epic novel chronicling Naim and Azra through war, revolutionary upheaval, and independence.',
    sceneVocabPreview: ['نسلیں', 'جنگ', 'خندق', 'انقلاب', 'جدائی'],
  },
  {
    level: 10,
    subLevel: '10.2',
    id: 'ghulam-bagh',
    titleEnglish: 'Ghulam Bagh',
    titleUrdu: 'غلام باغ',
    authorEnglish: 'Mirza Athar Baig',
    authorUrdu: 'مرزا اطہر بیگ',
    format: 'novel_arc',
    targetVocabFocus:
      'Postmodern philosophical Urdu, existential dread, linguistic experimentation, and labyrinthine narratives.',
    status: 'ready',
    levelThemeEnglish: 'Grand Philosophical Novels',
    levelThemeUrdu: 'عظیم فلسفیانہ شاہکار',
    gradeLevelDescription: 'Endgame / Magnum Opus Literary Masterpieces',
    descriptionEnglish:
      'Mirza Athar Baig’s cult philosophical masterpiece exploring memory, archaeological excavations, and the limits of the human mind.',
    sceneVocabPreview: ['فلسفہ', 'باغ', 'کھنڈر', 'وہم', 'تاریخ'],
  },
];

// Grouping helper by integer Level (1 through 10)
export function getCurriculumByLevel(): Record<number, CurriculumEntry[]> {
  const map: Record<number, CurriculumEntry[]> = {};
  for (let i = 1; i <= 10; i++) {
    map[i] = [];
  }
  for (const entry of CURRICULUM_REGISTRY) {
    if (!map[entry.level]) map[entry.level] = [];
    map[entry.level].push(entry);
  }
  return map;
}

export function getCurriculumEntry(slug: string): CurriculumEntry | undefined {
  return CURRICULUM_REGISTRY.find((e) => e.id === slug);
}

export function isCurriculumReady(slug: string): boolean {
  const entry = getCurriculumEntry(slug);
  return entry?.status === 'ready';
}
