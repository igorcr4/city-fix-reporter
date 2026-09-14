import type { ReportMapFilter } from "@/features/reports/helpers/reportMapFilters";
import { REPORT_STATUS } from "@/shared/types";

export interface StoredReportMapViewState {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

const REPORT_MAP_VIEW_STATE_KEY = "fixcity:report-map-view-state";
const REPORT_MAP_FILTER_KEY = "fixcity:report-map-filter";
const REPORT_MAP_FILTERS: ReportMapFilter[] = [
  "ALL",
  "ROAD",
  "LIGHTING",
  "WASTE",
  "VANDALISM",
  "OTHER",
  REPORT_STATUS.RESOLVED,
];

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidMapViewState(value: unknown): value is StoredReportMapViewState {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<StoredReportMapViewState>;

  return (
    isFiniteNumber(candidate.latitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    isFiniteNumber(candidate.longitude) &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180 &&
    isFiniteNumber(candidate.zoom) &&
    candidate.zoom >= 0 &&
    isFiniteNumber(candidate.bearing) &&
    isFiniteNumber(candidate.pitch)
  );
}

export function readStoredReportMapViewState(): StoredReportMapViewState | null {
  if (!canUseSessionStorage()) return null;

  const raw = window.sessionStorage.getItem(REPORT_MAP_VIEW_STATE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidMapViewState(parsed) ? parsed : null;
  } catch {
    window.sessionStorage.removeItem(REPORT_MAP_VIEW_STATE_KEY);
    return null;
  }
}

export function storeReportMapViewState(viewState: StoredReportMapViewState): void {
  if (!canUseSessionStorage() || !isValidMapViewState(viewState)) return;
  window.sessionStorage.setItem(REPORT_MAP_VIEW_STATE_KEY, JSON.stringify(viewState));
}

export function readStoredReportMapFilter(): ReportMapFilter | null {
  if (!canUseSessionStorage()) return null;

  const value = window.sessionStorage.getItem(REPORT_MAP_FILTER_KEY);
  return REPORT_MAP_FILTERS.includes(value as ReportMapFilter)
    ? (value as ReportMapFilter)
    : null;
}

export function storeReportMapFilter(filter: ReportMapFilter): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(REPORT_MAP_FILTER_KEY, filter);
}

/**
 * Limitarea cererilor automate de geolocație pe harta principală.
 *
 * Regulile (cerute de produs):
 *  - dacă utilizatorul REFUZĂ permisiunea → nu mai întrebăm deloc;
 *  - dacă a dat allow dar apare o eroare (indisponibil/timeout) → mai încercăm
 *    o singură dată (maxim 2 încercări cu eroare);
 *  - după ce limita e atinsă, nu mai întrebăm — până la o sesiune nouă sau
 *    re-login (starea e keyed pe token, deci un token nou resetează totul).
 */
const REPORT_MAP_GEO_KEY = "fixcity:report-map-geolocation";
const MAX_GEO_ERROR_ATTEMPTS = 2;

export type MapGeolocationOutcome = "success" | "denied" | "error";

interface MapGeolocationState {
  token: string;
  errorCount: number;
  denied: boolean;
}

function readMapGeolocationState(): MapGeolocationState | null {
  if (!canUseSessionStorage()) return null;

  const raw = window.sessionStorage.getItem(REPORT_MAP_GEO_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<MapGeolocationState>;
    if (
      typeof parsed.token === "string" &&
      typeof parsed.errorCount === "number" &&
      typeof parsed.denied === "boolean"
    ) {
      return parsed as MapGeolocationState;
    }
    return null;
  } catch {
    window.sessionStorage.removeItem(REPORT_MAP_GEO_KEY);
    return null;
  }
}

function writeMapGeolocationState(state: MapGeolocationState): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(REPORT_MAP_GEO_KEY, JSON.stringify(state));
}

/** Putem cere automat geolocația pentru sesiunea (token-ul) curent? */
export function canRequestMapGeolocation(token: string): boolean {
  const state = readMapGeolocationState();
  // Sesiune nouă sau token nou (re-login / expirare) → resetare implicită.
  if (!state || state.token !== token) return true;
  if (state.denied) return false;
  return state.errorCount < MAX_GEO_ERROR_ATTEMPTS;
}

/** Înregistrează rezultatul unei cereri automate de geolocație. */
export function recordMapGeolocationOutcome(
  token: string,
  outcome: MapGeolocationOutcome
): void {
  if (outcome === "success") {
    // Succes → resetăm contorul (re-centrăm liber data viitoare).
    writeMapGeolocationState({ token, errorCount: 0, denied: false });
    return;
  }

  const previous = readMapGeolocationState();
  const base =
    previous && previous.token === token
      ? previous
      : { token, errorCount: 0, denied: false };

  if (outcome === "denied") {
    writeMapGeolocationState({ ...base, token, denied: true });
  } else {
    writeMapGeolocationState({
      ...base,
      token,
      errorCount: base.errorCount + 1,
    });
  }
}
