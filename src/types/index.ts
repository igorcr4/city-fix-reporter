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
  username: string;
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
  image?: File;
}

export interface UpdateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
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
