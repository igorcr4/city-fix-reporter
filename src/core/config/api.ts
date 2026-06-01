const DEFAULT_API_ORIGIN = "http://localhost:8080";
const API_PATH = "/api";

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

const apiOrigin = normalizeUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN
);

export const API_BASE_URL = apiOrigin.endsWith(API_PATH)
  ? apiOrigin
  : `${apiOrigin}${API_PATH}`;
