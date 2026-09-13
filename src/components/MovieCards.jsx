import { Bookmark, Film, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../api/tmdb";

const MovieCards = ({
  movie,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
  watchlist,
}) => {
  const title = movie.title || movie.name || "Untitled movie";
  const mediaType = movie.media_type === "tv" ? "tv" : "movie";
  const isInWatchlist = watchlist.some((item) => item.id === movie.id && (item.media_type || "movie") === mediaType);
  const smallPosterUrl = getImageUrl(movie.poster_path, "w185");
  const posterUrl = getImageUrl(movie.poster_path, "w342");
  const releaseYear = (movie.release_date || movie.first_air_date)?.slice(0, 4) || "TBA";

  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11151c] shadow-lg shadow-black/20 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-black/35">
        <Link
          to={"/" + mediaType + "/" + movie.id}
          className="block aspect-[2/3] overflow-hidden"
          aria-label={"View details for " + title}
        >
          {posterUrl ? (
            <img
              src={smallPosterUrl}
              srcSet={smallPosterUrl + " 185w, " + posterUrl + " 342w"}
              sizes="(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 190px"
              alt={title + " poster"}
              loading="lazy"
              decoding="async"
              width="342"
              height="513"
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
            />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-800 to-gray-950 px-4 text-center text-gray-500">
              <Film className="h-10 w-10" aria-hidden="true" />
              <span className="text-sm font-semibold">Poster unavailable</span>
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent opacity-70" />
        </Link>

        <button
          type="button"
          onClick={() =>
            isInWatchlist
              ? handleRemoveFromWatchlist(movie)
              : handleAddToWatchlist(movie)
          }
          className={
            "absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-xl border shadow-lg backdrop-blur-md transition-[transform,background-color,border-color] duration-200 hover:scale-105 " +
            (isInWatchlist
              ? "border-red-400/40 bg-red-600 text-white"
              : "border-white/20 bg-black/55 text-white hover:bg-black/75")
          }
          aria-label={
            (isInWatchlist ? "Remove " : "Add ") +
            title +
            (isInWatchlist ? " from watchlist" : " to watchlist")
          }
          title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Bookmark
            className={"h-5 w-5 " + (isInWatchlist ? "fill-current" : "")}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="px-1 pt-3">
        <Link
          to={"/" + mediaType + "/" + movie.id}
          className="block rounded-md text-[15px] font-bold leading-5 text-gray-100 transition-colors hover:text-red-400 sm:text-base"
        >
          <span className="line-clamp-2 min-h-10">{title}</span>
        </Link>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs font-medium text-gray-500 sm:text-sm">
          <span>{releaseYear}</span>
          <span className="flex items-center gap-1 text-gray-300">
            <Star
              className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            {movie.vote_average?.toFixed(1) || "N/A"}
          </span>
        </div>
      </div>
    </article>
  );
};

export default MovieCards;
