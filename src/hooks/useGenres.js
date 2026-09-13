import { useEffect, useMemo, useState } from "react";
import { getMovieGenres, getTVGenres } from "../api/tmdb";

export function useGenres(mediaType = "movie") {
  const [genres, setGenres] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    const loadGenres = mediaType === "both"
      ? Promise.all([getMovieGenres(controller.signal), getTVGenres(controller.signal)])
        .then(([movies, television]) => {
          const uniqueGenres = new Map();
          [...(movies.genres || []), ...(television.genres || [])].forEach((genre) => {
            if (!uniqueGenres.has(genre.id)) uniqueGenres.set(genre.id, genre);
          });
          return [...uniqueGenres.values()];
        })
      : (mediaType === "tv" ? getTVGenres : getMovieGenres)(controller.signal)
        .then((data) => data.genres || []);

    loadGenres.then(setGenres).catch(() => {});
    return () => controller.abort();
  }, [mediaType]);
  const genreMap = useMemo(() => Object.fromEntries(genres.map((genre) => [genre.id, genre.name])), [genres]);
  return { genres, genreMap };
}
