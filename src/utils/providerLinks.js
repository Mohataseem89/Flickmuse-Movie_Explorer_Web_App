const APPLE_TV_REGIONS = new Set([
  "AU", "BR", "CA", "DE", "ES", "FR", "GB", "IN", "IT", "JP", "KR", "MX", "NL", "SE", "US",
]);

function normalizeProviderName(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function cleanTitle(title = "") {
  return title.trim();
}

function providerSearchUrl(providerName, title, region) {
  const normalizedName = normalizeProviderName(providerName);
  const normalizedTitle = cleanTitle(title);
  if (!normalizedTitle) return null;

  const query = encodeURIComponent(normalizedTitle);

  // Keep this list deliberately small. A provider belongs here only when we
  // have a stable provider-owned web search destination. Never invent title
  // IDs or deep links from a TMDB ID.
  if (normalizedName.includes("netflix")) {
    return `https://www.netflix.com/search?q=${query}`;
  }

  if (
    normalizedName.includes("amazon prime video") ||
    normalizedName === "prime video"
  ) {
    return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${query}`;
  }

  if (normalizedName.includes("apple tv") && APPLE_TV_REGIONS.has(region)) {
    return `https://tv.apple.com/${region.toLowerCase()}/search?term=${query}`;
  }

  return null;
}

function safeTmdbWatchUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.hostname !== "www.themoviedb.org" && url.hostname !== "themoviedb.org") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Resolves a watch-provider card without fabricating provider content IDs.
 *
 * TMDB's watch-provider API reports availability but does not return provider
 * deep links. For providers with a stable provider-owned search destination,
 * FlickMuse opens a title search there. Everything else falls back to the
 * TMDB watch URL returned by the API, which can lead the user to the provider.
 */
export function resolveWatchProviderUrl({ provider, title, region, tmdbWatchUrl }) {
  const providerUrl = providerSearchUrl(provider?.provider_name, title, region);

  if (providerUrl) {
    return {
      url: providerUrl,
      destination: "provider",
      ariaLabel: `Search ${provider.provider_name} for ${title}`,
    };
  }

  const fallbackUrl = safeTmdbWatchUrl(tmdbWatchUrl);
  if (!fallbackUrl) return null;

  return {
    url: fallbackUrl,
    destination: "tmdb",
    ariaLabel: `View ${title} watch options on TMDB`,
  };
}

export function getWatchProviderLinkHint(destination) {
  return destination === "provider"
    ? "Opens provider search"
    : "Opens TMDB watch options";
}
