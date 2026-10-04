import test from "node:test";
import assert from "node:assert/strict";
import { buildMovieDiscoveryParams, compactQuery } from "../src/api/queryBuilders.ts";

test("compactQuery removes empty values and stringifies supported values", () => {
  assert.deepEqual(compactQuery({ page: 2, include_adult: false, empty: "", missing: undefined }), { page: "2", include_adult: "false" });
});

test("movie discovery builder maps typed filters to TMDB query names", () => {
  const params = buildMovieDiscoveryParams({ page: 3, genre: 878, year: 2026, minimumRating: 7, region: "IN", minRuntime: 80, maxRuntime: 140 });
  assert.equal(params.page, "3"); assert.equal(params.with_genres, "878"); assert.equal(params.primary_release_year, "2026"); assert.equal(params["vote_average.gte"], "7"); assert.equal(params.region, "IN"); assert.equal(params["with_runtime.gte"], "80"); assert.equal(params["with_runtime.lte"], "140");
});
