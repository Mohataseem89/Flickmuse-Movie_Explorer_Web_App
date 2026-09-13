import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { discoverMovies } from "../api/tmdb";
import MovieResultsGrid from "../components/MovieResultsGrid";
import Pagination from "../components/Pagination";
import FilterChipGroup from "../components/FilterChipGroup";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { useGenres } from "../hooks/useGenres";

const sortOptions = [
  { value: "popularity.desc", label: "Most popular" },
  { value: "vote_average.desc", label: "Highest rated" },
  { value: "primary_release_date.desc", label: "Newest releases" },
  { value: "revenue.desc", label: "Highest grossing" },
];

export default function DiscoverPage({
  watchlist,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { genres } = useGenres();
  const [movies, setMovies] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageMetadata({
    title: "Discover Movies by Genre, Year and Rating",
    description:
      "Find movies by genre, release year, rating, and popularity with FlickMuse filters for your next watch.",
    canonicalPath: "/discover",
  });

  const filters = useMemo(
    () => ({
      genre: searchParams.get("genre") || "",
      year: searchParams.get("year") || "",
      sortBy: searchParams.get("sort") || "popularity.desc",
      minimumRating: searchParams.get("rating") || "",
      page: Number(searchParams.get("page")) || 1,
    }),
    [searchParams]
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    discoverMovies(filters, controller.signal)
      .then((data) => {
        setMovies(data.results || []);
        setTotalResults(data.total_results || 0);
        setTotalPages(Math.min(data.total_pages || 1, 500));
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filters]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const updatePage = (page) => {
    const next = new URLSearchParams(searchParams);
    if (page > 1) next.set("page", String(page));
    else next.delete("page");
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => setSearchParams({});

  const years = Array.from(
    { length: 60 },
    (_, index) => new Date().getFullYear() + 1 - index
  );
  const genreOptions = [{ value: "", label: "All genres" }, ...genres.map((genre) => ({ value: genre.id, label: genre.name }))];
  const ratingOptions = [
    { value: "", label: "Any rating" },
    { value: "6", label: "6+ / 10" },
    { value: "7", label: "7+ / 10" },
    { value: "8", label: "8+ / 10" },
  ];

  return (
    <section className="min-h-[75vh] bg-[#080a0f] py-12 text-white sm:py-16">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400 sm:text-sm">
          Find your next movie
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
          Discover movies
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-gray-400">
          Combine genre, year, rating, and sorting filters. Your selection stays
          in the URL, so the result is easy to bookmark or share.
        </p>

        <div className="mt-9 rounded-3xl border border-white/10 bg-[#0d1118] p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
            <SlidersHorizontal className="h-4 w-4 text-red-400" aria-hidden="true" />
            Refine results
          </div>
          <div className="mt-5 grid gap-5">
            <FilterChipGroup label="Genre" value={filters.genre} options={genreOptions} onChange={(value) => updateFilter("genre", value)} />
            <label className="block max-w-sm text-xs font-bold uppercase tracking-wider text-gray-500">
              Release year
              <span className="relative mt-2 block">
                <select
                  value={filters.year}
                  onChange={(event) => updateFilter("year", event.target.value)}
                  className="min-h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-4 pr-11 text-sm font-bold normal-case tracking-normal text-gray-100 outline-none transition-colors hover:border-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                >
                  <option value="">Any year</option>
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              </span>
            </label>
            <FilterChipGroup label="Minimum rating" value={filters.minimumRating} options={ratingOptions} onChange={(value) => updateFilter("rating", value)} />
            <FilterChipGroup label="Sort by" value={filters.sortBy} options={sortOptions} onChange={(value) => updateFilter("sort", value)} />
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold text-gray-300 transition-colors hover:bg-white/10 hover:text-white sm:w-fit"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset filters
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Results
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {loading ? "Finding movies…" : totalResults.toLocaleString() + " matches"}
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            Page {filters.page} of {totalPages}
          </p>
        </div>

        {error ? (
          <div role="alert" className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
            {error}
          </div>
        ) : (
          <MovieResultsGrid
            movies={movies}
            loading={loading}
            emptyMessage="No movies match this filter combination. Try widening your choices."
            watchlist={watchlist}
            handleAddToWatchlist={handleAddToWatchlist}
            handleRemoveFromWatchlist={handleRemoveFromWatchlist}
          />
        )}

        {!error && movies.length > 0 && (
          <Pagination
            currentPage={filters.page}
            pageNo={filters.page}
            loading={loading}
            hasNextPage={filters.page < totalPages}
            handlePreviousPage={() => updatePage(Math.max(1, filters.page - 1))}
            handleNextPage={() => updatePage(Math.min(totalPages, filters.page + 1))}
          />
        )}
      </div>
    </section>
  );
}
