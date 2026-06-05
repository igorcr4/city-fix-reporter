import type { ReportCategory, ReportStatus } from "@/shared/types";

export type MunicipalReportSort = "newest" | "oldest";
export type MunicipalReportCategoryFilter = ReportCategory | "ALL";
export type MunicipalReportStatusFilter = ReportStatus | "ACTIVE" | "ALL";

export interface MunicipalReportFilters {
  search: string;
  category: MunicipalReportCategoryFilter;
  status: MunicipalReportStatusFilter;
  criticalOnly: boolean;
  sort: MunicipalReportSort;
}

export interface MunicipalDashboardSummary {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}
