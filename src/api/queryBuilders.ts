import type { DiscoveryParams } from "../types/tmdb";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, string>;

export function compactQuery(params: Record<string, QueryValue>): QueryParams {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "").map(([key, value]) => [key, String(value)]));
}

export function buildMovieDiscoveryParams(filters: DiscoveryParams = {}): QueryParams {
  return compactQuery({
    page: filters.page ?? 1,
    include_adult: false,
    include_video: false,
    sort_by: filters.sortBy ?? "popularity.desc",
    with_genres: filters.genre,
    primary_release_year: filters.year,
    "vote_average.gte": filters.minimumRating,
    region: filters.region,
    "with_runtime.gte": filters.minRuntime,
    "with_runtime.lte": filters.maxRuntime,
  });
}
