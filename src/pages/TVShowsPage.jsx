import { Tv } from "lucide-react";
import { useEffect, useState } from "react";
import { getPopularTV, getTrendingTV } from "../api/tmdb";
import MovieCards from "../components/MovieCards";
import Pagination from "../components/Pagination";
import ResultsAnnouncer from "../components/ResultsAnnouncer";
import { usePageMetadata } from "../hooks/usePageMetadata";

export default function TVShowsPage({ watchlist, handleAddToWatchlist, handleRemoveFromWatchlist }) {
  const [shows, setShows] = useState([]);
  const [trending, setTrending] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageMetadata({ title: "Popular TV Shows", description: "Discover trending and popular TV shows, trailers, cast, seasons, and streaming providers on FlickMuse.", canonicalPath: "/tv" });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    Promise.all([getPopularTV(page, controller.signal), page === 1 ? getTrendingTV(controller.signal) : Promise.resolve({ results: [] })])
      .then(([popular, weeklyTrending]) => { setShows((popular.results || []).map((show) => ({ ...show, media_type: "tv" }))); if (page === 1) setTrending((weeklyTrending.results || []).map((show) => ({ ...show, media_type: "tv" }))); })
      .catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message || "Unable to load TV shows."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page]);

  const cardProps = { watchlist, handleAddToWatchlist, handleRemoveFromWatchlist };
  return <section className="min-h-[75vh] bg-[#080a0f] py-12 text-white sm:py-16"><div className="mx-auto max-w-[1600px] px-5 sm:px-8">
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">Series discovery</p>
    <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">TV shows</h1>
    <p className="mt-4 max-w-2xl leading-7 text-gray-400">Find your next series, then explore its trailer, cast, seasons, and available streaming providers.</p>
    <ResultsAnnouncer loading={loading} page={page} count={shows.length} label="popular TV shows" />
    {page === 1 && trending.length > 0 && <section className="mt-12" aria-labelledby="trending-tv-title"><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">This week</p><h2 id="trending-tv-title" className="mt-2 text-2xl font-black">Trending now</h2><div className="movie-row mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 sm:gap-5">{trending.slice(0, 12).map((show) => <div key={show.id} className="w-[42vw] max-w-[190px] shrink-0 snap-start sm:w-[190px]"><MovieCards movie={show} {...cardProps} /></div>)}</div></section>}
    <section className="mt-14" aria-labelledby="popular-tv-title"><div className="flex items-center gap-2"><Tv className="h-5 w-5 text-red-400" aria-hidden="true" /><h2 id="popular-tv-title" className="text-2xl font-black">Popular TV shows</h2></div>
      {error ? <div role="alert" className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">{error}</div> : <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{loading ? Array.from({ length: 12 }, (_, index) => <div key={index} className="aspect-[2/3] animate-pulse rounded-2xl bg-white/[0.07]" />) : shows.map((show) => <MovieCards key={show.id} movie={show} {...cardProps} />)}</div>}
      {!error && <Pagination currentPage={page} pageNo={page} loading={loading} handlePreviousPage={() => setPage((current) => Math.max(1, current - 1))} handleNextPage={() => setPage((current) => current + 1)} />}
    </section>
  </div></section>;
}
