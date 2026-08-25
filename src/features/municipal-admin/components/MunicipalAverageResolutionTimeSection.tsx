import { useMemo } from "react";
import { Timer } from "lucide-react";

import { getAverageResolutionTime } from "@/features/municipal-admin/helpers/averageResolutionTime";
import { NO_DATA_IN_RANGE_MESSAGE } from "@/features/municipal-admin/helpers/statsInterval";
import type { Report } from "@/shared/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

interface MunicipalAverageResolutionTimeSectionProps {
  reports: Report[];
  /** Un interval concret e activ (nu „Tot") → placeholder specific intervalului. */
  rangeApplied?: boolean;
}

export function MunicipalAverageResolutionTimeSection({
  reports,
  rangeApplied = false,
}: MunicipalAverageResolutionTimeSectionProps) {
  const { resolvedCount, formatted } = useMemo(
    () => getAverageResolutionTime(reports),
    [reports]
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Timp mediu de rezolvare
        </h2>
        <p className="text-sm text-muted-foreground">
          Cât durează în medie de la crearea unui raport până la rezolvarea lui.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="h-4 w-4 text-primary" />
            Timp mediu de rezolvare
          </CardTitle>
          <CardDescription>
            Calculat doar pentru rapoartele cu dată de rezolvare cunoscută.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formatted === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {rangeApplied ? NO_DATA_IN_RANGE_MESSAGE : "Niciun raport rezolvat încă"}
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-3xl font-semibold text-foreground">{formatted}</p>
              <p className="text-sm text-muted-foreground">
                Pe baza a {resolvedCount}{" "}
                {resolvedCount === 1 ? "raport rezolvat" : "rapoarte rezolvate"}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
