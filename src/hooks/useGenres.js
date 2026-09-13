import { useEffect, useMemo, useState } from "react";
import { getMovieGenres, getTVGenres } from "../api/tmdb";

export function useGenres(mediaType = "movie") {
  const [genres, setGenres] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    const loadGenres = mediaType === "tv" ? getTVGenres : getMovieGenres;
    loadGenres(controller.signal).then((data) => setGenres(data.genres || [])).catch(() => {});
    return () => controller.abort();
  }, [mediaType]);
  const genreMap = useMemo(() => Object.fromEntries(genres.map((genre) => [genre.id, genre.name])), [genres]);
  return { genres, genreMap };
}
