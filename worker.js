import { handleTmdbRequest } from "./server/tmdbProxy.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/tmdb") return handleTmdbRequest(request, env, ctx);

    // Serve Vite static assets & SPA routes for everything else
    return env.ASSETS.fetch(request);
  },
};
