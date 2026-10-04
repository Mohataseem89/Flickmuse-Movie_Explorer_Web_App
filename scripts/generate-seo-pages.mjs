import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MOVIE_GENRES, CATEGORY_PAGES } from "../src/seo/catalog.js";
import { SITE_URL } from "../src/seo/site.js";
import { slugifyTitle } from "../src/utils/mediaUrl.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PUBLIC_SITEMAP = join(ROOT, "public", "sitemap.xml");
const MAX_MEDIA = 12;

const escapeHtml = (v = "") =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]
  );

const mediaPath = (m, type = "movie") =>
  `/${type}/${slugifyTitle(m.title || m.name || "title")}/${m.id}`;

async function tmdb(path, params = {}) {
  const url = new URL(
    "https://api.themoviedb.org/3" + path
  );

  url.searchParams.set(
    "api_key",
    process.env.TMDB_API_KEY
  );

  url.searchParams.set("language", "en-US");

  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });

  const r = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!r.ok) {
    throw new Error(`TMDb ${r.status} for ${path}`);
  }

  return r.json();
}

const baseRoutes = [
  {
    path: "/",
    priority: "1.0",
  },
  {
    path: "/discover",
    priority: "0.8",
  },
  {
    path: "/tv",
    priority: "0.8",
  },
  {
    path: CATEGORY_PAGES["top-rated"].path,
    priority: "0.8",
  },
  ...MOVIE_GENRES.map((g) => ({
    path: g.path,
    priority: "0.7",
  })),
];

function sitemap(entries) {
  const today = new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${SITE_URL}${e.path}</loc>
    <lastmod>${today}</lastmod>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

function inject(
  indexHtml,
  {
    title,
    description,
    path,
    image = `${SITE_URL}/og-flickmuse.png`,
    content,
    schema,
    type = "website",
  }
) {
  const canonical = `${SITE_URL}${path}`;

  const pageTitle = title.includes("FlickMuse")
    ? title
    : `${title} | FlickMuse`;

  return indexHtml
    .replace(
      /<title>.*?<\/title>/,
      `<title>${escapeHtml(pageTitle)}</title>`
    )
    .replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${escapeHtml(
        description
      )}" />`
    )
    .replace(
      /<link rel="canonical" href=".*?" \/>/,
      `<link rel="canonical" href="${canonical}" />`
    )
    .replace(
      /<meta property="og:title" content=".*?" \/>/,
      `<meta property="og:title" content="${escapeHtml(
        pageTitle
      )}" />`
    )
    .replace(
      /<meta property="og:description" content=".*?" \/>/,
      `<meta property="og:description" content="${escapeHtml(
        description
      )}" />`
    )
    .replace(
      /<meta property="og:url" content=".*?" \/>/,
      `<meta property="og:url" content="${canonical}" />`
    )
    .replace(
      /<meta property="og:image" content=".*?" \/>/,
      `<meta property="og:image" content="${image}" />`
    )
    .replace(
      /<meta property="og:type" content=".*?" \/>/,
      `<meta property="og:type" content="${type}" />`
    )
    .replace(
      '<div id="root"></div>',
      `<div id="root">${content}</div>`
    )
    .replace(
      "</head>",
      schema
        ? `<script type="application/ld+json">${JSON.stringify(
            schema
          ).replace(/</g, "\\u003c")}</script></head>`
        : "</head>"
    );
}

const shell = (
  eyebrow,
  h1,
  copy,
  items = []
) => `
<main
  style="
    max-width:72rem;
    margin:0 auto;
    padding:4rem 1.25rem;
    color:#fff;
    background:#080a0f;
    font-family:system-ui,sans-serif;
    min-height:70vh
  "
>
  <p
    style="
      color:#f87171;
      font-weight:700;
      text-transform:uppercase;
      letter-spacing:.12em
    "
  >
    ${escapeHtml(eyebrow)}
  </p>

  <h1
    style="
      font-size:clamp(2.25rem,6vw,4.5rem);
      margin:.6rem 0 1rem
    "
  >
    ${escapeHtml(h1)}
  </h1>

  <p
    style="
      max-width:52rem;
      line-height:1.7;
      color:#d1d5db
    "
  >
    ${escapeHtml(copy)}
  </p>

  ${
    items.length
      ? `<ol>
          ${items
            .map(
              (x) => `
                <li style="margin:.75rem 0">
                  <a
                    style="color:#fff"
                    href="${x.path}"
                  >
                    ${escapeHtml(x.name)}
                  </a>
                  ${
                    x.meta
                      ? ` — ${escapeHtml(x.meta)}`
                      : ""
                  }
                </li>
              `
            )
            .join("")}
        </ol>`
      : ""
  }
</main>
`;

