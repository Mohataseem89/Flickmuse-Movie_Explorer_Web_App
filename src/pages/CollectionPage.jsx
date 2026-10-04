import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getCollectionDetails,
  getImageUrl,
} from "../api/tmdb";

import MovieCards from "../components/MovieCards";
import { usePageMetadata } from "../hooks/usePageMetadata";

export default function CollectionPage({
  watchlist,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
}) {
  const { id } = useParams();

  const [collection, setCollection] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const c = new AbortController();

    setLoading(true);

    getCollectionDetails(id, c.signal)
      .then(setCollection)
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e.message);
        }
      })
      .finally(() => {
        if (!c.signal.aborted) {
          setLoading(false);
        }
      });

    return () => c.abort();
  }, [id]);

  const parts = useMemo(
    () =>
      [...(collection?.parts || [])]
        .map((x) => ({
          ...x,
          media_type: "movie",
        }))
        .sort((a, b) =>
          (a.release_date || "9999").localeCompare(
            b.release_date || "9999"
          )
        ),
    [collection]
  );

  usePageMetadata({
    title: collection
      ? `${collection.name} Collection`
      : "Movie Collection",

    description:
      collection?.overview ||
      "Explore every movie in this FlickMuse collection.",

    image: getImageUrl(
      collection?.backdrop_path,
      "w1280"
    ),

    canonicalPath: collection
      ? `/collection/${slugify(
          collection.name
        )}/${collection.id}`
      : undefined,

    robots: error
      ? "noindex,follow"
      : "index,follow",
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] animate-pulse bg-[#080a0f]" />
    );
  }

  if (error || !collection) {
    return (
      <section className="min-h-[70vh] px-5 py-20 text-center">
        <h1 className="text-3xl font-black">
          Collection unavailable
        </h1>

        <p className="mt-3 text-gray-400">
          {error ||
            "This collection could not be found."}
        </p>
      </section>
    );
  }

  return (
    <main className="min-h-[75vh] bg-[#080a0f] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage: `url(${getImageUrl(
              collection.backdrop_path,
              "w1280"
            )})`,
          }}
        />

        <div className="relative mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-24">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-red-400">
            Movie collection
          </p>

          <h1 className="mt-3 max-w-4xl text-4xl font-black sm:text-6xl">
            {collection.name}
          </h1>

          {collection.overview && (
            <p className="mt-5 max-w-3xl leading-8 text-gray-300">
              {collection.overview}
            </p>
          )}

          <p className="mt-5 text-sm font-bold text-gray-400">
            {parts.length}{" "}
            {parts.length === 1
              ? "movie"
              : "movies"}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8">
        <h2 className="text-3xl font-black">
          Release chronology
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {parts.map((movie) => (
            <MovieCards
              key={movie.id}
              movie={movie}
              watchlist={watchlist}
              handleAddToWatchlist={
                handleAddToWatchlist
              }
              handleRemoveFromWatchlist={
                handleRemoveFromWatchlist
              }
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function slugify(value = "") {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}