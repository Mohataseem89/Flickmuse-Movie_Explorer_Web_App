import assert from "node:assert/strict";
import test, { beforeEach, mock } from "node:test";
import { freshTtlFor, handleTmdbRequest, resetProxyState } from "../server/tmdbProxy.js";

function installFakeCache() {
  const store = new Map();
  globalThis.caches = {
    default: {
      match: async (req) => store.get(req.url)?.clone(),
      put: async (req, res) => { store.set(req.url, res.clone()); },
    },
  };
  return store;
}

function fakeKv() {
  const data = new Map();
  return {
    data,
    get: async (key) => (data.has(key) ? JSON.parse(data.get(key)) : null),
    put: async (key, value) => { data.set(key, value); },
  };
}

const ctx = () => { const jobs = []; return { waitUntil: (p) => jobs.push(p), flush: () => Promise.all(jobs) }; };
const baseEnv = { TMDB_API_KEY: "secret-key" };
const call = (qs, env = baseEnv, c = ctx()) => handleTmdbRequest(new Request("https://flickmuse.test/api/tmdb?" + qs), env, c);

beforeEach(() => { resetProxyState(); mock.timers.reset(); });

test("TTLs match how often each dataset changes", () => {
  assert.equal(freshTtlFor("/genre/movie/list"), 7 * 86400);
  assert.equal(freshTtlFor("/trending/movie/week"), 3600);
  assert.equal(freshTtlFor("/movie/popular"), 6 * 3600);
  assert.equal(freshTtlFor("/discover/movie"), 3 * 3600);
  assert.equal(freshTtlFor("/search/movie"), 600);
  assert.equal(freshTtlFor("/movie/603"), 12 * 3600);
  assert.equal(freshTtlFor("/person/287"), 86400);
});

test("simultaneous identical requests share ONE TMDb call", async () => {
  installFakeCache();
  let upstream = 0;
  globalThis.fetch = async () => { upstream++; await new Promise((r) => setTimeout(r, 20)); return Response.json({ results: [1] }); };
  const responses = await Promise.all(Array.from({ length: 8 }, () => call("path=/movie/popular&page=1")));
  assert.equal(upstream, 1);
  assert.ok(responses.every((r) => r.status === 200));
});

test("different page / language / region / filters never collide", async () => {
  installFakeCache();
  const seen = [];
  globalThis.fetch = async (url) => { seen.push(new URL(url).searchParams.toString()); return Response.json({ n: seen.length }); };
  const queries = [
    "path=/movie/popular&page=1", "path=/movie/popular&page=2",
    "path=/movie/popular&page=1&language=fr-FR",
    "path=/discover/movie&with_genres=35", "path=/discover/movie&with_genres=53",
    "path=/discover/movie&with_genres=35&region=IN",
  ];
  for (const q of queries) { const c = ctx(); await call(q, baseEnv, c); await c.flush(); }
  assert.equal(seen.length, queries.length);
  // and a repeat of each is now a cache hit
  for (const q of queries) assert.equal((await call(q)).headers.get("X-FlickMuse-Cache"), "HIT");
  assert.equal(seen.length, queries.length);
});

test("expired entry is served (STALE) when TMDb answers 429, and no error reaches the visitor", async () => {
  installFakeCache();
  mock.timers.enable({ apis: ["Date"], now: Date.now() });
  globalThis.fetch = async () => Response.json({ results: ["real"] });
  let c = ctx();
  await call("path=/trending/movie/week", baseEnv, c);
  await c.flush();

  mock.timers.tick(2 * 3600 * 1000); // trending is fresh for 1h
  globalThis.fetch = async () => new Response("{}", { status: 429, headers: { "Retry-After": "30" } });
  c = ctx();
  const res = await call("path=/trending/movie/week", baseEnv, c);
  await c.flush();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("X-FlickMuse-Cache"), "STALE");
  assert.deepEqual(await res.json(), { results: ["real"] });
});

test("stale entry is refreshed in the background and the next request sees new data", async () => {
  installFakeCache();
  mock.timers.enable({ apis: ["Date"], now: Date.now() });
  globalThis.fetch = async () => Response.json({ v: 1 });
  let c = ctx();
  await call("path=/movie/top_rated", baseEnv, c); await c.flush();
  mock.timers.tick(7 * 3600 * 1000);
  globalThis.fetch = async () => Response.json({ v: 2 });
  c = ctx();
  assert.deepEqual(await (await call("path=/movie/top_rated", baseEnv, c)).json(), { v: 1 });
  await c.flush();
  const next = await call("path=/movie/top_rated");
  assert.equal(next.headers.get("X-FlickMuse-Cache"), "HIT");
  assert.deepEqual(await next.json(), { v: 2 });
});

test("a long Retry-After starts a cooldown: later requests do not touch TMDb", async () => {
  installFakeCache();
  let upstream = 0;
  globalThis.fetch = async () => { upstream++; return new Response("{}", { status: 429, headers: { "Retry-After": "30" } }); };
  const first = await call("path=/movie/popular&page=1");
  assert.equal(first.status, 429);
  assert.equal(first.headers.get("Retry-After"), "30");
  const second = await call("path=/movie/top_rated");
  assert.equal(second.status, 429);
  assert.ok(Number(second.headers.get("Retry-After")) > 0);
  assert.equal(upstream, 1, "only the first request reached TMDb");
});

test("a short Retry-After is honoured with one bounded inline retry", async () => {
  installFakeCache();
  let upstream = 0;
  globalThis.fetch = async () => {
    upstream++;
    return upstream === 1 ? new Response("{}", { status: 429, headers: { "Retry-After": "0" } }) : Response.json({ ok: true });
  };
  const res = await call("path=/movie/popular");
  assert.equal(res.status, 200);
  assert.equal(upstream, 2);
});

test("5xx errors are retried a bounded number of times, never indefinitely", async () => {
  installFakeCache();
  let upstream = 0;
  globalThis.fetch = async () => { upstream++; return new Response("{}", { status: 503 }); };
  const res = await call("path=/movie/popular");
  assert.equal(res.status, 503);
  assert.equal(upstream, 3);
});

test("optional KV layer shares only homepage datasets and never stores the key", async () => {
  installFakeCache();
  const kv = fakeKv();
  const env = { ...baseEnv, TMDB_CACHE: kv };
  globalThis.fetch = async () => Response.json({ results: [1] });
  let c = ctx();
  await call("path=/trending/movie/week", env, c); await c.flush();
  c = ctx();
  await call("path=/search/movie&query=heat", env, c); await c.flush();
  assert.equal(kv.data.size, 1, "search results are not written to KV");
  assert.ok([...kv.data.keys(), ...kv.data.values()].every((v) => !String(v).includes("secret-key")));

  // A different data centre (empty L1) is served from KV without calling TMDb.
  installFakeCache();
  globalThis.fetch = async () => { throw new Error("TMDb must not be called"); };
  const res = await call("path=/trending/movie/week", env);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("X-FlickMuse-Cache"), "HIT");
});
