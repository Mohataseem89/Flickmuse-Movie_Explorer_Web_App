# FlickMuse — Movie Discovery, Trailers & Cast

[![CI](https://github.com/Mohataseem89/Flickmuse-Movie_Explorer_Web_App/actions/workflows/ci.yml/badge.svg)](https://github.com/Mohataseem89/Flickmuse-Movie_Explorer_Web_App/actions/workflows/ci.yml)

FlickMuse is a movie and TV discovery application built with React and TMDb. Explore popular, trending, upcoming, and top-rated titles; use shareable filters; watch trailers; browse cast and crew; check India streaming availability when TMDb provides it; and save a personal watchlist.

[Live demo](https://flickmuse.mohataseem.com/) · [Source code](https://github.com/Mohataseem89/Flickmuse-Movie_Explorer_Web_App) · 


## Highlights

- Discover trending, now-playing, upcoming, popular, and top-rated movies, plus popular TV shows.
- Search movies and TV shows by title, explore cast and crew, watch trailers, and browse related titles.
- Filter by genre, year, rating, and sort order with shareable URLs.
- Maintain a local, persistent watchlist with defensive browser-storage handling and a one-time legacy key migration.
- Use responsive images, route-level code splitting, session response caching, loading/error states, keyboard navigation, live result announcements, and reduced-motion support.

## Architecture

```mermaid
flowchart LR
  user[Browser] --> cdn[Vercel CDN]
  cdn --> spa[React + Vite SPA]
  spa --> storage[Local storage]
  spa --> proxy[Serverless /api/tmdb proxy]
  proxy --> tmdb[TMDb API]
```

Movie data is requested through `api/tmdb.js`, a narrowly allowlisted Vercel serverless proxy. The TMDb API key stays in the server environment as `TMDB_API_KEY`; it is never bundled into browser code. The build-time SEO generator can use the same server-side variable to create a sitemap and static HTML for selected movie and TV pages. Watchlist and search-history data remain on the user’s device, so the app does not require accounts or a database.

## Technology

| Technology | Purpose |
| --- | --- |
| React 19 + React Router | UI, routes, and URL-driven state |
| Vite 7 | Development and production bundling |
| Tailwind CSS 4 | Responsive UI styling |
| Vercel Functions | Protected TMDb API proxy |
| TMDb API | Movie, person, image, and video data |
| Vitest + React Testing Library + Node test runner | Component, interaction, accessibility, and utility checks |
| ESLint | Code-quality checks |
| TypeScript | Targeted type safety at API/query boundaries |
| Playwright + Lighthouse CI | Critical browser flows and quality regression budgets |

## Run locally

Requirements: Node.js 22.12+ (Node 24 is recommended; see `.nvmrc`), npm, and a TMDb API key.

```bash
git clone https://github.com/Mohataseem89/Flickmuse-Movie_Explorer_Web_App.git
cd Flickmuse-Movie_Explorer_Web_App
npm ci
cp .env.example .env.local
```

Add this value to `.env.local`:

```env
TMDB_API_KEY=your_tmdb_api_key
```

Use `npm run dev:full` to run the complete app locally, including the Vercel `/api/tmdb` function. Vite alone (`npm run dev`) is useful for UI work but does not execute the local Vercel function, so movie data requests will fail without an external proxy. The first full-development run may ask you to authenticate with Vercel.

Never commit `.env.local`. In Vercel, add the same `TMDB_API_KEY` environment variable for every environment you deploy to. Do not use a `VITE_TMDB_API_KEY` variable: Vite exposes `VITE_*` variables to browser code.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development |
| `npm run dev:full` | Start Vercel local development with the TMDb proxy |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check targeted TypeScript boundaries |
| `npm run test` | Run utility, contrast, and component tests |
| `npm run test:utils` | Run storage and contrast tests |
| `npm run test:components` | Run React component tests in JSDOM |
| `npm run build` | Create a production build |
| `npm run test:e2e` | Run Playwright critical-flow tests |
| `npm run lighthouse` | Run Lighthouse CI against the production build |
| `npm run check` | Run lint, tests, and build |

## Project map

```text
api/tmdb.js       # Vercel serverless TMDb proxy
src/api/          # Browser TMDb client and request helpers
src/components/   # Reusable UI components
src/pages/        # Route pages
src/hooks/        # Metadata and watchlist hooks
src/utils/        # Browser-storage and domain helpers
public/           # Favicons, social image, manifest, robots, sitemap
tests/            # Regression tests
```



## Deployment

Vercel uses `vercel.json` for SPA rewrites, caching, and security headers. Set `TMDB_API_KEY` in Vercel before deployment. The production domain is `https://flickmuse.mohataseem.com/`. The build generates SEO pages only when that variable is available; the CI placeholder deliberately skips API-backed generation.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Movie information and images are provided by [The Movie Database](https://www.themoviedb.org/).

## Author

Mohataseem Khan · [LinkedIn](https://www.linkedin.com/in/mohataseem-khan/) · [GitHub](https://github.com/Mohataseem89)


> Made with ❤️ for movie lovers.
