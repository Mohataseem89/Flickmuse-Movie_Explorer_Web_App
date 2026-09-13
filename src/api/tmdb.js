const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const DEFAULT_CACHE_TIME = 5 * 60 * 1000;
const responseCache = new Map();
const inFlightRequests = new Map();
const SESSION_CACHE_PREFIX = "flickmuse:tmdb-cache:v1:";
const SESSION_CACHE_LIMIT = 30;

function readSessionCache(requestKey) {
  try {
    const cached = window.sessionStorage.getItem(SESSION_CACHE_PREFIX + requestKey);
    if (!cached) return null;
    const value = JSON.parse(cached);
    if (!value?.expiresAt || value.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(SESSION_CACHE_PREFIX + requestKey);
      return null;
    }
    return value;
  } catch { return null; }
}

function writeSessionCache(requestKey, value) {
  try {
    const storage = window.sessionStorage;
    storage.setItem(SESSION_CACHE_PREFIX + requestKey, JSON.stringify(value));
    const keys = Object.keys(storage).filter((key) => key.startsWith(SESSION_CACHE_PREFIX));
    if (keys.length > SESSION_CACHE_LIMIT) {
      keys.slice(0, keys.length - SESSION_CACHE_LIMIT).forEach((key) => storage.removeItem(key));
    }
  } catch { /* Storage is an optional performance enhancement. */ }
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

async function tmdbRequest(
  path,
  { params = {}, signal, cacheTime = DEFAULT_CACHE_TIME } = {}
) {
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
  const cached = responseCache.get(requestKey) || readSessionCache(requestKey);

  if (cached && cached.expiresAt > Date.now()) {
    return waitForRequest(Promise.resolve(cached.data), signal);
  }

  let request = inFlightRequests.get(requestKey);

  if (!request) {
    const url = new URL("/api/tmdb", window.location.origin);
    url.search = new URLSearchParams({
      path,
      ...Object.fromEntries(publicParams),
    }).toString();
    const requestController = new AbortController();
    const requestTimeout = window.setTimeout(
      () => requestController.abort(),
      15000
    );

    request = fetch(url, { signal: requestController.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            "TMDb request failed with status " + response.status + "."
          );
        }

        const data = await response.json();
        responseCache.set(requestKey, {
          data,
          expiresAt: Date.now() + cacheTime,
        });
        writeSessionCache(requestKey, { data, expiresAt: Date.now() + cacheTime });

        if (responseCache.size > 100) {
          responseCache.delete(responseCache.keys().next().value);
        }

        return data;
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          throw new Error(
            "TMDb took too long to respond. Please check your connection and try again."
          );
        }
        throw error;
      })
      .finally(() => {
        window.clearTimeout(requestTimeout);
        inFlightRequests.delete(requestKey);
      });

    inFlightRequests.set(requestKey, request);
  }

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

export function getTopRatedMovies(signal) {
  return tmdbRequest("/movie/top_rated", {
    params: { page: "1" },
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
    },
    signal,
  });
}

export function getMovieGenres(signal) {
  return tmdbRequest("/genre/movie/list", {
    signal,
    cacheTime: 24 * 60 * 60 * 1000,
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
      append_to_response: "videos,credits,recommendations,similar,watch/providers",
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
    params: { append_to_response: "videos,credits,recommendations,similar,watch/providers" },
    signal,
    cacheTime: 10 * 60 * 1000,
  });
}

export function discoverTV(filters = {}, signal) {
  const { page = 1, genre, year, sortBy = "popularity.desc", minimumRating } = filters;
  return tmdbRequest("/discover/tv", {
    params: {
      page: String(page), with_genres: genre, first_air_date_year: year,
      sort_by: sortBy, "vote_average.gte": minimumRating,
      "vote_count.gte": minimumRating ? "100" : undefined,
    }, signal,
  });
}

export function getPersonDetails(id, signal) {
  return tmdbRequest("/person/" + id, {
    signal,
    cacheTime: 30 * 60 * 1000,
  });
}

export function getPersonMovieCredits(id, signal) {
  return tmdbRequest("/person/" + id + "/movie_credits", {
    signal,
    cacheTime: 30 * 60 * 1000,
  });
}

export function getImageUrl(path, size = "w500") {
  return path ? IMAGE_BASE_URL + "/" + size + path : null;
}
