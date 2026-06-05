import type {
  LoginRequest,
  RegisterRequest,
  Report,
  CreateReportRequest,
  UpdateReportRequest,
  User,
} from "@/shared/types";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import { apiFetch } from "@/core/api/http";
import { isJwtExpired } from "@/core/auth/jwt";
import { getUserRoles } from "@/core/auth/roles";
import {
  localizeAdministrativeText,
  localizeAdministrativeValue,
} from "@/core/location/administrativeLocation";

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
}

interface ReverseGeocodeAddress {
  road?: string;
  street?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  cycleway?: string;
  residential?: string;
  neighbourhood?: string;
  suburb?: string;
  house_number?: string;
  housenumber?: string;
  street_number?: string;
  house_name?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  city_district?: string;
  state?: string;
  state_district?: string;
  region?: string;
  province?: string;
  county?: string;
  district?: string;
  country?: string;
}

interface ReverseGeocodeResponse {
  address?: ReverseGeocodeAddress;
  display_name?: string;
}

export interface ReverseGeocodeLocationDetails {
  address: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
}

type ReverseGeocodeAddressKey = keyof ReverseGeocodeAddress;

const STATE_ADDRESS_CANDIDATES: ReverseGeocodeAddressKey[] = [
  "state",
  "county",
  "region",
  "province",
  "state_district",
  "district",
  "municipality",
];

const HOUSE_NUMBER_ADDRESS_CANDIDATES: ReverseGeocodeAddressKey[] = [
  "house_number",
  "housenumber",
  "street_number",
];

const STREET_ADDRESS_CANDIDATES: ReverseGeocodeAddressKey[] = [
  "road",
  "street",
  "pedestrian",
  "footway",
  "path",
  "cycleway",
  "residential",
  "neighbourhood",
  "suburb",
];

const LOCALITY_ADDRESS_CANDIDATES: ReverseGeocodeAddressKey[] = [
  "city",
  "town",
  "village",
  "municipality",
  "city_district",
  "county",
];

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

function normalizeReportStatus(status: string | null | undefined): Report["status"] {
  const normalized = status?.trim().toUpperCase();

  switch (normalized) {
    case "OPEN":
    case "NEW":
      return "NEW";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "RESOLVED":
    case "FIXED":
      return "RESOLVED";
    default:
      return "NEW";
  }
}

export function normalizeReportResponse(rawValue: unknown): Report {
  const raw = rawValue as RawReport;
  const municipalityId = raw.municipality?.id ?? raw.municipalityId ?? null;
  const municipalityName =
    raw.municipality?.name ?? raw.municipalityName ?? null;

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
    address: localizeAdministrativeText(raw.address) || undefined,
    country: localizeAdministrativeValue("country", raw.country) || null,
    state: localizeAdministrativeValue("state", raw.state) || null,
    city: localizeAdministrativeValue("city", raw.city) || null,
    municipalityId:
      municipalityId !== null && municipalityId !== undefined
        ? Number(municipalityId)
        : null,
    municipalityName:
      localizeAdministrativeValue("city", municipalityName) || null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
  };
}

function formatReverseGeocodeAddress(raw: ReverseGeocodeResponse): string {
  const addr = raw?.address ?? {};
  const street = pickFirstAddressValue(addr, STREET_ADDRESS_CANDIDATES).value;
  const houseNumber = pickFirstAddressValue(
    addr,
    HOUSE_NUMBER_ADDRESS_CANDIDATES
  ).value;
  const locality = pickFirstAddressValue(addr, LOCALITY_ADDRESS_CANDIDATES).value;
  const houseName =
    typeof addr.house_name === "string" ? addr.house_name.trim() : "";
  const displayNameStreetLine = extractStreetLineFromDisplayName(
    raw.display_name,
    street
  );

  const streetLine =
    displayNameStreetLine ??
    (street && houseNumber
      ? `${street} ${houseNumber}`
      : street ?? (houseName || null));

  if (streetLine && locality) return `${streetLine}, ${locality}`;
  if (streetLine) return streetLine;
  if (locality) return locality;

  return raw?.display_name?.trim() ?? "";
}

function looksLikeHouseNumber(value: string): boolean {
  return /^[0-9]+[A-Za-z]?(?:[-/][0-9A-Za-z]+)?$/.test(
    value.replace(/\s+/g, "")
  );
}

function extractStreetLineFromDisplayName(
  displayName: string | undefined,
  street: string | null
): string | null {
  if (!displayName || !street) return null;

  const parts = displayName
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return null;

  const [firstPart, secondPart] = parts;
  const normalizedStreet = street.toLocaleLowerCase();
  const firstPartLower = firstPart?.toLocaleLowerCase() ?? "";
  const secondPartLower = secondPart?.toLocaleLowerCase() ?? "";

  if (
    firstPartLower.includes(normalizedStreet) &&
    firstPart.length > street.length
  ) {
    return firstPart;
  }

  if (looksLikeHouseNumber(firstPart) && secondPartLower.includes(normalizedStreet)) {
    return `${secondPart} ${firstPart}`;
  }

  return null;
}

function pickFirstAddressValue(
  address: ReverseGeocodeAddress,
  candidates: ReverseGeocodeAddressKey[]
): {
  value: string | null;
  source: ReverseGeocodeAddressKey | null;
} {
  for (const candidate of candidates) {
    const rawValue = address[candidate];
    const value = typeof rawValue === "string" ? rawValue.trim() : "";

    if (value) {
      return {
        value,
        source: candidate,
      };
    }
  }

  return {
    value: null,
    source: null,
  };
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const details = await reverseGeocodeLocationDetails(latitude, longitude);
  return details.address;
}

export async function reverseGeocodeLocationDetails(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeLocationDetails> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "ro");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "ro",
    },
  });

  if (!res.ok) {
    throw new Error(`Reverse geocoding failed (${res.status})`);
  }

  const raw = (await res.json()) as ReverseGeocodeResponse;
  const address = raw.address ?? {};
  const formatted = formatReverseGeocodeAddress(raw).trim();
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.city_district ??
    address.county ??
    null;
  const stateSelection = pickFirstAddressValue(address, STATE_ADDRESS_CANDIDATES);
  const country = address.country ?? null;

  return {
    address: localizeAdministrativeText(formatted) || null,
    country: localizeAdministrativeValue("country", country) || null,
    state: localizeAdministrativeValue("state", stateSelection.value) || null,
    city: localizeAdministrativeValue("city", city) || null,
  };
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
      localizeAdministrativeValue("city", raw.municipalityName) || null,
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
    country: data.country,
    state: data.state,
    city: data.city,
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
