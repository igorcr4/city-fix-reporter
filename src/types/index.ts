export type ReportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export type ReportCategory = "DRUM" | "ILUMINAT" | "GUNOI" | "VANDALISM" | "ALTELE";

export interface Report {
  id: number;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  imageUrl?: string;
  authorUsername: string;
  authorId: number;
  latitude: number;
  longitude: number;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  token: string;
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
  image?: File;
}

export interface UpdateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
  latitude?: number;
  longitude?: number;
  address?: string;
  image?: File;
}

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  DRUM: "Drum",
  ILUMINAT: "Iluminat",
  GUNOI: "Gunoi",
  VANDALISM: "Vandalism",
  ALTELE: "Altele",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: "Deschis",
  IN_PROGRESS: "În lucru",
  RESOLVED: "Rezolvat",
};

/** Colors for map markers by category */
export const CATEGORY_COLORS: Record<ReportCategory, string> = {
  DRUM: "#e74c3c",
  ILUMINAT: "#f39c12",
  GUNOI: "#27ae60",
  VANDALISM: "#8e44ad",
  ALTELE: "#3498db",
};

/** Default map center (Bucharest) */
export const DEFAULT_MAP_CENTER = { lat: 44.4268, lng: 26.1025 };
export const DEFAULT_MAP_ZOOM = 13;
