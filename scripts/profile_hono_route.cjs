const { performance } = require('perf_hooks');
const { api } = require('../src/server/api');

async function profileHono(slug, page) {
  const req = new Request(`http://localhost/stories/${slug}?page=${page}&pageSize=4`);
  const t0 = performance.now();
  const res = await api.fetch(req);
  const t1 = performance.now();
  const body = await res.json();
  const t2 = performance.now();

  console.log(`[Hono ${slug} Page ${page}] api.fetch: ${(t1 - t0).toFixed(2)}ms | res.json: ${(t2 - t1).toFixed(2)}ms | total: ${(t2 - t0).toFixed(2)}ms`);
}

async function main() {
  console.log('--- Profiling Hono Handler Directly in Process ---');
  await profileHono('idgah', 1);
  await profileHono('idgah', 2);
  await profileHono('baagh', 1);
  await profileHono('hathak', 1);
}

main();
