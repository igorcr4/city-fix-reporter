const DEFAULT_API_ORIGIN = "http://localhost:8080";
const API_PATH = "/api";

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

// The localhost fallback exists only for local development. Production builds
// are rejected in vite.config.ts when VITE_API_BASE_URL is missing.
const apiOrigin = normalizeUrl(
  import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? DEFAULT_API_ORIGIN : "")
);

export const API_BASE_URL = apiOrigin.endsWith(API_PATH)
  ? apiOrigin
  : `${apiOrigin}${API_PATH}`;
