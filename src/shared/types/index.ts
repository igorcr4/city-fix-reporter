/**
 * Sursa unică pentru statusurile unui raport. Codul referă valorile prin
 * REPORT_STATUS.*, nu prin string-uri scrise de mână, iar tipul se derivă de
 * aici ca să nu poată ieși din sincron.
 */
export const REPORT_STATUS = {
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export type ReportCategory = "ROAD" | "LIGHTING" | "WASTE" | "VANDALISM" | "OTHER";
export type UserRole = "ROLE_USER" | "ROLE_MUNICIPAL_ADMIN" | "ROLE_ADMIN";

export interface Report {
  id: number;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  imageUrl?: string;
  afterImageUrl?: string;
  resolutionNotes?: string | null;
  userId: number;     
  username: string;     
  latitude: number;
  longitude: number;
  address?: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  municipalityId?: number | null;
  municipalityName?: string | null;
  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
  confirmationCount: number;
  confirmedByCurrentUser: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  token: string;
  role?: UserRole;
  roles?: UserRole[];
  municipalityId?: number | null;
  municipalityName?: string | null;
}

export interface GeographyCountry {
  name: string;
  iso2: string;
}

export interface GeographyState {
  name: string;
  iso2: string;
}

/** Orașele nu au identificator propriu — numele este cheia. */
export interface GeographyCity {
  name: string;
}

/**
 * Rezultatul geocodării inverse făcute de backend. `stateIso2`, `state` și
 * `city` pot lipsi pentru zone pe care serverul nu le poate rezolva complet.
 */
export interface GeocodedPlace {
  countryIso2: string;
  stateIso2: string | null;
  country: string;
  state: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface CreateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  /** Adresa în limba locală, așa cum vine de la geocoder / utilizator. */
  address?: string;
  /** Identitate geografică canonică — cheia după care backendul află primăria. */
  countryIso2: string;
  stateIso2: string;
  countryName: string;
  stateName: string;
  cityName: string;
  file?: File;
  removeImage?: boolean;
}

export interface UpdateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
  status?: ReportStatus;
  latitude?: number;
  longitude?: number;
  address?: string;
  file?: File;
  removeImage?: boolean;
}

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  ROAD: "Drum",
  LIGHTING: "Iluminat",
  WASTE: "Gunoi",
  VANDALISM: "Vandalism",
  OTHER: "Altele",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  NEW: "Nou",
  IN_PROGRESS: "În lucru",
  RESOLVED: "Rezolvat",
};

/**
 * Culorile semantice ale statusurilor, folosite în grafice. Sunt date de
 * domeniu, nu stil de componentă — clasele Tailwind pentru badge rămân în
 * StatusBadge, fiindcă țin de prezentarea acelei componente.
 */
export const STATUS_COLORS: Record<ReportStatus, string> = {
  NEW: "#f59e0b",
  IN_PROGRESS: "#0ea5e9",
  RESOLVED: "#10b981",
};

export const CATEGORY_COLORS: Record<ReportCategory, string> = {
  ROAD: "#e74c3c",
  LIGHTING: "#f39c12",
  WASTE: "#27ae60",
  VANDALISM: "#8e44ad",
  OTHER: "#3498db",
};

export const DEFAULT_MAP_CENTER = { lat: 44.4268, lng: 26.1025 };
export const DEFAULT_MAP_ZOOM = 13;
