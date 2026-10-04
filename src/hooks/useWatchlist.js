import { useCallback, useState } from "react";

import {
  addMovieToWatchlist,
  loadWatchlist,
  removeMovieFromWatchlist,
  saveWatchlist,
  setViewingState,
} from "../utils/watchlist";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(
    loadWatchlist
  );

  const commit = useCallback(
    (next) => {
      saveWatchlist(next);
      setWatchlist(next);
    },
    []
  );

  const addToWatchlist = useCallback(
    (movie) => {
      const result = addMovieToWatchlist(
        watchlist,
        movie
      );

      if (!result.added) {
        return false;
      }

      commit(result.watchlist);

      return true;
    },
    [watchlist, commit]
  );

  const removeFromWatchlist = useCallback(
    (movie) => {
      commit(
        removeMovieFromWatchlist(
          watchlist,
          movie
        )
      );
    },
    [watchlist, commit]
  );

  const changeViewingState = useCallback(
    (movie, state) => {
      const result = setViewingState(
        watchlist,
        movie,
        state
      );

      commit(result.watchlist);

      return result.changed;
    },
    [watchlist, commit]
  );

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    changeViewingState,
  };
}