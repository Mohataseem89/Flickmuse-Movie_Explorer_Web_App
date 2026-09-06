import { readJson, writeJson } from "./storage.js";

export const WATCHLIST_STORAGE_KEY = "FlickMuse_watchlist";
const LEGACY_WATCHLIST_STORAGE_KEY = "moviesapp";

export function normalizeWatchlist(value) {
  if (!Array.isArray(value)) return [];

  const uniqueMovies = new Map();
  value.forEach((movie) => {
    if (movie && Number.isFinite(movie.id) && !uniqueMovies.has(movie.id)) {
      uniqueMovies.set(movie.id, movie);
    }
  });

  return [...uniqueMovies.values()];
}

export function loadWatchlist(storage = window.localStorage) {
  const currentWatchlist = normalizeWatchlist(
    readJson(WATCHLIST_STORAGE_KEY, [], storage)
  );
  if (currentWatchlist.length > 0) return currentWatchlist;

  const legacyWatchlist = normalizeWatchlist(
    readJson(LEGACY_WATCHLIST_STORAGE_KEY, [], storage)
  );
  if (legacyWatchlist.length === 0) return currentWatchlist;

  writeJson(WATCHLIST_STORAGE_KEY, legacyWatchlist, storage);
  storage.removeItem(LEGACY_WATCHLIST_STORAGE_KEY);
  return legacyWatchlist;
}

export function saveWatchlist(watchlist, storage = window.localStorage) {
  return writeJson(
    WATCHLIST_STORAGE_KEY,
    normalizeWatchlist(watchlist),
    storage
  );
}

export function addMovieToWatchlist(watchlist, movie) {
  const normalized = normalizeWatchlist(watchlist);
  if (!movie || !Number.isFinite(movie.id)) {
    return { watchlist: normalized, added: false };
  }

  if (normalized.some((item) => item.id === movie.id)) {
    return { watchlist: normalized, added: false };
  }

  return { watchlist: [...normalized, movie], added: true };
}

export function removeMovieFromWatchlist(watchlist, movieId) {
  return normalizeWatchlist(watchlist).filter((movie) => movie.id !== movieId);
}
