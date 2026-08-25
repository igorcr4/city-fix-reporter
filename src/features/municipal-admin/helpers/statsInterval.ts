import { subYears } from "date-fns";

import type { Report } from "@/shared/types";

/**
 * Intervalul selectat pentru cardurile de statistici din panoul de municipal
 * admin. Numărul reprezintă câți ani în urmă; `"all"` = fără filtru de interval.
 */
export type StatsRange = 1 | 2 | 3 | 5 | "all";

export const DEFAULT_STATS_RANGE: StatsRange = "all";

/** Mesaj comun pentru cardurile fără date în intervalul ales. */
export const NO_DATA_IN_RANGE_MESSAGE = "Fără date în intervalul selectat";

export const STATS_RANGE_OPTIONS: { value: StatsRange; label: string }[] = [
  { value: 1, label: "Ultimul an" },
  { value: 2, label: "Ultimii 2 ani" },
  { value: 3, label: "Ultimii 3 ani" },
  { value: 5, label: "Ultimii 5 ani" },
  { value: "all", label: "Tot" },
];

/** StatsRange → string pentru `Select`-ul shadcn. */
export function statsRangeToValue(range: StatsRange): string {
  return range === "all" ? "all" : String(range);
}

/** string din `Select` → StatsRange. */
export function valueToStatsRange(value: string): StatsRange {
  if (value === "all") return "all";
  const parsed = Number(value);
  return parsed === 1 || parsed === 2 || parsed === 3 || parsed === 5
    ? parsed
    : "all";
}

/** `true` dacă e activ un interval concret (nu „Tot"). */
export function isRangeApplied(range: StatsRange): boolean {
  return range !== "all";
}

/**
 * Filtrează rapoartele după câmpul de dată relevant pentru metrică, păstrând
 * doar pe cele cu data ≥ pragul intervalului. Câmpul diferă intenționat:
 * `createdAt` pentru metrici de volum, `resolvedAt` pentru timpul de rezolvare.
 * Opțiunea `"all"` nu aplică niciun filtru.
 */
export function filterReportsByRange(
  reports: Report[],
  range: StatsRange,
  field: "createdAt" | "resolvedAt"
): Report[] {
  if (range === "all") return reports;

  const threshold = subYears(new Date(), range).getTime();

  return reports.filter((report) => {
    const value = report[field];
    if (value == null) return false;

    const time = new Date(value).getTime();
    return Number.isFinite(time) && time >= threshold;
  });
}
