import { readJson, writeJson } from "./storage.js";

export const WATCHLIST_STORAGE_KEY = "FlickMuse_watchlist";
const LEGACY_WATCHLIST_STORAGE_KEY = "moviesapp";
export const VIEWING_STATES = ["want-to-watch", "watching", "watched"];
export const DEFAULT_VIEWING_STATE = "want-to-watch";

const mediaTypeOf = (item) => item?.media_type === "tv" ? "tv" : "movie";
const keyOf = (item) => `${mediaTypeOf(item)}:${item?.id}`;

export function normalizeWatchlist(value) {
  if (!Array.isArray(value)) return [];
  const unique = new Map();
  value.forEach((item) => {
    if (!item || !Number.isFinite(item.id)) return;
    const media_type = mediaTypeOf(item);
    const viewing_state = VIEWING_STATES.includes(item.viewing_state) ? item.viewing_state : DEFAULT_VIEWING_STATE;
    const normalized = { ...item, media_type, viewing_state, state_updated_at: item.state_updated_at || item.added_at || new Date(0).toISOString() };
    if (!unique.has(keyOf(normalized))) unique.set(keyOf(normalized), normalized);
  });
  return [...unique.values()];
}

export function loadWatchlist(storage = window.localStorage) {
  const rawCurrent = readJson(WATCHLIST_STORAGE_KEY, [], storage);
  let current = normalizeWatchlist(rawCurrent);
  if (current.length) {
    if (JSON.stringify(rawCurrent) !== JSON.stringify(current)) writeJson(WATCHLIST_STORAGE_KEY, current, storage);
    return current;
  }
  const legacy = normalizeWatchlist(readJson(LEGACY_WATCHLIST_STORAGE_KEY, [], storage));
  if (legacy.length) {
    writeJson(WATCHLIST_STORAGE_KEY, legacy, storage);
    storage.removeItem(LEGACY_WATCHLIST_STORAGE_KEY);
  }
  return legacy;
}

export function saveWatchlist(watchlist, storage = window.localStorage) {
  return writeJson(WATCHLIST_STORAGE_KEY, normalizeWatchlist(watchlist), storage);
}

export function setViewingState(watchlist, item, viewingState = DEFAULT_VIEWING_STATE) {
  const normalized = normalizeWatchlist(watchlist);
  if (!item || !Number.isFinite(item.id) || !VIEWING_STATES.includes(viewingState)) return { watchlist: normalized, changed: false };
  const media_type = mediaTypeOf(item);
  const key = `${media_type}:${item.id}`;
  const next = { ...item, media_type, viewing_state: viewingState, state_updated_at: new Date().toISOString() };
  const index = normalized.findIndex((entry) => keyOf(entry) === key);
  if (index < 0) return { watchlist: [...normalized, next], changed: true };
  const updated = [...normalized];
  updated[index] = { ...normalized[index], ...next };
  return { watchlist: updated, changed: normalized[index].viewing_state !== viewingState };
}

export function addMovieToWatchlist(watchlist, movie) {
  const normalized = normalizeWatchlist(watchlist);
  if (!movie || !Number.isFinite(movie.id)) return { watchlist: normalized, added: false };
  if (normalized.some((item) => keyOf(item) === keyOf(movie))) return { watchlist: normalized, added: false };
  const result = setViewingState(normalized, movie, DEFAULT_VIEWING_STATE);
  return { watchlist: result.watchlist, added: true };
}

export function removeMovieFromWatchlist(watchlist, movieOrId) {
  const id = typeof movieOrId === "object" ? movieOrId.id : movieOrId;
  const mediaType = typeof movieOrId === "object" ? mediaTypeOf(movieOrId) : null;
  return normalizeWatchlist(watchlist).filter((item) => item.id !== id || (mediaType && mediaTypeOf(item) !== mediaType));
}
