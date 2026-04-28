import type { UserRole } from "@/shared/types";
import { decodeJwtPayload } from "@/core/auth/jwt";

const KNOWN_ROLES: UserRole[] = [
  "ROLE_USER",
  "ROLE_MUNICIPAL_ADMIN",
  "ROLE_ADMIN",
];

type UserWithRoles =
  | {
      roles?: unknown[];
      token?: unknown;
    }
  | null
  | undefined;

export function parseJwtPayload(token: string | null | undefined): Record<string, unknown> | null {
  return decodeJwtPayload(token);
}

export function normalizeUserRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase() as UserRole;

  return KNOWN_ROLES.includes(normalized) ? normalized : null;
}

export function getUserRoles(user: UserWithRoles): UserRole[] {
  if (!user) return [];

  const tokenPayload =
    typeof user.token === "string" ? parseJwtPayload(user.token) : null;
  const roleCandidates = [
    ...(Array.isArray(user.roles) ? user.roles : []),
    ...(Array.isArray(tokenPayload?.roles) ? tokenPayload.roles : []),
  ];
  const extraRoles = roleCandidates.length
    ? roleCandidates
        .map((role) => normalizeUserRole(role))
        .filter((role): role is UserRole => !!role)
    : [];

  return Array.from(new Set(extraRoles));
}

export function isAdminUser(user: UserWithRoles): boolean {
  const roles = getUserRoles(user);
  return roles.includes("ROLE_ADMIN");
}

export function isMunicipalAdminUser(user: UserWithRoles): boolean {
  const roles = getUserRoles(user);
  return roles.includes("ROLE_MUNICIPAL_ADMIN");
}
