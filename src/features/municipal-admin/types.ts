import type { Report, ReportCategory, ReportStatus } from "@/shared/types";

export type MunicipalReportSort = "newest" | "oldest";
export type MunicipalReportCategoryFilter = ReportCategory | "ALL";
export type MunicipalReportStatusFilter = ReportStatus | "ALL";
export type MunicipalReportsSource = "backend-scoped" | "client-fallback";

export interface MunicipalScope {
  municipalityId?: number | null;
  municipalityName?: string | null;
}

export interface MunicipalReportFilters {
  search: string;
  category: MunicipalReportCategoryFilter;
  status: MunicipalReportStatusFilter;
  sort: MunicipalReportSort;
}

export interface MunicipalReportsResult {
  reports: Report[];
  source: MunicipalReportsSource;
  recommendedEndpoint?: string | null;
}

export interface MunicipalDashboardSummary {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}
