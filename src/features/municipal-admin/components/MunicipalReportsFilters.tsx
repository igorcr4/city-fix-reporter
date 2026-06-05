import { Flame, Search, SlidersHorizontal } from "lucide-react";

import {
  MUNICIPAL_REPORT_CATEGORIES,
} from "@/features/municipal-admin/helpers/reportFilters";
import type {
  MunicipalReportCategoryFilter,
  MunicipalReportFilters,
  MunicipalReportSort,
} from "@/features/municipal-admin/types";
import { CATEGORY_LABELS } from "@/shared/types";
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
  onCriticalOnlyChange: (value: boolean) => void;
  onSortChange: (value: MunicipalReportSort) => void;
}

export function MunicipalReportsFilters({
  filters,
  onSearchChange,
  onCategoryChange,
  onCriticalOnlyChange,
  onSortChange,
}: MunicipalReportsFiltersProps) {
  return (
    <Card className="rounded-lg border-border/80 shadow-sm">
      <CardHeader className="px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filtrare și sortare
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.4fr)_minmax(180px,0.75fr)_minmax(160px,0.7fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Caută după titlu sau adresă..."
              className="h-9 pl-9"
            />
          </div>

          <Select
            value={filters.category}
            onValueChange={(value) =>
              onCategoryChange(value as MunicipalReportCategoryFilter)
            }
          >
            <SelectTrigger className="h-9">
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
            value={filters.sort}
            onValueChange={(value) => onSortChange(value as MunicipalReportSort)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sortare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Cele mai noi întâi</SelectItem>
              <SelectItem value="oldest">Cele mai vechi întâi</SelectItem>
            </SelectContent>
          </Select>

          <button
            type="button"
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
              filters.criticalOnly
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
            }`}
            aria-pressed={filters.criticalOnly}
            onClick={() => onCriticalOnlyChange(!filters.criticalOnly)}
          >
            <Flame className="h-4 w-4" />
            Zone critice
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
