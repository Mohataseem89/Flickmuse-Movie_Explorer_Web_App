const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DEFAULT_CACHE_TIME = 5 * MINUTE;
const LIST_CACHE_TIME = 10 * MINUTE;
const LIST_STALE_TIME = 24 * HOUR;

const MAX_CONCURRENT_REQUESTS = 3;
const MAX_ATTEMPTS = 3; // first try + 2 retries
const MAX_RETRY_WAIT_MS = 8000; // longer Retry-After values are surfaced to the UI instead
const DEFAULT_RATE_LIMIT_SECONDS = 8;
const MAX_COOLDOWN_SECONDS = 60;
const REQUEST_TIMEOUT_MS = 15000;

const PERSIST_PREFIX = "flickmuse:tmdb-cache:v2:";
const PERSIST_LIMIT = 24;
const PERSIST_MAX_CHARS = 200000;

// Only small, shared list endpoints are persisted for stale fallback.
const LIST_PATH = /^\/(trending\/(movie|tv)\/week|movie\/(popular|now_playing|top_rated)|tv\/(popular|on_the_air|top_rated)|discover\/(movie|tv)|genre\/(movie|tv)\/list)$/;
// Anything a person is actively waiting on jumps ahead of background lists.
const INTERACTIVE_PATH = /^\/(search\/|trending\/|(movie|tv)\/\d|person\/|collection\/)/;

const responseCache = new Map();
const inFlightRequests = new Map();
let cooldownUntil = 0; // epoch ms, shared by every request after a 429

/**
 * Error thrown for every failed TMDb request.
 * kind: "rate_limit" | "network" | "timeout" | "api"
 */
export class TmdbError extends Error {
  constructor(message, { kind = "api", status = 0, retryAfter = null } = {}) {
    super(message);
    this.name = "TmdbError";
    this.kind = kind;
    this.status = status;
    this.retryAfter = retryAfter; // seconds, when known
  }
}

function messageFor(kind, status) {
  if (kind === "rate_limit") {
    return "TMDb is receiving too many requests right now. Please wait a moment and try again.";
  }
  if (kind === "timeout") {
    return "TMDb took too long to respond. Please check your connection and try again.";
  }
  if (kind === "network") {
    return "FlickMuse could not reach the movie data service. Please check your connection and try again.";
  }
  return "The movie data service returned an error (status " + status + "). Please try again shortly.";
}

/** Seconds until the shared rate-limit cooldown ends (0 when not cooling down). */
export function getTmdbCooldownSeconds() {
  return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
}

function startCooldown(seconds) {
  const bounded = Math.min(MAX_COOLDOWN_SECONDS, Math.max(1, seconds));
  cooldownUntil = Math.max(cooldownUntil, Date.now() + bounded * 1000);
}

