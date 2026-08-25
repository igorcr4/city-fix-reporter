import { intervalToDuration, formatDuration } from "date-fns";
import { ro } from "date-fns/locale";

import type { Report } from "@/shared/types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface AverageResolutionTime {
  /** Câte rapoarte au intrat în calcul (au resolvedAt != null). */
  resolvedCount: number;
  /** Media în milisecunde, sau null dacă nu există rapoarte rezolvate. */
  averageMs: number | null;
  /** Text formatat pentru afișare, sau null dacă nu există date. */
  formatted: string | null;
}

/**
 * Timpul mediu de rezolvare al rapoartelor.
 *
 * Include DOAR rapoartele cu `resolvedAt != null` — nu se filtrează după
 * status, fiindcă un raport poate fi RESOLVED fără `resolvedAt` (date vechi),
 * iar acelea nu au timp de rezolvare cunoscut.
 *
 * Media se calculează într-o singură unitate liniară (milisecunde) și se
 * formatează abia la final. „Luna" din afișare e doar o aproximare vizuală,
 * nu o unitate de calcul.
 */
export function getAverageResolutionTime(reports: Report[]): AverageResolutionTime {
  const resolved = reports.filter((report) => report.resolvedAt != null);

  if (resolved.length === 0) {
    return { resolvedCount: 0, averageMs: null, formatted: null };
  }

  const totalMs = resolved.reduce(
    (sum, report) =>
      sum +
      (new Date(report.resolvedAt as string).getTime() -
        new Date(report.createdAt).getTime()),
    0
  );

  const averageMs = totalMs / resolved.length;
  const averageDays = averageMs / MS_PER_DAY;
  const duration = intervalToDuration({ start: 0, end: averageMs });

  // Sub 30 de zile → zile (și ore); peste → luni și zile.
  const formatted =
    averageDays < 30
      ? formatDuration(duration, { format: ["days", "hours"], locale: ro })
      : formatDuration(duration, { format: ["months", "days"], locale: ro });

  return {
    resolvedCount: resolved.length,
    averageMs,
    formatted: formatted || "mai puțin de o oră",
  };
}
