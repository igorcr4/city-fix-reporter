import { format } from "date-fns";

import { CATEGORY_LABELS, STATUS_LABELS, type Report } from "@/shared/types";

const CSV_HEADERS = [
  "id",
  "titlu",
  "categorie",
  "status",
  "data",
  "locatie",
] as const;

/** Escapează o valoare pentru CSV (RFC 4180 — ghilimele duble + învelire). */
function escapeCsvValue(value: string): string {
  const needsQuoting = /[",\n;]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

function getReportLocation(report: Report): string {
  if (report.address) return report.address;

  if (
    typeof report.latitude === "number" &&
    typeof report.longitude === "number"
  ) {
    return `${report.latitude}, ${report.longitude}`;
  }

  return "";
}

export function buildReportsCsv(reports: Report[]): string {
  const rows = reports.map((report) => {
    const date = new Date(report.createdAt);
    const formattedDate = Number.isNaN(date.getTime())
      ? report.createdAt
      : format(date, "yyyy-MM-dd HH:mm");

    return [
      String(report.id),
      report.title ?? "",
      CATEGORY_LABELS[report.category] ?? report.category,
      STATUS_LABELS[report.status] ?? report.status,
      formattedDate,
      getReportLocation(report),
    ]
      .map((value) => escapeCsvValue(value))
      .join(",");
  });

  // BOM ca să se deschidă corect diacriticele în Excel.
  return "﻿" + [CSV_HEADERS.join(","), ...rows].join("\r\n");
}

export function downloadReportsCsv(reports: Report[], fileName?: string): void {
  const csv = buildReportsCsv(reports);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download =
    fileName ?? `rapoarte-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
