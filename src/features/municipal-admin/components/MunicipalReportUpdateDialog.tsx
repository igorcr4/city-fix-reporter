import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  REPORT_STATUS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  type Report,
  type ReportStatus,
} from "@/shared/types";
import { Badge } from "@/shared/components/ui/badge";
import { StatusBadge } from "@/features/reports/components/StatusBadge";

export interface MunicipalReportUpdateData {
  status: ReportStatus;
  file?: File;
}

interface MunicipalReportUpdateDialogProps {
  open: boolean;
  report: Report | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: MunicipalReportUpdateData) => Promise<void> | void;
}

const STATUS_OPTIONS: ReportStatus[] = [
  REPORT_STATUS.NEW,
  REPORT_STATUS.IN_PROGRESS,
];

export function MunicipalReportUpdateDialog({
  open,
  report,
  loading,
  onOpenChange,
  onConfirm,
}: MunicipalReportUpdateDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nextStatus, setNextStatus] = useState<ReportStatus>(REPORT_STATUS.NEW);
  const [file, setFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!report || !open) return;

    setNextStatus(
      report.status === REPORT_STATUS.RESOLVED
        ? REPORT_STATUS.IN_PROGRESS
        : report.status
    );
    setFile(undefined);
    setPreviewUrl(null);
  }, [open, report]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [file]);

  const finalStatus: ReportStatus = file ? REPORT_STATUS.RESOLVED : nextStatus;
  const hasChanges = Boolean(
    report && (finalStatus !== report.status || file)
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;

    setFile(nextFile);
  };

  const clearSelectedFile = () => {
    setFile(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirm = async () => {
    await onConfirm({
      status: finalStatus,
      file,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Actualizare raport</DialogTitle>
          <DialogDescription>
            Poți marca raportul ca rezolvat doar prin adăugarea unei imagini noi.
          </DialogDescription>
        </DialogHeader>

        {report && (
          <div className="space-y-5">
            <section className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full">
                  {CATEGORY_LABELS[report.category]}
                </Badge>
                <StatusBadge status={report.status} />
              </div>

              <div className="space-y-1">
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {report.title}
                </h3>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {report.description}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                {report.address || "Adresa nu este disponibilă."}
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Imagine curentă
                </p>
                {report.imageUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                    <img
                      src={report.imageUrl}
                      alt={`Imagine curentă pentru ${report.title}`}
                      className="h-48 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-4 text-center text-sm text-muted-foreground">
                    Raportul nu are încă o imagine curentă.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Imagine nouă
                </p>
                {previewUrl ? (
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
                    <img
                      src={previewUrl}
                      alt="Previzualizare imagine nouă"
                      className="h-48 w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8 rounded-full"
                      onClick={clearSelectedFile}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 px-4 text-center text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <ImagePlus className="h-6 w-6" />
                    Alege o imagine nouă
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {file && (
                  <p className="text-xs text-muted-foreground">
                    Imaginea nouă va înlocui imaginea curentă, iar raportul va fi
                    marcat automat ca rezolvat.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-sm font-medium text-foreground">Stare nouă</p>
              <Select
                value={nextStatus}
                onValueChange={(value) => setNextStatus(value as ReportStatus)}
                disabled={loading || !!file}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alege starea" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {file ? (
                <p className="text-xs text-muted-foreground">
                  Ai selectat o imagine nouă, deci starea finală va fi{" "}
                  <span className="font-medium text-foreground">Rezolvat</span>.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Pentru starea Rezolvat este obligatorie o imagine nouă cu
                  problema rezolvată.
                </p>
              )}
            </section>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Anulează
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={loading || !report || !hasChanges}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se salvează...
              </>
            ) : (
              "Salvează modificările"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