function parseRetryAfter(value) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, (date - Date.now()) / 1000);
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Persistent stale-data store (localStorage). Optional: failures are ignored.
// ---------------------------------------------------------------------------
function readPersisted(requestKey) {
  try {
    const raw = window.localStorage.getItem(PERSIST_PREFIX + requestKey);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value?.staleUntil || value.staleUntil <= Date.now()) {
      window.localStorage.removeItem(PERSIST_PREFIX + requestKey);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function writePersisted(requestKey, entry) {
  try {
    const serialized = JSON.stringify(entry);
    if (serialized.length > PERSIST_MAX_CHARS) return;
    const storage = window.localStorage;
    storage.setItem(PERSIST_PREFIX + requestKey, serialized);

    const keys = Object.keys(storage).filter((key) => key.startsWith(PERSIST_PREFIX));
    if (keys.length > PERSIST_LIMIT) {
      const dated = keys.map((key) => {
        try { return [key, JSON.parse(storage.getItem(key))?.savedAt || 0]; } catch { return [key, 0]; }
      }).sort((a, b) => a[1] - b[1]);
      dated.slice(0, keys.length - PERSIST_LIMIT).forEach(([key]) => storage.removeItem(key));
    }
  } catch { /* Storage is an optional performance enhancement. */ }
}

// ---------------------------------------------------------------------------
// Request queue: caps concurrency, runs interactive requests first and holds
// everything while the shared rate-limit cooldown is active.
// ---------------------------------------------------------------------------
const queue = [];
let activeRequests = 0;
let sequence = 0;
let pumpTimer = null;

function pumpQueue() {
  if (pumpTimer) { window.clearTimeout(pumpTimer); pumpTimer = null; }

  const waitMs = cooldownUntil - Date.now();
  if (waitMs > 0 && queue.length > 0) {
    pumpTimer = window.setTimeout(pumpQueue, waitMs + 50);
    return;
  }

  while (activeRequests < MAX_CONCURRENT_REQUESTS && queue.length > 0) {
    let best = 0;
    for (let index = 1; index < queue.length; index++) {
      const a = queue[index];
      const b = queue[best];
      if (a.priority < b.priority || (a.priority === b.priority && a.order < b.order)) best = index;
    }
    const [job] = queue.splice(best, 1);
    activeRequests++;
    job.run().then(job.resolve, job.reject).finally(() => {
      activeRequests--;
      pumpQueue();
    });
  }
}

function enqueue(run, priority) {
  return new Promise((resolve, reject) => {
    queue.push({ run, resolve, reject, priority, order: sequence++ });
    pumpQueue();
  });
}

// One network operation with bounded retries. 429 responses start the shared
// cooldown and are only retried when TMDb asks for a short wait; otherwise the
// error (with its retryAfter) goes straight to the UI.
async function fetchJsonWithRetry(url) {
  let lastError = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const remaining = cooldownUntil - Date.now();
    if (remaining > 0) await sleep(Math.min(remaining, MAX_RETRY_WAIT_MS));

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let fatal = null;
    let waitMs = 0;

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (response.ok) return await response.json();

      if (response.status === 429) {
        const retryAfter = parseRetryAfter(response.headers.get("Retry-After")) ?? DEFAULT_RATE_LIMIT_SECONDS;
        startCooldown(retryAfter);
        lastError = new TmdbError(messageFor("rate_limit", 429), {
          kind: "rate_limit",
          status: 429,
          retryAfter: Math.ceil(Math.min(retryAfter, MAX_COOLDOWN_SECONDS)),
        });
        if (retryAfter * 1000 > MAX_RETRY_WAIT_MS) fatal = lastError;
        else waitMs = retryAfter * 1000 + Math.random() * 400;
      } else if (response.status >= 500) {
        lastError = new TmdbError(messageFor("api", response.status), { kind: "api", status: response.status });
        waitMs = 600 * 2 ** attempt + Math.random() * 300;
      } else {
        // 4xx other than 429 will not succeed on retry.
        fatal = new TmdbError(messageFor("api", response.status), { kind: "api", status: response.status });
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        fatal = new TmdbError(messageFor("timeout"), { kind: "timeout" });
      } else {
        lastError = new TmdbError(messageFor("network"), { kind: "network" });
        waitMs = 600 * 2 ** attempt + Math.random() * 300;
      }
    } finally {
      window.clearTimeout(timeout);
    }

    if (fatal) throw fatal;
    if (attempt < MAX_ATTEMPTS - 1) await sleep(waitMs);
  }

  throw lastError || new TmdbError(messageFor("network"), { kind: "network" });
}

function waitForRequest(request, signal) {
  if (!signal) return request;

  if (signal.aborted) {
    return Promise.reject(new DOMException("Request aborted", "AbortError"));
  }

  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      reject(new DOMException("Request aborted", "AbortError"));
    };

    signal.addEventListener("abort", handleAbort, { once: true });
    request.then(
      (data) => {
        signal.removeEventListener("abort", handleAbort);
        resolve(data);
      },
      (error) => {
        signal.removeEventListener("abort", handleAbort);
        reject(error);
      }
    );
  });
}

// Shared, de-duplicated network request. Every caller for the same key awaits
// the same promise; component aborts never cancel it for other callers.
function fetchAndStore(requestKey, path, publicParams, { cacheTime, staleTime, priority }) {
  let request = inFlightRequests.get(requestKey);
  if (request) return request;

  const url = new URL("/api/tmdb", window.location.origin);
  url.search = new URLSearchParams({ path, ...Object.fromEntries(publicParams) }).toString();

  request = enqueue(() => fetchJsonWithRetry(url), priority)
    .then((data) => {
      const now = Date.now();
      const entry = { data, expiresAt: now + cacheTime, staleUntil: now + Math.max(cacheTime, staleTime), savedAt: now };
      responseCache.set(requestKey, entry);
      if (responseCache.size > 100) responseCache.delete(responseCache.keys().next().value);
      if (staleTime > 0) writePersisted(requestKey, entry);
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(requestKey);
    });

  inFlightRequests.set(requestKey, request);
  return request;
}

