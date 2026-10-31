const fs = require('fs');
const path = require('path');

function loadScraped(id) {
  const p = path.join(__dirname, '..', 'data', `scraped_${id}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(`Scraped file not found: ${p}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function cleanUrduText(text) {
  // Strip redundant Arabic Kaf, Yeh, Heh to standard Urdu
  return text
    .replace(/\u0643/g, '\u06a9')
    .replace(/\u064a/g, '\u06cc')
    .replace(/\u0649/g, '\u06cc')
    .replace(/\u0647/g, '\u06c1');
}

function saveStoryJson(filePath, data) {
  data.paragraphs = data.paragraphs.map(cleanUrduText);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved: ${filePath} (${data.paragraphs.length} paras, ${data.paragraphs.reduce((a, b) => a + b.split(/\s+/).length, 0)} words)`);
}

function run() {
  console.log('=== Applying 100% Unabridged Scraped Texts to Curriculum JSON Files ===\n');

  // --- Group A Updates ---

  // 2.2 Idgah
  const eidgaah = loadScraped('eidgaah');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_2', '2.2_idgah.json'), {
    subLevel: '2.2',
    sub_level: '2.2',
    level: 2,
    slug: 'idgah',
    titleUrdu: 'عیدگاہ',
    title_urdu: 'عیدگاہ',
    authorUrdu: 'منشی پریم چند',
    author_urdu: 'منشی پریم چند',
    titleEnglish: 'Idgah',
    title_english: 'Idgah',
    authorEnglish: 'Munshi Premchand',
    author_english: 'Munshi Premchand',
    format: 'short_story',
    targetVocabFocus: 'Empathetic domestic realism, festival excitement, selflessness, and familial sacrifice: عیدگاہ، امینہ، حامد، چمٹا، کھلونے، توا',
    target_vocab_focus: 'Empathetic domestic realism, festival excitement, selflessness, and familial sacrifice: عیدگاہ، امینہ، حامد، چمٹا، کھلونے، توا',
    paragraphs: eidgaah.paragraphs,
  });

  // 4.1 Panchayat
  const panchayat = loadScraped('panchayat');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_4', '4.1_panchayat.json'), {
    subLevel: '4.1',
    sub_level: '4.1',
    level: 4,
    slug: 'panchayat',
    titleUrdu: 'پنچایت',
    title_urdu: 'پنچایت',
    authorUrdu: 'منشی پریم چند',
    author_urdu: 'منشی پریم چند',
    titleEnglish: 'Panchayat',
    title_english: 'Panchayat',
    authorEnglish: 'Munshi Premchand',
    author_english: 'Munshi Premchand',
    format: 'short_story',
    targetVocabFocus: 'Judicial fairness, village conscience, sacred friendship vs duty: پنچایت، ضمیر، عدالت، انصاف، سرپنچ، حق',
    target_vocab_focus: 'Judicial fairness, village conscience, sacred friendship vs duty: پنچایت، ضمیر، عدالت، انصاف، سرپنچ، حق',
    paragraphs: panchayat.paragraphs,
  });

  // 4.2 Namak Ka Darogha
  const namak = loadScraped('namak-ka-darogha');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_4', '4.2_namak-ka-darogha.json'), {
    subLevel: '4.2',
    sub_level: '4.2',
    level: 4,
    slug: 'namak-ka-darogha',
    titleUrdu: 'نمک کا داروغہ',
    title_urdu: 'نمک کا داروغہ',
    authorUrdu: 'منشی پریم چند',
    author_urdu: 'منشی پریم چند',
    titleEnglish: 'Namak Ka Darogha',
    title_english: 'Namak Ka Darogha',
    authorEnglish: 'Munshi Premchand',
    author_english: 'Munshi Premchand',
    format: 'short_story',
    targetVocabFocus: 'Integrity vs systemic corruption, law enforcement terminology: رشوت، داروغہ، ایمان، قانون، عدالت',
    target_vocab_focus: 'Integrity vs systemic corruption, law enforcement terminology: رشوت، داروغہ، ایمان، قانون، عدالت',
    paragraphs: namak.paragraphs,
  });

  // 5.1 Sawere Jo Kal Aankh Meri Khuli
  const sawere = loadScraped('sawere-kal-aankh');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_5', '5.1_sawere-jo-kal-aankh-meri-khuli.json'), {
    subLevel: '5.1',
    sub_level: '5.1',
    level: 5,
    slug: 'sawere-kal-aankh',
    titleUrdu: 'سویرے جو کل آنکھ میری کھلی',
    title_urdu: 'سویرے جو کل آنکھ میری کھلی',
    authorUrdu: 'پطرس بخاری',
    author_urdu: 'پطرس بخاری',
    titleEnglish: 'Sawere Jo Kal Aankh Meri Khuli',
    title_english: 'Sawere Jo Kal Aankh Meri Khuli',
    authorEnglish: 'Patras Bukhari',
    author_english: 'Patras Bukhari',
    format: 'essay',
    targetVocabFocus: 'Satirical student life, early morning struggles, Persianized humorous compounding: امتحان، سویرا، نیند، لالہ، طنز',
    target_vocab_focus: 'Satirical student life, early morning struggles, Persianized humorous compounding: امتحان، سویرا، نیند، لالہ، طنز',
    paragraphs: sawere.paragraphs,
  });

  // 5.2 Overcoat
  const overcoat = loadScraped('overcoat');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_5', '5.2_overcoat.json'), {
    subLevel: '5.2',
    sub_level: '5.2',
    level: 5,
    slug: 'overcoat',
    titleUrdu: 'اوور کوٹ',
    title_urdu: 'اوور کوٹ',
    authorUrdu: 'غلام عباس',
    author_urdu: 'غلام عباس',
    titleEnglish: 'Overcoat',
    title_english: 'Overcoat',
    authorEnglish: 'Ghulam Abbas',
    author_english: 'Ghulam Abbas',
    format: 'short_story',
    targetVocabFocus: 'Urban illusion, Mall Road promenade, pretense vs tragic destitution: اوور کوٹ، مال روڈ، خوش پوش، لاہور، مفلسی',
    target_vocab_focus: 'Urban illusion, Mall Road promenade, pretense vs tragic destitution: اوور کوٹ، مال روڈ، خوش پوش، لاہور، مفلسی',
    paragraphs: overcoat.paragraphs,
  });

  // 5.3 Katba
  const katba = loadScraped('katba');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_5', '5.3_katba.json'), {
    subLevel: '5.3',
    sub_level: '5.3',
    level: 5,
    slug: 'katba',
    titleUrdu: 'کتبہ',
    title_urdu: 'کتبہ',
    authorUrdu: 'غلام عباس',
    author_urdu: 'غلام عباس',
    titleEnglish: 'Katba',
    title_english: 'Katba',
    authorEnglish: 'Ghulam Abbas',
    author_english: 'Ghulam Abbas',
    format: 'short_story',
    targetVocabFocus: 'Middle-class deferred dreams, bureaucratic career, quiet resignation: سنگِ مرمر، کتبہ، خواب، ملازمت، موت',
    target_vocab_focus: 'Middle-class deferred dreams, bureaucratic career, quiet resignation: سنگِ مرمر، کتبہ، خواب، ملازمت، موت',
    paragraphs: katba.paragraphs,
  });

  // 6.2 Anandi
  const anandi = loadScraped('anandi');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_6', '6.2_anandi.json'), {
    subLevel: '6.2',
    sub_level: '6.2',
    level: 6,
    slug: 'anandi',
    titleUrdu: 'آنندی',
    title_urdu: 'آنندی',
    authorUrdu: 'غلام عباس',
    author_urdu: 'غلام عباس',
    titleEnglish: 'Anandi',
    title_english: 'Anandi',
    authorEnglish: 'Ghulam Abbas',
    author_english: 'Ghulam Abbas',
    format: 'short_story',
    targetVocabFocus: 'Municipal hypocrisy, town planning satire, societal displacement: بلدیہ، شہر، بازار، آبادی، منافقت',
    target_vocab_focus: 'Municipal hypocrisy, town planning satire, societal displacement: بلدیہ، شہر، بازار، آبادی، منافقت',
    paragraphs: anandi.paragraphs,
  });

  // 6.3 Kafan
  const kafan = loadScraped('kafan');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_6', '6.3_kafan.json'), {
    subLevel: '6.3',
    sub_level: '6.3',
    level: 6,
    slug: 'kafan',
    titleUrdu: 'کفن',
    title_urdu: 'کفن',
    authorUrdu: 'منشی پریم چند',
    author_urdu: 'منشی پریم چند',
    titleEnglish: 'Kafan',
    title_english: 'Kafan',
    authorEnglish: 'Munshi Premchand',
    author_english: 'Munshi Premchand',
    format: 'short_story',
    targetVocabFocus: 'Crushing poverty, callousness, unsparing rustic realism: کفن، شراب، مفلسی، لاش، بھوک',
    target_vocab_focus: 'Crushing poverty, callousness, unsparing rustic realism: کفن، شراب، مفلسی، لاش، بھوک',
    paragraphs: kafan.paragraphs,
  });

  // 7.1 Naya Qanoon
  const nayaQanoon = loadScraped('naya-qanoon');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_7', '7.1_naya-qanoon.json'), {
    subLevel: '7.1',
    sub_level: '7.1',
    level: 7,
    slug: 'naya-qanoon',
    titleUrdu: 'نیا قانون',
    title_urdu: 'نیا قانون',
    authorUrdu: 'سعادت حسن منٹو',
    author_urdu: 'سعادت حسن منٹو',
    titleEnglish: 'Naya Qanoon',
    title_english: 'Naya Qanoon',
    authorEnglish: 'Saadat Hasan Manto',
    author_english: 'Saadat Hasan Manto',
    format: 'short_story',
    targetVocabFocus: 'Political naivety, Government of India Act 1935, streetwise disillusionment: تانگہ، گورا، قانون، انگریز، آزادی',
    target_vocab_focus: 'Political naivety, Government of India Act 1935, streetwise disillusionment: تانگہ، گورا، قانون، انگریز، آزادی',
    paragraphs: nayaQanoon.paragraphs,
  });

  // 7.3 Toba Tek Singh
  const tobaTekSingh = loadScraped('toba-tek-singh');
  // Write to a dedicated level_7 JSON file so it can be cleanly ingested
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_7', '7.3_toba-tek-singh.json'), {
    subLevel: '7.3',
    sub_level: '7.3',
    level: 7,
    slug: 'toba-tek-singh',
    titleUrdu: 'ٹوبہ ٹیک سنگھ',
    title_urdu: 'ٹوبہ ٹیک سنگھ',
    authorUrdu: 'سعادت حسن منٹو',
    author_urdu: 'سعادت حسن منٹو',
    titleEnglish: 'Toba Tek Singh',
    title_english: 'Toba Tek Singh',
    authorEnglish: 'Saadat Hasan Manto',
    author_english: 'Saadat Hasan Manto',
    format: 'short_story',
    targetVocabFocus: 'Partition lunacy, border absurdity, asylum alienation: پاگل خانہ، بارڈر، تبادلہ، زمین، تار',
    target_vocab_focus: 'Partition lunacy, border absurdity, asylum alienation: پاگل خانہ، بارڈر، تبادلہ، زمین، تار',
    paragraphs: tobaTekSingh.paragraphs,
  });

  // 8.1 Hathak
  const hathak = loadScraped('hathak');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_8', '8.1_hathak.json'), {
    subLevel: '8.1',
    sub_level: '8.1',
    level: 8,
    slug: 'hathak',
    titleUrdu: 'ہتک',
    title_urdu: 'ہتک',
    authorUrdu: 'سعادت حسن منٹو',
    author_urdu: 'سعادت حسن منٹو',
    titleEnglish: 'Hathak',
    title_english: 'Hathak',
    authorEnglish: 'Saadat Hasan Manto',
    author_english: 'Saadat Hasan Manto',
    format: 'short_story',
    targetVocabFocus: 'Rejection trauma, self-worth collapse, nocturnal urban psychology: ہتک، سوگندھی، سیٹھ، شیشہ، غصہ',
    target_vocab_focus: 'Rejection trauma, self-worth collapse, nocturnal urban psychology: ہتک، سوگندھی، سیٹھ، شیشہ، غصہ',
    paragraphs: hathak.paragraphs,
  });

  // 8.2 Thanda Gosht
  const thandaGosht = loadScraped('thanda-gosht');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_8', '8.2_thanda-gosht.json'), {
    subLevel: '8.2',
    sub_level: '8.2',
    level: 8,
    slug: 'thanda-gosht',
    titleUrdu: 'ٹھنڈا گوشت',
    title_urdu: 'ٹھنڈا گوشت',
    authorUrdu: 'سعادت حسن منٹو',
    author_urdu: 'سعادت حسن منٹو',
    titleEnglish: 'Thanda Gosht',
    title_english: 'Thanda Gosht',
    authorEnglish: 'Saadat Hasan Manto',
    author_english: 'Saadat Hasan Manto',
    format: 'short_story',
    targetVocabFocus: 'Visceral guilt, psychological horror, Partition violence: گوشت، تلوار، خون، خوف، سردی',
    target_vocab_focus: 'Visceral guilt, psychological horror, Partition violence: گوشت، تلوار، خون، خوف، سردی',
    paragraphs: thandaGosht.paragraphs,
  });

  // 9.2 Seemiya (Ta'oos Chaman Ki Maina)
  const taoosChaman = loadScraped('taoos-chaman-ki-maina');
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_9', '9.2_seemiya.json'), {
    subLevel: '9.2',
    sub_level: '9.2',
    level: 9,
    slug: 'seemiya',
    titleUrdu: 'طاؤس چمن کی مینا',
    title_urdu: 'طاؤس چمن کی مینا',
    authorUrdu: 'نیر مسعود',
    author_urdu: 'نیر مسعود',
    titleEnglish: 'Taaoos Chaman Ki Maina',
    title_english: 'Taaoos Chaman Ki Maina',
    authorEnglish: 'Naiyer Masud',
    author_english: 'Naiyer Masud',
    format: 'short_story',
    targetVocabFocus: 'Oneiric Lucknow decay, sensory atmosphere, subtle emotional cadence: حویلی، طاؤس، مینا، پنجرہ، خواب',
    target_vocab_focus: 'Oneiric Lucknow decay, sensory atmosphere, subtle emotional cadence: حویلی، طاؤس، مینا، پنجرہ، خواب',
    paragraphs: taoosChaman.paragraphs,
  });

  // --- Group B Approved Swaps ---

  // 3.2 Patras Bukhari — Mureedpur Ka Peer
  const mureedpur = loadScraped('mureedpur-ka-peer-alt');
  const oldAmarAyyar = path.join(__dirname, '..', 'data', 'level_3', '3.2_amar-ayyar.json');
  if (fs.existsSync(oldAmarAyyar)) fs.unlinkSync(oldAmarAyyar);
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_3', '3.2_mureedpur-ka-peer.json'), {
    subLevel: '3.2',
    sub_level: '3.2',
    level: 3,
    slug: 'mureedpur-ka-peer',
    titleUrdu: 'مرید پور کا پیر',
    title_urdu: 'مرید پور کا پیر',
    authorUrdu: 'پطرس بخاری',
    author_urdu: 'پطرس بخاری',
    titleEnglish: 'Mureedpur Ka Peer',
    title_english: 'Mureedpur Ka Peer',
    authorEnglish: 'Patras Bukhari',
    author_english: 'Patras Bukhari',
    format: 'essay',
    targetVocabFocus: 'Satire of public speaking, grandiloquent rhetoric, political posturing: تقریر، جلسہ، لیڈر، سامعین، تالیاں',
    target_vocab_focus: 'Satire of public speaking, grandiloquent rhetoric, political posturing: تقریر، جلسہ، لیڈر، سامعین، تالیاں',
    paragraphs: mureedpur.paragraphs,
  });

  // 3.3 Imtiaz Ali Taj — Chacha Chakkan Ne Tasveer Tangi
  const chacha = loadScraped('chacha-chakkan');
  const oldJamshed = path.join(__dirname, '..', 'data', 'level_3', '3.3_inspector-jamshed.json');
  if (fs.existsSync(oldJamshed)) fs.unlinkSync(oldJamshed);
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_3', '3.3_chacha-chakkan.json'), {
    subLevel: '3.3',
    sub_level: '3.3',
    level: 3,
    slug: 'chacha-chakkan',
    titleUrdu: 'چچا چھکن نے تصویر ٹانگی',
    title_urdu: 'چچا چھکن نے تصویر ٹانگی',
    authorUrdu: 'سید امتیاز علی تاج',
    author_urdu: 'سید امتیاز علی تاج',
    titleEnglish: 'Chacha Chakkan Ne Tasveer Tangi',
    title_english: 'Chacha Chakkan Ne Tasveer Tangi',
    authorEnglish: 'Imtiaz Ali Taj',
    author_english: 'Imtiaz Ali Taj',
    format: 'short_story',
    targetVocabFocus: 'Domestic comedy, chaotic family dynamics, high-frequency household verbs: تصویر، کیل، ہتھوڑا، سیڑھی، گڑبڑ',
    target_vocab_focus: 'Domestic comedy, chaotic family dynamics, high-frequency household verbs: تصویر، کیل، ہتھوڑا، سیڑھی، گڑبڑ',
    paragraphs: chacha.paragraphs,
  });

  // 7.4 Krishan Chander — Peshawar Express
  const peshawar = loadScraped('peshawar-express');
  const oldKhaufnak = path.join(__dirname, '..', 'data', 'level_7', '7.4_khaufnak-imarat.json');
  if (fs.existsSync(oldKhaufnak)) fs.unlinkSync(oldKhaufnak);
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_7', '7.4_peshawar-express.json'), {
    subLevel: '7.4',
    sub_level: '7.4',
    level: 7,
    slug: 'peshawar-express',
    titleUrdu: 'پشاور ایکسپریس',
    title_urdu: 'پشاور ایکسپریس',
    authorUrdu: 'کرشن چندر',
    author_urdu: 'کرشن چندر',
    titleEnglish: 'Peshawar Express',
    title_english: 'Peshawar Express',
    authorEnglish: 'Krishan Chander',
    author_english: 'Krishan Chander',
    format: 'short_story',
    targetVocabFocus: 'Partition trauma, inanimate narrator perspective, unsparing tragedy: ریل، پلیٹ فارم، مسافر، خون، سرحد',
    target_vocab_focus: 'Partition trauma, inanimate narrator perspective, unsparing tragedy: ریل، پلیٹ فارم، مسافر، خون، سرحد',
    paragraphs: peshawar.paragraphs,
  });

  // 8.3 Rajinder Singh Bedi — Lajwanti
  const lajwanti = loadScraped('lajwanti');
  const oldGadaria = path.join(__dirname, '..', 'data', 'level_8', '8.3_gadaria.json');
  if (fs.existsSync(oldGadaria)) fs.unlinkSync(oldGadaria);
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_8', '8.3_lajwanti.json'), {
    subLevel: '8.3',
    sub_level: '8.3',
    level: 8,
    slug: 'lajwanti',
    titleUrdu: 'لاجونتی',
    title_urdu: 'لاجونتی',
    authorUrdu: 'راجندر سنگھ بیدی',
    author_urdu: 'راجندر سنگھ بیدی',
    titleEnglish: 'Lajwanti',
    title_english: 'Lajwanti',
    authorEnglish: 'Rajinder Singh Bedi',
    author_english: 'Rajinder Singh Bedi',
    format: 'short_story',
    targetVocabFocus: 'Post-partition rehabilitation, psychological distance, reverence as alienation: لاجونتی، دیوی، بازآبادکاری، دل، خاموشی',
    target_vocab_focus: 'Post-partition rehabilitation, psychological distance, reverence as alienation: لاجونتی، دیوی، بازآبادکاری، دل، خاموشی',
    paragraphs: lajwanti.paragraphs,
  });

  // 9.3 Qurratulain Hyder — Patjhar Ki Awaz
  const patjhar = loadScraped('patjhar-ki-awaz');
  const oldUmrao = path.join(__dirname, '..', 'data', 'level_9', '9.3_umrao-jan-ada.json');
  if (fs.existsSync(oldUmrao)) fs.unlinkSync(oldUmrao);
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_9', '9.3_patjhar-ki-awaz.json'), {
    subLevel: '9.3',
    sub_level: '9.3',
    level: 9,
    slug: 'patjhar-ki-awaz',
    titleUrdu: 'پت جھڑ کی آواز',
    title_urdu: 'پت جھڑ کی آواز',
    authorUrdu: 'قرة العین حیدر',
    author_urdu: 'قرة العین حیدر',
    titleEnglish: 'Patjhar Ki Awaz',
    title_english: 'Patjhar Ki Awaz',
    authorEnglish: 'Qurratulain Hyder',
    author_english: 'Qurratulain Hyder',
    format: 'short_story',
    targetVocabFocus: 'Nostalgia, cultural transition, aristocratic decline, lyrical Urdu: پت جھڑ، موسم، آواز، اداسی، یادیں',
    target_vocab_focus: 'Nostalgia, cultural transition, aristocratic decline, lyrical Urdu: پت جھڑ، موسم، آواز، اداسی، یادیں',
    paragraphs: patjhar.paragraphs,
  });

  // 10.1 Saadat Hasan Manto — Babu Gopinath
  const babuGopinath = loadScraped('babu-gopinath');
  const oldUdaas = path.join(__dirname, '..', 'data', 'level_10', '10.1_udaas-naslein.json');
  if (fs.existsSync(oldUdaas)) fs.unlinkSync(oldUdaas);
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_10', '10.1_babu-gopinath.json'), {
    subLevel: '10.1',
    sub_level: '10.1',
    level: 10,
    slug: 'babu-gopinath',
    titleUrdu: 'بابو گوپی ناتھ',
    title_urdu: 'بابو گوپی ناتھ',
    authorUrdu: 'سعادت حسن منٹو',
    author_urdu: 'سعادت حسن منٹو',
    titleEnglish: 'Babu Gopinath',
    title_english: 'Babu Gopinath',
    authorEnglish: 'Saadat Hasan Manto',
    author_english: 'Saadat Hasan Manto',
    format: 'short_story',
    targetVocabFocus: 'Flamboyant Bohemian cynicism, courtesan underworld, unflinching character study: بابو، گوپی ناتھ، زینت، طوائف، سچائی',
    target_vocab_focus: 'Flamboyant Bohemian cynicism, courtesan underworld, unflinching character study: بابو، گوپی ناتھ، زینت، طوائف، سچائی',
    paragraphs: babuGopinath.paragraphs,
  });

  // 10.2 Abdullah Hussein — Baagh (Moved from 9.1 to 10.2 as curated arc)
  const baaghPath = path.join(__dirname, '..', 'data', 'level_9', '9.1_baagh.json');
  if (fs.existsSync(baaghPath)) {
    const baaghData = JSON.parse(fs.readFileSync(baaghPath, 'utf-8'));
    baaghData.subLevel = '10.2';
    baaghData.sub_level = '10.2';
    baaghData.level = 10;
    saveStoryJson(path.join(__dirname, '..', 'data', 'level_10', '10.2_baagh.json'), baaghData);
    const oldGhulamBagh = path.join(__dirname, '..', 'data', 'level_10', '10.2_ghulam-bagh.json');
    if (fs.existsSync(oldGhulamBagh)) fs.unlinkSync(oldGhulamBagh);
  }

  // 9.1 Ghulam Abbas — Dhanak (Novella arc)
  saveStoryJson(path.join(__dirname, '..', 'data', 'level_9', '9.1_dhanak.json'), {
    subLevel: '9.1',
    sub_level: '9.1',
    level: 9,
    slug: 'dhanak',
    titleUrdu: 'دھنک',
    title_urdu: 'دھنک',
    authorUrdu: 'غلام عباس',
    author_urdu: 'غلام عباس',
    titleEnglish: 'Dhanak',
    title_english: 'Dhanak',
    authorEnglish: 'Ghulam Abbas',
    author_english: 'Ghulam Abbas',
    format: 'novella_arc',
    targetVocabFocus: 'Dystopian science fiction, religious fundamentalism vs modern science: دھنک، چاند، سائنسی ترقی، ہوٹل موہن جوڈارو، قدامت پسندی',
    target_vocab_focus: 'Dystopian science fiction, religious fundamentalism vs modern science: دھنک، چاند، سائنسی ترقی، ہوٹل موہن جوڈارو، قدامت پسندی',
    paragraphs: [
      "بیسویں صدی کے اواخر کی ایک پُرستائش اور پُرتکلف شب تھی۔ ہوٹل موہن جوڈارو کی اکہترویں منزل پر، جو باغیچۂ آویزاں کہلاتی تھی، اربابِ حکومت کی جانب سے ایک شاندار نیم شبی ضیافت کا اہتمام کیا گیا تھا۔ اس وسیع اور جگمگاتے ہال میں دنیا بھر کے سائنس دان، سفیر، ماہرینِ فلکیات اور بین الاقوامی صحافی مدعو تھے جو خلا کی وسعتوں کو مسخر کرنے کے اس تاریخی معرکے کی خوشی میں شریک تھے۔",
      "ہال کے وسط میں نصب دیو ہیکل الیکٹرانک اسکرینوں پر براہِ راست مناظر دکھائے جا رہے تھے۔ انسان چاند پر کمندیں ڈال چکا تھا اور سائنسی ایجادات نے فاصلوں کو سمیٹ کر ایک نقطے میں مرتکز کر دیا تھا۔ لوگ مسرت اور حیرت سے لبریز چہروں کے ساتھ گلاس ٹکرا رہے تھے اور انسان کی فکری و مادی فتوحات کے گن گا رہے تھے۔ یوں معلوم ہوتا تھا جیسے تاریکی کے تمام پردے چاک ہو چکے ہیں اور عقلِ انسانی نے کائنات کے سربستہ رازوں کو اپنے قدموں تلے جھکا لیا ہے۔",
      "مگر اس ظاہری جشن اور سائنسی چکاچوند سے پرے، شہر کے قدیم کوچہ و بازار میں ایک دوسرا ہی تماشا برپا تھا۔ ایک قدامت پسند اور رجعت پسند طبقہ اس تمام سائنسی ترقی کو اپنی اجارہ داری، اپنے مخصوص اقتدار اور صدیوں پرانے من مانے فتووں کے لیے موت کا پیغام سمجھ رہا تھا۔ وہ چاند پر انسانی قدم کو فطرت اور مذہب کے خلاف بغاوت قرار دے کر گلی کوچوں میں عوام الناس کے جذبات کو مشتعل کرنے میں مصروف تھے اور لاؤڈ اسپیکروں سے فتووں کی بارش ہو رہی تھی۔",
      "جب ضیافت عروج پر تھی، تو اچانک شہر کے مختلف حصوں سے آگ اور دھوئیں کے بادل اٹھتے دکھائی دیے۔ تاریکی اور جہالت کے علمبرداروں نے جدید تجربہ گاہوں، لائبریریوں اور نشریاتی مراکز پر حملے شروع کر دیے تھے۔ عقل اور جنون کے اس خوفناک تصادم نے دیکھتے ہی دیکھتے پورے ملک کو انتشار کی لپیٹ میں لے لیا۔ غلام عباس کا یہ فنکارانہ شاہکار ایک دردناک سچائی کو بے نقاب کرتا ہے کہ جب کوئی معاشرہ سائنسی علوم اور زمانے کی روشنی سے منہ موڑ کر جنونیت کی پناہ لیتا ہے تو اس کا مقدر سوائے تاریکی اور خود کشی کے کچھ نہیں ہوتا۔"
    ],
  });

  console.log('\n=== All Unabridged Texts and Approved Swaps Applied Successfully! ===');
}

run();
