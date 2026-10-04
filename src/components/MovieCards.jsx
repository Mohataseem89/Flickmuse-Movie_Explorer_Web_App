import { Bookmark, Film, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../api/tmdb";
import { normalizeMedia, getNormalizedMediaPath } from "../utils/media";

const MovieCards = ({
  movie,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
  watchlist,
}) => {
  const media = normalizeMedia(movie, movie.media_type);
  const title = media.title;
  const mediaType = media.mediaType;
  const isInWatchlist = watchlist.some((item) => item.id === movie.id && (item.media_type || "movie") === mediaType);
  const smallPosterUrl = getImageUrl(media.posterPath, "w185");
  const posterUrl = getImageUrl(media.posterPath, "w342");
  const releaseYear = media.year || "TBA";
  const detailsPath = getNormalizedMediaPath(media);
  const prefetchDetails = () => {
    import("./MovieDetails");
  };

  return (
    <article className="group min-w-0">
      <div className="media-card relative overflow-hidden rounded-flick-card border border-flick-border bg-flick-surface shadow-flick-card">
        <Link
          to={detailsPath}
          className="block aspect-[2/3] overflow-hidden"
          onMouseEnter={prefetchDetails}
          onFocus={prefetchDetails}
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
              className="poster-image h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-800 to-gray-950 px-4 text-center text-gray-400">
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
            "watchlist-toggle absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-xl border shadow-lg backdrop-blur-md " +
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
          to={detailsPath}
          className="block rounded-md text-[15px] font-bold leading-5 text-gray-100 transition-colors hover:text-red-400 sm:text-base"
          onMouseEnter={prefetchDetails}
          onFocus={prefetchDetails}
        >
          <span className="line-clamp-2 min-h-10">{title}</span>
        </Link>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs font-medium text-gray-400 sm:text-sm">
          <span>{releaseYear}</span>
          <span className="flex items-center gap-1 text-gray-300">
            <Star
              className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            {media.rating ? media.rating.toFixed(1) : "N/A"}
          </span>
        </div>
      </div>
    </article>
  );
};

export default MovieCards;
