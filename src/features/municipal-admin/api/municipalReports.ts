import { normalizeReportResponse, updateReport } from "@/core/api/api";
import { apiFetch } from "@/core/api/http";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import type { Report, ReportStatus } from "@/shared/types";

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
    throw new Error(
      await parseErrorMessage(
        res,
        "Nu s-au putut încărca rapoartele municipalității."
      )
    );
  }

  if (res.status === 204) {
    return [];
  }

  const raw = await res.json().catch(() => null);
  if (!raw) {
    return [];
  }

  const list = extractListPayload<unknown>(raw);
  return (list.length > 0 ? list : [raw]).map((item) =>
    normalizeReportResponse(item)
  );
}

export async function updateMunicipalReportStatus(
  report: Report,
  status: ReportStatus
): Promise<Report> {
  return updateReport(report.id, {
    title: report.title,
    description: report.description,
    category: report.category,
    status,
    latitude: report.latitude,
    longitude: report.longitude,
    address: report.address,
  });
}