async function tmdbRequest(
  path,
  { params = {}, signal, cacheTime, staleTime, priority } = {}
) {
  const isList = LIST_PATH.test(path);
  const options = {
    cacheTime: cacheTime ?? (isList ? LIST_CACHE_TIME : DEFAULT_CACHE_TIME),
    staleTime: staleTime ?? (isList ? LIST_STALE_TIME : 0),
    priority: priority ?? (INTERACTIVE_PATH.test(path) ? 0 : 1),
  };

  const normalizedParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );

  const publicParams = new URLSearchParams({
    language: "en-US",
    ...normalizedParams,
  });
  const requestKey = path + "?" + publicParams.toString();

  let entry = responseCache.get(requestKey);
  if (!entry && options.staleTime > 0) {
    entry = readPersisted(requestKey);
    if (entry) responseCache.set(requestKey, entry);
  }

  const now = Date.now();
  if (entry && entry.expiresAt > now) {
    return waitForRequest(Promise.resolve(entry.data), signal);
  }

  const canServeStale = Boolean(entry && entry.staleUntil > now);

  // Expired but still usable: show it now, refresh quietly in the background.
  if (canServeStale && options.staleTime > 0) {
    fetchAndStore(requestKey, path, publicParams, options).catch(() => {});
    return waitForRequest(Promise.resolve(entry.data), signal);
  }

  const request = fetchAndStore(requestKey, path, publicParams, options).catch((error) => {
    // TMDb unavailable or rate limited: prefer real (older) data over an error.
    if (canServeStale) return entry.data;
    throw error;
  });

  return waitForRequest(request, signal);
}

export function getPopularMovies(page = 1, signal) {
  return tmdbRequest("/movie/popular", {
    params: { page: String(page) },
    signal,
  });
}

export function getTrendingMovies(signal) {
  return tmdbRequest("/trending/movie/week", { signal });
}

export function getNowPlayingMovies(signal) {
  return tmdbRequest("/movie/now_playing", {
    params: { page: "1" },
    signal,
  });
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

export function getUpcomingMovies(signal) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  return tmdbRequest("/discover/movie", {
    params: {
      page: "1",
      include_adult: "false",
      include_video: "false",
      sort_by: "popularity.desc",
      "primary_release_date.gte": formatLocalDate(tomorrow),
      "primary_release_date.lte": formatLocalDate(sixMonthsFromNow),
    },
    signal,
  });
}

export function getTopRatedMovies(page = 1, signal) {
  return tmdbRequest("/movie/top_rated", {
    params: { page: String(page) },
    signal,
  });
}

export function searchMovies(query, page = 1, signal) {
  return tmdbRequest("/search/movie", {
    params: {
      query,
      page: String(page),
      include_adult: "false",
    },
    signal,
    cacheTime: 60 * 1000,
  });
}

export function searchTitles(query, page = 1, signal) {
  return tmdbRequest("/search/multi", {
    params: { query, page: String(page), include_adult: "false" },
    signal,
    cacheTime: 60 * 1000,
  });
}

export function discoverMovies(filters = {}, signal) {
  const {
    page = 1,
    genre,
    year,
    sortBy = "popularity.desc",
    minimumRating,
    originalLanguage,
  } = filters;

  return tmdbRequest("/discover/movie", {
    params: {
      page: String(page),
      include_adult: "false",
      include_video: "false",
      with_genres: genre,
      primary_release_year: year,
      sort_by: sortBy,
      "vote_average.gte": minimumRating,
      "vote_count.gte": minimumRating ? "100" : undefined,
      with_original_language: originalLanguage,
    },
    signal,
  });
}

function addMediaType(results, mediaType) {
  return (results || []).map((result) => ({ ...result, media_type: mediaType }));
}

function getTVSortBy(sortBy) {
  if (sortBy === "primary_release_date.desc") return "first_air_date.desc";
  if (sortBy === "revenue.desc") return "popularity.desc";
  return sortBy;
}

