import type { Report, ReportCategory, ReportStatus } from "@/shared/types";
import { REPORT_STATUS } from "@/shared/types";

export type ReportMapFilter =
  | ReportCategory
  | "ALL"
  | typeof REPORT_STATUS.RESOLVED;

export const RESOLVED_REPORT_MARKER_COLOR = "#16a34a";

export const REPORT_MAP_CATEGORY_COLORS: Record<ReportCategory, string> = {
  ROAD: "#f97316",
  LIGHTING: "#f59e0b",
  WASTE: "#64748b",
  VANDALISM: "#8b5cf6",
  OTHER: "#2563eb",
};

export function filterReportsForMap(
  reports: Report[],
  filter: ReportMapFilter
): Report[] {
  if (filter === REPORT_STATUS.RESOLVED) {
    return reports.filter(
      (report) => report.status === REPORT_STATUS.RESOLVED
    );
  }

  const activeReports = reports.filter(
    (report) => report.status !== REPORT_STATUS.RESOLVED
  );

  if (filter === "ALL") {
    return activeReports;
  }

  return activeReports.filter((report) => report.category === filter);
}

export function getReportMapMarkerColor(
  category: ReportCategory,
  status: ReportStatus
): string {
  if (status === REPORT_STATUS.RESOLVED) {
    return RESOLVED_REPORT_MARKER_COLOR;
  }

  return REPORT_MAP_CATEGORY_COLORS[category];
}
