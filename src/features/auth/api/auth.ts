import type { LoginRequest, RegisterRequest, User } from "@/shared/types";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import { isJwtExpired } from "@/core/auth/jwt";
import { getUserRoles } from "@/core/auth/roles";
import { compactAdministrativeText } from "@/core/location/administrativeLocation";

interface RawAuthResponse {
  id?: number;
  userId?: number;
  username: string;
  email: string;
  token: string;
  roles?: unknown[];
  municipalityId?: number | null;
  municipalityName?: string | null;
}

export async function login(data: LoginRequest): Promise<User> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Autentificare eșuată");

  const raw = (await res.json()) as RawAuthResponse;

  if (isJwtExpired(raw.token)) {
    throw new Error("Tokenul primit de la server nu este valid.");
  }

  const normalizedRoles = getUserRoles({
    roles: raw.roles,
    token: raw.token,
  });

  return {
    id: raw.userId ?? raw.id ?? 0,
    username: raw.username,
    email: raw.email,
    token: raw.token,
    role: normalizedRoles[0] ?? undefined,
    roles: normalizedRoles,
    municipalityId: raw.municipalityId ?? null,
    municipalityName:
      compactAdministrativeText(raw.municipalityName) || null,
  } satisfies User;
}

export async function register(data: RegisterRequest): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    const errorMessage = errorText || "Înregistrare eșuată";
    console.error("REGISTER ERROR:", res.status, errorMessage);
    throw new Error(`${res.status} - ${errorMessage}`);
  }

  return;
}

