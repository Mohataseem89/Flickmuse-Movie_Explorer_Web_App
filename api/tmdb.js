const API_BASE_URL = "https://api.themoviedb.org/3";

const ALLOWED_PATHS = [
  /^\/trending\/movie\/week$/,
  /^\/trending\/tv\/week$/,
  /^\/movie\/(popular|now_playing|top_rated)$/,
  /^\/discover\/movie$/,
  /^\/discover\/tv$/,
  /^\/search\/movie$/,
  /^\/search\/multi$/,
  /^\/search\/tv$/,
  /^\/genre\/movie\/list$/,
  /^\/genre\/tv\/list$/,
  /^\/movie\/\d+(?:\/similar)?$/,
  /^\/tv\/(popular|on_the_air|top_rated)$/, 
  /^\/tv\/\d+(?:\/similar)?$/,
  /^\/person\/\d+(?:\/movie_credits)?$/,
];

function isAllowedPath(path) {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.API_KEY;
  const path = typeof request.query.path === "string" ? request.query.path : "";
  if (!apiKey) return response.status(500).json({ error: "Movie data service is not configured." });
  if (!isAllowedPath(path)) return response.status(400).json({ error: "Unsupported movie data request." });

  const url = new URL(API_BASE_URL + path);
  Object.entries(request.query).forEach(([key, value]) => {
    if (key === "path" || key === "api_key" || Array.isArray(value)) return;
    url.searchParams.set(key, value);
  });
  url.searchParams.set("api_key", apiKey);

  try {
    const upstream = await fetch(url, { headers: { accept: "application/json" } });
    const data = await upstream.json();
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return response.status(upstream.status).json(data);
  } catch {
    return response.status(502).json({ error: "Movie data service is temporarily unavailable." });
  }
}
