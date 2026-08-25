import {
  differenceInDays,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ro } from "date-fns/locale/ro";

import type { Report, ReportCategory } from "@/shared/types";

export interface ResolutionRate {
  total: number;
  resolved: number;
  /** Procent 0–100, rotunjit. 0 dacă nu există rapoarte. */
  percentage: number;
}

export interface CategoryResolutionTime {
  category: ReportCategory;
  /** Media zilelor de rezolvare pentru categoria respectivă. */
  averageDays: number;
  /** Câte rapoarte rezolvate au intrat în medie. */
  resolvedCount: number;
}

export function getResolutionRate(reports: Report[]): ResolutionRate {
  const total = reports.length;
  const resolved = reports.filter((report) => report.status === "RESOLVED").length;
  const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return { total, resolved, percentage };
}

/**
 * Timpul mediu de rezolvare (în zile) pe fiecare categorie, ordonat descrescător
 * (cea mai lentă categorie prima). Include doar rapoartele cu `resolvedAt != null`
 * — nu se filtrează după status, fiindcă pot exista rapoarte RESOLVED fără
 * `resolvedAt` (date vechi), iar acelea nu au timp de rezolvare cunoscut.
 */
export function getAverageResolutionTimeByCategory(
  reports: Report[]
): CategoryResolutionTime[] {
  const totals = new Map<ReportCategory, { days: number; count: number }>();

  for (const report of reports) {
    if (report.resolvedAt == null) continue;

    const days = differenceInDays(
      new Date(report.resolvedAt),
      new Date(report.createdAt)
    );

    const entry = totals.get(report.category) ?? { days: 0, count: 0 };
    entry.days += days;
    entry.count += 1;
    totals.set(report.category, entry);
  }

  return Array.from(totals.entries())
    .map(([category, { days, count }]) => ({
      category,
      averageDays: count > 0 ? days / count : 0,
      resolvedCount: count,
    }))
    .sort((left, right) => right.averageDays - left.averageDays);
}

const DEFAULT_TREND_MONTHS = 6;

/** Construiește lista ultimelor `count` luni calendaristice, terminând cu luna curentă. */
function buildRecentMonths(
  count: number
): Array<{ key: string; label: string; date: Date }> {
  const now = new Date();
  const months: Array<{ key: string; label: string; date: Date }> = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = startOfMonth(subMonths(now, offset));
    months.push({
      key: format(date, "yyyy-MM"),
      label: format(date, "LLL yyyy", { locale: ro }),
      date,
    });
  }

  return months;
}

export interface ResolutionTimeTrendPoint {
  key: string;
  label: string;
  /** Timp mediu de rezolvare (zile) pentru rapoartele rezolvate în acea lună; null = N/A. */
  averageDays: number | null;
  resolvedCount: number;
}

export interface ResolutionTimeTrend {
  points: ResolutionTimeTrendPoint[];
  /** Câte luni din fereastră au date (rapoarte rezolvate). */
  monthsWithData: number;
}

/**
 * Tendința timpului de rezolvare pe ultimele `months` luni. Rapoartele rezolvate
 * sunt grupate după luna din `resolvedAt`, iar pentru fiecare lună se mediază
 * `resolvedAt − createdAt` (zile). Lunile fără rezolvări au `averageDays = null` (N/A).
 */
export function getResolutionTimeTrend(
  reports: Report[],
  months = DEFAULT_TREND_MONTHS
): ResolutionTimeTrend {
  const buckets = new Map<string, { days: number; count: number }>();

  for (const report of reports) {
    if (report.resolvedAt == null) continue;

    const resolvedDate = new Date(report.resolvedAt);
    if (Number.isNaN(resolvedDate.getTime())) continue;

    const key = format(resolvedDate, "yyyy-MM");
    const days = differenceInDays(resolvedDate, new Date(report.createdAt));

    const entry = buckets.get(key) ?? { days: 0, count: 0 };
    entry.days += days;
    entry.count += 1;
    buckets.set(key, entry);
  }

  const points = buildRecentMonths(months).map(({ key, label }) => {
    const entry = buckets.get(key);
    return {
      key,
      label,
      averageDays:
        entry && entry.count > 0
          ? Math.round((entry.days / entry.count) * 10) / 10
          : null,
      resolvedCount: entry?.count ?? 0,
    };
  });

  const monthsWithData = points.filter((point) => point.resolvedCount > 0).length;

  return { points, monthsWithData };
}

export interface ReportVolumePoint {
  key: string;
  label: string;
  /** Rapoarte create în acea lună (după createdAt). */
  created: number;
  /** Rapoarte rezolvate în acea lună (după resolvedAt). */
  resolved: number;
}

