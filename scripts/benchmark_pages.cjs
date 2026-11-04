const { performance } = require('perf_hooks');

async function testStory(slug, page) {
  const start = performance.now();
  const res = await fetch(`http://localhost:4000/api/stories/${slug}?page=${page}&pageSize=4`);
  const json = await res.json();
  const elapsed = (performance.now() - start).toFixed(2);
  const tokenCount = json.data?.tokens?.length || 0;
  const analysisCount = Object.keys(json.data?.analyses || {}).length;
  const payloadSizeKB = (JSON.stringify(json).length / 1024).toFixed(1);
  console.log(`[${slug} Page ${page}] -> ${elapsed}ms | tokens: ${tokenCount} | analyses: ${analysisCount} | payload: ${payloadSizeKB} KB`);
  return { elapsed: parseFloat(elapsed), payloadSizeKB: parseFloat(payloadSizeKB) };
}

async function run() {
  console.log('--- Benchmarking Page Loading Performance ---');
  await testStory('sheikh-chilli', 1);
  await testStory('idgah', 1);
  await testStory('idgah', 5);
  await testStory('idgah', 10);
  await testStory('hathak', 1);
  await testStory('hathak', 10);
  await testStory('seemiya', 1);
  await testStory('seemiya', 15);
  await testStory('baagh', 1);
  await testStory('baagh', 10);
}

run();
