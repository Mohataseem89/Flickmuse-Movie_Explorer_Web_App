const API_BASE_URL = "https://api.themoviedb.org/3";

const ALLOWED_PATHS = [
  /^\/trending\/movie\/week$/,
  /^\/trending\/tv\/week$/,
  /^\/movie\/(popular|now_playing|top_rated)$/,
  /^\/discover\/movie$/,
  /^\/discover\/tv$/,
  /^\/search\/movie$/,
  /^\/search\/multi$/,
  /^\/search\/tv$/,
  /^\/genre\/movie\/list$/,
  /^\/genre\/tv\/list$/,
  /^\/movie\/\d+(?:\/similar)?$/,
  /^\/tv\/(popular|on_the_air|top_rated)$/,
  /^\/tv\/\d+(?:\/similar)?$/,
  /^\/tv\/\d+\/season\/\d+$/,
  /^\/person\/\d+(?:\/(?:movie_credits|combined_credits))?$/,
  /^\/collection\/\d+$/,
];

const ALLOWED_QUERY_PARAMETERS = new Set([
  "append_to_response",
  "first_air_date_year",
  "include_adult",
  "include_video",
  "language",
  "page",
  "primary_release_date.gte",
  "primary_release_date.lte",
  "primary_release_year",
  "query",
  "region",
  "sort_by",
  "vote_average.gte",
  "vote_count.gte",
  "with_genres",
  "with_original_language",
  "with_runtime.gte",
  "with_runtime.lte",
]);

const MAX_QUERY_VALUE_LENGTH = 200;

// ---------------------------------------------------------------------------
// Caching strategy
//
// 1. L1: Cloudflare's per-data-centre cache (caches.default). Free, no setup.
// 2. L2 (optional): a Workers KV namespace bound as TMDB_CACHE. KV is global,
//    so one data centre warming "trending" also warms every other one. It is
//    only used for the handful of homepage datasets (see KV_SHARED_PATHS) to
//    stay far below the free-tier write quota. Without the binding the Worker
//    behaves exactly as L1-only.
//
// Entries are stored far longer than they are "fresh". When TMDb rate limits
// or fails, an expired entry is served instead of an error, and expired
// entries are refreshed in the background (stale-while-revalidate).
// ---------------------------------------------------------------------------
const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// First match wins. Values are the number of seconds an entry stays fresh.
const FRESH_TTL_RULES = [
  [/^\/genre\//, 7 * DAY],
  [/^\/trending\//, HOUR],
  [/^\/(movie|tv)\/(popular|top_rated)$/, 6 * HOUR],
  [/^\/(movie\/now_playing|tv\/on_the_air)$/, 6 * HOUR],
  [/^\/discover\//, 3 * HOUR],
  [/^\/search\//, 10 * MINUTE],
  [/^\/(person|collection)\//, DAY],
  [/^\/(movie|tv)\/\d+/, 12 * HOUR],
];
const DEFAULT_FRESH_TTL = HOUR;
const MAX_STALE_RETENTION = 7 * DAY;

// Datasets worth sharing globally through KV.
const KV_SHARED_PATHS = [
  /^\/trending\/(movie|tv)\/week$/,
  /^\/movie\/(popular|now_playing|top_rated)$/,
  /^\/tv\/(popular|on_the_air|top_rated)$/,
  /^\/discover\/movie$/,
  /^\/genre\/(movie|tv)\/list$/,
];

const FRESH_UNTIL_HEADER = "X-FlickMuse-Fresh-Until";
const CACHE_STATUS_HEADER = "X-FlickMuse-Cache";

// Upstream protection (per Worker isolate).
const MAX_UPSTREAM_ATTEMPTS = 3; // 1 try + 2 retries
const MAX_INLINE_RETRY_WAIT_MS = 2000; // never hold a visitor longer than this
const DEFAULT_COOLDOWN_SECONDS = 10;
const MAX_COOLDOWN_SECONDS = 60;

const inFlight = new Map(); // cacheKey -> Promise<UpstreamResult>
let upstreamCooldownUntil = 0; // epoch ms; set when TMDb answers 429

export function freshTtlFor(path) {
  for (const [pattern, ttl] of FRESH_TTL_RULES) if (pattern.test(path)) return ttl;
  return DEFAULT_FRESH_TTL;
}

function retentionFor(ttl) {
  return Math.min(MAX_STALE_RETENTION, Math.max(ttl * 6, 6 * HOUR));
}

function isAllowedPath(path) {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
}

function jsonResponse(payload, status, cacheControl = "no-store") {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterSeconds(value) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, (date - Date.now()) / 1000);
}

// Headers the browser sees on a successful (fresh or stale) response.
function clientCacheControl(ttl) {
  const browserTtl = Math.min(ttl, 5 * MINUTE);
  return "public, max-age=" + browserTtl + ", stale-while-revalidate=" + Math.min(ttl, 10 * MINUTE) + ", stale-if-error=" + DAY;
}

function buildResponse(body, status, ttl, cacheStatus, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": clientCacheControl(ttl),
      [CACHE_STATUS_HEADER]: cacheStatus,
      ...extraHeaders,
    },
  });
}

async function readL1(cacheKey) {
  const cache = typeof caches !== "undefined" ? caches.default : null;
  if (!cache) return null;
  try {
    const hit = await cache.match(cacheKey);
    if (!hit) return null;
    return {
      body: await hit.text(),
      freshUntil: Number(hit.headers.get(FRESH_UNTIL_HEADER)) || 0,
    };
  } catch {
    return null;
  }
}

function writeL1(cacheKey, entry, retentionSeconds, ctx) {
  const cache = typeof caches !== "undefined" ? caches.default : null;
  if (!cache) return;
  const response = new Response(entry.body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Controls how long Cloudflare physically keeps the entry.
      "Cache-Control": "public, max-age=" + retentionSeconds,
      [FRESH_UNTIL_HEADER]: String(entry.freshUntil),
    },
  });
  const job = cache.put(cacheKey, response).catch(() => {});
  if (ctx?.waitUntil) ctx.waitUntil(job);
}