/**
 * Volumul de rapoarte pe ultimele `months` luni: create (după `createdAt`) vs
 * rezolvate (după `resolvedAt`), ca să se vadă „intrări vs rezolvări".
 */
export function getReportVolumeTrend(
  reports: Report[],
  months = DEFAULT_TREND_MONTHS
): ReportVolumePoint[] {
  const created = new Map<string, number>();
  const resolved = new Map<string, number>();

  for (const report of reports) {
    const createdDate = new Date(report.createdAt);
    if (!Number.isNaN(createdDate.getTime())) {
      const key = format(createdDate, "yyyy-MM");
      created.set(key, (created.get(key) ?? 0) + 1);
    }

    if (report.resolvedAt != null) {
      const resolvedDate = new Date(report.resolvedAt);
      if (!Number.isNaN(resolvedDate.getTime())) {
        const key = format(resolvedDate, "yyyy-MM");
        resolved.set(key, (resolved.get(key) ?? 0) + 1);
      }
    }
  }

  return buildRecentMonths(months).map(({ key, label }) => ({
    key,
    label,
    created: created.get(key) ?? 0,
    resolved: resolved.get(key) ?? 0,
  }));
}

export interface MetricComparison {
  /** Valoarea lunii curente (null = N/A, ex. timp mediu fără rezolvări). */
  current: number | null;
  /** Valoarea lunii precedente (null = N/A). */
  previous: number | null;
  /** Diferența procentuală față de luna precedentă; null dacă nu se poate calcula. */
  deltaPercent: number | null;
}

export interface MonthOverMonthComparison {
  /** Există rapoarte în luna precedentă (altfel nu afișăm comparația). */
  hasPreviousData: boolean;
  created: MetricComparison;
  resolved: MetricComparison;
  averageResolutionDays: MetricComparison;
}

function countCreatedInMonth(reports: Report[], month: Date): number {
  return reports.filter((report) => {
    const date = new Date(report.createdAt);
    return !Number.isNaN(date.getTime()) && isSameMonth(date, month);
  }).length;
}

function countResolvedInMonth(reports: Report[], month: Date): number {
  return reports.filter((report) => {
    if (report.resolvedAt == null) return false;
    const date = new Date(report.resolvedAt);
    return !Number.isNaN(date.getTime()) && isSameMonth(date, month);
  }).length;
}

function averageResolutionDaysInMonth(
  reports: Report[],
  month: Date
): number | null {
  let days = 0;
  let count = 0;

  for (const report of reports) {
    if (report.resolvedAt == null) continue;
    const resolvedDate = new Date(report.resolvedAt);
    if (Number.isNaN(resolvedDate.getTime())) continue;
    if (!isSameMonth(resolvedDate, month)) continue;

    days += differenceInDays(resolvedDate, new Date(report.createdAt));
    count += 1;
  }

  return count > 0 ? Math.round((days / count) * 10) / 10 : null;
}

function buildComparison(
  current: number | null,
  previous: number | null
): MetricComparison {
  // Procent doar dacă avem ambele valori și luna precedentă nu e zero/N/A.
  const deltaPercent =
    current != null && previous != null && previous !== 0
      ? Math.round(((current - previous) / previous) * 100)
      : null;

  return { current, previous, deltaPercent };
}

/**
 * Comparație lună curentă vs lună precedentă pentru: rapoarte create, rezolvate
 * și timp mediu de rezolvare. Dacă luna precedentă nu are deloc rapoarte,
 * `hasPreviousData` e false (afișăm valorile curente fără comparație).
 */
export function getMonthOverMonthComparison(
  reports: Report[]
): MonthOverMonthComparison {
  const currentMonth = startOfMonth(new Date());
  const previousMonth = subMonths(currentMonth, 1);

  const currentCreated = countCreatedInMonth(reports, currentMonth);
  const previousCreated = countCreatedInMonth(reports, previousMonth);
  const currentResolved = countResolvedInMonth(reports, currentMonth);
  const previousResolved = countResolvedInMonth(reports, previousMonth);
  const currentAvg = averageResolutionDaysInMonth(reports, currentMonth);
  const previousAvg = averageResolutionDaysInMonth(reports, previousMonth);

  const hasPreviousData = previousCreated > 0 || previousResolved > 0;

  return {
    hasPreviousData,
    created: buildComparison(currentCreated, previousCreated),
    resolved: buildComparison(currentResolved, previousResolved),
    averageResolutionDays: buildComparison(currentAvg, previousAvg),
  };
}
