import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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
import { STATUS_LABELS, type Report, type ReportStatus } from "@/shared/types";

interface MunicipalReportStatusDialogProps {
  open: boolean;
  report: Report | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (status: ReportStatus) => Promise<void> | void;
}

const STATUS_OPTIONS: ReportStatus[] = ["NEW", "IN_PROGRESS", "FIXED"];

export function MunicipalReportStatusDialog({
  open,
  report,
  loading,
  onOpenChange,
  onConfirm,
}: MunicipalReportStatusDialogProps) {
  const [nextStatus, setNextStatus] = useState<ReportStatus>("NEW");

  useEffect(() => {
    if (!report) return;
    setNextStatus(report.status);
  }, [report]);

  const handleConfirm = async () => {
    await onConfirm(nextStatus);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Actualizează status raport</DialogTitle>
          <DialogDescription>
            {report
              ? `Schimbi statusul raportului „${report.title}” folosind endpointul existent de update report.`
              : "Alege noul status pentru raportul selectat."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">
              Status curent
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {report ? STATUS_LABELS[report.status] : "-"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Status nou</p>
            <Select
              value={nextStatus}
              onValueChange={(value) => setNextStatus(value as ReportStatus)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alege statusul" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            Structura UI este pregătită și pentru before/after. În acest moment,
            dialogul actualizează prioritar statusul raportului.
          </p>
        </div>

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
            disabled={loading || !report || nextStatus === report?.status}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se salvează...
              </>
            ) : (
              "Salvează statusul"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
