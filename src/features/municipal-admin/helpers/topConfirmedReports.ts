import type { Report } from "@/shared/types";

/** Câte rapoarte afișăm în topul după confirmări. */
export const TOP_CONFIRMED_REPORTS_LIMIT = 10;

/**
 * Rapoartele primăriei ordonate descrescător după numărul de confirmări
 * cetățenești (gravitate percepută). Sunt incluse doar rapoartele care au
 * cel puțin o confirmare. La egalitate, cel mai recent creat apare primul.
 */
export function getTopConfirmedReports(
  reports: Report[],
  limit = TOP_CONFIRMED_REPORTS_LIMIT
): Report[] {
  return reports
    .filter((report) => report.confirmationCount > 0)
    .sort((left, right) => {
      if (right.confirmationCount !== left.confirmationCount) {
        return right.confirmationCount - left.confirmationCount;
      }
      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    })
    .slice(0, limit);
}
