module.exports = {
  ci: {
    collect: {
      startServerCommand: "node scripts/serve-dist-spa.mjs 4174",
      startServerReadyPattern: "FlickMuse SPA audit server listening",
      startServerReadyTimeout: 10000,
      numberOfRuns: 2,
      url: [
        "http://127.0.0.1:4174/",
        "http://127.0.0.1:4174/genre/action",
        "http://127.0.0.1:4174/movie/fight-club/550",
      ],
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        "categories:performance": ["error", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "uses-long-cache-ttl": "off",
        "service-worker": "off",
        "installable-manifest": "off",
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
