import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import { getTopRatedMovies } from "../api/tmdb";

import MovieResultsGrid from "../components/MovieResultsGrid";
import Pagination from "../components/Pagination";
import ResultsAnnouncer from "../components/ResultsAnnouncer";

import { usePageMetadata } from "../hooks/usePageMetadata";

import {
  CATEGORY_PAGES,
  MOVIE_GENRES,
} from "../seo/catalog";

import { absoluteUrl } from "../seo/site";
import { getMediaPath } from "../utils/mediaUrl";

export default function TopRatedPage(props) {
  const meta = CATEGORY_PAGES["top-rated"];

  const [params, setParams] =
    useSearchParams();

  const page = Math.max(
    Number(params.get("page")) || 1,
    1
  );

  const [state, setState] = useState({
    movies: [],
    totalPages: 1,
    totalResults: 0,
    loading: true,
    error: "",
  });

  const schema = useMemo(
    () =>
      state.movies.length
        ? {
            "@context":
              "https://schema.org",
            "@type": "ItemList",
            name: meta.title,
            itemListElement:
              state.movies.map(
                (m, i) => ({
                  "@type": "ListItem",
                  position:
                    (page - 1) * 20 +
                    i +
                    1,
                  url: absoluteUrl(
                    getMediaPath(m, "movie")
                  ),
                  name: m.title,
                })
              ),
          }
        : undefined,
    [state.movies, page, meta.title]
  );

  usePageMetadata({
    title: "Top-Rated Movies — Audience Favorites",
    description: meta.description,
    canonicalPath: meta.path,
    structuredData: schema,
  });

  useEffect(() => {
    const c = new AbortController();

    setState((s) => ({
      ...s,
      loading: true,
      error: "",
    }));

    getTopRatedMovies(page, c.signal)
      .then((d) =>
        setState({
          movies: (d.results || []).map(
            (x) => ({
              ...x,
              media_type: "movie",
            })
          ),

          totalPages: Math.min(
            d.total_pages || 1,
            500
          ),

          totalResults:
            d.total_results || 0,

          loading: false,
          error: "",
        })
      )
      .catch((e) => {
        if (e.name !== "AbortError") {
          setState((s) => ({
            ...s,
            loading: false,
            error: e.message,
          }));
        }
      });

    return () => c.abort();
  }, [page]);

  const changePage = (n) => {
    const p = new URLSearchParams();

    if (n > 1) {
      p.set("page", String(n));
    }

    setParams(p);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <section className="min-h-[75vh] bg-[#080a0f] py-12 text-white sm:py-16">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-red-400">
            {meta.eyebrow}
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
            {meta.title}
          </h1>

          <p className="mt-5 leading-7 text-gray-300">
            {meta.description} Ratings are a
            discovery signal, not an editorial
            ranking by FlickMuse.
          </p>
        </header>

        <div className="mt-7 flex flex-wrap gap-2">
          {MOVIE_GENRES.slice(0, 7).map(
            (g) => (
              <Link
                key={g.id}
                to={g.path}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 hover:text-white"
              >
                {g.name}
              </Link>
            )
          )}
        </div>

        <div className="mt-10">
          <ResultsAnnouncer
            loading={state.loading}
            page={page}
            count={state.totalResults}
            label="top-rated movies"
          />

          {state.error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200"
            >
              {state.error}
            </div>
          ) : (
            <MovieResultsGrid
              movies={state.movies}
              loading={state.loading}
              emptyMessage="No top-rated movies are available right now."
              {...props}
            />
          )}
        </div>

        {!state.error &&
          !state.loading &&
          state.movies.length > 0 && (
            <Pagination
              currentPage={page}
              pageNo={page}
              loading={false}
              hasNextPage={
                page < state.totalPages
              }
              handlePreviousPage={() =>
                changePage(
                  Math.max(1, page - 1)
                )
              }
              handleNextPage={() =>
                changePage(
                  Math.min(
                    state.totalPages,
                    page + 1
                  )
                )
              }
            />
          )}
      </div>
    </section>
  );
}