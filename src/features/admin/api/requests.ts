import { apiFetch } from "@/core/api/http";
import { extractListPayload, parseErrorMessage } from "@/core/api/parsing";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import type {
  MunicipalityRequest,
  PromoteMunicipalAdminPayload,
} from "@/features/admin/types";

const ADMIN_FORBIDDEN_MESSAGE =
  "Nu ai permisiuni de admin pentru această acțiune.";

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
      await parseErrorMessage(res, "Nu s-au putut încărca cererile în așteptare.", {
        forbiddenMessage: ADMIN_FORBIDDEN_MESSAGE,
      })
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
      await parseErrorMessage(res, "Nu s-a putut aproba cererea.", {
        forbiddenMessage: ADMIN_FORBIDDEN_MESSAGE,
      })
    );
  }
}

export async function rejectRequest(requestId: number): Promise<void> {
  const res = await apiFetch(`${REJECT_REQUEST_ENDPOINT}/${requestId}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut respinge cererea.", {
        forbiddenMessage: ADMIN_FORBIDDEN_MESSAGE,
      })
    );
  }
}
