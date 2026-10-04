export const MAX_SHARED_ITEMS = 40;
const ENTRY = /^(movie|tv):(\d+)$/;

export function encodeSharedList(items) {
  return items.slice(0, MAX_SHARED_ITEMS).map((item) => `${item.media_type === "tv" ? "tv" : "movie"}:${item.id}`).join(",");
}

export function parseSharedList(value) {
  if (!value) return [];
  const unique = new Set();
  return value.split(",").slice(0, MAX_SHARED_ITEMS).flatMap((raw) => {
    const match = raw.trim().match(ENTRY);
    if (!match) return [];
    const key = `${match[1]}:${match[2]}`;
    if (unique.has(key)) return [];
    unique.add(key);
    return [{ mediaType: match[1], id: Number(match[2]) }];
  });
}
