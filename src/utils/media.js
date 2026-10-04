import { getMediaPathFromParts } from "./mediaUrl.js";

export function normalizeMedia(item, fallbackType = "movie") {
  if (!item) return null;
  const mediaType = item.media_type === "tv" || fallbackType === "tv" ? "tv" : "movie";
  const title = mediaType === "tv" ? (item.name || item.title) : (item.title || item.name);
  const releaseDate = mediaType === "tv" ? (item.first_air_date || item.release_date) : (item.release_date || item.first_air_date);
  return {
    ...item,
    media_type: mediaType,
    mediaType,
    title: title || "Untitled",
    originalTitle: mediaType === "tv" ? (item.original_name || item.original_title || title) : (item.original_title || item.original_name || title),
    releaseDate: releaseDate || "",
    year: releaseDate?.slice(0, 4) || "",
    posterPath: item.poster_path || null,
    backdropPath: item.backdrop_path || null,
    rating: Number(item.vote_average) || 0,
    voteCount: Number(item.vote_count) || 0,
    genreIds: item.genre_ids || item.genres?.map((genre) => genre.id) || [],
  };
}

export function normalizeSearchResult(item) {
  if (item?.media_type === "person") {
    return { ...item, resultType: "person", title: item.name || "Unnamed person" };
  }
  const media = normalizeMedia(item, item?.media_type);
  return media ? { ...media, resultType: "media" } : null;
}

export function getNormalizedMediaPath(item, fallbackType) {
  const media = normalizeMedia(item, fallbackType);
  return media ? getMediaPathFromParts(media.mediaType, media.title, media.id) : "/";
}
