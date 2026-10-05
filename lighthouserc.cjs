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
      // Gate stable category scores rather than every audit from
      // lighthouse:recommended. Several individual audits depend on the
      // lightweight local CI server (compression, caching and latency) and
      // should not fail a production-quality gate.
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
