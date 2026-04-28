import { ClipboardList, Clock3, CheckCircle2, Wrench } from "lucide-react";

import type { MunicipalDashboardSummary } from "@/features/municipal-admin/types";
import { Card, CardContent } from "@/shared/components/ui/card";

interface MunicipalDashboardSummaryProps {
  summary: MunicipalDashboardSummary;
}

const summaryCards = [
  {
    key: "total",
    label: "Total rapoarte",
    accent: "text-slate-700",
    bg: "bg-slate-100",
    icon: ClipboardList,
  },
  {
    key: "pending",
    label: "Pending",
    accent: "text-amber-700",
    bg: "bg-amber-100",
    icon: Clock3,
  },
  {
    key: "inProgress",
    label: "In progress",
    accent: "text-sky-700",
    bg: "bg-sky-100",
    icon: Wrench,
  },
  {
    key: "resolved",
    label: "Resolved",
    accent: "text-emerald-700",
    bg: "bg-emerald-100",
    icon: CheckCircle2,
  },
] as const;

export function MunicipalDashboardSummary({
  summary,
}: MunicipalDashboardSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        const value = summary[card.key];

        return (
          <Card key={card.key} className="rounded-2xl border-border/80 shadow-sm">
            <CardContent className="flex items-start justify-between p-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-3xl font-semibold tracking-tight text-foreground">
                  {value}
                </p>
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.bg}`}
              >
                <Icon className={`h-5 w-5 ${card.accent}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
