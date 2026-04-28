import type { User } from "@/shared/types";

export const AUTH_STORAGE_KEY = "fixcity_user";
export const AUTH_SESSION_INVALID_EVENT = "fixcity:auth-session-invalid";

function hasBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readStoredSession(): unknown | null {
  if (!hasBrowserStorage()) return null;

  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as unknown;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getStoredToken(): string | null {
  const stored = readStoredSession();

  if (!stored || typeof stored !== "object") return null;

  const token = (stored as { token?: unknown }).token;
  return typeof token === "string" && token.trim() ? token : null;
}

export function persistStoredSession(user: User): void {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredSession(): void {
  if (!hasBrowserStorage()) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function notifyInvalidAuthSession(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_INVALID_EVENT));
}

export function invalidateAuthSession(): void {
  clearStoredSession();
  notifyInvalidAuthSession();
}

export function listenForInvalidAuthSession(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(AUTH_SESSION_INVALID_EVENT, listener);
  return () => window.removeEventListener(AUTH_SESSION_INVALID_EVENT, listener);
}
