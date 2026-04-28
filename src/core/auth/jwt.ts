export interface JwtPayload {
  exp?: number;
  [claim: string]: unknown;
}

function normalizeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;

  if (padding === 0) return normalized;
  return `${normalized}${"=".repeat(4 - padding)}`;
}

export function decodeJwtPayload(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const decoded = atob(normalizeBase64Url(parts[1]));
    const payload = JSON.parse(decoded) as unknown;

    return payload && typeof payload === "object" ? (payload as JwtPayload) : null;
  } catch {
    return null;
  }
}

export function getJwtExpiration(token: string | null | undefined): number | null {
  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === "number" ? payload.exp : null;
}

export function getJwtExpirationTime(token: string | null | undefined): number | null {
  const exp = getJwtExpiration(token);
  return exp ? exp * 1000 : null;
}

export function isJwtExpired(
  token: string | null | undefined,
  clockSkewSeconds = 0
): boolean {
  const expiresAt = getJwtExpirationTime(token);

  if (!expiresAt) return true;

  return Date.now() >= expiresAt - clockSkewSeconds * 1000;
}

export function isJwtValid(token: string | null | undefined): boolean {
  return !isJwtExpired(token);
}
