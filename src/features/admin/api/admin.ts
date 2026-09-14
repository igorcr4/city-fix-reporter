import { apiFetch } from "@/core/api/http";
import { extractListPayload, parseErrorMessage } from "@/core/api/parsing";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import { normalizeUserRole } from "@/core/auth/roles";
import { compactAdministrativeText } from "@/core/location/administrativeLocation";
import type {
  AdminUser,
  PromoteMunicipalAdminPayload,
} from "@/features/admin/types";

const ADMIN_FORBIDDEN_MESSAGE =
  "Nu ai permisiuni de admin pentru această acțiune.";

const ADMIN_USER_BY_USERNAME_ENDPOINT = `${BASE_URL}/admin/users/username`;
interface RawAdminUser {
  id?: number;
  userId?: number;
  username?: string;
  email?: string;
  role?: string;
  roles?: unknown[];
  municipalityId?: number | null;
  municipalityName?: string | null;
  municipality?: {
    id?: number;
    name?: string;
  } | null;
}

function normalizeAdminUser(raw: RawAdminUser): AdminUser {
  const municipalityId = raw.municipality?.id ?? raw.municipalityId ?? null;
  const municipalityName = raw.municipality?.name ?? raw.municipalityName ?? null;
  const role =
    normalizeUserRole(raw.role) ??
    (Array.isArray(raw.roles)
      ? raw.roles
          .map((candidate) => normalizeUserRole(candidate))
          .find((candidate): candidate is AdminUser["role"] => !!candidate)
      : null) ??
    "ROLE_USER";

  return {
    id: Number(raw.id ?? raw.userId ?? 0),
    username: raw.username ?? "Necunoscut",
    email: raw.email ?? undefined,
    role,
    municipality:
      municipalityId && municipalityName
        ? {
            id: Number(municipalityId),
            name: compactAdministrativeText(municipalityName),
          }
        : null,
  };
}

export async function findAdminUserByUsername(username: string): Promise<AdminUser | null> {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) return null;

  const searchParams = new URLSearchParams({
    username: normalizedUsername,
  });

  const res = await apiFetch(
    `${ADMIN_USER_BY_USERNAME_ENDPOINT}?${searchParams.toString()}`
  );

  if (res.status === 204 || res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut căuta userul după username.", {
        forbiddenMessage: ADMIN_FORBIDDEN_MESSAGE,
      })
    );
  }

  const raw = await res.json();
  const list = extractListPayload<RawAdminUser>(raw);

  if (list.length > 0) {
    return normalizeAdminUser(list[0]);
  }

  return normalizeAdminUser(raw as RawAdminUser);
}

export async function promoteToMunicipalAdmin(
  userId: number,
  payload: PromoteMunicipalAdminPayload
): Promise<void> {
  const res = await apiFetch(
    `${BASE_URL}/admin/user/${userId}/promote-municipal-admin`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut promova userul la municipal admin.", {
        forbiddenMessage: ADMIN_FORBIDDEN_MESSAGE,
      })
    );
  }
}

export async function demoteToRegularUser(userId: number): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/admin/user/${userId}/demote-to-user`, {
    method: "PATCH",
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut retrograda userul la rolul de user.", {
        forbiddenMessage: ADMIN_FORBIDDEN_MESSAGE,
      })
    );
  }
}
