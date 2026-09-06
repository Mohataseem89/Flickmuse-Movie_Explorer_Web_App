import { ArrowLeft, CalendarDays, Film, MapPin, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getImageUrl,
  getPersonDetails,
  getPersonMovieCredits,
} from "../api/tmdb";
import MovieCards from "../components/MovieCards";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { textForMeta } from "../seo/site";

export default function PersonDetails({
  watchlist,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageMetadata({
    title: person?.name || "Person Profile",
    description:
      (person?.biography ? textForMeta(person.biography) : undefined) ||
      "Explore this film professional's biography and movie credits on FlickMuse.",
    image: getImageUrl(person?.profile_path, "h632"),
    type: "profile",
    structuredData: person
      ? {
          "@context": "https://schema.org",
          "@type": "Person",
          name: person.name,
          image: getImageUrl(person.profile_path, "h632"),
          birthDate: person.birthday || undefined,
          birthPlace: person.place_of_birth || undefined,
          description: person.biography || undefined,
        }
      : undefined,
  });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    Promise.all([
      getPersonDetails(id, controller.signal),
      getPersonMovieCredits(id, controller.signal),
    ])
      .then(([personData, creditData]) => {
        setPerson(personData);
        setCredits(creditData.cast || []);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  const knownFor = useMemo(() => {
    const unique = new Map();
    [...credits]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .forEach((movie) => {
        if (movie.poster_path && !unique.has(movie.id)) unique.set(movie.id, movie);
      });
    return [...unique.values()].slice(0, 12);
  }, [credits]);

  const filmography = useMemo(
    () =>
      [...credits]
        .filter((movie) => movie.poster_path)
        .sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""))
        .slice(0, 30),
    [credits]
  );

  if (loading) {
    return (
      <div className="min-h-[75vh] animate-pulse bg-[#080a0f] px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[280px_1fr]">
          <div className="aspect-[2/3] rounded-3xl bg-white/[0.07]" />
          <div>
            <div className="h-12 w-2/3 rounded-xl bg-white/[0.07]" />
            <div className="mt-7 h-48 rounded-2xl bg-white/[0.05]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <section className="flex min-h-[65vh] items-center justify-center px-5 text-center">
        <div>
          <Film className="mx-auto h-10 w-10 text-red-400" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-black">Profile unavailable</h1>
          <p className="mt-2 text-gray-400">{error || "This person could not be found."}</p>
        </div>
      </section>
    );
  }

  const profileUrl = getImageUrl(person.profile_path, "h632");

  return (
    <article className="min-h-[75vh] bg-[#080a0f] py-8 text-white sm:py-10">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold text-gray-200 transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#171c27] via-[#0e121a] to-[#080a0f] p-5 sm:p-8 lg:p-10">
          <div className="grid gap-8 md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-12">
          <div className="mx-auto w-full max-w-[320px] md:mx-0">
            <div className="aspect-[2/3] overflow-hidden rounded-3xl border border-white/10 bg-[#11151c] shadow-2xl shadow-black/40">
              {profileUrl ? (
                <img
                  src={profileUrl}
                  alt={person.name}
                  width="421"
                  height="632"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-600">
                  <Film className="h-12 w-12" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center py-2">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">
              {person.known_for_department || "Film professional"}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {person.name}
            </h1>

            <dl className="mt-6 flex flex-wrap gap-3 text-sm text-gray-300">
              {person.birthday && (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <CalendarDays className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  <dt className="sr-only">Born</dt>
                  <dd>{person.birthday}{person.deathday ? " — " + person.deathday : ""}</dd>
                </div>
              )}
              {person.place_of_birth && (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <MapPin className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  <dt className="sr-only">Place of birth</dt>
                  <dd>{person.place_of_birth}</dd>
                </div>
              )}
            </dl>

            <section className="mt-9 max-w-4xl" aria-labelledby="biography-title">
              <h2 id="biography-title" className="text-2xl font-black">Biography</h2>
              <p className="mt-4 max-w-4xl whitespace-pre-line leading-8 text-gray-300">
                {person.biography || "No biography is currently available."}
              </p>
            </section>
          </div>
          </div>
        </div>

        <section className="mt-16" aria-labelledby="known-for-title">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">
            Filmography highlights
          </p>
          <h2 id="known-for-title" className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Known for
          </h2>
          {knownFor.length ? (
            <div className="movie-row mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 sm:gap-5">
              {knownFor.map((movie) => (
                <div key={movie.id} className="w-[42vw] max-w-[190px] shrink-0 snap-start sm:w-[190px]">
                  <MovieCards movie={movie} watchlist={watchlist} handleAddToWatchlist={handleAddToWatchlist} handleRemoveFromWatchlist={handleRemoveFromWatchlist} />
                </div>
              ))}
            </div>
          ) : <p className="mt-5 text-gray-400">No movie credits are available.</p>}
        </section>

        <section className="mt-14 border-t border-white/10 pt-14" aria-labelledby="filmography-title">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">Selected credits</p>
          <h2 id="filmography-title" className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Filmography</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {filmography.map((movie) => (
              <Link key={movie.credit_id || movie.id} to={'/movie/' + movie.id} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-2 transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500">
                <img src={getImageUrl(movie.poster_path, 'w342')} alt={'View ' + movie.title} loading="lazy" className="aspect-[2/3] w-full rounded-xl object-cover" />
                <p className="mt-3 truncate font-bold text-white">{movie.title}</p>
                <p className="mt-1 truncate text-xs text-gray-400">{movie.character || movie.release_date?.slice(0, 4) || 'Movie credit'}</p>
                {movie.vote_average > 0 && <p className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-300"><Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />{movie.vote_average.toFixed(1)}</p>}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
