import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker.js";

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

const env = { TMDB_API_KEY: "secret-key", ASSETS: { fetch: async () => new Response("asset") } };
const ctx = () => { const jobs = []; return { waitUntil: (p) => jobs.push(p), flush: () => Promise.all(jobs) }; };
const call = (qs, c) => worker.fetch(new Request("https://flickmuse.test/api/tmdb?" + qs), env, c);

test("second identical request is served from the edge cache without calling TMDb", async () => {
  installFakeCache();
  let upstreamCalls = 0;
  globalThis.fetch = async () => { upstreamCalls++; return Response.json({ results: [1] }); };

  const c1 = ctx();
  const first = await call("path=/trending/movie/week&language=en-US", c1);
  await c1.flush();
  assert.equal(first.headers.get("X-FlickMuse-Cache"), "MISS");

  const second = await call("language=en-US&path=/trending/movie/week", ctx()); // different param order
  assert.equal(second.headers.get("X-FlickMuse-Cache"), "HIT");
  assert.deepEqual(await second.json(), { results: [1] });
  assert.equal(upstreamCalls, 1);
});

test("API key never appears in cached keys or responses", async () => {
  const store = installFakeCache();
  globalThis.fetch = async () => Response.json({ ok: true });
  const c = ctx();
  await call("path=/movie/popular&page=1", c);
  await c.flush();
  assert.ok([...store.keys()].every((key) => !key.includes("secret-key")));
});

test("429 from TMDb is passed through, not cached, and keeps Retry-After", async () => {
  const store = installFakeCache();
  globalThis.fetch = async () => new Response(JSON.stringify({ status_code: 25 }), { status: 429, headers: { "Retry-After": "7" } });
  const c = ctx();
  const res = await call("path=/movie/popular", c);
  await c.flush();
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("Retry-After"), "7");
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  assert.equal(store.size, 0);
});

test("disallowed paths are rejected and non-API requests go to static assets", async () => {
  installFakeCache();
  globalThis.fetch = async () => { throw new Error("should not be called"); };
  assert.equal((await call("path=/account")).status, 400);
  const asset = await worker.fetch(new Request("https://flickmuse.test/"), env, ctx());
  assert.equal(await asset.text(), "asset");
});
