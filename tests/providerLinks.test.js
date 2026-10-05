import test from "node:test";
import assert from "node:assert/strict";
import { resolveWatchProviderUrl } from "../src/utils/providerLinks.js";

const tmdbWatchUrl = "https://www.themoviedb.org/tv/95350/watch?locale=IN";

test("Netflix uses provider-owned title search", () => {
  const result = resolveWatchProviderUrl({
    provider: { provider_name: "Netflix" },
    title: "3 Body Problem",
    region: "IN",
    tmdbWatchUrl,
  });
  assert.equal(result.destination, "provider");
  assert.equal(result.url, "https://www.netflix.com/search?q=3%20Body%20Problem");
});

test("Prime Video uses provider-owned title search", () => {
  const result = resolveWatchProviderUrl({
    provider: { provider_name: "Amazon Prime Video" },
    title: "Fallout",
    region: "IN",
    tmdbWatchUrl,
  });
  assert.equal(result.destination, "provider");
  assert.equal(result.url, "https://www.primevideo.com/search/ref=atv_nb_sr?phrase=Fallout");
});

test("Apple TV search is region aware", () => {
  const result = resolveWatchProviderUrl({
    provider: { provider_name: "Apple TV Plus" },
    title: "Severance",
    region: "IN",
    tmdbWatchUrl,
  });
  assert.equal(result.destination, "provider");
  assert.equal(result.url, "https://tv.apple.com/in/search?term=Severance");
});

test("JioHotstar safely falls back to TMDB instead of inventing a deep link", () => {
  const result = resolveWatchProviderUrl({
    provider: { provider_name: "JioHotstar" },
    title: "Lanterns",
    region: "IN",
    tmdbWatchUrl,
  });
  assert.equal(result.destination, "tmdb");
  assert.equal(result.url, tmdbWatchUrl);
});

test("unsupported providers reject unsafe fallback URLs", () => {
  const result = resolveWatchProviderUrl({
    provider: { provider_name: "Unknown Provider" },
    title: "Example",
    region: "IN",
    tmdbWatchUrl: "https://example.com/watch",
  });
  assert.equal(result, null);
});
