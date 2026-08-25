import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PieChart as PieChartIcon, TrendingUp } from "lucide-react";

import { getReportsByMonth } from "@/features/municipal-admin/helpers/periodStatistics";
import { getStatusCounts } from "@/features/municipal-admin/helpers/reportFilters";
import { NO_DATA_IN_RANGE_MESSAGE } from "@/features/municipal-admin/helpers/statsInterval";
import { STATUS_LABELS, type Report, type ReportStatus } from "@/shared/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

interface MunicipalPeriodStatisticsSectionProps {
  reports: Report[];
  /** Un interval concret e activ (nu „Tot") → placeholder specific intervalului. */
  rangeApplied?: boolean;
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  NEW: "#f59e0b",
  IN_PROGRESS: "#0ea5e9",
  RESOLVED: "#10b981",
};

export function MunicipalPeriodStatisticsSection({
  reports,
  rangeApplied = false,
}: MunicipalPeriodStatisticsSectionProps) {
  const monthlyData = useMemo(() => getReportsByMonth(reports), [reports]);

  const statusData = useMemo(() => {
    const counts = getStatusCounts(reports);

    return (Object.keys(counts) as ReportStatus[])
      .map((status) => ({
        status,
        label: STATUS_LABELS[status],
        color: STATUS_COLORS[status],
        count: counts[status],
      }))
      .filter((entry) => entry.count > 0);
  }, [reports]);

  const hasMonthly = monthlyData.length > 0;
  const hasStatus = statusData.length > 0;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Statistici pe perioade
        </h2>
        <p className="text-sm text-muted-foreground">
          Evoluția rapoartelor în timp și distribuția pe status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Rapoarte pe lună
          </CardTitle>
          <CardDescription>Ultimele 12 luni cu activitate.</CardDescription>
        </CardHeader>
        <CardContent>
          {hasMonthly ? (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={32}
                  />
                  <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                  <Legend />
                  <Bar
                    dataKey="total"
                    name="Create"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="resolved"
                    name="Rezolvate"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {rangeApplied
                ? NO_DATA_IN_RANGE_MESSAGE
                : "Nu există încă date suficiente pentru a afișa evoluția."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Distribuție pe status
          </CardTitle>
          <CardDescription>
            Câte rapoarte sunt în fiecare stare.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasStatus ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {rangeApplied
                ? NO_DATA_IN_RANGE_MESSAGE
                : "Nu există încă rapoarte pentru distribuția pe status."}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
