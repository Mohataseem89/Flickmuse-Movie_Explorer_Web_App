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
const SUCCESS_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

function withCacheStatus(response, status) {
  const headers = new Headers(response.headers);
  headers.set("X-FlickMuse-Cache", status);
  return new Response(response.body, { status: response.status, headers });
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle /api/tmdb requests
    if (url.pathname === "/api/tmdb") {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Allow": "GET",
          },
        });
      }

      const apiKey = env.TMDB_API_KEY || env.API_KEY;
      const path = url.searchParams.get("path") || "";

      if (!apiKey) {
        return jsonResponse({ error: "Movie data service is not configured." }, 500);
      }
      if (!isAllowedPath(path)) {
        return jsonResponse({ error: "Unsupported movie data request." }, 400);
      }

      const upstreamUrl = new URL(API_BASE_URL + path);
      for (const [key, value] of url.searchParams.entries()) {
        if (
          key === "path" ||
          !ALLOWED_QUERY_PARAMETERS.has(key) ||
          value.length > MAX_QUERY_VALUE_LENGTH
        ) {
          continue;
        }
        upstreamUrl.searchParams.set(key, value);
      }
      upstreamUrl.searchParams.set("api_key", apiKey);

      // Cloudflare does NOT cache Worker responses just because they carry a
      // Cache-Control header, so without this every visitor reached TMDb
      // directly from Cloudflare's shared egress IPs and was rate limited (429).
      // The key excludes api_key and is parameter-order independent.
      const cache = typeof caches !== "undefined" ? caches.default : null;
      const keyParams = new URLSearchParams(
        [...upstreamUrl.searchParams.entries()]
          .filter(([key]) => key !== "api_key")
          .sort(([a], [b]) => a.localeCompare(b))
      );
      const cacheKey = new Request(
        url.origin + "/__tmdb-cache" + path + "?" + keyParams.toString(),
        { method: "GET" }
      );

      if (cache) {
        const hit = await cache.match(cacheKey);
        if (hit) return withCacheStatus(hit, "HIT");
      }

      try {
        const upstream = await fetch(upstreamUrl.toString(), {
          headers: { accept: "application/json" },
        });
        const data = await upstream.json();

        if (!upstream.ok) {
          const response = jsonResponse(data, upstream.status);
          const retryAfter = upstream.headers.get("Retry-After");
          if (retryAfter) response.headers.set("Retry-After", retryAfter);
          return withCacheStatus(response, "BYPASS");
        }

        const response = jsonResponse(data, upstream.status, SUCCESS_CACHE_CONTROL);
        if (cache && ctx?.waitUntil) ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return withCacheStatus(response, "MISS");
      } catch {
        return jsonResponse({ error: "Movie data service is temporarily unavailable." }, 502);
      }
    }

    // Serve Vite static assets & SPA routes for everything else
    return env.ASSETS.fetch(request);
  },
};