import type { Report, ReportCategory } from "@/shared/types";
import { REPORT_STATUS } from "@/shared/types";

export type MyReportsTab = "active" | "resolved";
export type MyReportsSortKey = "newest" | "oldest";

interface MyReportsFilterOptions {
  category: ReportCategory | "ALL";
  query: string;
  sort: MyReportsSortKey;
}

export function splitMyReportsByStatus(reports: Report[]): Record<MyReportsTab, Report[]> {
  return reports.reduce<Record<MyReportsTab, Report[]>>(
    (groups, report) => {
      if (report.status === REPORT_STATUS.RESOLVED) {
        groups.resolved.push(report);
      } else {
        groups.active.push(report);
      }

      return groups;
    },
    {
      active: [],
      resolved: [],
    }
  );
}

export function filterAndSortMyReports(
  reports: Report[],
  { category, query, sort }: MyReportsFilterOptions
): Report[] {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = reports.filter((report) => {
    if (category !== "ALL" && report.category !== category) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const title = (report.title ?? "").toLowerCase();
    const description = (report.description ?? "").toLowerCase();
    const address = (report.address ?? "").toLowerCase();

    return (
      title.includes(normalizedQuery) ||
      description.includes(normalizedQuery) ||
      address.includes(normalizedQuery)
    );
  });

  return filtered.sort((left, right) => {
    const leftDate = new Date(left.createdAt).getTime();
    const rightDate = new Date(right.createdAt).getTime();

    return sort === "newest" ? rightDate - leftDate : leftDate - rightDate;
  });
}
