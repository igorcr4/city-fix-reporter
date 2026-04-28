import { CalendarDays, Camera, FileImage, RefreshCw } from "lucide-react";

import { StatusBadge } from "@/features/reports/components/StatusBadge";
import type { Report } from "@/shared/types";
import { CATEGORY_LABELS } from "@/shared/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

interface MunicipalBeforeAfterPanelProps {
  report: Report | null;
  onOpenDetails: () => void;
  onOpenStatusDialog: () => void;
}

export function MunicipalBeforeAfterPanel({
  report,
  onOpenDetails,
  onOpenStatusDialog,
}: MunicipalBeforeAfterPanelProps) {
  if (!report) {
    return (
      <Card className="rounded-3xl border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Before / After</CardTitle>
          <CardDescription>
            Selectează un raport pentru a vedea comparația vizuală și acțiunile
            rapide ale primăriei.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-border/80 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full">
            {CATEGORY_LABELS[report.category]}
          </Badge>
          <StatusBadge status={report.status} />
        </div>

        <div>
          <CardTitle className="text-xl">{report.title}</CardTitle>
          <CardDescription className="mt-2">
            {report.address || "Adresa nu este disponibilă."}
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" />
            Creat la {new Date(report.createdAt).toLocaleDateString("ro-RO")}
          </span>

          {report.updatedAt && (
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizat la {new Date(report.updatedAt).toLocaleDateString("ro-RO")}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {report.description}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Înainte</p>
            {report.imageUrl ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                <img
                  src={report.imageUrl}
                  alt={`Imagine inițială pentru ${report.title}`}
                  className="h-56 w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-4 text-center text-sm text-muted-foreground">
                <div className="space-y-2">
                  <Camera className="mx-auto h-5 w-5" />
                  <p>Nu există imagine inițială în raport.</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">După intervenție</p>
            {report.afterImageUrl ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                <img
                  src={report.afterImageUrl}
                  alt={`Imagine după intervenție pentru ${report.title}`}
                  className="h-56 w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-5 text-center text-sm text-muted-foreground">
                <div className="space-y-2">
                  <FileImage className="mx-auto h-5 w-5" />
                  <p>
                    UI-ul este pregătit pentru before/after. Backend-ul poate
                    trimite ulterior `afterImageUrl` și eventual note despre
                    intervenție.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {report.resolutionNotes && (
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium text-foreground">Note intervenție</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {report.resolutionNotes}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onOpenDetails}>
            Vezi detalii complete
          </Button>
          <Button type="button" onClick={onOpenStatusDialog}>
            Actualizează status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
