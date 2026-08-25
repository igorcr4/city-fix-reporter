import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

import { getCategoryCounts } from "@/features/municipal-admin/helpers/reportFilters";
import { NO_DATA_IN_RANGE_MESSAGE } from "@/features/municipal-admin/helpers/statsInterval";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Report,
  type ReportCategory,
} from "@/shared/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

interface MunicipalTopCategoriesSectionProps {
  reports: Report[];
  /** Un interval concret e activ (nu „Tot") → placeholder specific intervalului. */
  rangeApplied?: boolean;
}

export function MunicipalTopCategoriesSection({
  reports,
  rangeApplied = false,
}: MunicipalTopCategoriesSectionProps) {
  const { data, total } = useMemo(() => {
    const counts = getCategoryCounts(reports);

    const data = (Object.keys(counts) as ReportCategory[])
      .map((category) => ({
        category,
        label: CATEGORY_LABELS[category],
        color: CATEGORY_COLORS[category],
        count: counts[category],
      }))
      .filter((entry) => entry.count > 0)
      .sort((left, right) => right.count - left.count);

    const total = data.reduce((sum, entry) => sum + entry.count, 0);

    return { data, total };
  }, [reports]);

  const isEmpty = data.length === 0;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Top categorii</h2>
        <p className="text-sm text-muted-foreground">
          Cele mai frecvente tipuri de probleme raportate în orașul tău.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Rapoarte pe categorie
          </CardTitle>
          <CardDescription>
            {isEmpty
              ? "Ordonate descrescător după număr."
              : `${total} rapoarte, ordonate descrescător după număr.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEmpty ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {rangeApplied
                ? NO_DATA_IN_RANGE_MESSAGE
                : "Nu există încă rapoarte pentru a calcula top categorii."}
            </p>
          ) : (
            <div className="space-y-6">
              <div
                className="w-full"
                style={{ height: `${Math.max(data.length * 56, 120)}px` }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
                  >
                    <XAxis type="number" hide allowDecimals={false} />
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
                      formatter={(value: number) => [value, "Rapoarte"]}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                      {data.map((entry) => (
                        <Cell key={entry.category} fill={entry.color} />
                      ))}
                      <LabelList dataKey="count" position="right" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ul className="divide-y divide-border rounded-lg border border-border">
                {data.map((entry, index) => {
                  const percentage =
                    total > 0 ? Math.round((entry.count / total) * 100) : 0;

                  return (
                    <li
                      key={entry.category}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-4 text-right font-medium text-muted-foreground">
                          {index + 1}
                        </span>
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="font-medium text-foreground">
                          {entry.label}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {entry.count}
                        </span>{" "}
                        ({percentage}%)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
