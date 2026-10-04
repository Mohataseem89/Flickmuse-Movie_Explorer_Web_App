import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { discoverMovies } from "../api/tmdb";

import MovieResultsGrid from "../components/MovieResultsGrid";
import Pagination from "../components/Pagination";
import ResultsAnnouncer from "../components/ResultsAnnouncer";

import { usePageMetadata } from "../hooks/usePageMetadata";

import { absoluteUrl } from "../seo/site";
import {
  getGenreBySlug,
  MOVIE_GENRES,
} from "../seo/catalog";

import { getMediaPath } from "../utils/mediaUrl";

export default function GenrePage(props) {
  const { slug } = useParams();

  const genre = getGenreBySlug(slug);
  const genreId = genre?.id;

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

  const canonicalPath =
    genre?.path || `/genre/${slug}`;

  const itemList = useMemo(
    () =>
      genre && state.movies.length
        ? {
            "@context":
              "https://schema.org",
            "@type": "ItemList",
            name: `${genre.name} movies`,
            itemListElement:
              state.movies.map(
                (movie, index) => ({
                  "@type": "ListItem",
                  position:
                    (page - 1) * 20 +
                    index +
                    1,
                  url: absoluteUrl(
                    getMediaPath(
                      movie,
                      "movie"
                    )
                  ),
                  name: movie.title,
                })
              ),
          }
        : undefined,
    [genre, state.movies, page]
  );

  usePageMetadata({
    title: genre
      ? `${genre.name} Movies — Popular Picks & Ratings`
      : "Genre not found",

    description:
      genre?.description ||
      "Browse movie genres on FlickMuse.",

    canonicalPath,

    robots: genre
      ? "index,follow"
      : "noindex,follow",

    structuredData: itemList,
  });

  useEffect(() => {
    if (!genreId) {
      setState({
        movies: [],
        totalPages: 1,
        totalResults: 0,
        loading: false,
        error: "",
      });

      return;
    }

    const controller =
      new AbortController();

    setState((s) => ({
      ...s,
      loading: true,
      error: "",
    }));

    discoverMovies(
      {
        genre: String(genreId),
        page,
      },
      controller.signal
    )
      .then((data) =>
        setState({
          movies: (data.results || []).map(
            (x) => ({
              ...x,
              media_type: "movie",
            })
          ),

          totalPages: Math.min(
            data.total_pages || 1,
            500
          ),

          totalResults:
            data.total_results || 0,

          loading: false,
          error: "",
        })
      )
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState((s) => ({
            ...s,
            loading: false,
            error:
              error.message ||
              "Movies could not be loaded.",
          }));
        }
      });

    return () => controller.abort();
  }, [genreId, page]);

  if (!genre) {
    return (
      <section className="mx-auto min-h-[65vh] max-w-3xl px-5 py-20 text-center text-white">
        <h1 className="text-4xl font-black">
          Genre not found
        </h1>

        <p className="mt-4 text-gray-400">
          That genre is not available. Browse
          one of FlickMuse’s supported movie
          genres instead.
        </p>

        <Link
          to="/discover"
          className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-red-600 px-5 font-bold"
        >
          Browse movies
        </Link>
      </section>
    );
  }

  const changePage = (next) => {
    const p = new URLSearchParams();

    if (next > 1) {
      p.set("page", String(next));
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
            Movie genre
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
            {genre.name} movies
          </h1>

          <p className="mt-5 leading-7 text-gray-300">
            {genre.description} Use the pages
            below to explore more titles without
            losing this genre focus.
          </p>
        </header>

        <nav
          aria-label="Other movie genres"
          className="mt-8 flex gap-2 overflow-x-auto pb-2"
        >
          {MOVIE_GENRES.filter(
            (x) => x.id !== genre.id
          )
            .slice(0, 8)
            .map((x) => (
              <Link
                key={x.id}
                to={x.path}
                className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 hover:border-red-500/40 hover:text-white"
              >
                {x.name}
              </Link>
            ))}
        </nav>

        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-gray-400">
              Results
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {state.loading
                ? "Finding movies…"
                : `${state.totalResults.toLocaleString()} ${genre.name.toLowerCase()} movies`}
            </h2>
          </div>

          <Link
            to="/top-rated"
            className="text-sm font-bold text-red-400 hover:text-red-300"
          >
            Browse top-rated →
          </Link>
        </div>

        <ResultsAnnouncer
          loading={state.loading}
          page={page}
          count={state.totalResults}
          label={`${genre.name} movies`}
        />

        {state.error ? (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200"
          >
            {state.error}
          </div>
        ) : (
          <MovieResultsGrid
            movies={state.movies}
            loading={state.loading}
            emptyMessage={`No ${genre.name.toLowerCase()} movies were found.`}
            {...props}
          />
        )}

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