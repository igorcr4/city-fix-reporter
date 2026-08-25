import { CalendarDays, Download, Flame, Search, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale/ro";
import type { DateRange } from "react-day-picker";

import {
  MUNICIPAL_REPORT_CATEGORIES,
} from "@/features/municipal-admin/helpers/reportFilters";
import type {
  MunicipalReportCategoryFilter,
  MunicipalReportFilters,
  MunicipalReportSort,
} from "@/features/municipal-admin/types";
import { CATEGORY_LABELS } from "@/shared/types";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
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
  onDateRangeChange: (range: { from: Date | null; to: Date | null }) => void;
  onExportCsv: () => void;
  /** Toggle-ul „Zone critice" e premium (TOP_CRITICAL_ZONES). */
  showCriticalZones?: boolean;
  /** Selectorul de interval de date e premium (PERIOD_FILTER). */
  showPeriodFilter?: boolean;
  /** Butonul de export CSV e premium (CSV_EXPORT). */
  showCsvExport?: boolean;
}

function formatRangeLabel(from: Date | null, to: Date | null): string {
  if (from && to) {
    return `${format(from, "d MMM yyyy", { locale: ro })} – ${format(to, "d MMM yyyy", { locale: ro })}`;
  }
  if (from) {
    return `Din ${format(from, "d MMM yyyy", { locale: ro })}`;
  }
  return "Perioadă";
}

export function MunicipalReportsFilters({
  filters,
  onSearchChange,
  onCategoryChange,
  onCriticalOnlyChange,
  onSortChange,
  onDateRangeChange,
  onExportCsv,
  showCriticalZones = true,
  showPeriodFilter = false,
  showCsvExport = false,
}: MunicipalReportsFiltersProps) {
  const hasRange = !!filters.dateFrom || !!filters.dateTo;
  const selectedRange: DateRange | undefined = filters.dateFrom
    ? { from: filters.dateFrom, to: filters.dateTo ?? undefined }
    : undefined;

  return (
    <Card className="mx-auto w-full max-w-7xl rounded-lg border-border/80 shadow-sm">
      <CardHeader className="px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filtrare și sortare
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-[320px] lg:w-[360px]">
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
            <SelectTrigger className="h-9 w-full md:w-[188px]">
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
            <SelectTrigger className="h-9 w-full md:w-[176px]">
              <SelectValue placeholder="Sortare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Cele mai noi întâi</SelectItem>
              <SelectItem value="oldest">Cele mai vechi întâi</SelectItem>
            </SelectContent>
          </Select>

          {showPeriodFilter && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-9 gap-2 ${hasRange ? "border-primary text-primary" : ""}`}
                >
                  <CalendarDays className="h-4 w-4" />
                  {formatRangeLabel(filters.dateFrom, filters.dateTo)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={selectedRange}
                  onSelect={(range) =>
                    onDateRangeChange({
                      from: range?.from ?? null,
                      to: range?.to ?? null,
                    })
                  }
                  numberOfMonths={2}
                  locale={ro}
                />
                {hasRange && (
                  <div className="border-t border-border p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        onDateRangeChange({ from: null, to: null })
                      }
                    >
                      Resetează perioada
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}

          {showCriticalZones && (
            <button
              type="button"
              className={`inline-flex h-9 w-auto shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-3 text-sm font-medium transition-colors ${
                filters.criticalOnly
                  ? "border-red-600 bg-red-600 text-white shadow-sm hover:border-red-700 hover:bg-red-700"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
              }`}
              aria-pressed={filters.criticalOnly}
              onClick={() => onCriticalOnlyChange(!filters.criticalOnly)}
            >
              <Flame className="h-4 w-4" />
              Zone critice
            </button>
          )}

          {showCsvExport && (
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2"
              onClick={onExportCsv}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
