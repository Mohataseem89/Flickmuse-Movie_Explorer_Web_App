import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  getImageUrl,
  getMovieBundle,
  searchMovies,
} from "../api/tmdb";

import { usePageMetadata } from "../hooks/usePageMetadata";
import { getMediaPath } from "../utils/mediaUrl";

function MoviePicker({
  label,
  movie,
  onSelect,
  onClear,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      setResults([]);
      return;
    }

    const c = new AbortController();

    const timer = setTimeout(() => {
      setLoading(true);

      searchMovies(q, 1, c.signal)
        .then((d) =>
          setResults(
            (d.results || []).slice(0, 5)
          )
        )
        .catch(() => setResults([]))
        .finally(() => {
          if (!c.signal.aborted) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [query]);

  if (movie) {
    return (
      <div className="flex min-h-14 items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] px-4">
        <span className="font-bold">
          {movie.title}
        </span>

        <button
          type="button"
          onClick={onClear}
          className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/10"
          aria-label={`Remove ${movie.title}`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
        {label}

        <span className="relative mt-2 block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />

          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search a movie"
            className="min-h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pl-11 pr-4 text-white outline-none focus:border-red-500"
          />
        </span>
      </label>

      {query.trim().length >= 2 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#11151c] shadow-2xl">
          {loading ? (
            <p className="p-4 text-sm text-gray-400">
              Searching…
            </p>
          ) : results.length ? (
            results.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => {
                  onSelect(r);
                  setQuery("");
                  setResults([]);
                }}
                className="block min-h-12 w-full px-4 py-3 text-left text-sm font-semibold hover:bg-white/10"
              >
                {r.title}{" "}
                <span className="text-gray-400">
                  {r.release_date?.slice(0, 4)}
                </span>
              </button>
            ))
          ) : (
            <p className="p-4 text-sm text-gray-400">
              No movies found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const money = (n) =>
  n > 0
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n)
    : "Not available";

const value = (v) => v || "Not available";

export default function ComparePage() {
  const [params, setParams] =
    useSearchParams();

  const moviesParam =
    params.get("movies") || "";

  const ids = useMemo(
    () =>
      moviesParam
        .split(",")
        .filter((x) => /^\d+$/.test(x))
        .slice(0, 2),
    [moviesParam]
  );

  const [movies, setMovies] = useState([
    null,
    null,
  ]);

  const [error, setError] = useState("");

  usePageMetadata({
    title: "Compare Two Movies",
    description:
      "Compare two movies side by side by rating, runtime, genres, budget, revenue, director, and cast.",
    canonicalPath: "/compare",
    robots: "noindex,follow",
  });

  useEffect(() => {
    const c = new AbortController();

    setError("");

    Promise.all(
      ids.map((id) =>
        getMovieBundle(id, c.signal)
      )
    )
      .then((data) => {
        setMovies([
          data[0] || null,
          data[1] || null,
        ]);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e.message);
        }
      });

    return () => c.abort();
  }, [ids]);

  const update = (index, movie) => {
    const next = [
      movies[0]?.id,
      movies[1]?.id,
    ];

    next[index] = movie?.id || null;

    const clean = next.filter(Boolean);

    setParams(
      clean.length
        ? { movies: clean.join(",") }
        : {}
    );
  };

  const common = useMemo(() => {
    if (!movies[0] || !movies[1]) {
      return [];
    }

    const b = new Set(
      (movies[1].credits?.cast || []).map(
        (x) => x.id
      )
    );

    return (movies[0].credits?.cast || [])
      .filter((x) => b.has(x.id))
      .slice(0, 6);
  }, [movies]);

  const rows = [
    [
      "Release year",
      (m) =>
        (m.release_date || "").slice(0, 4) ||
        "Not available",
    ],
    [
      "Rating",
      (m) =>
        m.vote_count
          ? `${m.vote_average.toFixed(
              1
            )} / 10 (${m.vote_count.toLocaleString()} votes)`
          : "Not rated",
    ],
    [
      "Runtime",
      (m) =>
        m.runtime
          ? `${m.runtime} min`
          : "Not available",
    ],
    [
      "Genres",
      (m) =>
        m.genres
          ?.map((g) => g.name)
          .join(", ") ||
        "Not available",
    ],
    [
      "Budget",
      (m) => money(m.budget),
    ],
    [
      "Revenue",
      (m) => money(m.revenue),
    ],
    [
      "Director",
      (m) =>
        value(
          m.credits?.crew?.find(
            (p) => p.job === "Director"
          )?.name
        ),
    ],
    [
      "Main cast",
      (m) =>
        m.credits?.cast
          ?.slice(0, 5)
          .map((p) => p.name)
          .join(", ") ||
        "Not available",
    ],
  ];

  return (
    <section className="min-h-[75vh] bg-[#080a0f] py-12 text-white sm:py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-red-400">
          Side by side
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
          Compare movies
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-gray-400">
          Choose exactly two movies.
          Comparison stays in the URL, so
          the selected pair can be bookmarked
          or shared without an account.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-red-500/10 p-4 text-red-200"
          >
            {error}
          </p>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <MoviePicker
            label="First movie"
            movie={movies[0]}
            onSelect={(m) => update(0, m)}
            onClear={() => setParams({})}
          />

          {movies[0] ? (
            <MoviePicker
              label="Second movie"
              movie={movies[1]}
              onSelect={(m) => update(1, m)}
              onClear={() => update(1, null)}
            />
          ) : (
            <div className="flex min-h-14 items-center rounded-2xl border border-dashed border-white/10 px-4 text-sm font-semibold text-gray-400">
              Choose the first movie to
              unlock the second selection.
            </div>
          )}
        </div>

        {movies[0] && movies[1] && (
          <div className="mt-10 overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-2 gap-px bg-white/10">
              {movies.map((m) => (
                <Link
                  to={getMediaPath(m, "movie")}
                  key={m.id}
                  className="bg-[#0d1118] p-4 text-center sm:p-6"
                >
                  {m.poster_path && (
                    <img
                      src={getImageUrl(
                        m.poster_path,
                        "w342"
                      )}
                      srcSet={`${getImageUrl(
                        m.poster_path,
                        "w185"
                      )} 185w, ${getImageUrl(
                        m.poster_path,
                        "w342"
                      )} 342w`}
                      sizes="(max-width: 767px) 40vw, 220px"
                      width="342"
                      height="513"
                      loading="lazy"
                      alt={`${m.title} poster`}
                      className="mx-auto aspect-[2/3] w-full max-w-[220px] rounded-2xl object-cover"
                    />
                  )}

                  <h2 className="mt-4 text-lg font-black sm:text-2xl">
                    {m.title}
                  </h2>
                </Link>
              ))}
            </div>

            <dl>
              {rows.map(([label, fn]) => (
                <div
                  key={label}
                  className="border-t border-white/10 p-4 sm:grid sm:grid-cols-[10rem_1fr_1fr] sm:gap-5 sm:p-5"
                >
                  <dt className="mb-3 font-bold text-red-400 sm:mb-0">
                    {label}
                  </dt>

                  <div className="grid grid-cols-2 gap-4 sm:contents">
                    <dd className="min-w-0 text-sm text-gray-300">
                      {fn(movies[0])}
                    </dd>

                    <dd className="min-w-0 text-sm text-gray-300">
                      {fn(movies[1])}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            {common.length > 0 && (
              <div className="border-t border-white/10 p-5">
                <h2 className="font-black">
                  Appears in both
                </h2>

                <p className="mt-2 text-sm text-gray-300">
                  {common
                    .map((x) => x.name)
                    .join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}