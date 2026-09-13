import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const { API_KEY: apiKey } = loadEnv(mode, process.cwd(), "API_");

  return {
    plugins: [react(), tailwindcss()],
    test: {
      environment: "jsdom",
      setupFiles: "./tests/components/setup.js",
      include: ["tests/components/**/*.test.{js,jsx}"],
    },
    server: apiKey
      ? {
          proxy: {
            "/api/tmdb": {
              target: "https://api.themoviedb.org",
              changeOrigin: true,
              rewrite: (requestPath) => {
                const url = new URL(requestPath, "http://localhost");
                const path = url.searchParams.get("path") || "";
                url.searchParams.delete("path");
                url.searchParams.set("api_key", apiKey);
                return "/3" + path + "?" + url.searchParams.toString();
              },
            },
          },
        }
      : undefined,
  };
});
