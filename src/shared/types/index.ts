export type ReportStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

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
  id?: number;
  name: string;
  iso2: string;
}

export interface GeographyState {
  id?: number;
  name: string;
  iso2: string;
}

export interface GeographyCity {
  id: number;
  name: string;
  countryIso2?: string;
  stateIso2?: string;
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
  address?: string;
  country: string;
  state: string;
  city: string;
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

export const CATEGORY_COLORS: Record<ReportCategory, string> = {
  ROAD: "#e74c3c",
  LIGHTING: "#f39c12",
  WASTE: "#27ae60",
  VANDALISM: "#8e44ad",
  OTHER: "#3498db",
};

export const DEFAULT_MAP_CENTER = { lat: 44.4268, lng: 26.1025 };
export const DEFAULT_MAP_ZOOM = 13;