async function readL2(env, kvKey, path) {
  if (!env.TMDB_CACHE || !KV_SHARED_PATHS.some((pattern) => pattern.test(path))) return null;
  try {
    const value = await env.TMDB_CACHE.get(kvKey, "json");
    return value && typeof value.body === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeL2(env, kvKey, path, entry, retentionSeconds, ctx) {
  if (!env.TMDB_CACHE || !KV_SHARED_PATHS.some((pattern) => pattern.test(path))) return;
  const job = env.TMDB_CACHE
    .put(kvKey, JSON.stringify(entry), { expirationTtl: Math.max(60, retentionSeconds) })
    .catch(() => {});
  if (ctx?.waitUntil) ctx.waitUntil(job);
}

// Talks to TMDb. Retries 429/5xx/network errors a bounded number of times and
// never waits longer than MAX_INLINE_RETRY_WAIT_MS. Returns a plain result
// object so concurrent callers can share it.
async function fetchUpstream(upstreamUrl) {
  const now = Date.now();
  if (upstreamCooldownUntil > now) {
    return {
      ok: false,
      status: 429,
      body: JSON.stringify({ status_message: "Movie data service is cooling down after a rate limit." }),
      retryAfter: Math.ceil((upstreamCooldownUntil - now) / 1000),
    };
  }

  let last = null;
  for (let attempt = 0; attempt < MAX_UPSTREAM_ATTEMPTS; attempt++) {
    let waitMs = 0;
    try {
      const upstream = await fetch(upstreamUrl, { headers: { accept: "application/json" } });
      const body = await upstream.text();
      if (upstream.ok) return { ok: true, status: upstream.status, body };

      const retryAfter = parseRetryAfterSeconds(upstream.headers.get("Retry-After"));
      last = { ok: false, status: upstream.status, body, retryAfter };

      if (upstream.status === 429) {
        const cooldown = Math.min(MAX_COOLDOWN_SECONDS, retryAfter ?? DEFAULT_COOLDOWN_SECONDS);
        // Only retry inline when TMDb says the wait is short.
        if (retryAfter === null || retryAfter * 1000 > MAX_INLINE_RETRY_WAIT_MS) {
          upstreamCooldownUntil = Date.now() + cooldown * 1000;
          last.retryAfter = Math.ceil(cooldown);
          return last;
        }
        waitMs = retryAfter * 1000;
      } else if (upstream.status >= 500) {
        waitMs = 300 * 2 ** attempt + Math.random() * 150;
      } else {
        return last; // 4xx other than 429 is not retryable
      }
    } catch {
      last = { ok: false, status: 502, body: JSON.stringify({ error: "Movie data service is temporarily unavailable." }), retryAfter: null };
      waitMs = 300 * 2 ** attempt + Math.random() * 150;
    }

    if (attempt < MAX_UPSTREAM_ATTEMPTS - 1) await sleep(Math.min(waitMs, MAX_INLINE_RETRY_WAIT_MS));
  }
  return last;
}

// Identical simultaneous requests inside one isolate share one TMDb call.
function refresh(cacheKeyString, upstreamUrl) {
  let pending = inFlight.get(cacheKeyString);
  if (!pending) {
    pending = fetchUpstream(upstreamUrl).finally(() => inFlight.delete(cacheKeyString));
    inFlight.set(cacheKeyString, pending);
  }
  return pending;
}

function errorResponse(result) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", [CACHE_STATUS_HEADER]: "BYPASS" };
  if (result.retryAfter !== null && result.retryAfter !== undefined) headers["Retry-After"] = String(Math.ceil(result.retryAfter));
  return new Response(result.body, { status: result.status, headers });
}

export function resetProxyState() {
  inFlight.clear();
  upstreamCooldownUntil = 0;
}

export async function handleTmdbRequest(request, env, ctx) {
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", Allow: "GET" },
    });
  }

  const apiKey = env.TMDB_API_KEY || env.API_KEY;
  const path = url.searchParams.get("path") || "";

  if (!apiKey) return jsonResponse({ error: "Movie data service is not configured." }, 500);
  if (!isAllowedPath(path)) return jsonResponse({ error: "Unsupported movie data request." }, 400);

  const upstreamUrl = new URL(API_BASE_URL + path);
  for (const [key, value] of url.searchParams.entries()) {
    if (key === "path" || !ALLOWED_QUERY_PARAMETERS.has(key) || value.length > MAX_QUERY_VALUE_LENGTH) continue;
    upstreamUrl.searchParams.set(key, value);
  }
  upstreamUrl.searchParams.set("api_key", apiKey);

  // The key covers the endpoint plus every forwarded parameter (language,
  // page, region, filters...), sorted so parameter order cannot cause misses,
  // and never contains the API key.
  const keyParams = new URLSearchParams(
    [...upstreamUrl.searchParams.entries()]
      .filter(([key]) => key !== "api_key")
      .sort(([a], [b]) => a.localeCompare(b))
  );
  const keyString = path + "?" + keyParams.toString();
  const cacheKey = new Request(url.origin + "/__tmdb-cache" + keyString, { method: "GET" });
  const kvKey = "v1:" + keyString.slice(0, 480);

  const ttl = freshTtlFor(path);
  const retention = retentionFor(ttl);

  let entry = await readL1(cacheKey);
  if (!entry) {
    entry = await readL2(env, kvKey, path);
    if (entry) writeL1(cacheKey, entry, retention, ctx);
  }

  const now = Date.now();
  if (entry && entry.freshUntil > now) {
    return buildResponse(entry.body, 200, ttl, "HIT");
  }

  const doRefresh = async () => {
    const result = await refresh(keyString, upstreamUrl.toString());
    if (result.ok) {
      const fresh = { body: result.body, freshUntil: Date.now() + ttl * 1000 };
      writeL1(cacheKey, fresh, retention, ctx);
      writeL2(env, kvKey, path, fresh, retention, ctx);
    }
    return result;
  };

  // Expired but still stored: answer immediately, refresh in the background.
  if (entry) {
    const job = doRefresh().catch(() => {});
    if (ctx?.waitUntil) ctx.waitUntil(job);
    return buildResponse(entry.body, 200, 60, "STALE");
  }

  const result = await doRefresh();
  if (result.ok) return buildResponse(result.body, 200, ttl, "MISS");
  return errorResponse(result);
}
