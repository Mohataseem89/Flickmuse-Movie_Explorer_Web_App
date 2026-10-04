export const REGION_STORAGE_KEY = "FlickMuse_watch_region";
export const DEFAULT_REGION = "IN";

export const WATCH_REGIONS = [
  ["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"],
  ["CA", "Canada"], ["AU", "Australia"], ["DE", "Germany"], ["FR", "France"],
  ["ES", "Spain"], ["IT", "Italy"], ["JP", "Japan"], ["KR", "South Korea"],
  ["BR", "Brazil"], ["MX", "Mexico"], ["NL", "Netherlands"], ["SE", "Sweden"],
];

const supported = new Set(WATCH_REGIONS.map(([code]) => code));

export function getInitialRegion(storage = window.localStorage, locale = navigator.language) {
  try {
    const saved = storage.getItem(REGION_STORAGE_KEY)?.toUpperCase();
    if (supported.has(saved)) return saved;
  } catch { /* localStorage is optional */ }
  const localeRegion = locale?.split("-")[1]?.toUpperCase();
  return supported.has(localeRegion) ? localeRegion : DEFAULT_REGION;
}

export function saveRegion(region, storage = window.localStorage) {
  if (!supported.has(region)) return false;
  try { storage.setItem(REGION_STORAGE_KEY, region); } catch { /* optional */ }
  return true;
}

export function getRegionName(region) {
  return WATCH_REGIONS.find(([code]) => code === region)?.[1] || region;
}
