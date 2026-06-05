import { getAllReports, normalizeReportResponse } from "@/core/api/api";
import { apiFetch } from "@/core/api/http";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import type { Report, ReportStatus } from "@/shared/types";

export interface MunicipalReportUpdateRequest {
  status: ReportStatus;
  file?: File;
}

function extractListPayload<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];

  if (raw && typeof raw === "object") {
    const listCandidates = ["items", "content", "data", "results", "reports"] as const;

    for (const key of listCandidates) {
      const value = (raw as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as T[];
    }
  }

  return [];
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

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  if (res.status === 401) {
    return "Sesiunea nu mai este validă sau tokenul lipsește. Deloghează-te și autentifică-te din nou.";
  }

  if (res.status === 403) {
    return "Nu ai permisiuni de municipal admin pentru această acțiune.";
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

export async function getMunicipalAdminReports(): Promise<Report[]> {
  const res = await apiFetch(`${BASE_URL}/reports/municipal-admin`);

  if (!res.ok) {
    const errorMessage = await parseErrorMessage(
      res,
      "Nu s-au putut încărca rapoartele municipalității."
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

  const list = extractListPayload<unknown>(raw);
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
      await parseErrorMessage(res, "Raportul nu a putut fi actualizat.")
    );
  }

  const raw = await res.json();
  return normalizeReportResponse(raw);
}
