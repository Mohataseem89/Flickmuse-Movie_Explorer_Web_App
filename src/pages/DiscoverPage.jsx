import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { discoverMovies, discoverTV, discoverTitles } from "../api/tmdb";
import MovieResultsGrid from "../components/MovieResultsGrid";
import Pagination from "../components/Pagination";
import FilterChipGroup from "../components/FilterChipGroup";
import ResultsAnnouncer from "../components/ResultsAnnouncer";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { useGenres } from "../hooks/useGenres";

const sortOptions = [
  { value: "popularity.desc", label: "Most popular" },
  { value: "vote_average.desc", label: "Highest rated" },
  { value: "primary_release_date.desc", label: "Newest releases" },
  { value: "revenue.desc", label: "Highest grossing" },
];

const sharedSortOptions = sortOptions.filter((option) => option.value !== "revenue.desc");
const contentTypeOptions = [
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV shows" },
  { value: "both", label: "Both" },
];

export default function DiscoverPage({
  watchlist,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [both, setBoth] = useState({ movies: [], tv: [], moviePages: 1, tvPages: 1, movieTotal: 0, tvTotal: 0, movieError: "", tvError: "" });

  const filters = useMemo(
    () => ({
      mediaType: searchParams.get("type") || "movie",
      genre: searchParams.get("genre") || "",
      year: searchParams.get("year") || "",
      sortBy: searchParams.get("sort") || "popularity.desc",
      minimumRating: searchParams.get("rating") || "",
      page: Number(searchParams.get("page")) || 1,
      moviePage: Number(searchParams.get("moviePage")) || 1,
      tvPage: Number(searchParams.get("tvPage")) || 1,
    }),
    [searchParams]
  );
  const contentLabel = filters.mediaType === "tv" ? "TV shows" : filters.mediaType === "both" ? "movies and TV shows" : "movies";

  usePageMetadata({
    title: "Discover " + contentLabel + " by Genre, Year and Rating",
    description:
      "Find " + contentLabel + " by genre, release year, rating, and popularity with FlickMuse filters for your next watch.",
    canonicalPath: "/discover",
  });

  const { genres } = useGenres(filters.mediaType);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    if (filters.mediaType === "both") {
      const base = { ...filters }; delete base.page; delete base.moviePage; delete base.tvPage;
      Promise.allSettled([
        discoverMovies({ ...base, page: filters.moviePage }, controller.signal),
        discoverTV({ ...base, page: filters.tvPage, sortBy: filters.sortBy === "primary_release_date.desc" ? "first_air_date.desc" : filters.sortBy }, controller.signal),
      ]).then(([movieResult, tvResult]) => {
        if (controller.signal.aborted) return;
        const movieData = movieResult.status === "fulfilled" ? movieResult.value : {};
        const tvData = tvResult.status === "fulfilled" ? tvResult.value : {};
        setBoth({
          movies: (movieData.results || []).map((item) => ({ ...item, media_type: "movie" })),
          tv: (tvData.results || []).map((item) => ({ ...item, media_type: "tv" })),
          moviePages: Math.min(movieData.total_pages || 1, 500), tvPages: Math.min(tvData.total_pages || 1, 500),
          movieTotal: movieData.total_results || 0, tvTotal: tvData.total_results || 0,
          movieError: movieResult.status === "rejected" ? movieResult.reason?.message || "Movies could not be loaded." : "",
          tvError: tvResult.status === "rejected" ? tvResult.reason?.message || "TV shows could not be loaded." : "",
        });
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    } else {
      discoverTitles(filters, controller.signal).then((data) => {
        setMovies(data.results || []); setTotalResults(data.total_results || 0); setTotalPages(Math.min(data.total_pages || 1, 500));
      }).catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }
    return () => controller.abort();
  }, [filters]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "type" && value !== "movie" && filters.sortBy === "revenue.desc") {
      next.set("sort", "popularity.desc");
    }
    next.delete("page"); next.delete("moviePage"); next.delete("tvPage");
    setSearchParams(next);
  };

  const updatePage = (page) => {
    const next = new URLSearchParams(searchParams);
    if (page > 1) next.set("page", String(page));
    else next.delete("page");
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateBothPage = (kind, page) => {
    const next = new URLSearchParams(searchParams);
    const key = kind === "movie" ? "moviePage" : "tvPage";
    if (page > 1) next.set(key, String(page)); else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const newestYear = new Date().getFullYear() + 1;
  const genreOptions = [{ value: "", label: "All genres" }, ...genres.map((genre) => ({ value: genre.id, label: genre.name }))];
  const availableSortOptions = filters.mediaType === "movie" ? sortOptions : sharedSortOptions;
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
          Find your next title
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
          Discover {contentLabel}
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-gray-400">
          Choose movies, TV shows, or both, then combine genre, year, rating, and sorting filters. Your selection stays
          in the URL, so the result is easy to bookmark or share.
        </p>

        <div className="mt-9 rounded-3xl border border-white/10 bg-[#0d1118] p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
            <SlidersHorizontal className="h-4 w-4 text-red-400" aria-hidden="true" />
            Refine results
          </div>
          <div className="mt-5 grid gap-5">
            <FilterChipGroup label="Content type" value={filters.mediaType} options={contentTypeOptions} onChange={(value) => updateFilter("type", value)} />
            <FilterChipGroup label="Genre" value={filters.genre} options={genreOptions} onChange={(value) => updateFilter("genre", value)} />
            <label className="block max-w-sm text-xs font-bold uppercase tracking-wider text-gray-400">
              Release year
              <input
                type="number"
                inputMode="numeric"
                min="1888"
                max={newestYear}
                step="1"
                value={filters.year}
                onChange={(event) => updateFilter("year", event.target.value)}
                placeholder="Any year"
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold normal-case tracking-normal text-gray-100 outline-none transition-colors placeholder:text-gray-400 hover:border-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              />
            </label>
            <FilterChipGroup label="Minimum rating" value={filters.minimumRating} options={ratingOptions} onChange={(value) => updateFilter("rating", value)} />
            <FilterChipGroup label="Sort by" value={filters.sortBy} options={availableSortOptions} onChange={(value) => updateFilter("sort", value)} />
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

        {filters.mediaType === "both" ? (
          <div className="mt-10 space-y-14">
            {[{key:"movie", title:"Movies", items:both.movies, page:filters.moviePage, pages:both.moviePages, total:both.movieTotal, error:both.movieError},{key:"tv", title:"TV Shows", items:both.tv, page:filters.tvPage, pages:both.tvPages, total:both.tvTotal, error:both.tvError}].map((section) => (
              <section key={section.key} aria-labelledby={`discover-${section.key}`}>
                <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{section.total.toLocaleString()} matches</p><h2 id={`discover-${section.key}`} className="mt-2 text-3xl font-black">{section.title}</h2></div><p className="text-sm text-gray-400">Page {section.page} of {section.pages}</p></div>
                {section.error ? <div role="alert" className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">{section.error}</div> : <MovieResultsGrid movies={section.items} loading={loading} emptyMessage={`No ${section.title.toLowerCase()} match these filters.`} watchlist={watchlist} handleAddToWatchlist={handleAddToWatchlist} handleRemoveFromWatchlist={handleRemoveFromWatchlist}/>}
                {!section.error && section.items.length > 0 && <Pagination currentPage={section.page} pageNo={section.page} loading={loading} hasNextPage={section.page < section.pages} handlePreviousPage={() => updateBothPage(section.key, Math.max(1, section.page - 1))} handleNextPage={() => updateBothPage(section.key, Math.min(section.pages, section.page + 1))}/>}
              </section>
            ))}
          </div>
        ) : (<>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Results</p><h2 className="mt-2 text-2xl font-black">{loading ? "Finding titles…" : totalResults.toLocaleString() + " matches"}</h2></div><p className="text-sm text-gray-400">Page {filters.page} of {totalPages}</p></div>
          <ResultsAnnouncer loading={loading} page={filters.page} count={totalResults} label={contentLabel + " discovery results"}/>
          {error ? <div role="alert" className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">{error}</div> : <MovieResultsGrid movies={movies} loading={loading} emptyMessage={`No ${contentLabel} match this filter combination. Try widening your choices.`} watchlist={watchlist} handleAddToWatchlist={handleAddToWatchlist} handleRemoveFromWatchlist={handleRemoveFromWatchlist}/>}
          {!error && movies.length > 0 && <Pagination currentPage={filters.page} pageNo={filters.page} loading={loading} hasNextPage={filters.page < totalPages} handlePreviousPage={() => updatePage(Math.max(1, filters.page - 1))} handleNextPage={() => updatePage(Math.min(totalPages, filters.page + 1))}/>}
        </>)}
      </div>
    </section>
  );
}
