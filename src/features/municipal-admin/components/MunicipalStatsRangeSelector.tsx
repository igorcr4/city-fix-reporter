import { CalendarRange } from "lucide-react";

import {
  STATS_RANGE_OPTIONS,
  statsRangeToValue,
  valueToStatsRange,
  type StatsRange,
} from "@/features/municipal-admin/helpers/statsInterval";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface MunicipalStatsRangeSelectorProps {
  value: StatsRange;
  onChange: (value: StatsRange) => void;
}

/**
 * Selector unic de interval pentru toate cardurile de statistici. Valoarea e
 * ținută la nivelul panoului (o singură sursă de adevăr) și pasată în jos.
 */
export function MunicipalStatsRangeSelector({
  value,
  onChange,
}: MunicipalStatsRangeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <CalendarRange className="h-4 w-4" />
        Interval
      </span>
      <Select
        value={statsRangeToValue(value)}
        onValueChange={(next) => onChange(valueToStatsRange(next))}
      >
        <SelectTrigger className="h-9 w-full sm:w-[188px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATS_RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={statsRangeToValue(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
