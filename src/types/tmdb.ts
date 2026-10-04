export type MediaType = "movie" | "tv";

export interface Genre { id: number; name: string; }
export interface CastMember { id: number; name: string; character?: string; profile_path?: string | null; }
export interface Video { id: string; key: string; name: string; site: string; type: string; official?: boolean; }
export interface WatchProvider { provider_id: number; provider_name: string; logo_path?: string | null; }
export interface Movie { id: number; title: string; overview?: string; poster_path?: string | null; backdrop_path?: string | null; release_date?: string; vote_average?: number; vote_count?: number; runtime?: number | null; genre_ids?: number[]; genres?: Genre[]; media_type?: "movie"; }
export interface TVShow { id: number; name: string; overview?: string; poster_path?: string | null; backdrop_path?: string | null; first_air_date?: string; vote_average?: number; vote_count?: number; genre_ids?: number[]; genres?: Genre[]; media_type?: "tv"; }
export type MediaItem = Movie | TVShow;
export interface Person { id: number; name: string; profile_path?: string | null; known_for_department?: string; }
export interface PaginatedResponse<T> { page: number; results: T[]; total_pages: number; total_results: number; }
export interface ApiError { status_code?: number; status_message?: string; success?: boolean; }
export interface DiscoveryParams { page?: number; genre?: number | string; year?: number | string; sortBy?: string; minimumRating?: number | string; region?: string; minRuntime?: number; maxRuntime?: number; }
