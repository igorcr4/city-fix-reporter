import { Search, SlidersHorizontal } from "lucide-react";

import {
  MUNICIPAL_REPORT_CATEGORIES,
  MUNICIPAL_REPORT_STATUSES,
} from "@/features/municipal-admin/helpers/reportFilters";
import type {
  MunicipalReportCategoryFilter,
  MunicipalReportFilters,
  MunicipalReportStatusFilter,
  MunicipalReportSort,
} from "@/features/municipal-admin/types";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  type ReportCategory,
  type ReportStatus,
} from "@/shared/types";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface MunicipalReportsFiltersProps {
  filters: MunicipalReportFilters;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: MunicipalReportCategoryFilter) => void;
  onStatusChange: (value: MunicipalReportStatusFilter) => void;
  onSortChange: (value: MunicipalReportSort) => void;
  categoryCounts: Record<ReportCategory, number>;
  statusCounts: Record<ReportStatus, number>;
}

export function MunicipalReportsFilters({
  filters,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onSortChange,
  categoryCounts,
  statusCounts,
}: MunicipalReportsFiltersProps) {
  return (
    <Card className="rounded-3xl border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          Filtrare și sortare
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Caută după titlu sau adresă..."
              className="pl-9"
            />
          </div>

          <Select
            value={filters.category}
            onValueChange={(value) =>
              onCategoryChange(value as MunicipalReportCategoryFilter)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              {MUNICIPAL_REPORT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "ALL"
                    ? "Toate categoriile"
                    : CATEGORY_LABELS[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) =>
              onStatusChange(value as MunicipalReportStatusFilter)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {MUNICIPAL_REPORT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "ALL" ? "Toate statusurile" : STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sort}
            onValueChange={(value) => onSortChange(value as MunicipalReportSort)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sortare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Cele mai noi întâi</SelectItem>
              <SelectItem value="oldest">Cele mai vechi întâi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Count pe status
            </span>
            {MUNICIPAL_REPORT_STATUSES.filter((status) => status !== "ALL").map(
              (status) => (
                <Badge key={status} variant="outline" className="gap-1 rounded-full">
                  {STATUS_LABELS[status]}
                  <span className="text-muted-foreground">
                    {statusCounts[status]}
                  </span>
                </Badge>
              )
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Count pe categorie
            </span>
            {MUNICIPAL_REPORT_CATEGORIES.filter(
              (category) => category !== "ALL"
            ).map((category) => (
              <Badge key={category} variant="outline" className="gap-1 rounded-full">
                {CATEGORY_LABELS[category]}
                <span className="text-muted-foreground">
                  {categoryCounts[category]}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
