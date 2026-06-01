import type { ReportCategory, ReportStatus } from "@/shared/types";

export type MunicipalReportSort = "newest" | "oldest";
export type MunicipalReportCategoryFilter = ReportCategory | "ALL";
export type MunicipalReportStatusFilter = ReportStatus | "ALL";

export interface MunicipalReportFilters {
  search: string;
  category: MunicipalReportCategoryFilter;
  status: MunicipalReportStatusFilter;
  sort: MunicipalReportSort;
}

export interface MunicipalDashboardSummary {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}
