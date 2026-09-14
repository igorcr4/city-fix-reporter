import { format } from "date-fns";
import { ro } from "date-fns/locale/ro";

import type { Report } from "@/shared/types";
import { REPORT_STATUS } from "@/shared/types";

export interface PeriodStatPoint {
  /** Cheie sortabilă, ex. „2026-06". */
  key: string;
  /** Etichetă prietenoasă, ex. „iun. 2026". */
  label: string;
  /** Total rapoarte create în lună. */
  total: number;
  /** Câte dintre ele sunt acum rezolvate. */
  resolved: number;
}

const MAX_MONTHS = 12;

/** Grupează rapoartele pe lună (după createdAt), ultimele 12 luni cu activitate. */
export function getReportsByMonth(reports: Report[]): PeriodStatPoint[] {
  const buckets = new Map<string, PeriodStatPoint>();

  for (const report of reports) {
    const date = new Date(report.createdAt);
    if (Number.isNaN(date.getTime())) continue;

    const key = format(date, "yyyy-MM");
    let bucket = buckets.get(key);

    if (!bucket) {
      bucket = {
        key,
        label: format(date, "LLL yyyy", { locale: ro }),
        total: 0,
        resolved: 0,
      };
      buckets.set(key, bucket);
    }

    bucket.total += 1;
    if (report.status === REPORT_STATUS.RESOLVED) {
      bucket.resolved += 1;
    }
  }

  return Array.from(buckets.values())
    .sort((left, right) => left.key.localeCompare(right.key))
    .slice(-MAX_MONTHS);
}
