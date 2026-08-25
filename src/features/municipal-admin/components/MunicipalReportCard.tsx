import { CalendarDays, ExternalLink, Map as MapIcon, MapPinned, RefreshCw, UserRound } from "lucide-react";

import { ReportCommentsSection } from "@/features/comments/components/ReportCommentsSection";
import { StatusBadge } from "@/features/reports/components/StatusBadge";
import { isValidReportMapTarget } from "@/features/reports/helpers/reportMapNavigation";
import type { Report } from "@/shared/types";
import { CATEGORY_LABELS } from "@/shared/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

interface MunicipalReportCardProps {
  report: Report;
  onOpenDetails: () => void;
  onOpenOnMap: () => void;
  onOpenUpdateDialog: () => void;
  /**
   * Permite acțiunea de actualizare a raportului (status, imagine etc.).
   * Fără abonament activ, primăria poate doar vizualiza rapoartele.
   */
  canManage?: boolean;
}

export function MunicipalReportCard({
  report,
  onOpenDetails,
  onOpenOnMap,
  onOpenUpdateDialog,
  canManage = true,
}: MunicipalReportCardProps) {
  const canOpenOnMap = isValidReportMapTarget(report);

  return (
    <Card
      role="button"
      tabIndex={0}
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border-border/80 transition-all hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onOpenDetails}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onOpenDetails();
      }}
    >
      <CardContent className="flex h-full flex-col p-0">
        <div className="flex h-full w-full flex-col text-left">
          <div className="aspect-[4/3] border-b bg-muted/60">
            {report.imageUrl ? (
              <img
                src={report.imageUrl}
                alt={report.title}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
                Fără imagine inițială
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col p-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
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
                <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug text-foreground">
                  {report.title}
                </h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {report.description}
                </p>
              </div>

              <div className="grid gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-1.5">
                  <MapPinned className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span className="line-clamp-2">{report.address || "Adresa nu este disponibilă."}</span>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(report.createdAt).toLocaleDateString("ro-RO")}
                  </span>

                  <span className="flex min-w-0 items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{report.username}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t px-3 py-2.5">
            <ReportCommentsSection reportId={report.id} />
          </div>

          <div className="grid grid-cols-2 gap-1.5 border-t p-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs"
              aria-disabled={!canOpenOnMap}
              onClick={(event) => {
                event.stopPropagation();
                if (!canOpenOnMap) return;
                onOpenOnMap();
              }}
            >
              <MapIcon className="h-3.5 w-3.5" />
              Hartă
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetails();
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Detalii
            </Button>

            {canManage && (
              <Button
                type="button"
                size="sm"
                className="col-span-2 h-8 gap-1.5 px-2 text-xs"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenUpdateDialog();
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Actualizează
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
