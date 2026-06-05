import { type ReportStatus, STATUS_LABELS } from "@/shared/types";
import { cn } from "@/shared/utils/utils";

const statusStyles: Record<ReportStatus, string> = {
  NEW: "bg-status-open-bg text-status-open",
  IN_PROGRESS: "bg-status-in-progress-bg text-status-in-progress",
  RESOLVED: "bg-status-resolved-bg text-status-resolved",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
