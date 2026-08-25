import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ThumbsUp } from "lucide-react";

import {
  getTopConfirmedReports,
  TOP_CONFIRMED_REPORTS_LIMIT,
} from "@/features/municipal-admin/helpers/topConfirmedReports";
import { NO_DATA_IN_RANGE_MESSAGE } from "@/features/municipal-admin/helpers/statsInterval";
import { CATEGORY_LABELS, type Report } from "@/shared/types";
import { StatusBadge } from "@/features/reports/components/StatusBadge";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

interface MunicipalConfirmationStatisticsSectionProps {
  reports: Report[];
  /** Un interval concret e activ (nu „Tot") → placeholder specific intervalului. */
  rangeApplied?: boolean;
}

export function MunicipalConfirmationStatisticsSection({
  reports,
  rangeApplied = false,
}: MunicipalConfirmationStatisticsSectionProps) {
  const navigate = useNavigate();

  const topReports = useMemo(() => getTopConfirmedReports(reports), [reports]);
  const isEmpty = topReports.length === 0;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Confirmări cetățeni
        </h2>
        <p className="text-sm text-muted-foreground">
          Probleme validate de cât mai mulți cetățeni („și eu văd problema"),
          ordonate descrescător după numărul de confirmări.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ThumbsUp className="h-4 w-4 text-primary" />
            Top probleme după confirmări
          </CardTitle>
          <CardDescription>
            {isEmpty
              ? "Ordonate descrescător după numărul de confirmări."
              : `Primele ${Math.min(
                  topReports.length,
                  TOP_CONFIRMED_REPORTS_LIMIT
                )} rapoarte după confirmările cetățenilor.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEmpty ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {rangeApplied
                ? NO_DATA_IN_RANGE_MESSAGE
                : "Niciun raport nu a fost confirmat încă de cetățeni."}
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {topReports.map((report, index) => (
                <li key={report.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className="w-4 shrink-0 text-right font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate font-medium text-foreground">
                        {report.title}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="rounded-md px-2 py-0 text-[11px]"
                        >
                          {CATEGORY_LABELS[report.category]}
                        </Badge>
                        <StatusBadge status={report.status} />
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 font-semibold text-foreground">
                      <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                      {report.confirmationCount}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
