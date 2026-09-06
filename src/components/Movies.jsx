import { Film } from "lucide-react";
import { useEffect, useState } from "react";
import { getPopularMovies } from "../api/tmdb";
import MovieCards from "./MovieCards";
import Pagination from "./Pagination";

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
  const [movies, setMovies] = useState([]);
  const [pageNo, setPageNo] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

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

  useEffect(() => {
    const controller = new AbortController();

    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getPopularMovies(pageNo, controller.signal);
        setMovies(data.results ?? []);
      } catch (requestError) {
        if (requestError.name === "AbortError") return;
        setError(requestError.message || "Unable to load movies.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchMovies();
    return () => controller.abort();
  }, [pageNo, retryCount]);

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

          <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-gray-400 sm:self-auto">
            <Film className="h-4 w-4 text-red-400" aria-hidden="true" />
            Page {pageNo}
          </div>
        </div>

        {error ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-red-500/20 bg-red-950/20 p-8 text-center sm:p-10">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <Film className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-xl font-bold">Movies could not be loaded</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">{error}</p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-6 min-h-11 rounded-xl bg-red-600 px-5 font-bold text-white transition-colors hover:bg-red-500"
            >
              Try again
            </button>
          </div>
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
