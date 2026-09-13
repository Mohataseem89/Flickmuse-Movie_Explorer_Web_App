import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getNowPlayingMovies,
  getTopRatedMovies,
  getUpcomingMovies,
} from "../api/tmdb";
import MovieCards from "./MovieCards";

const collections = [
  {
    key: "nowPlaying",
    eyebrow: "In cinemas",
    title: "Now playing",
    description: "Movies currently lighting up the big screen.",
  },
  {
    key: "upcoming",
    eyebrow: "Plan your next watch",
    title: "Coming soon",
    description: "Upcoming releases worth keeping on your radar.",
  },
  {
    key: "topRated",
    eyebrow: "Audience favorites",
    title: "Top rated",
    description: "Acclaimed films with consistently strong ratings.",
  },
];

function RowSkeleton() {
  return (
    <div className="movie-row mt-7 flex gap-4 overflow-hidden sm:gap-5">
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={index}
          className="w-[42vw] max-w-[190px] shrink-0 animate-pulse"
        >
          <div className="aspect-[2/3] rounded-2xl bg-white/[0.07]" />
          <div className="mt-3 h-4 w-4/5 rounded bg-white/[0.06]" />
          <div className="mt-2 h-3 w-2/5 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

export default function DiscoveryRows({
  watchlist,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
}) {
  const [rows, setRows] = useState({
    nowPlaying: [],
    upcoming: [],
    topRated: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      getNowPlayingMovies(controller.signal),
      getUpcomingMovies(controller.signal),
      getTopRatedMovies(controller.signal),
    ])
      .then(([nowPlaying, upcoming, topRated]) => {
        setRows({
          nowPlaying: nowPlaying.results || [],
          upcoming: upcoming.results || [],
          topRated: topRated.results || [],
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Unable to load movie collections:", error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="content-auto border-b border-white/[0.07] bg-[#0b0e14] py-16 sm:py-20">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400 sm:text-sm">
              Curated discovery
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Browse collections
            </h2>
          </div>
          <Link
            to="/discover"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-gray-200 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Open all filters
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-12 space-y-14 sm:space-y-16">
          {collections.map((collection) => (
            <section key={collection.key} aria-labelledby={collection.key + "-title"}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                {collection.eyebrow}
              </p>
              <h3
                id={collection.key + "-title"}
                className="mt-2 text-2xl font-black tracking-[-0.03em]"
              >
                {collection.title}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {collection.description}
              </p>

              {loading ? (
                <RowSkeleton />
              ) : (
                <div className="movie-row mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 sm:gap-5">
                  {rows[collection.key].slice(0, 14).map((movie) => (
                    <div
                      key={movie.id}
                      className="w-[42vw] max-w-[190px] shrink-0 snap-start sm:w-[190px]"
                    >
                      <MovieCards
                        movie={movie}
                        watchlist={watchlist}
                        handleAddToWatchlist={handleAddToWatchlist}
                        handleRemoveFromWatchlist={handleRemoveFromWatchlist}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
