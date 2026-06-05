import type { Report, ReportCategory, ReportStatus } from "@/shared/types";
import type {
  MunicipalDashboardSummary,
  MunicipalReportCategoryFilter,
  MunicipalReportFilters,
  MunicipalReportStatusFilter,
} from "@/features/municipal-admin/types";
import { getCriticalReportIds } from "@/features/municipal-admin/helpers/criticalReportZones";

export const MUNICIPAL_REPORT_CATEGORIES: MunicipalReportCategoryFilter[] = [
  "ALL",
  "ROAD",
  "LIGHTING",
  "WASTE",
  "VANDALISM",
  "OTHER",
];

export const MUNICIPAL_REPORT_STATUSES: MunicipalReportStatusFilter[] = [
  "ACTIVE",
  "ALL",
  "NEW",
  "IN_PROGRESS",
  "RESOLVED",
];

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function filterAndSortMunicipalReports(
  reports: Report[],
  filters: MunicipalReportFilters
): Report[] {
  const normalizedQuery = normalizeText(filters.search);

  const baseFiltered = reports.filter((report) => {
    const matchesCategory =
      filters.category === "ALL" || report.category === filters.category;
    const matchesStatus =
      filters.status === "ALL" ||
      (filters.status === "ACTIVE" && report.status !== "RESOLVED") ||
      report.status === filters.status;

    if (!matchesCategory || !matchesStatus) return false;

    if (!normalizedQuery) return true;

    const searchFields = [
      report.title,
      report.address,
      report.description,
      report.city,
      report.municipalityName,
    ];

    return searchFields.some((field) =>
      normalizeText(field).includes(normalizedQuery)
    );
  });

  const criticalReportIds = filters.criticalOnly
    ? getCriticalReportIds(baseFiltered)
    : null;
  const filtered = criticalReportIds
    ? baseFiltered.filter((report) => criticalReportIds.has(report.id))
    : baseFiltered;

  return filtered.sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();

    return filters.sort === "newest"
      ? rightTime - leftTime
      : leftTime - rightTime;
  });
}

export function getMunicipalDashboardSummary(
  reports: Report[]
): MunicipalDashboardSummary {
  return reports.reduce<MunicipalDashboardSummary>(
    (summary, report) => {
      if (report.status === "NEW") summary.pending += 1;
      if (report.status === "IN_PROGRESS") summary.inProgress += 1;
      if (report.status === "RESOLVED") summary.resolved += 1;
      if (report.status !== "RESOLVED") summary.total += 1;

      return summary;
    },
    {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
    }
  );
}

export function getCategoryCounts(
  reports: Report[]
): Record<ReportCategory, number> {
  return reports.reduce<Record<ReportCategory, number>>(
    (counts, report) => {
      counts[report.category] += 1;
      return counts;
    },
    {
      ROAD: 0,
      LIGHTING: 0,
      WASTE: 0,
      VANDALISM: 0,
      OTHER: 0,
    }
  );
}

export function getStatusCounts(
  reports: Report[]
): Record<ReportStatus, number> {
  return reports.reduce<Record<ReportStatus, number>>(
    (counts, report) => {
      counts[report.status] += 1;
      return counts;
    },
    {
      NEW: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    }
  );
}
