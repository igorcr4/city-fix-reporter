import { useEffect, useRef, useState } from "react";
import { Activity, Layers, MapPin, SlidersHorizontal } from "lucide-react";

import { REPORT_STATUS, CATEGORY_LABELS } from "@/shared/types";
import {
  REPORT_MAP_CATEGORY_COLORS,
  RESOLVED_REPORT_MARKER_COLOR,
  type ReportMapFilter,
} from "@/features/reports/helpers/reportMapFilters";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

interface MapControlsDockProps {
  selectedFilter: ReportMapFilter;
  onFilterChange: (filter: ReportMapFilter) => void;
  isHeatmapVisible: boolean;
  onHeatmapToggle: () => void;
  /** Densitatea e indisponibilă când nu există rapoarte de afișat. */
  heatmapDisabled?: boolean;
}

const mapFilters: ReportMapFilter[] = [
  "ALL",
  "ROAD",
  "LIGHTING",
  "WASTE",
  "VANDALISM",
  "OTHER",
  REPORT_STATUS.RESOLVED,
];

function getMapFilterLabel(filter: ReportMapFilter): string {
  if (filter === "ALL") return "Toate active";
  if (filter === REPORT_STATUS.RESOLVED) return "Rezolvate";
  return CATEGORY_LABELS[filter];
}

function getMapFilterColor(filter: Exclude<ReportMapFilter, "ALL">): string {
  if (filter === REPORT_STATUS.RESOLVED) return RESOLVED_REPORT_MARKER_COLOR;
  return REPORT_MAP_CATEGORY_COLORS[filter];
}

export function MapControlsDock({
  selectedFilter,
  onFilterChange,
  isHeatmapVisible,
  onHeatmapToggle,
  heatmapDisabled = false,
}: MapControlsDockProps) {
  const [open, setOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dock-ul se deschide la click pe sferă și rămâne deschis cât timp e deschis
  // și meniul de filtre.
  const isExpanded = open || filterMenuOpen;

  const hasActiveControls = selectedFilter !== "ALL" || isHeatmapVisible;

  // Pe touch nu există mouseleave — închidem la tap în afara dock-ului.
  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerDown = (event: PointerEvent) => {
      // Cât timp meniul de filtre e deschis, Radix își gestionează singur
      // închiderea la click în afară (conținutul lui e portalat pe body, deci
      // ar apărea „în afara" dock-ului și am închide selecția înainte să se
      // înregistreze). Nu interveni peste el.
      if (filterMenuOpen) return;

      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isExpanded, filterMenuOpen]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label="Instrumente hartă"
        aria-expanded={isExpanded}
        onClick={() => setOpen((current) => !current)}
        className="relative h-12 w-12 shrink-0 touch-manipulation rounded-full bg-card/90 shadow-md backdrop-blur-md"
      >
        <Layers className="h-5 w-5" />
        {hasActiveControls && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
        )}
      </Button>

      {isExpanded && (
        // `pt-2` e o punte transparentă continuă între sferă și panou, ca să nu
        // se închidă când treci cu mouse-ul peste spațiul dintre ele.
        <div className="absolute right-0 top-full z-10 pt-2 duration-150 animate-in fade-in slide-in-from-top-2">
          <div className="flex w-40 flex-col gap-1.5 rounded-xl border border-border bg-card p-2 shadow-lg">
            <DropdownMenu open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant={selectedFilter !== "ALL" ? "default" : "ghost"}
                  className="h-10 w-full touch-manipulation justify-start gap-2 px-3"
                >
                  <SlidersHorizontal className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {selectedFilter === "ALL"
                      ? "Filtru"
                      : getMapFilterLabel(selectedFilter)}
                  </span>
                  {selectedFilter !== "ALL" && (
                    <span
                      className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/80 shadow-sm"
                      style={{
                        backgroundColor: getMapFilterColor(selectedFilter),
                      }}
                    >
                      <MapPin className="h-3 w-3 text-white" />
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="left"
                align="start"
                collisionPadding={16}
                sideOffset={8}
                className="w-52 max-w-[calc(100vw-2rem)]"
              >
                <DropdownMenuRadioGroup
                  value={selectedFilter}
                  onValueChange={(value) =>
                    onFilterChange(value as ReportMapFilter)
                  }
                >
                  {mapFilters.map((filter) => (
                    <DropdownMenuRadioItem key={filter} value={filter}>
                      <span className="flex items-center gap-2">
                        {filter === "ALL" ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-foreground/70" />
                        ) : (
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/80 shadow-sm"
                            style={{ backgroundColor: getMapFilterColor(filter) }}
                          >
                            <MapPin className="h-3 w-3 text-white" />
                          </span>
                        )}
                        <span>{getMapFilterLabel(filter)}</span>
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant={isHeatmapVisible ? "default" : "ghost"}
              onClick={onHeatmapToggle}
              disabled={heatmapDisabled}
              aria-pressed={isHeatmapVisible}
              className="h-10 w-full touch-manipulation justify-start gap-2 px-3"
            >
              <Activity className="h-4 w-4 shrink-0" />
              <span>Densitate</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
