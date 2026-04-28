import { CalendarDays, ExternalLink, MapPinned, RefreshCw, UserRound } from "lucide-react";

import { StatusBadge } from "@/features/reports/components/StatusBadge";
import type { Report } from "@/shared/types";
import { CATEGORY_LABELS } from "@/shared/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";

interface MunicipalReportCardProps {
  report: Report;
  active?: boolean;
  onSelect: () => void;
  onOpenDetails: () => void;
  onOpenStatusDialog: () => void;
}

export function MunicipalReportCard({
  report,
  active = false,
  onSelect,
  onOpenDetails,
  onOpenStatusDialog,
}: MunicipalReportCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-3xl border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md",
        active && "border-primary shadow-md ring-2 ring-primary/15"
      )}
    >
      <CardContent className="p-0">
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect();
            }
          }}
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <div className="grid gap-0 lg:grid-cols-[180px_1fr]">
            <div className="bg-muted/50">
              {report.imageUrl ? (
                <img
                  src={report.imageUrl}
                  alt={report.title}
                  className="h-full min-h-[180px] w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[180px] items-center justify-center bg-muted/60 px-4 text-center text-sm text-muted-foreground">
                  Nu există imagine inițială pentru acest raport.
                </div>
              )}
            </div>

            <div className="flex min-h-[180px] flex-col justify-between p-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full">
                    {CATEGORY_LABELS[report.category]}
                  </Badge>
                  <StatusBadge status={report.status} />
                  {report.afterImageUrl && (
                    <Badge variant="secondary" className="rounded-full">
                      After disponibil
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {report.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPinned className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{report.address || "Adresa nu este disponibilă."}</span>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(report.createdAt).toLocaleDateString("ro-RO")}
                    </span>

                    <span className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      {report.username}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
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
                  className="gap-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenStatusDialog();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Update status
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
