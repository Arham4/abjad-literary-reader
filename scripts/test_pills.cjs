const { vocalizeUrduWord, makePhoneticBreakdown } = require('./src/lib/abjad/packs/urduVocalizer.ts');

const testWords = ['پیسوں', 'پیسے', 'کھلونے', 'توے', 'جھونپڑی', 'چمٹا', 'چمٹے', 'دوڑ', 'لوگ'];
for (const w of testWords) {
  const voc = vocalizeUrduWord(w);
  const pills = makePhoneticBreakdown(voc);
  console.log(`Word: ${w} -> Vocalized: ${voc}`);
  console.log('Pills:', JSON.stringify(pills));
}
