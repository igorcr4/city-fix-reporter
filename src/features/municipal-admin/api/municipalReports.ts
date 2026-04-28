import { getAllReports, normalizeReportResponse, updateReport } from "@/core/api/api";
import { apiFetch } from "@/core/api/http";
import type { MunicipalReportsResult, MunicipalScope } from "@/features/municipal-admin/types";
import { reportBelongsToMunicipality } from "@/features/municipal-admin/helpers/reportFilters";
import type { Report, ReportStatus } from "@/shared/types";

const BASE_URL = "http://localhost:8080/api";
const RECOMMENDED_BACKEND_ENDPOINT = "GET /api/reports/municipal-admin";

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

function getCandidateEndpoints(scope: MunicipalScope): string[] {
  const endpoints = [
    `${BASE_URL}/reports/municipal-admin`,
    `${BASE_URL}/reports/municipality-admin`,
    `${BASE_URL}/municipal-admin/reports`,
  ];

  if (scope.municipalityId != null) {
    endpoints.push(`${BASE_URL}/reports/municipality/${scope.municipalityId}`);
  }

  return endpoints;
}

export async function getMunicipalAdminReports(
  scope: MunicipalScope
): Promise<MunicipalReportsResult> {
  for (const endpoint of getCandidateEndpoints(scope)) {
    const res = await apiFetch(endpoint);

    if (res.status === 404 || res.status === 405) {
      continue;
    }

    if (!res.ok) {
      throw new Error(
        await parseErrorMessage(
          res,
          "Nu s-au putut încărca rapoartele municipalității."
        )
      );
    }

    if (res.status === 204) {
      return {
        reports: [],
        source: "backend-scoped",
        recommendedEndpoint: null,
      };
    }

    const raw = await res.json().catch(() => null);
    if (!raw) {
      return {
        reports: [],
        source: "backend-scoped",
        recommendedEndpoint: null,
      };
    }

    const list = extractListPayload<unknown>(raw);
    const normalized = (list.length > 0 ? list : [raw]).map((item) =>
      normalizeReportResponse(item)
    );

    return {
      reports: normalized,
      source: "backend-scoped",
      recommendedEndpoint: null,
    };
  }

  const reports = await getAllReports();

  return {
    reports: reports.filter((report) => reportBelongsToMunicipality(report, scope)),
    source: "client-fallback",
    recommendedEndpoint: RECOMMENDED_BACKEND_ENDPOINT,
  };
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
