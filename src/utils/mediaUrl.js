export function slugifyTitle(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "title";
}

export function normalizeMediaType(value) {
  return value === "tv" ? "tv" : "movie";
}

export function getMediaTitle(media) {
  return media?.title || media?.name || "title";
}

export function getMediaPath(media, mediaType = media?.media_type) {
  if (!media?.id) return "/";
  const type = normalizeMediaType(mediaType);
  return `/${type}/${slugifyTitle(getMediaTitle(media))}/${media.id}`;
}

export function getMediaPathFromParts(mediaType, title, id) {
  if (!id) return "/";
  return `/${normalizeMediaType(mediaType)}/${slugifyTitle(title)}/${id}`;
}