async function writePage(indexHtml, path, data) {
  const folder =
    path === "/"
      ? DIST
      : join(
          DIST,
          ...path.split("/").filter(Boolean)
        );

  await mkdir(folder, {
    recursive: true,
  });

  await writeFile(
    join(folder, "index.html"),
    inject(indexHtml, data)
  );
}

function mediaData(media, type) {
  const title =
    media.title ||
    media.name ||
    (type === "tv" ? "TV Show" : "Movie");

  const date =
    media.release_date ||
    media.first_air_date;

  const year = date?.slice(0, 4);

  const description =
    media.overview ||
    `Explore ${title}, trailers, cast and streaming availability on FlickMuse.`;

  const path = mediaPath(media, type);

  const image = media.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`
    : `${SITE_URL}/og-flickmuse.png`;

  return {
    title: `${title}${year ? ` (${year})` : ""}`,
    description,
    path,
    image,
    type:
      type === "tv"
        ? "video.tv_show"
        : "video.movie",

    content: shell(
      type === "tv"
        ? "TV show"
        : "Movie details",
      title,
      description
    ),

    schema: {
      "@context": "https://schema.org",

      "@type":
        type === "tv"
          ? "TVSeries"
          : "Movie",

      name: title,
      description,
      image,

      dateCreated: date || undefined,

      aggregateRating:
        media.vote_count > 0
          ? {
              "@type": "AggregateRating",
              ratingValue:
                media.vote_average?.toFixed(1),
              ratingCount: media.vote_count,
              bestRating: 10,
              worstRating: 0,
            }
          : undefined,
    },
  };
}

async function run() {
  const indexHtml = await readFile(
    join(DIST, "index.html"),
    "utf8"
  );

  let entries = [...baseRoutes];

  const staticPages = [
    {
      path: "/",
      title:
        "FlickMuse — Movie Discovery, Trailers & Cast",
      description:
        "Explore trending, popular, upcoming, and top-rated movies on FlickMuse.",

      content: shell(
        "Movie discovery",
        "Discover movies, trailers, and cast",
        "Explore trending films, discover genres, compare movies, watch trailers and keep a personal watchlist."
      ),
    },

    {
      path: "/discover",
      title:
        "Discover Movies by Genre, Year and Rating",
      description:
        "Find movies by genre, release year, rating, and popularity with FlickMuse filters.",

      content: shell(
        "Find your next title",
        "Discover movies",
        "Filter movie discovery by genre, release year, rating and popularity."
      ),
    },

    {
      path: "/tv",
      title: "Discover TV Shows",
      description:
        "Explore popular and trending TV shows on FlickMuse.",

      content: shell(
        "TV discovery",
        "Discover TV shows",
        "Explore popular TV shows and open detailed cast, trailer and streaming information."
      ),
    },
  ];

  for (const p of staticPages) {
    await writePage(
      indexHtml,
      p.path,
      p
    );
  }

  let dynamicOk = false;

  try {
    if (
      !process.env.TMDB_API_KEY ||
      process.env.TMDB_API_KEY ===
        "ci-placeholder-key"
    ) {
      throw new Error(
        "TMDB_API_KEY unavailable"
      );
    }

    const [
      popular,
      trending,
      popularTv,
      trendingTv,
      topRated,
    ] = await Promise.all([
      tmdb("/movie/popular"),
      tmdb("/trending/movie/week"),
      tmdb("/tv/popular"),
      tmdb("/trending/tv/week"),
      tmdb("/movie/top_rated"),
    ]);

    const movies = [
      ...(popular.results || []),
      ...(trending.results || []),
    ]
      .filter(
        (m, i, a) =>
          m.id &&
          a.findIndex(
            (x) => x.id === m.id
          ) === i
      )
      .slice(0, MAX_MEDIA);

    const tv = [
      ...(popularTv.results || []),
      ...(trendingTv.results || []),
    ]
      .filter(
        (m, i, a) =>
          m.id &&
          a.findIndex(
            (x) => x.id === m.id
          ) === i
      )
      .slice(0, MAX_MEDIA);

    for (const m of movies) {
      await writePage(
        indexHtml,
        mediaPath(m, "movie"),
        mediaData(m, "movie")
      );
    }

    for (const m of tv) {
      await writePage(
        indexHtml,
        mediaPath(m, "tv"),
        mediaData(m, "tv")
      );
    }

    entries.push(
      ...movies.map((m) => ({
        path: mediaPath(m, "movie"),
        priority: "0.7",
      })),

      ...tv.map((m) => ({
        path: mediaPath(m, "tv"),
        priority: "0.7",
      }))
    );

    const top =
      topRated.results || [];

    await writePage(
      indexHtml,
      "/top-rated",
      {
        title:
          "Top-Rated Movies — Audience Favorites",

        description:
          CATEGORY_PAGES["top-rated"]
            .description,

        path: "/top-rated",

        content: shell(
          "Critically loved",
          "Top-Rated Movies",
          CATEGORY_PAGES["top-rated"]
            .description,

          top
            .slice(0, 10)
            .map((m) => ({
              name: m.title,
              path: mediaPath(
                m,
                "movie"
              ),
              meta:
                m.vote_average?.toFixed(
                  1
                ),
            }))
        ),

        schema: {
          "@context":
            "https://schema.org",

          "@type": "ItemList",

          name: "Top-Rated Movies",

          itemListElement: top.map(
            (m, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}${mediaPath(
                m,
                "movie"
              )}`,
              name: m.title,
            })
          ),
        },
      }
    );

    for (const genre of MOVIE_GENRES) {
      const data = await tmdb(
        "/discover/movie",
        {
          with_genres: genre.id,
          sort_by: "popularity.desc",
          include_adult: "false",
          page: "1",
        }
      );

      const items =
        data.results || [];

      await writePage(
        indexHtml,
        genre.path,
        {
          title: `${genre.name} Movies — Popular Picks & Ratings`,

          description:
            genre.description,

          path: genre.path,

          content: shell(
            "Movie genre",
            `${genre.name} movies`,
            genre.description,

            items
              .slice(0, 10)
              .map((m) => ({
                name: m.title,
                path: mediaPath(
                  m,
                  "movie"
                ),
                meta:
                  m.release_date?.slice(
                    0,
                    4
                  ),
              }))
          ),

          schema: {
            "@context":
              "https://schema.org",

            "@type": "ItemList",

            name: `${genre.name} movies`,

            itemListElement:
              items.map(
                (m, i) => ({
                  "@type":
                    "ListItem",
                  position: i + 1,
                  url: `${SITE_URL}${mediaPath(
                    m,
                    "movie"
                  )}`,
                  name: m.title,
                })
              ),
          },
        }
      );
    }

    dynamicOk = true;
  } catch (error) {
    console.warn(
      "Dynamic SEO data skipped:",
      error.message
    );

    await writePage(
      indexHtml,
      "/top-rated",
      {
        title:
          "Top-Rated Movies — Audience Favorites",

        description:
          CATEGORY_PAGES["top-rated"]
            .description,

        path: "/top-rated",

        content: shell(
          "Critically loved",
          "Top-Rated Movies",
          CATEGORY_PAGES["top-rated"]
            .description
        ),
      }
    );

    for (const genre of MOVIE_GENRES) {
      await writePage(
        indexHtml,
        genre.path,
        {
          title: `${genre.name} Movies — Popular Picks & Ratings`,

          description:
            genre.description,

          path: genre.path,

          content: shell(
            "Movie genre",
            `${genre.name} movies`,
            genre.description
          ),
        }
      );
    }
  }

  const xml = sitemap(entries);

  await Promise.all([
    writeFile(
      PUBLIC_SITEMAP,
      xml
    ),

    writeFile(
      join(DIST, "sitemap.xml"),
      xml
    ),
  ]);

  console.log(
    `Generated ${baseRoutes.length} evergreen SEO routes${
      dynamicOk
        ? " plus controlled movie/TV pages"
        : " with safe static fallbacks"
    }.`
  );
}

await run();