import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Flame, MapPin, MapPinned } from "lucide-react";

import {
  CRITICAL_REPORT_ZONE_CONFIG,
  getCriticalReportZones,
  type CriticalReportZone,
} from "@/features/municipal-admin/helpers/criticalReportZones";
import { getReportMapUrl } from "@/features/reports/helpers/reportMapNavigation";
import { NO_DATA_IN_RANGE_MESSAGE } from "@/features/municipal-admin/helpers/statsInterval";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Report,
} from "@/shared/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

interface MunicipalCriticalZonesSectionProps {
  reports: Report[];
  /** Un interval concret e activ (nu „Tot") → placeholder specific intervalului. */
  rangeApplied?: boolean;
}

interface CriticalZoneCardProps {
  zone: CriticalReportZone;
  rank: number;
  onOpenOnMap: () => void;
}

function CriticalZoneCard({ zone, rank, onOpenOnMap }: CriticalZoneCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-lg border-border/80 transition-all hover:border-primary/30 hover:shadow-sm">
      <CardContent className="flex h-full flex-col p-0">
        <button
          type="button"
          onClick={onOpenOnMap}
          className="relative block aspect-[4/3] w-full border-b bg-muted/60"
          aria-label={`Vezi zona ${rank} pe hartă`}
        >
          <Map
            initialViewState={{
              latitude: zone.centerLatitude,
              longitude: zone.centerLongitude,
              zoom: 15,
            }}
            latitude={zone.centerLatitude}
            longitude={zone.centerLongitude}
            zoom={15}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            attributionControl={false}
            interactive={false}
          >
            <Marker
              latitude={zone.centerLatitude}
              longitude={zone.centerLongitude}
              anchor="bottom"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg">
                <Flame className="h-4 w-4 text-white" />
              </div>
            </Marker>
          </Map>

          <span className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-foreground/85 px-2 text-xs font-bold text-background shadow-sm">
            #{rank}
          </span>
        </button>

        <div className="flex flex-1 flex-col gap-2.5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Flame className="h-4 w-4 text-red-600" />
              Zonă critică
            </span>
            <Badge variant="secondary">{zone.reportCount} rapoarte</Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[zone.topCategory] }}
            />
            <span className="text-muted-foreground">
              Predominant:{" "}
              <span className="font-medium text-foreground">
                {CATEGORY_LABELS[zone.topCategory]}
              </span>
            </span>
          </div>

          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPinned className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-2">
              {zone.address || "Adresa nu este disponibilă."}
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-auto h-8 gap-1.5 text-xs"
            onClick={onOpenOnMap}
          >
            <MapPin className="h-3.5 w-3.5" />
            Vezi pe hartă
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function MunicipalCriticalZonesSection({
  reports,
  rangeApplied = false,
}: MunicipalCriticalZonesSectionProps) {
  const navigate = useNavigate();

  const zones = useMemo(() => getCriticalReportZones(reports), [reports]);
  const totalCriticalReports = useMemo(
    () => zones.reduce((sum, zone) => sum + zone.reportCount, 0),
    [zones]
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Zone critice</h2>
        <p className="text-sm text-muted-foreground">
          Zone cu concentrare mare de probleme (cel puțin{" "}
          {CRITICAL_REPORT_ZONE_CONFIG.minimumReports} rapoarte într-o rază de{" "}
          {CRITICAL_REPORT_ZONE_CONFIG.radiusMeters} m), ordonate de la cea mai
          critică la cea mai puțin critică.
        </p>
      </div>

      {zones.length === 0 ? (
        <Card className="rounded-lg border-dashed shadow-sm">
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Flame className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {rangeApplied ? NO_DATA_IN_RANGE_MESSAGE : "Nicio zonă critică momentan"}
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                {rangeApplied
                  ? "Nu există rapoarte concentrate într-o zonă în intervalul ales. Alege un interval mai mare pentru a vedea zonele critice."
                  : "Când mai multe rapoarte se vor concentra în aceeași zonă, acestea vor apărea aici pentru a fi prioritizate."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            <Flame className="h-4 w-4 shrink-0" />
            <span>
              <strong>{zones.length}</strong>{" "}
              {zones.length === 1 ? "zonă critică" : "zone critice"} ·{" "}
              <strong>{totalCriticalReports}</strong> rapoarte în total
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(248px,280px))]">
            {zones.map((zone, index) => (
              <CriticalZoneCard
                key={zone.id}
                zone={zone}
                rank={index + 1}
                onOpenOnMap={() => navigate(getReportMapUrl(zone.reports[0]))}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
