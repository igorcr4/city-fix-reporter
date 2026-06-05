import { ClipboardList, Clock3, CheckCircle2, Wrench } from "lucide-react";

import type {
  MunicipalDashboardSummary,
  MunicipalReportStatusFilter,
} from "@/features/municipal-admin/types";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";

interface MunicipalDashboardSummaryProps {
  summary: MunicipalDashboardSummary;
  activeStatus: MunicipalReportStatusFilter;
  onStatusSelect: (status: MunicipalReportStatusFilter) => void;
}

const summaryCards = [
  {
    key: "total",
    label: "Total rapoarte",
    accent: "text-slate-700",
    bg: "bg-slate-100",
    icon: ClipboardList,
    status: "ACTIVE",
  },
  {
    key: "pending",
    label: "În așteptare",
    accent: "text-amber-700",
    bg: "bg-amber-100",
    icon: Clock3,
    status: "NEW",
  },
  {
    key: "inProgress",
    label: "În lucru",
    accent: "text-sky-700",
    bg: "bg-sky-100",
    icon: Wrench,
    status: "IN_PROGRESS",
  },
  {
    key: "resolved",
    label: "Rezolvate",
    accent: "text-emerald-700",
    bg: "bg-emerald-100",
    icon: CheckCircle2,
    status: "RESOLVED",
  },
] as const;

export function MunicipalDashboardSummary({
  summary,
  activeStatus,
  onStatusSelect,
}: MunicipalDashboardSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        const value = summary[card.key];
        const isActive = activeStatus === card.status;

        return (
          <Card
            key={card.key}
            className={cn(
              "rounded-lg border-border/80 shadow-sm transition hover:border-primary/40 hover:shadow-md",
              isActive && "border-primary ring-2 ring-primary/15"
            )}
          >
            <CardContent className="p-0">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 p-3 text-left"
                onClick={() => onStatusSelect(card.status)}
              >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {value}
                </p>
              </div>

              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.bg}`}
              >
                <Icon className={`h-4 w-4 ${card.accent}`} />
              </div>
              </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
