import { useCallback, useState } from "react";
import {
  addMovieToWatchlist,
  loadWatchlist,
  removeMovieFromWatchlist,
  saveWatchlist,
} from "../utils/watchlist";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(loadWatchlist);

  const addToWatchlist = useCallback(
    (movie) => {
      const result = addMovieToWatchlist(watchlist, movie);
      if (!result.added) return false;

      saveWatchlist(result.watchlist);
      setWatchlist(result.watchlist);
      return true;
    },
    [watchlist]
  );

  const removeFromWatchlist = useCallback(
    (movie) => {
      const updatedWatchlist = removeMovieFromWatchlist(watchlist, movie);
      saveWatchlist(updatedWatchlist);
      setWatchlist(updatedWatchlist);
    },
    [watchlist]
  );

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
  };
}
