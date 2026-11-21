import { Film } from "lucide-react";
import { useState } from "react";
import { getPopularMovies } from "../api/tmdb";
import { useTmdbQuery } from "../hooks/useTmdbQuery";
import LoadError from "./LoadError";
import MovieCards from "./MovieCards";
import Pagination from "./Pagination";
import ResultsAnnouncer from "./ResultsAnnouncer";

const MovieCardSkeleton = () => (
  <div aria-hidden="true">
    <div className="aspect-[2/3] animate-pulse rounded-2xl border border-white/[0.06] bg-[#171c25]" />
    <div className="mx-1 mt-3 h-4 w-4/5 animate-pulse rounded bg-white/10" />
    <div className="mx-1 mt-2 h-3 w-2/5 animate-pulse rounded bg-white/[0.07]" />
  </div>
);

const Movies = ({
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
  watchlist,
}) => {
  const [pageNo, setPageNo] = useState(1);
  const { data, loading, error, retry, cooldownSeconds } = useTmdbQuery(
    (signal) => getPopularMovies(pageNo, signal),
    pageNo,
    { label: "popular movies" }
  );
  const movies = data?.results ?? [];

  const handlePreviousPage = () => {
    if (pageNo > 1) {
      setPageNo((page) => page - 1);
      document
        .getElementById("popular-movies")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    setPageNo((page) => page + 1);
    document
      .getElementById("popular-movies")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="popular-movies"
      className="content-auto scroll-mt-24 bg-[#080a0f] py-16 text-white sm:py-20"
      aria-labelledby="popular-movies-title"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <div className="mb-9 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-red-400 sm:text-sm">
              Discover
            </p>
            <h2
              id="popular-movies-title"
              className="text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl"
            >
              Popular movies
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
              Explore the titles audiences are watching right now and save your
              favorites for later.
            </p>
          </div>

        <ResultsAnnouncer
          loading={loading}
          page={pageNo}
          count={movies.length}
          label="popular movies"
        />

          <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-gray-400 sm:self-auto">
            <Film className="h-4 w-4 text-red-400" aria-hidden="true" />
            Page {pageNo}
          </div>
        </div>

        {error ? (
          <LoadError
            error={error}
            onRetry={retry}
            cooldownSeconds={cooldownSeconds}
            loading={loading}
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {loading
              ? Array.from({ length: 12 }, (_, index) => (
                  <MovieCardSkeleton key={index} />
                ))
              : movies.map((movie) => (
                  <MovieCards
                    key={movie.id}
                    movie={movie}
                    handleAddToWatchlist={handleAddToWatchlist}
                    handleRemoveFromWatchlist={handleRemoveFromWatchlist}
                    watchlist={watchlist}
                  />
                ))}
          </div>
        )}

        {!error && (
          <Pagination
            pageNo={pageNo}
            currentPage={pageNo}
            loading={loading}
            handlePreviousPage={handlePreviousPage}
            handleNextPage={handleNextPage}
          />
        )}
      </div>
    </section>
  );
};

export default Movies;
