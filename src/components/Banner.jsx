import { CalendarDays, Clapperboard, Info, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getImageUrl, getTrendingMovies } from "../api/tmdb";

const FEATURED_CACHE_KEY = "FlickMuse_featured_movies";

function readFeaturedCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(FEATURED_CACHE_KEY));
    if (
      Array.isArray(cached?.movies) &&
      cached.movies.length > 0
    ) {
      return cached.movies;
    }
  } catch {
    localStorage.removeItem(FEATURED_CACHE_KEY);
  }

  return [];
}

function saveFeaturedCache(movies) {
  try {
    localStorage.setItem(
      FEATURED_CACHE_KEY,
      JSON.stringify({ movies, savedAt: Date.now() })
    );
  } catch {
    // The banner still works when browser storage is unavailable.
  }
}

const Banner = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState(readFeaturedCache);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(() => readFeaturedCache().length === 0);
  const currentMovie = movies[currentIndex] ?? null;

  useEffect(() => {
    const controller = new AbortController();

    const fetchFeaturedMovies = async () => {
      const hasCachedMovies = readFeaturedCache().length > 0;

      try {
        if (!hasCachedMovies) setLoading(true);
        const data = await getTrendingMovies(controller.signal);
        const featuredMovies = data.results
          .filter((movie) => movie.backdrop_path)
          .slice(0, 6);

        if (featuredMovies.length > 0) {
          setMovies(featuredMovies);
          setCurrentIndex(0);
          saveFeaturedCache(featuredMovies);
        }
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Unable to load featured movies:", error);
        if (hasCachedMovies) return;

        const fallbackMovie = {
          title: "Discover your next favorite movie",
          overview:
            "Browse popular movies, explore every detail, and keep a personal watchlist for movie night.",
          backdrop_path: null,
          vote_average: null,
          release_date: null,
        };
        setMovies([fallbackMovie]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchFeaturedMovies();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (movies.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % movies.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [movies]);

  useEffect(() => {
    if (movies.length <= 1) return undefined;

    const nextMovie = movies[(currentIndex + 1) % movies.length];
    const nextBackdrop = getImageUrl(
      nextMovie.backdrop_path,
      window.innerWidth < 900 ? "w780" : "w1280"
    );

    if (nextBackdrop) {
      const image = new Image();
      image.src = nextBackdrop;
    }

    return undefined;
  }, [currentIndex, movies]);

  const handleBrowseMovies = () => {
    document
      .getElementById("popular-movies")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <section className="home-hero relative min-h-[620px] overflow-hidden bg-[#0d1118] sm:min-h-[680px]">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-900 via-gray-950 to-black" />
        <div className="home-hero-content relative mx-auto flex min-h-[620px] max-w-[1600px] items-end px-5 pb-24 pt-20 sm:min-h-[680px] sm:px-8 lg:items-center lg:pb-20">
          <div className="w-full max-w-2xl">
            <div className="mb-5 h-5 w-40 rounded-full bg-white/10" />
            <div className="mb-4 h-14 w-4/5 rounded-xl bg-white/10 sm:h-20" />
            <div className="mb-8 h-24 max-w-xl rounded-xl bg-white/10" />
            <div className="flex gap-3">
              <div className="h-12 w-40 rounded-xl bg-white/10" />
              <div className="h-12 w-36 rounded-xl bg-white/10" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!currentMovie) return null;

  const releaseYear = currentMovie.release_date
    ? new Date(currentMovie.release_date).getFullYear()
    : "Coming soon";
  const smallBackdropUrl = getImageUrl(currentMovie.backdrop_path, "w780");
  const backdropUrl = getImageUrl(currentMovie.backdrop_path, "w1280");

  return (
    <section
      className="home-hero relative isolate min-h-[620px] overflow-hidden bg-[#0d1118] text-white sm:min-h-[680px]"
      aria-labelledby="flickmuse-discovery-title"
    >
      {backdropUrl ? (
        <img
          key={backdropUrl}
          src={smallBackdropUrl}
          srcSet={smallBackdropUrl + " 780w, " + backdropUrl + " 1280w"}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="hero-image absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-[#111827] to-black" />
      )}

      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#080a0f]/55 to-transparent" />

      <div className="home-hero-content relative mx-auto flex min-h-[620px] max-w-[1600px] items-end px-5 pb-24 pt-20 sm:min-h-[680px] sm:px-8 sm:pb-28 lg:items-center lg:pb-20">
        <div className="max-w-3xl">
          <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-red-400 sm:text-sm">
            <span className="h-px w-8 bg-red-500" />
            Featured this week
          </div>

          <h1
            id="flickmuse-discovery-title"
            className="max-w-3xl text-xl font-black tracking-[-0.025em] text-white [text-shadow:0_3px_22px_rgba(0,0,0,0.8)] sm:text-2xl"
          >
            Discover movies, trailers, and cast
          </h1>

          <h2
            id="featured-movie-title"
            className="mt-3 max-w-3xl text-[clamp(2.5rem,7vw,5.75rem)] font-black leading-[0.95] tracking-[-0.055em] text-white [text-shadow:0_3px_22px_rgba(0,0,0,0.8)]"
          >
            {currentMovie.title}
          </h2>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.95)] sm:text-base">
            <span className="flex items-center gap-2">
              <Star
                className="h-[18px] w-[18px] fill-amber-400 text-amber-400"
                aria-hidden="true"
              />
              {currentMovie.vote_average?.toFixed(1) || "Not rated"}
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays className="h-[18px] w-[18px]" aria-hidden="true" />
              {releaseYear}
            </span>
            <span className="rounded-md border border-white/20 bg-black/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
              Trending
            </span>
          </div>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.95)] sm:text-lg sm:leading-8">
            {currentMovie.overview?.length > 220
              ? currentMovie.overview.substring(0, 220) + "…"
              : currentMovie.overview}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleBrowseMovies}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 font-bold text-white shadow-lg shadow-red-950/30 transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-red-500"
            >
              <Clapperboard className="h-5 w-5" aria-hidden="true" />
              Browse movies
            </button>
            <button
              type="button"
              disabled={!currentMovie.id}
              onClick={() =>
                currentMovie.id && navigate("/movie/" + currentMovie.id)
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 font-bold text-white backdrop-blur-md transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Info className="h-5 w-5" aria-hidden="true" />
              View details
            </button>
          </div>
        </div>

        {movies.length > 1 && (
          <div
            className="absolute bottom-8 left-5 right-5 flex max-w-md gap-2 sm:left-8"
            aria-label="Featured movies"
          >
            {movies.map((movie, index) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={
                  "h-1.5 flex-1 rounded-full transition-colors duration-200 " +
                  (index === currentIndex
                    ? "bg-red-500"
                    : "bg-white/25 hover:bg-white/50")
                }
                aria-label={
                  "Show featured movie " + (index + 1) + ": " + movie.title
                }
                aria-current={index === currentIndex ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Banner;
