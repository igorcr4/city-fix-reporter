import type { Report } from "@/shared/types";

type ReportMapTarget = Pick<Report, "id" | "latitude" | "longitude">;

export function isValidReportMapTarget(report: ReportMapTarget): boolean {
  return (
    Number.isFinite(report.latitude) &&
    Number.isFinite(report.longitude) &&
    report.latitude >= -90 &&
    report.latitude <= 90 &&
    report.longitude >= -180 &&
    report.longitude <= 180
  );
}

export function getReportMapUrl(report: ReportMapTarget): string {
  const searchParams = new URLSearchParams({
    reportId: String(report.id),
    lat: String(report.latitude),
    lng: String(report.longitude),
  });

  return `/reports?${searchParams.toString()}`;
}