export async function discoverTitles(filters = {}, signal) {
  const mediaType = filters.mediaType || "movie";

  if (mediaType === "movie") {
    const data = await discoverMovies(filters, signal);
    return { ...data, results: addMediaType(data.results, "movie") };
  }

  const tvFilters = { ...filters, sortBy: getTVSortBy(filters.sortBy) };
  if (mediaType === "tv") {
    const data = await discoverTV(tvFilters, signal);
    return { ...data, results: addMediaType(data.results, "tv") };
  }

  const [movieData, tvData] = await Promise.all([
    discoverMovies(filters, signal),
    discoverTV(tvFilters, signal),
  ]);
  const results = [...addMediaType(movieData.results, "movie"), ...addMediaType(tvData.results, "tv")];

  const sortBy = filters.sortBy || "popularity.desc";
  const sortedResults = results.sort((first, second) => {
    if (sortBy === "vote_average.desc") return (second.vote_average || 0) - (first.vote_average || 0);
    if (sortBy === "primary_release_date.desc") {
      const firstDate = first.release_date || first.first_air_date || "";
      const secondDate = second.release_date || second.first_air_date || "";
      return secondDate.localeCompare(firstDate);
    }
    return (second.popularity || 0) - (first.popularity || 0);
  });

  return {
    results: sortedResults,
    total_results: (movieData.total_results || 0) + (tvData.total_results || 0),
    total_pages: Math.max(movieData.total_pages || 1, tvData.total_pages || 1),
  };
}

export function getMovieGenres(signal) {
  return tmdbRequest("/genre/movie/list", {
    signal,
    cacheTime: 24 * 60 * 60 * 1000,
  });
}

export function discoverTonight({ genres, minRuntime, maxRuntime, region }, signal) {
  return tmdbRequest("/discover/movie", {
    params: { page: "1", include_adult: "false", include_video: "false", sort_by: "vote_average.desc", with_genres: genres, "with_runtime.gte": String(minRuntime), "with_runtime.lte": String(maxRuntime), "vote_count.gte": "150", region }, signal,
  });
}

export function getMovieDetails(id, signal) {
  return tmdbRequest("/movie/" + id, { signal });
}

export function getSimilarMovies(id, signal) {
  return tmdbRequest("/movie/" + id + "/similar", { signal });
}

export function getMovieBundle(id, signal) {
  return tmdbRequest("/movie/" + id, {
    params: {
      append_to_response: "videos,credits,recommendations,similar,watch/providers,images,external_ids,release_dates",
    },
    signal,
    cacheTime: 10 * 60 * 1000,
  });
}

export function getTVGenres(signal) {
  return tmdbRequest("/genre/tv/list", { signal, cacheTime: 24 * 60 * 60 * 1000 });
}

export function getPopularTV(page = 1, signal) {
  return tmdbRequest("/tv/popular", { params: { page: String(page) }, signal });
}

export function getTrendingTV(signal) {
  return tmdbRequest("/trending/tv/week", { signal });
}

export function getTVBundle(id, signal) {
  return tmdbRequest("/tv/" + id, {
    params: { append_to_response: "videos,credits,recommendations,similar,watch/providers,images,external_ids,content_ratings" },
    signal,
    cacheTime: 10 * 60 * 1000,
  });
}

export function discoverTV(filters = {}, signal) {
  const { page = 1, genre, year, sortBy = "popularity.desc", minimumRating, originalLanguage } = filters;
  return tmdbRequest("/discover/tv", {
    params: {
      page: String(page), with_genres: genre, first_air_date_year: year,
      sort_by: sortBy, "vote_average.gte": minimumRating,
      "vote_count.gte": minimumRating ? "100" : undefined, with_original_language: originalLanguage,
    }, signal,
  });
}

export function getTVSeason(id, seasonNumber, signal) {
  return tmdbRequest(`/tv/${id}/season/${seasonNumber}`, { signal, cacheTime: 30 * 60 * 1000 });
}

export function getPersonDetails(id, signal) {
  return tmdbRequest("/person/" + id, {
    signal,
    cacheTime: 30 * 60 * 1000,
  });
}

export function getPersonMovieCredits(id, signal) {
  return getPersonCombinedCredits(id, signal);
}

export function getPersonCombinedCredits(id, signal) {
  return tmdbRequest("/person/" + id + "/combined_credits", { signal, cacheTime: 30 * 60 * 1000 });
}

export function getCollectionDetails(id, signal) {
  return tmdbRequest("/collection/" + id, { signal, cacheTime: 30 * 60 * 1000 });
}

export function getImageUrl(path, size = "w500") {
  return path ? IMAGE_BASE_URL + "/" + size + path : null;
}
