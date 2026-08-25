import { apiFetch } from "@/core/api/http";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import type {
  MunicipalityRequest,
  PromoteMunicipalAdminPayload,
} from "@/features/admin/types";

const PENDING_REQUESTS_ENDPOINT = `${BASE_URL}/requests/pending`;
const APPROVE_REQUEST_ENDPOINT = `${BASE_URL}/requests/approve`;
const REJECT_REQUEST_ENDPOINT = `${BASE_URL}/requests/reject`;

interface RawMunicipalityRequest {
  id?: number;
  status?: string;
  createdAt?: string;
  institutionName?: string;
  employeePosition?: string;
  justification?: string;
  username?: string;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  if (res.status === 401) {
    return "Sesiunea nu mai este validă sau tokenul lipsește. Deloghează-te și autentifică-te din nou.";
  }

  if (res.status === 403) {
    return "Nu ai permisiuni de admin pentru această acțiune.";
  }

  const text = await res.text().catch(() => "");
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text) as {
      message?: string;
      error?: string;
      detail?: string;
    };

    return parsed.message ?? parsed.detail ?? parsed.error ?? fallback;
  } catch {
    return text;
  }
}

function extractListPayload<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];

  if (raw && typeof raw === "object") {
    const listCandidates = ["items", "content", "data", "results"] as const;

    for (const key of listCandidates) {
      const value = (raw as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as T[];
    }
  }

  return [];
}

function normalizeRequest(raw: RawMunicipalityRequest): MunicipalityRequest {
  return {
    id: Number(raw.id ?? 0),
    status: raw.status ?? "PENDING",
    createdAt: raw.createdAt ?? "",
    institutionName: raw.institutionName ?? "Instituție necunoscută",
    employeePosition: raw.employeePosition ?? "",
    justification: raw.justification ?? "",
    username: raw.username ?? "",
  };
}

export async function getPendingRequests(): Promise<MunicipalityRequest[]> {
  const res = await apiFetch(PENDING_REQUESTS_ENDPOINT);

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-au putut încărca cererile în așteptare.")
    );
  }

  const raw = await res.json();
  return extractListPayload<RawMunicipalityRequest>(raw).map(normalizeRequest);
}

export async function approveRequest(
  requestId: number,
  payload: PromoteMunicipalAdminPayload
): Promise<void> {
  const res = await apiFetch(`${APPROVE_REQUEST_ENDPOINT}/${requestId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut aproba cererea.")
    );
  }
}

export async function rejectRequest(requestId: number): Promise<void> {
  const res = await apiFetch(`${REJECT_REQUEST_ENDPOINT}/${requestId}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut respinge cererea.")
    );
  }
}
