import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Gauge,
  LineChart as LineChartIcon,
  Minus,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";

import {
  getAverageResolutionTimeByCategory,
  getMonthOverMonthComparison,
  getReportVolumeTrend,
  getResolutionRate,
  getResolutionTimeTrend,
  type MetricComparison,
} from "@/features/municipal-admin/helpers/performanceStatistics";
import { getStatusCounts } from "@/features/municipal-admin/helpers/reportFilters";
import { NO_DATA_IN_RANGE_MESSAGE } from "@/features/municipal-admin/helpers/statsInterval";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  type Report,
  type ReportStatus,
} from "@/shared/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/utils/utils";

interface MunicipalPerformanceSectionProps {
  reports: Report[];
  /** Un interval concret e activ (nu „Tot") → placeholder specific intervalului. */
  rangeApplied?: boolean;
}

/**
 * Semnificația direcției pentru un delta:
 *  - „down-good": scădere = bine (ex. timp de rezolvare) → verde la scădere;
 *  - „up-good": creștere = bine (ex. rezolvate) → verde la creștere;
 *  - „neutral": nu colorăm (ex. volum de create — o creștere nu e neapărat rea).
 */
type DeltaDirection = "down-good" | "up-good" | "neutral";

function DeltaIndicator({
  comparison,
  direction,
}: {
  comparison: MetricComparison;
  direction: DeltaDirection;
}) {
  const { deltaPercent } = comparison;

  if (deltaPercent === null) {
    return (
      <span className="text-xs text-muted-foreground">
        date insuficiente pentru comparație
      </span>
    );
  }

  const isFlat = deltaPercent === 0;
  const isUp = deltaPercent > 0;
  const Icon = isFlat ? Minus : isUp ? ArrowUp : ArrowDown;

  let colorClass = "text-muted-foreground";
  if (!isFlat && direction !== "neutral") {
    const isGood = direction === "up-good" ? isUp : !isUp;
    colorClass = isGood ? "text-emerald-600" : "text-red-600";
  }

  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", colorClass)}>
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(deltaPercent)}% față de luna trecută
    </span>
  );
}

function ComparisonCard({
  title,
  value,
  unit = "",
  comparison,
  direction,
}: {
  title: string;
  value: number | null;
  unit?: string;
  comparison: MetricComparison;
  direction: DeltaDirection;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">
          {value === null ? "N/A" : value}
          {value !== null && unit ? (
            <span className="text-base font-normal text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DeltaIndicator comparison={comparison} direction={direction} />
      </CardContent>
    </Card>
  );
}

export function MunicipalPerformanceSection({
  reports,
  rangeApplied = false,
}: MunicipalPerformanceSectionProps) {
  const resolutionRate = useMemo(() => getResolutionRate(reports), [reports]);

  const resolutionTimeData = useMemo(
    () =>
      getAverageResolutionTimeByCategory(reports).map((entry) => ({
        ...entry,
        label: CATEGORY_LABELS[entry.category],
        color: CATEGORY_COLORS[entry.category],
        averageDays: Math.round(entry.averageDays * 10) / 10,
      })),
    [reports]
  );

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

  const resolutionTrend = useMemo(
    () => getResolutionTimeTrend(reports),
    [reports]
  );
  const volumeTrend = useMemo(() => getReportVolumeTrend(reports), [reports]);
  const comparison = useMemo(
    () => getMonthOverMonthComparison(reports),
    [reports]
  );

  const hasReports = reports.length > 0;
  const hasResolutionTime = resolutionTimeData.length > 0;
  const hasStatus = statusData.length > 0;
  const hasResolutionTrend = resolutionTrend.monthsWithData >= 2;

  if (!hasReports) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Performanță</h2>
          <p className="text-sm text-muted-foreground">
            Indicatori de performanță în gestionarea rapoartelor.
          </p>
        </div>

        <Card className="rounded-lg border-dashed shadow-sm">
          <CardContent className="flex min-h-[220px] items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              {rangeApplied
                ? NO_DATA_IN_RANGE_MESSAGE
                : "Nu există date suficiente pentru statistici."}
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Performanță</h2>
        <p className="text-sm text-muted-foreground">
          Indicatori de performanță în gestionarea rapoartelor.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-primary" />
            Rata de rezolvare
          </CardTitle>
          <CardDescription>
            Procentul rapoartelor rezolvate din total.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight text-foreground">
              {resolutionRate.percentage}%
            </span>
            <span className="text-base font-medium text-muted-foreground">
              rezolvate
            </span>
          </div>
          <Progress value={resolutionRate.percentage} className="h-2.5" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {resolutionRate.resolved}
            </span>{" "}
            rezolvate din{" "}
            <span className="font-semibold text-foreground">
              {resolutionRate.total}
            </span>{" "}
            în total.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Timp mediu de rezolvare pe categorie
          </CardTitle>
          <CardDescription>
            Zile medii de la creare până la rezolvare, ordonate de la cea mai
            lentă categorie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasResolutionTime ? (
            <div
              className="w-full"
              style={{
                height: `${Math.max(resolutionTimeData.length * 56, 120)}px`,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={resolutionTimeData}
                  layout="vertical"
                  margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    width={92}
                    fontSize={12}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    formatter={(value: number) => [`${value} zile`, "Medie"]}
                  />
                  <Bar dataKey="averageDays" radius={[0, 6, 6, 0]} barSize={28}>
                    {resolutionTimeData.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Niciun raport rezolvat încă.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Distribuția statusurilor
          </CardTitle>
          <CardDescription>Unde se află acum rapoartele.</CardDescription>
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
              Nu există date suficiente pentru statistici.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Tendința timpului de rezolvare
          </CardTitle>
          <CardDescription>
            Zile medii de rezolvare pe lună (ultimele 6 luni).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasResolutionTrend ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={resolutionTrend.points}
                  margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
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
                  <Tooltip
                    formatter={(value: number) => [`${value} zile`, "Timp mediu"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="averageDays"
                    name="Timp mediu"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    connectNulls
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nu sunt suficiente date pentru o tendință (e nevoie de cel puțin 2
              luni cu rapoarte rezolvate).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChartIcon className="h-4 w-4 text-primary" />
            Volumul de rapoarte în timp
          </CardTitle>
          <CardDescription>
            Rapoarte create vs rezolvate pe lună (ultimele 6 luni).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={volumeTrend}
                margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
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
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  name="Create"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Rezolvate"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-base font-semibold text-foreground">
          Luna curentă vs luna precedentă
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <ComparisonCard
            title="Rapoarte create"
            value={comparison.created.current ?? 0}
            comparison={comparison.created}
            direction="neutral"
          />
          <ComparisonCard
            title="Rapoarte rezolvate"
            value={comparison.resolved.current ?? 0}
            comparison={comparison.resolved}
            direction="up-good"
          />
          <ComparisonCard
            title="Timp mediu rezolvare"
            value={comparison.averageResolutionDays.current}
            unit=" zile"
            comparison={comparison.averageResolutionDays}
            direction="down-good"
          />
        </div>
      </div>
    </section>
  );
}
