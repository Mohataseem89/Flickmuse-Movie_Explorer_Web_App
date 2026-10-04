import test from "node:test";
import assert from "node:assert/strict";

import {
  addMovieToWatchlist,
  DEFAULT_VIEWING_STATE,
  loadWatchlist,
  normalizeWatchlist,
  removeMovieFromWatchlist,
  setViewingState,
  VIEWING_STATES,
  WATCHLIST_STORAGE_KEY,
} from "../src/utils/watchlist.js";

function storage(initial = {}) {
  const map = new Map(Object.entries(initial));

  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test(
  "legacy binary entries migrate to Want to Watch without duplicates",
  () => {
    const result = normalizeWatchlist([
      {
        id: 10,
        title: "First",
      },
      {
        id: 10,
        title: "Duplicate",
      },
      {
        id: 11,
        title: "Second",
        media_type: "tv",
      },
    ]);

    assert.equal(result.length, 2);

    assert.equal(
      result[0].viewing_state,
      DEFAULT_VIEWING_STATE
    );

    assert.equal(
      result[1].media_type,
      "tv"
    );
  }
);

test(
  "add remains backward compatible and assigns default state",
  () => {
    const result = addMovieToWatchlist(
      [],
      {
        id: 42,
        title: "The Answer",
      }
    );

    assert.equal(result.added, true);

    assert.equal(
      result.watchlist[0].viewing_state,
      "want-to-watch"
    );

    assert.equal(
      addMovieToWatchlist(
        result.watchlist,
        {
          id: 42,
          title: "The Answer",
        }
      ).added,
      false
    );
  }
);

test(
  "one title has one current viewing state",
  () => {
    let list = setViewingState(
      [],
      {
        id: 1,
        title: "One",
      },
      "watching"
    ).watchlist;

    list = setViewingState(
      list,
      {
        id: 1,
        title: "One",
      },
      "watched"
    ).watchlist;

    assert.equal(list.length, 1);

    assert.equal(
      list[0].viewing_state,
      "watched"
    );

    assert.deepEqual(
      VIEWING_STATES,
      [
        "want-to-watch",
        "watching",
        "watched",
      ]
    );
  }
);

test(
  "movie and TV ids do not collide",
  () => {
    let list = setViewingState(
      [],
      {
        id: 1,
        title: "Movie",
        media_type: "movie",
      },
      "watched"
    ).watchlist;

    list = setViewingState(
      list,
      {
        id: 1,
        name: "TV",
        media_type: "tv",
      },
      "watching"
    ).watchlist;

    assert.equal(list.length, 2);
  }
);

test(
  "remove targets the selected media identity",
  () => {
    const list = normalizeWatchlist([
      {
        id: 2,
        title: "Movie",
      },
      {
        id: 2,
        name: "TV",
        media_type: "tv",
      },
    ]);

    const result = removeMovieFromWatchlist(
      list,
      {
        id: 2,
        media_type: "movie",
      }
    );

    assert.equal(result.length, 1);

    assert.equal(
      result[0].media_type,
      "tv"
    );
  }
);

test(
  "load migrates existing current-format binary entries idempotently",
  () => {
    const s = storage({
      [WATCHLIST_STORAGE_KEY]: JSON.stringify([
        {
          id: 7,
          title: "Saved",
        },
      ]),
    });

    const first = loadWatchlist(s);
    const second = loadWatchlist(s);

    assert.equal(
      first[0].viewing_state,
      "want-to-watch"
    );

    assert.deepEqual(
      second,
      first
    );
  }
);