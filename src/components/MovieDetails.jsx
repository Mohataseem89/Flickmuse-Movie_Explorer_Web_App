import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Check,
  Clock3,
  Film,
  Globe2,
  Play,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getImageUrl, getMovieBundle } from "../api/tmdb";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { absoluteUrl, textForMeta } from "../seo/site";
import MovieCards from "./MovieCards";
import TrailerModal from "./TrailerModal";

const DetailSkeleton = () => (
  <div className="min-h-screen animate-pulse bg-[#080a0f]">
    <div className="h-[58vh] min-h-[520px] bg-gradient-to-br from-gray-900 to-black" />
    <div className="mx-auto -mt-32 grid max-w-7xl gap-8 px-5 pb-20 sm:px-8 md:grid-cols-[260px_1fr]">
      <div className="aspect-[2/3] rounded-3xl bg-[#171c25]" />
      <div className="pt-32 md:pt-20">
        <div className="h-12 w-3/4 rounded-xl bg-white/10" />
        <div className="mt-5 h-5 w-2/5 rounded bg-white/[0.07]" />
        <div className="mt-8 h-32 max-w-2xl rounded-xl bg-white/[0.07]" />
      </div>
    </div>
  </div>
);

function MovieRow({
  id,
  eyebrow,
  title,
  movies,
  watchlist,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
}) {
  if (!movies.length) return null;

  return (
    <section className="border-t border-white/10 py-16 sm:py-20" aria-labelledby={id}>
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400 sm:text-sm">
          {eyebrow}
        </p>
        <h2 id={id} className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          {title}
        </h2>
        <div className="movie-row mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 sm:gap-5">
          {movies.slice(0, 14).map((item) => (
            <div
              key={item.id}
              className="w-[42vw] max-w-[190px] shrink-0 snap-start sm:w-[190px]"
            >
              <MovieCards
                movie={item}
                watchlist={watchlist}
                handleAddToWatchlist={handleAddToWatchlist}
                handleRemoveFromWatchlist={handleRemoveFromWatchlist}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function MovieDetails({
  watchlist,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [activeTrailer, setActiveTrailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageMetadata({
    title: movie
      ? [
          movie.title,
          movie.release_date?.slice(0, 4),
          movie.genres?.slice(0, 2).map((genre) => genre.name).join(", "),
        ]
          .filter(Boolean)
          .join(" — ")
      : "Movie Details",
    description:
      movie?.overview
        ? textForMeta(movie.overview)
        : "Explore movie details, trailers, cast, crew, recommendations, and similar titles on FlickMuse.",
    image: getImageUrl(movie?.backdrop_path, "w1280"),
    type: "video.movie",
    structuredData: movie
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Movie",
              "@id": absoluteUrl("/movie/" + movie.id),
              name: movie.title,
              description: movie.overview || undefined,
              image: getImageUrl(movie.poster_path, "w500") || undefined,
              dateCreated: movie.release_date || undefined,
              duration: movie.runtime ? "PT" + movie.runtime + "M" : undefined,
              genre: movie.genres?.map((genre) => genre.name),
              aggregateRating:
                Number.isFinite(movie.vote_average) && movie.vote_count > 0
                  ? {
                      "@type": "AggregateRating",
                      ratingValue: movie.vote_average.toFixed(1),
                      ratingCount: movie.vote_count,
                      bestRating: 10,
                      worstRating: 0,
                    }
                  : undefined,
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Movie", item: absoluteUrl("/movie/" + movie.id) },
                { "@type": "ListItem", position: 3, name: movie.title },
              ],
            },
          ],
        }
      : undefined,
  });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    getMovieBundle(id, controller.signal)
      .then(setMovie)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  const trailer = useMemo(() => {
    const videos = movie?.videos?.results || [];
    return (
      videos.find(
        (video) =>
          video.site === "YouTube" &&
          video.type === "Trailer" &&
          video.official
      ) ||
      videos.find(
        (video) =>
          video.site === "YouTube" &&
          (video.type === "Trailer" || video.type === "Teaser")
      ) ||
      null
    );
  }, [movie]);

  const crew = useMemo(() => {
    const importantJobs = new Set(["Director", "Screenplay", "Writer", "Story"]);
    const unique = new Map();
    (movie?.credits?.crew || [])
      .filter((person) => importantJobs.has(person.job))
      .forEach((person) => {
        const key = person.id + "-" + person.job;
        if (!unique.has(key)) unique.set(key, person);
      });
    return [...unique.values()].slice(0, 8);
  }, [movie]);

  if (loading) return <DetailSkeleton />;

  if (error || !movie) {
    return (
      <section className="flex min-h-[65vh] items-center justify-center px-5 py-20 text-center">
        <div className="max-w-md rounded-3xl border border-white/10 bg-[#11151c] p-8 sm:p-10">
          <Film className="mx-auto h-12 w-12 text-red-400" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-black">Movie details could not be loaded</h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            {error || "The movie may have been removed or the address is incorrect."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 min-h-11 rounded-xl bg-red-600 px-5 font-bold transition-colors hover:bg-red-500"
          >
            Return home
          </button>
        </div>
      </section>
    );
  }

  const isInWatchlist = watchlist.some((item) => item.id === movie.id);
  const smallBackdropUrl = getImageUrl(movie.backdrop_path, "w780");
  const backdropUrl = getImageUrl(movie.backdrop_path, "w1280");
  const posterUrl = getImageUrl(movie.poster_path, "w500");
  const releaseYear = movie.release_date?.slice(0, 4) || "TBA";
  const cast = (movie.credits?.cast || []).slice(0, 12);
  const recommendations = movie.recommendations?.results || [];
  const similar = movie.similar?.results || [];

  return (
    <article className="min-h-screen bg-[#080a0f] text-white">
      <header className="relative isolate min-h-[560px] overflow-hidden sm:min-h-[640px]">
        {backdropUrl ? (
          <img
            src={smallBackdropUrl}
            srcSet={smallBackdropUrl + " 780w, " + backdropUrl + " 1280w"}
            sizes="100vw"
            alt=""
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#080a0f]/60 to-transparent" />

        <div className="relative mx-auto flex min-h-[560px] max-w-[1600px] flex-col px-5 py-8 sm:min-h-[640px] sm:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 text-sm font-bold backdrop-blur-md transition-colors hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>

          <div className="mt-auto max-w-4xl pb-16 pt-20">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400 sm:text-sm">
              Movie details
            </p>
            <h1 className="mt-4 text-[clamp(2.5rem,7vw,5.5rem)] font-black leading-[0.98] tracking-[-0.055em] [text-shadow:0_3px_22px_rgba(0,0,0,0.8)]">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="mt-4 max-w-2xl text-lg italic text-gray-300 sm:text-xl">
                “{movie.tagline}”
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.95)]">
              <span className="flex items-center gap-2">
                <Star className="h-[18px] w-[18px] fill-amber-400 text-amber-400" aria-hidden="true" />
                {movie.vote_average?.toFixed(1) || "Not rated"}
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays className="h-[18px] w-[18px]" aria-hidden="true" />
                {releaseYear}
              </span>
              {movie.runtime > 0 && (
                <span className="flex items-center gap-2">
                  <Clock3 className="h-[18px] w-[18px]" aria-hidden="true" />
                  {movie.runtime} min
                </span>
              )}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              {trailer && (
                <button
                  type="button"
                  onClick={() => setActiveTrailer(trailer)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-red-600 px-5 font-bold transition-colors hover:bg-red-500"
                >
                  <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                  Play trailer
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  isInWatchlist
                    ? handleRemoveFromWatchlist(movie)
                    : handleAddToWatchlist(movie)
                }
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-5 font-bold backdrop-blur-md transition-colors hover:bg-white/15"
              >
                {isInWatchlist ? (
                  <Check className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Bookmark className="h-5 w-5" aria-hidden="true" />
                )}
                {isInWatchlist ? "In watchlist" : "Add to watchlist"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-10 grid max-w-[1600px] gap-8 px-5 pb-20 sm:px-8 md:-mt-20 md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
        <div className="relative z-10">
          <div className="aspect-[2/3] overflow-hidden rounded-3xl border border-white/10 bg-[#11151c] shadow-2xl shadow-black/45">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={movie.title + " poster"}
                width="500"
                height="750"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-600">
                <Film className="h-12 w-12" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 md:pt-24">
          <section aria-labelledby="overview-title">
            <h2 id="overview-title" className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">
              Overview
            </h2>
            <p className="mt-4 max-w-4xl text-base leading-8 text-gray-300 sm:text-lg">
              {movie.overview || "No overview is available for this movie."}
            </p>
          </section>

          <section className="mt-9" aria-labelledby="genres-title">
            <h2 id="genres-title" className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500">
              Genres
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(movie.genres || []).map((genre) => (
                <Link
                  key={genre.id}
                  to={"/discover?genre=" + genre.id}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:border-red-500/40 hover:text-red-300"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </section>

          <dl className="mt-9 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#11151c] p-5">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                <Globe2 className="h-4 w-4" aria-hidden="true" />
                Language
              </dt>
              <dd className="mt-2 font-bold">{movie.original_language?.toUpperCase() || "N/A"}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#11151c] p-5">
              <dt className="text-xs font-bold uppercase tracking-wider text-gray-500">Release date</dt>
              <dd className="mt-2 font-bold">{movie.release_date || "Not available"}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#11151c] p-5">
              <dt className="text-xs font-bold uppercase tracking-wider text-gray-500">Audience votes</dt>
              <dd className="mt-2 font-bold">{movie.vote_count?.toLocaleString() || "Not available"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {cast.length > 0 && (
        <section className="border-t border-white/10 py-16 sm:py-20" aria-labelledby="cast-title">
          <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">People behind the story</p>
            <h2 id="cast-title" className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Cast</h2>
            <div className="movie-row mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5">
              {cast.map((person) => {
                const photo = getImageUrl(person.profile_path, "w185");
                return (
                  <Link
                    key={person.cast_id || person.credit_id}
                    to={"/person/" + person.id}
                    className="group w-[38vw] max-w-[160px] shrink-0 snap-start"
                  >
                    <span className="block aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#11151c]">
                      {photo ? (
                        <img
                          src={photo}
                          alt={person.name}
                          loading="lazy"
                          width="185"
                          height="278"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-gray-600">
                          <Film className="h-8 w-8" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <span className="mt-3 block font-bold text-gray-100 group-hover:text-red-400">{person.name}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-gray-500">{person.character || "Cast member"}</span>
                  </Link>
                );
              })}
            </div>

            {crew.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-black">Key crew</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {crew.map((person) => (
                    <Link
                      key={person.id + "-" + person.job}
                      to={"/person/" + person.id}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-red-500/40"
                    >
                      <span className="block font-bold text-gray-100">{person.name}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">{person.job}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <MovieRow
        id="recommended-title"
        eyebrow="Picked from this title"
        title="You may also like"
        movies={recommendations}
        watchlist={watchlist}
        handleAddToWatchlist={handleAddToWatchlist}
        handleRemoveFromWatchlist={handleRemoveFromWatchlist}
      />
      <MovieRow
        id="similar-title"
        eyebrow="Keep exploring"
        title="Similar movies"
        movies={similar}
        watchlist={watchlist}
        handleAddToWatchlist={handleAddToWatchlist}
        handleRemoveFromWatchlist={handleRemoveFromWatchlist}
      />

      <TrailerModal trailer={activeTrailer} onClose={() => setActiveTrailer(null)} />
    </article>
  );
}
