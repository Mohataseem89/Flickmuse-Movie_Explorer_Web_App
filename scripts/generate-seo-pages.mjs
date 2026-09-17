import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://flickmuse.mohataseem.com";
const ROOT_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DIRECTORY = join(ROOT_DIRECTORY, "dist");
const PUBLIC_SITEMAP = join(ROOT_DIRECTORY, "public", "sitemap.xml");
const MAX_MOVIES = 12;
const MAX_PEOPLE = 12;

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

function slugifyTitle(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "title";
}

function mediaPath(media, type = "movie") {
  const title = media.title || media.name || "title";
  return `/${type}/${slugifyTitle(title)}/${media.id}`;
}

async function tmdb(path) {
  const url = new URL("https://api.themoviedb.org/3" + path);
  url.searchParams.set("api_key", process.env.VITE_TMDB_API_KEY);
  url.searchParams.set("language", "en-US");
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("TMDb returned " + response.status + " for " + path);
  return response.json();
}

function makeSitemap(entries) {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry) => `  <url>\n    <loc>${SITE_URL}${entry.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${entry.priority}</priority>\n  </url>`).join("\n")}\n</urlset>\n`;
}

function pageHtml(indexHtml, media, type = "movie") {
  const title = media.title || media.name || (type === "tv" ? "TV Show" : "Movie");
  const date = media.release_date || media.first_air_date;
  const year = date?.slice(0, 4);
  const description = media.overview || `Explore ${title}, its trailer, cast, streaming availability, and similar titles on FlickMuse.`;
  const canonical = `${SITE_URL}${mediaPath(media, type)}`;
  const image = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : `${SITE_URL}/og-flickmuse.png`;
  const pageTitle = `${title}${year ? ` (${year})` : ""} — FlickMuse`;
  const structuredData = JSON.stringify({ "@context": "https://schema.org", "@type": type === "tv" ? "TVSeries" : "Movie", name: title, description, image, dateCreated: date || undefined, aggregateRating: media.vote_count > 0 ? { "@type": "AggregateRating", ratingValue: media.vote_average?.toFixed(1), ratingCount: media.vote_count, bestRating: 10, worstRating: 0 } : undefined });
  const content = `<main style="max-width:72rem;margin:0 auto;padding:3rem 1.25rem;color:#fff;background:#080a0f;font-family:system-ui,sans-serif"><p style="color:#f87171;font-weight:700;text-transform:uppercase;letter-spacing:.12em">${type === "tv" ? "TV show" : "Movie"} details</p><h1 style="font-size:clamp(2rem,6vw,4.5rem);margin:.5rem 0">${escapeHtml(title)}</h1><p>${escapeHtml(year || "Release date unavailable")} · ${escapeHtml(media.vote_average?.toFixed(1) || "Not rated")} / 10</p><h2>Overview</h2><p style="max-width:60rem;line-height:1.7">${escapeHtml(description)}</p><p>Open FlickMuse to watch trailers, browse cast, find streaming providers, and save this title to your watchlist.</p></main>`;
  return indexHtml
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${image}" />`)
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`)
    .replace("</head>", `<script type="application/ld+json">${structuredData}</script></head>`);
}

async function writeStaticSitemap() {
  const sitemap = makeSitemap([{ path: "/", priority: "1.0" }, { path: "/discover", priority: "0.8" }, { path: "/tv", priority: "0.8" }]);
  await Promise.all([writeFile(PUBLIC_SITEMAP, sitemap), writeFile(join(DIST_DIRECTORY, "sitemap.xml"), sitemap)]);
}

async function run() {
  await writeStaticSitemap();
  if (!process.env.VITE_TMDB_API_KEY || process.env.VITE_TMDB_API_KEY === "ci-placeholder-key") {
    console.log("SEO generation skipped: VITE_TMDB_API_KEY is not available for this build.");
    return;
  }
  try {
    const [popular, trending, popularTv, trendingTv] = await Promise.all([tmdb("/movie/popular"), tmdb("/trending/movie/week"), tmdb("/tv/popular"), tmdb("/trending/tv/week")]);
    const movies = [...(popular.results || []), ...(trending.results || [])].filter((movie, index, list) => movie.id && list.findIndex((item) => item.id === movie.id) === index).slice(0, MAX_MOVIES);
    const tvShows = [...(popularTv.results || []), ...(trendingTv.results || [])].filter((show, index, list) => show.id && list.findIndex((item) => item.id === show.id) === index).slice(0, MAX_MOVIES);
    const credits = await Promise.all(movies.slice(0, 6).map((movie) => tmdb(`/movie/${movie.id}/credits`)));
    const people = credits.flatMap((credit) => credit.cast || []).filter((person, index, list) => person.id && list.findIndex((item) => item.id === person.id) === index).slice(0, MAX_PEOPLE);
    const entries = [{ path: "/", priority: "1.0" }, { path: "/discover", priority: "0.8" }, { path: "/tv", priority: "0.8" }, ...movies.map((movie) => ({ path: mediaPath(movie, "movie"), priority: "0.7" })), ...tvShows.map((show) => ({ path: mediaPath(show, "tv"), priority: "0.7" })), ...people.map((person) => ({ path: `/person/${person.id}`, priority: "0.6" }))];
    const sitemap = makeSitemap(entries);
    await Promise.all([writeFile(PUBLIC_SITEMAP, sitemap), writeFile(join(DIST_DIRECTORY, "sitemap.xml"), sitemap)]);
    const indexHtml = await readFile(join(DIST_DIRECTORY, "index.html"), "utf8");
    await Promise.all([
      ...movies.map(async (movie) => { const folder = join(DIST_DIRECTORY, "movie", slugifyTitle(movie.title), String(movie.id)); await mkdir(folder, { recursive: true }); await writeFile(join(folder, "index.html"), pageHtml(indexHtml, movie, "movie")); }),
      ...tvShows.map(async (show) => { const folder = join(DIST_DIRECTORY, "tv", slugifyTitle(show.name), String(show.id)); await mkdir(folder, { recursive: true }); await writeFile(join(folder, "index.html"), pageHtml(indexHtml, show, "tv")); }),
    ]);
    console.log(`Generated sitemap and ${movies.length} movie + ${tvShows.length} TV prerendered pages.`);
  } catch (error) {
    console.warn("SEO generation fell back to the static sitemap:", error.message);
  }
}

await run();
