import {
  Bookmark,
  Film,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../api/tmdb";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { useGenres } from "../hooks/useGenres";

const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const getGenreIds = (movie) =>
  movie.genre_ids ?? movie.genres?.map((genre) => genre.id) ?? [];

const getMovieGenres = (movie) =>
  getGenreIds(movie)
    .slice(0, 2)
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);

const WatchList = ({ watchlist, handleRemoveFromWatchlist }) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("added");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const { genreMap } = useGenres();

  usePageMetadata({
    title: "My Watchlist",
    description: "Review and organize movies saved to your personal FlickMuse watchlist.",
    robots: "noindex,nofollow",
  });

  const availableGenres = useMemo(() => {
    const genres = new Set();

    watchlist.forEach((movie) => {
      getGenreIds(movie).forEach((genreId) => {
        if (genreMap[genreId] || GENRE_MAP[genreId]) genres.add(genreMap[genreId] || GENRE_MAP[genreId]);
      });
    });

    return ["All", ...Array.from(genres).sort()];
  }, [watchlist, genreMap]);

  const filteredMovies = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const results = watchlist.filter((movie) => {
      const title = (movie.title || movie.name || "").toLowerCase();
      const matchesSearch = title.includes(normalizedSearch);
      const matchesGenre =
        selectedGenre === "All" ||
        getGenreIds(movie).some(
          (genreId) => (genreMap[genreId] || GENRE_MAP[genreId]) === selectedGenre
        );

      return matchesSearch && matchesGenre;
    });

    return [...results].sort((first, second) => {
      if (sortBy === "rating-desc") {
        return (second.vote_average ?? 0) - (first.vote_average ?? 0);
      }
      if (sortBy === "rating-asc") {
        return (first.vote_average ?? 0) - (second.vote_average ?? 0);
      }
      if (sortBy === "popularity-desc") {
        return (second.popularity ?? 0) - (first.popularity ?? 0);
      }
      if (sortBy === "title-asc") {
        return (first.title || first.name || "").localeCompare(
          second.title || second.name || ""
        );
      }
      return watchlist.indexOf(first) - watchlist.indexOf(second);
    });
  }, [watchlist, search, selectedGenre, sortBy, genreMap]);

  const clearFilters = () => {
    setSearch("");
    setSelectedGenre("All");
    setSortBy("added");
  };

  if (watchlist.length === 0) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-5 py-20 text-center">
        <div className="max-w-lg">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-[#11151c] text-red-400">
            <Bookmark className="h-8 w-8" aria-hidden="true" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-red-400">
            Your collection
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
            Your watchlist is empty
          </h1>
          <p className="mx-auto mt-4 max-w-md leading-7 text-gray-400">
            Save movies that catch your eye and they will stay here for your
            next movie night.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 font-bold text-white transition-colors hover:bg-red-500"
          >
            <Film className="h-5 w-5" aria-hidden="true" />
            Explore movies
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[75vh] bg-[#080a0f] py-12 text-white sm:py-16">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400 sm:text-sm">
              Your collection
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              Watchlist
            </h1>
            <p className="mt-3 text-gray-400">
              {watchlist.length} {watchlist.length === 1 ? "movie" : "movies"} saved
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            Add more movies
          </Link>
        </header>

        <div className="my-8 grid gap-3 rounded-3xl border border-white/10 bg-[#11151c] p-3 sm:p-4 lg:grid-cols-[minmax(260px,1fr)_220px_220px]">
          <label className="relative block">
            <span className="sr-only">Search your watchlist</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Search your watchlist"
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#080a0f] py-3 pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-red-500"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Filter by genre</span>
            <SlidersHorizontal
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            />
            <select
              value={selectedGenre}
              onChange={(event) => setSelectedGenre(event.target.value)}
              className="min-h-12 w-full appearance-none rounded-2xl border border-white/10 bg-[#080a0f] py-3 pl-11 pr-9 text-sm font-semibold text-gray-200 outline-none transition-colors focus:border-red-500"
            >
              {availableGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre === "All" ? "All genres" : genre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Sort watchlist</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="min-h-12 w-full appearance-none rounded-2xl border border-white/10 bg-[#080a0f] px-4 py-3 text-sm font-semibold text-gray-200 outline-none transition-colors focus:border-red-500"
            >
              <option value="added">Recently added</option>
              <option value="rating-desc">Rating: high to low</option>
              <option value="rating-asc">Rating: low to high</option>
              <option value="popularity-desc">Most popular</option>
              <option value="title-asc">Title: A to Z</option>
            </select>
          </label>
        </div>

        {filteredMovies.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-gray-600" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">No matching movies</h2>
            <p className="mt-2 text-sm text-gray-500">
              Try another title or remove the current filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 min-h-11 rounded-xl bg-white/10 px-5 text-sm font-bold text-white transition-colors hover:bg-white/15"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:hidden">
              {filteredMovies.map((movie) => {
                const title = movie.title || movie.name || "Untitled movie";
                const posterUrl = getImageUrl(movie.poster_path, "w185");
                const genres = getMovieGenres(movie);

                return (
                  <article
                    key={movie.id}
                    className="grid grid-cols-[88px_minmax(0,1fr)_44px] gap-4 rounded-2xl border border-white/10 bg-[#11151c] p-3"
                  >
                    <Link
                      to={"/movie/" + movie.id}
                      className="aspect-[2/3] overflow-hidden rounded-xl bg-gray-900"
                    >
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={title + " poster"}
                          loading="lazy"
                          width="185"
                          height="278"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-gray-600">
                          <Film className="h-6 w-6" aria-hidden="true" />
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 py-1">
                      <Link
                        to={"/movie/" + movie.id}
                        className="line-clamp-2 font-bold leading-5 text-white hover:text-red-400"
                      >
                        {title}
                      </Link>
                      <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-gray-300">
                        <Star
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                          aria-hidden="true"
                        />
                        {movie.vote_average?.toFixed(1) || "N/A"}
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">
                        {genres.join(" • ") || "Genres unavailable"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromWatchlist(movie)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      aria-label={"Remove " + title + " from watchlist"}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-[#11151c] md:block">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Movie</th>
                    <th className="px-5 py-4">Rating</th>
                    <th className="hidden px-5 py-4 lg:table-cell">Popularity</th>
                    <th className="hidden px-5 py-4 xl:table-cell">Genres</th>
                    <th className="px-5 py-4 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {filteredMovies.map((movie) => {
                    const title = movie.title || movie.name || "Untitled movie";
                    const posterUrl = getImageUrl(movie.poster_path, "w185");
                    const genres = getMovieGenres(movie);

                    return (
                      <tr
                        key={movie.id}
                        className="transition-colors hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <Link
                              to={"/movie/" + movie.id}
                              className="h-[84px] w-14 shrink-0 overflow-hidden rounded-xl bg-gray-900"
                            >
                              {posterUrl ? (
                                <img
                                  src={posterUrl}
                                  alt={title + " poster"}
                                  loading="lazy"
                                  width="185"
                                  height="278"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center text-gray-600">
                                  <Film className="h-5 w-5" aria-hidden="true" />
                                </span>
                              )}
                            </Link>
                            <div className="min-w-0">
                              <Link
                                to={"/movie/" + movie.id}
                                className="line-clamp-2 font-bold text-gray-100 transition-colors hover:text-red-400"
                              >
                                {title}
                              </Link>
                              <p className="mt-1 text-sm text-gray-500">
                                {movie.release_date?.slice(0, 4) || "Release TBA"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 font-bold text-gray-200">
                            <Star
                              className="h-4 w-4 fill-amber-400 text-amber-400"
                              aria-hidden="true"
                            />
                            {movie.vote_average?.toFixed(1) || "N/A"}
                          </span>
                        </td>
                        <td className="hidden px-5 py-4 text-gray-400 lg:table-cell">
                          {movie.popularity
                            ? Math.round(movie.popularity).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="hidden px-5 py-4 text-sm text-gray-400 xl:table-cell">
                          {genres.join(", ") || "N/A"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromWatchlist(movie)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                            aria-label={"Remove " + title + " from watchlist"}
                          >
                            <Trash2 className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default WatchList;
