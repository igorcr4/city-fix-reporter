import type {
  Report,
  CreateReportRequest,
  UpdateReportRequest,
} from "@/shared/types";
import { REPORT_STATUS } from "@/shared/types";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import { apiFetch } from "@/core/api/http";
import { compactAdministrativeText } from "@/core/location/administrativeLocation";

interface RawUser {
  id?: number;
  username?: string;
}

interface RawMunicipality {
  id?: number | null;
  name?: string | null;
}

interface RawReport {
  id: number;
  title?: string;
  description?: string;
  category: Report["category"];
  status: string;
  imageUrl?: string | null;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  resolvedImageUrl?: string | null;
  fixedImageUrl?: string | null;
  resolutionNotes?: string | null;
  userId?: number;
  user?: RawUser;
  username?: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  municipalityId?: number | null;
  municipalityName?: string | null;
  municipality?: RawMunicipality | null;
  createdAt: string;
  updatedAt?: string | null;
  resolvedAt?: string | null;
  confirmationCount?: number | null;
  confirmedByCurrentUser?: boolean | null;
}

function normalizeReportStatus(status: string | null | undefined): Report["status"] {
  const normalized = status?.trim().toUpperCase();

  switch (normalized) {
    case "OPEN":
    case "NEW":
      return REPORT_STATUS.NEW;
    case "IN_PROGRESS":
      return REPORT_STATUS.IN_PROGRESS;
    case "RESOLVED":
    case "FIXED":
      return REPORT_STATUS.RESOLVED;
    default:
      return REPORT_STATUS.NEW;
  }
}

export function normalizeReportResponse(rawValue: unknown): Report {
  const raw = rawValue as RawReport;
  const municipalityId = raw.municipality?.id ?? raw.municipalityId ?? null;
  const municipalityName =
    raw.municipality?.name ?? raw.municipalityName ?? null;
  const confirmationCount = Number(raw.confirmationCount ?? 0);

  return {
    id: raw.id,
    title: raw.title ?? "",
    description: raw.description ?? "",
    category: raw.category,
    status: normalizeReportStatus(raw.status),
    imageUrl: raw.beforeImageUrl ?? raw.imageUrl ?? undefined,
    afterImageUrl:
      raw.afterImageUrl ?? raw.resolvedImageUrl ?? raw.fixedImageUrl ?? undefined,
    resolutionNotes: raw.resolutionNotes ?? null,
    userId: raw.userId ?? raw.user?.id ?? 0,
    username: raw.username ?? raw.user?.username ?? "Necunoscut",
    latitude: raw.latitude,
    longitude: raw.longitude,
    address: compactAdministrativeText(raw.address) || undefined,
    // Denumirile CSC se afișează ca atare, identic pentru orice țară.
    country: raw.country ?? null,
    state: raw.state ?? null,
    city: raw.city ?? null,
    municipalityId:
      municipalityId !== null && municipalityId !== undefined
        ? Number(municipalityId)
        : null,
    municipalityName:
      compactAdministrativeText(municipalityName) || null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
    resolvedAt: raw.resolvedAt ?? null,
    confirmationCount: Number.isFinite(confirmationCount) ? confirmationCount : 0,
    confirmedByCurrentUser: raw.confirmedByCurrentUser === true,
  };
}

export async function getAllReports(): Promise<Report[]> {
  const res = await apiFetch(`${BASE_URL}/reports`);
  if (!res.ok) throw new Error("Nu s-au putut încărca rapoartele");

  const raw = (await res.json()) as unknown;
  return Array.isArray(raw)
    ? raw.map((item) => normalizeReportResponse(item))
    : [];
}

export async function getMyReports(): Promise<Report[]> {
  const res = await apiFetch(`${BASE_URL}/reports/my-reports`);
  if (!res.ok) throw new Error("Nu s-au putut încărca rapoartele tale");

  const raw = (await res.json()) as unknown;
  return Array.isArray(raw)
    ? raw.map((item) => normalizeReportResponse(item))
    : [];
}

export async function getReportById(id: number): Promise<Report> {
  const res = await apiFetch(`${BASE_URL}/reports/${id}`);
  if (!res.ok) throw new Error("Raportul nu a fost găsit");

  const raw = (await res.json()) as RawReport;
  return normalizeReportResponse(raw);
}

export async function createReport(data: CreateReportRequest): Promise<Report> {
  const formData = new FormData();

  const payload = {
    title: data.title,
    description: data.description,
    category: data.category,
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address ?? null,
    countryIso2: data.countryIso2,
    stateIso2: data.stateIso2,
    countryName: data.countryName,
    stateName: data.stateName,
    cityName: data.cityName,
  };

  formData.append(
    "data",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );

  if (data.file) {
    formData.append("file", data.file);
  }

  const res = await apiFetch(`${BASE_URL}/reports/create`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(errorText || "Raportul nu a putut fi creat");
  }

  const raw = (await res.json()) as RawReport;
  return normalizeReportResponse(raw);
}

export async function updateReport(
  id: number,
  data: UpdateReportRequest
): Promise<Report> {
  const formData = new FormData();

  const payload = {
    title: data.title,
    description: data.description,
    category: data.category,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    address: data.address ?? null,
    removeImage: data.removeImage ?? false,
  };

  if (data.status) {
    Object.assign(payload, {
      status: data.status,
    });
  }

  formData.append(
    "data",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );

  if (data.file) {
    formData.append("file", data.file);
  }

  const res = await apiFetch(`${BASE_URL}/reports/update/${id}`, {
    method: "PATCH",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(errorText || "Raportul nu a putut fi actualizat");
  }

  const raw = (await res.json()) as RawReport;
  return normalizeReportResponse(raw);
}

export async function deleteReport(id: number): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/reports/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Raportul nu a putut fi șters");
}
