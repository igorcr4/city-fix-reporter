import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/shared/types";
import { getJwtExpirationTime, isJwtExpired } from "@/core/auth/jwt";
import { getUserRoles } from "@/core/auth/roles";
import {
  clearStoredSession,
  invalidateAuthSession,
  listenForInvalidAuthSession,
  persistStoredSession,
  readStoredSession,
} from "@/core/auth/session";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

interface StoredUserLike {
  id?: number;
  userId?: number;
  username?: string;
  email?: string;
  token?: string;
  roles?: unknown[];
  municipalityId?: number | null;
  municipalityName?: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeStoredUser(raw: StoredUserLike | null | undefined): User | null {
  if (!raw) return null;
  if (typeof raw !== "object") return null;

  const id = raw.id ?? raw.userId;
  const token = raw.token;

  if (id == null || !token || isJwtExpired(token)) return null;

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;

  const normalizedRoles = getUserRoles({
    roles: raw.roles,
    token,
  });

  return {
    id: numericId,
    username: raw.username ?? "",
    email: raw.email ?? "",
    token: String(token),
    role: normalizedRoles[0] ?? undefined,
    roles: normalizedRoles,
    municipalityId: raw.municipalityId ?? null,
    municipalityName: raw.municipalityName ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    const normalized = normalizeStoredUser(readStoredSession() as StoredUserLike);

    if (normalized) {
      persistStoredSession(normalized);
    } else {
      clearStoredSession();
    }

    return normalized;
  });

  const setUser = (u: User | null) => {
    const normalized = u ? normalizeStoredUser(u) : null;

    setUserState(normalized);

    if (normalized) {
      persistStoredSession(normalized);
    } else {
      clearStoredSession();
    }
  };

  useEffect(() => {
    return listenForInvalidAuthSession(() => {
      setUserState(null);
    });
  }, []);

  useEffect(() => {
    if (!user?.token) return;

    const expiresAt = getJwtExpirationTime(user.token);

    if (!expiresAt || isJwtExpired(user.token)) {
      invalidateAuthSession();
      return;
    }

    const timeoutMs = Math.max(expiresAt - Date.now(), 0);
    const timeoutId = window.setTimeout(() => {
      invalidateAuthSession();
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [user?.token]);

  useEffect(() => {
    if (!user) return;

    const normalized = normalizeStoredUser(user);
    if (!normalized) {
      invalidateAuthSession();
      return;
    }

    const currentRoles = JSON.stringify(user.roles ?? []);
    const nextRoles = JSON.stringify(normalized.roles ?? []);
    const shouldSync =
      user.role !== normalized.role ||
      currentRoles !== nextRoles ||
      user.municipalityId !== normalized.municipalityId ||
      user.municipalityName !== normalized.municipalityName;

    if (!shouldSync) return;

    setUserState(normalized);
    persistStoredSession(normalized);
  }, [user]);

  const logout = () => setUser(null);
  const isAuthenticated = !!user && !isJwtExpired(user.token);

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
