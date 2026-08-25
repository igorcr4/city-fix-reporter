import { useNavigate } from "react-router-dom";
import { ProfileMenu } from "@/features/reports/components/ProfileMenu";
import { MapControlsDock } from "@/features/reports/components/MapControlsDock";
import type { ReportMapFilter } from "@/features/reports/helpers/reportMapFilters";
import { Button } from "@/shared/components/ui/button";
import { CreditCard } from "lucide-react";

interface MapHeaderProps {
  selectedFilter: ReportMapFilter;
  onFilterChange: (filter: ReportMapFilter) => void;
  isHeatmapVisible: boolean;
  onHeatmapToggle: () => void;
  heatmapDisabled?: boolean;
}

export function MapHeader({
  selectedFilter,
  onFilterChange,
  isHeatmapVisible,
  onHeatmapToggle,
  heatmapDisabled = false,
}: MapHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="mobile-map-header absolute left-0 right-0 top-0 z-30 pb-3">
      <div className="flex min-h-11 items-center justify-between gap-2 sm:relative sm:justify-end">
        <button
          onClick={() => navigate("/reports")}
          className="shrink-0 rounded-lg bg-card/90 px-3 py-2 font-heading text-base font-bold text-primary shadow-md backdrop-blur-md sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:text-lg"
        >
          FixCity
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Abonamente"
            onClick={() => navigate("/subscription")}
            className="h-11 w-11 shrink-0 touch-manipulation rounded-lg bg-card/90 shadow-md backdrop-blur-md"
          >
            <CreditCard className="h-4 w-4" />
          </Button>

          <MapControlsDock
            selectedFilter={selectedFilter}
            onFilterChange={onFilterChange}
            isHeatmapVisible={isHeatmapVisible}
            onHeatmapToggle={onHeatmapToggle}
            heatmapDisabled={heatmapDisabled}
          />

          <div className="map-header-profile rounded-full bg-card/90 shadow-md backdrop-blur-md">
            <ProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
