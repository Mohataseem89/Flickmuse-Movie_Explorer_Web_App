import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  getPopularMovies,
  searchTitles,
} from "../api/tmdb";

import MovieResultsGrid from "../components/MovieResultsGrid";
import PersonCard from "../components/PersonCard";
import Pagination from "../components/Pagination";
import ResultsAnnouncer from "../components/ResultsAnnouncer";

import { usePageMetadata } from "../hooks/usePageMetadata";

import { saveRecentSearch } from "../utils/searchHistory";
import { normalizeSearchResult } from "../utils/media";

export default function SearchPage({
  watchlist,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
}) {
  const [sp, setSp] = useSearchParams();

  const query =
    sp.get("q")?.trim() || "";

  const page = Math.max(
    parseInt(sp.get("page") || "1"),
    1
  );

  const type = sp.get("type") || "all";

  const [results, setResults] = useState([]);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] =
    useState(Boolean(query));
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState([]);

  usePageMetadata({
    title: query
      ? `Search results for ${query}`
      : "Search Movies, TV Shows and People",

    description: query
      ? `Search FlickMuse for movies, TV shows and people matching ${query}.`
      : "Search FlickMuse for movies, TV shows and people.",

    robots: "noindex,follow",
  });

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    saveRecentSearch(query);

    const c = new AbortController();

    setLoading(true);
    setError("");

    searchTitles(query, page, c.signal)
      .then((d) => {
        setResults(
          (d.results || [])
            .map(normalizeSearchResult)
            .filter(Boolean)
        );

        setPages(
          Math.min(
            d.total_pages || 1,
            500
          )
        );
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e.message);
        }
      })
      .finally(() => {
        if (!c.signal.aborted) {
          setLoading(false);
        }
      });

    return () => c.abort();
  }, [query, page]);

  const filtered = useMemo(
    () =>
      results.filter(
        (r) =>
          type === "all" ||
          (type === "people"
            ? r.resultType === "person"
            : r.mediaType === type)
      ),
    [results, type]
  );

  const media = filtered.filter(
    (r) => r.resultType === "media"
  );

  const people = filtered.filter(
    (r) => r.resultType === "person"
  );

  useEffect(() => {
    if (
      loading ||
      error ||
      !query ||
      results.length
    ) {
      return;
    }

    getPopularMovies(1)
      .then((d) =>
        setFallback(
          (d.results || []).slice(0, 6)
        )
      )
      .catch(() => {});
  }, [
    loading,
    error,
    query,
    results.length,
  ]);

  const setType = (v) => {
    const n = new URLSearchParams(sp);

    if (v === "all") {
      n.delete("type");
    } else {
      n.set("type", v);
    }

    n.delete("page");
    setSp(n);
  };

  const changePage = (n) => {
    const x = new URLSearchParams(sp);

    x.set("page", String(n));
    setSp(x);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!query) {
    return (
      <section className="flex min-h-[68vh] items-center justify-center px-5 text-center">
        <div>
          <Search className="mx-auto h-10 w-10 text-red-400" />

          <h1 className="mt-5 text-4xl font-black">
            Search FlickMuse
          </h1>

          <p className="mt-3 text-gray-400">
            Find movies, TV shows, actors,
            directors and creators.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[75vh] bg-[#080a0f] py-12 text-white">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <h1 className="text-4xl font-black">
          “{query}”
        </h1>

        <div
          className="mt-6 flex flex-wrap gap-2"
          aria-label="Search result type"
        >
          {[
            ["all", "All"],
            ["movie", "Movies"],
            ["tv", "TV Shows"],
            ["people", "People"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setType(v)}
              className={`min-h-11 rounded-full border px-4 text-sm font-bold ${
                type === v
                  ? "border-red-500 bg-red-500/15"
                  : "border-white/10"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <ResultsAnnouncer
          loading={loading}
          page={page}
          count={filtered.length}
          label={`search results for ${query}`}
        />

        {error ? (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-500/20 p-5 text-red-200"
          >
            {error}
          </div>
        ) : (
          <div className="mt-9 space-y-10">
            {media.length > 0 && (
              <MovieResultsGrid
                movies={media}
                loading={loading}
                watchlist={watchlist}
                handleAddToWatchlist={
                  handleAddToWatchlist
                }
                handleRemoveFromWatchlist={
                  handleRemoveFromWatchlist
                }
              />
            )}

            {people.length > 0 && (
              <section>
                <h2 className="mb-5 text-2xl font-black">
                  People
                </h2>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                  {people.map((p) => (
                    <PersonCard
                      key={p.id}
                      person={p}
                    />
                  ))}
                </div>
              </section>
            )}

            {!loading &&
              filtered.length === 0 && (
                <div className="rounded-3xl border border-white/10 p-7">
                  <h2 className="text-2xl font-black">
                    No results for “{query}”
                  </h2>

                  <p className="mt-3 text-gray-400">
                    Check the spelling, try fewer
                    words, or search for a movie,
                    TV show, or person.
                  </p>

                  {fallback.length > 0 && (
                    <div className="mt-8">
                      <h3 className="mb-5 text-xl font-black">
                        Popular right now
                      </h3>

                      <MovieResultsGrid
                        movies={fallback}
                        loading={false}
                        watchlist={watchlist}
                        handleAddToWatchlist={
                          handleAddToWatchlist
                        }
                        handleRemoveFromWatchlist={
                          handleRemoveFromWatchlist
                        }
                      />
                    </div>
                  )}
                </div>
              )}
          </div>
        )}

        {!error &&
          !loading &&
          results.length > 0 && (
            <Pagination
              currentPage={page}
              pageNo={page}
              loading={false}
              hasNextPage={page < pages}
              handlePreviousPage={() =>
                changePage(
                  Math.max(1, page - 1)
                )
              }
              handleNextPage={() =>
                changePage(page + 1)
              }
            />
          )}
      </div>
    </section>
  );
}