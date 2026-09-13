import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchTitles } from "../api/tmdb";
import MovieResultsGrid from "../components/MovieResultsGrid";
import Pagination from "../components/Pagination";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { saveRecentSearch } from "../utils/searchHistory";

const SearchPage = ({
  watchlist,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";
  const page = Math.max(Number.parseInt(searchParams.get("page") || "1", 10), 1);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState("");

  usePageMetadata({
    title: query ? "Search results for " + query : "Search Movies and TV Shows",
    description: query
      ? "Browse FlickMuse movie and TV show results for " + query + "."
      : "Search FlickMuse for movies, TV shows, cast information, trailers, and recommendations.",
    robots: "noindex,follow",
  });

  useEffect(() => {
    if (!query) {
      setResults([]);
      setTotalResults(0);
      setTotalPages(1);
      setLoading(false);
      return undefined;
    }

    saveRecentSearch(query);
    const controller = new AbortController();

    const loadResults = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await searchTitles(query, page, controller.signal);
        const titleResults = (data.results || []).filter((result) => result.media_type === "movie" || result.media_type === "tv");
        setResults(titleResults);
        setTotalResults(data.total_results || titleResults.length);
        setTotalPages(Math.min(data.total_pages || 1, 500));
      } catch (requestError) {
        if (requestError.name === "AbortError") return;
        setError(requestError.message || "Search results could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadResults();
    return () => controller.abort();
  }, [query, page]);

  const changePage = (nextPage) => {
    setSearchParams({ q: query, page: String(nextPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!query) {
    return (
      <section className="flex min-h-[68vh] items-center justify-center px-5 py-20 text-center">
        <div className="max-w-lg">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-[#11151c] text-red-400">
            <Search className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
            Search FlickMuse

          </h1>
          <p className="mt-4 leading-7 text-gray-400">
            Use the search field in the navigation to find movies and TV shows by title.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[75vh] bg-[#080a0f] py-12 text-white sm:py-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <header className="mb-10 border-b border-white/10 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400 sm:text-sm">
            Search results
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
            “{query}”
          </h1>
          {!loading && !error && (
            <p className="mt-3 text-sm text-gray-500">
              {totalResults.toLocaleString()} results found
            </p>
          )}
        </header>

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-950/20 p-8 text-center text-gray-300">
            {error}
          </div>
        ) : (
          <MovieResultsGrid
            movies={results}
            loading={loading}
            hasNextPage={page < totalPages}
            watchlist={watchlist}
            handleAddToWatchlist={handleAddToWatchlist}
            handleRemoveFromWatchlist={handleRemoveFromWatchlist}
            emptyMessage={"No movies or TV shows matched “" + query + "”."}
          />
        )}

        {!error && !loading && results.length > 0 && (
          <Pagination
            pageNo={page}
            currentPage={page}
            loading={loading}
            handlePreviousPage={() => changePage(Math.max(page - 1, 1))}
            handleNextPage={() => changePage(page + 1)}
          />
        )}
      </div>
    </section>
  );
};

export default SearchPage;
