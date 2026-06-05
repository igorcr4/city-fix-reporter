import { CalendarDays, ExternalLink, MapPinned, RefreshCw, UserRound } from "lucide-react";

import { StatusBadge } from "@/features/reports/components/StatusBadge";
import type { Report } from "@/shared/types";
import { CATEGORY_LABELS } from "@/shared/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

interface MunicipalReportCardProps {
  report: Report;
  onOpenDetails: () => void;
  onOpenUpdateDialog: () => void;
}

export function MunicipalReportCard({
  report,
  onOpenDetails,
  onOpenUpdateDialog,
}: MunicipalReportCardProps) {
  return (
    <Card className="overflow-hidden rounded-lg border-border/80 transition-all hover:border-primary/30 hover:shadow-sm">
      <CardContent className="p-0">
        <div className="w-full text-left">
          <div className="grid gap-0 lg:grid-cols-[112px_1fr_auto]">
            <div className="bg-muted/50">
              {report.imageUrl ? (
                <img
                  src={report.imageUrl}
                  alt={report.title}
                  className="h-full min-h-[112px] w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[112px] items-center justify-center bg-muted/60 px-3 text-center text-xs text-muted-foreground">
                  Fără imagine inițială
                </div>
              )}
            </div>

            <div className="min-w-0 p-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-md px-2 py-0 text-[11px]">
                    {CATEGORY_LABELS[report.category]}
                  </Badge>
                  <StatusBadge status={report.status} />
                  {report.afterImageUrl && (
                    <Badge variant="secondary" className="rounded-md px-2 py-0 text-[11px]">
                      Imagine finală
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="line-clamp-1 font-heading text-base font-semibold text-foreground">
                    {report.title}
                  </h3>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </div>

                <div className="grid gap-1.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPinned className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">{report.address || "Adresa nu este disponibilă."}</span>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(report.createdAt).toLocaleDateString("ro-RO")}
                    </span>

                    <span className="flex items-center gap-2">
                      <UserRound className="h-3.5 w-3.5" />
                      {report.username}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-row gap-2 border-t px-4 pb-4 lg:min-w-[154px] lg:flex-col lg:justify-center lg:border-l lg:border-t-0 lg:p-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-2 lg:flex-none"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenDetails();
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Detalii
              </Button>

              <Button
                type="button"
                size="sm"
                className="flex-1 gap-2 lg:flex-none"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenUpdateDialog();
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Actualizează
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
