import {
  getAllReports,
  normalizeReportResponse,
} from "@/features/reports/api/reports";
import { apiFetch } from "@/core/api/http";
import { extractListPayload, parseErrorMessage } from "@/core/api/parsing";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import type { Report, ReportStatus } from "@/shared/types";

const MUNICIPAL_ADMIN_FORBIDDEN_MESSAGE =
  "Nu ai permisiuni de municipal admin pentru această acțiune.";

export interface MunicipalReportUpdateRequest {
  status: ReportStatus;
  file?: File;
}

function isReportPayload(raw: unknown): boolean {
  return !!raw && typeof raw === "object" && "id" in raw;
}

async function isApplicationReportsListEmpty(): Promise<boolean> {
  try {
    const reports = await getAllReports();
    return reports.length === 0;
  } catch {
    return false;
  }
}

export async function getMunicipalAdminReports(): Promise<Report[]> {
  const res = await apiFetch(`${BASE_URL}/reports/municipal-admin`);

  if (!res.ok) {
    const errorMessage = await parseErrorMessage(
      res,
      "Nu s-au putut încărca rapoartele municipalității.",
      { forbiddenMessage: MUNICIPAL_ADMIN_FORBIDDEN_MESSAGE }
    );

    if (res.status >= 500 && res.status < 600) {
      const hasNoReports = await isApplicationReportsListEmpty();
      if (hasNoReports) return [];
    }

    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return [];
  }

  const raw = await res.json().catch(() => null);
  if (!raw) {
    return [];
  }

  const list = extractListPayload<unknown>(raw, ["reports"]);
  const payload = list.length > 0 ? list : isReportPayload(raw) ? [raw] : [];

  return payload.map((item) =>
    normalizeReportResponse(item)
  );
}

export async function updateMunicipalReport(
  report: Report,
  data: MunicipalReportUpdateRequest
): Promise<Report> {
  const formData = new FormData();

  formData.append(
    "data",
    new Blob([JSON.stringify({ status: data.status })], {
      type: "application/json",
    })
  );

  if (data.file) {
    formData.append("file", data.file);
  }

  const res = await apiFetch(`${BASE_URL}/reports/update/${report.id}`, {
    method: "PATCH",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Raportul nu a putut fi actualizat.", {
        forbiddenMessage: MUNICIPAL_ADMIN_FORBIDDEN_MESSAGE,
      })
    );
  }

  const raw = await res.json();
  return normalizeReportResponse(raw);
}
