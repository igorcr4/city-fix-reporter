import { useEffect, useMemo, useRef } from "react";
import Map, { Marker, Popup } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { ExternalLink, MapPin } from "lucide-react";

import { StatusBadge } from "@/features/reports/components/StatusBadge";
import type { Report } from "@/shared/types";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/shared/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface MunicipalReportsMapProps {
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report | null) => void;
  onOpenDetails: (report: Report) => void;
}

function getMarkerColor(report: Report): string {
  if (report.status === "FIXED") return "#16a34a";
  if (report.status === "IN_PROGRESS") return "#f59e0b";
  return CATEGORY_COLORS[report.category];
}

export function MunicipalReportsMap({
  reports,
  selectedReport,
  onSelectReport,
  onOpenDetails,
}: MunicipalReportsMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  const initialView = useMemo(() => {
    if (selectedReport) {
      return {
        latitude: selectedReport.latitude,
        longitude: selectedReport.longitude,
        zoom: 13,
      };
    }

    const firstReport = reports[0];
    if (firstReport) {
      return {
        latitude: firstReport.latitude,
        longitude: firstReport.longitude,
        zoom: 12,
      };
    }

    return {
      latitude: DEFAULT_MAP_CENTER.lat,
      longitude: DEFAULT_MAP_CENTER.lng,
      zoom: DEFAULT_MAP_ZOOM,
    };
  }, [reports, selectedReport]);

  useEffect(() => {
    if (!selectedReport) return;

    mapRef.current?.flyTo({
      center: [selectedReport.longitude, selectedReport.latitude],
      zoom: 14,
      duration: 800,
      essential: true,
    });
  }, [selectedReport]);

  return (
    <Card className="overflow-hidden rounded-3xl border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Hartă rapoarte municipalitate</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="h-[360px] overflow-hidden rounded-2xl border border-border">
          <Map
            ref={mapRef}
            initialViewState={initialView}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            attributionControl={false}
          >
            {reports.map((report) => (
              <Marker
                key={report.id}
                latitude={report.latitude}
                longitude={report.longitude}
                anchor="bottom"
                onClick={(event) => {
                  event.originalEvent.stopPropagation();
                  onSelectReport(report);
                }}
              >
                <div
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110"
                  style={{ backgroundColor: getMarkerColor(report) }}
                  title={report.title}
                >
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </Marker>
            ))}

            {selectedReport && (
              <Popup
                latitude={selectedReport.latitude}
                longitude={selectedReport.longitude}
                anchor="bottom"
                offset={[0, -34]}
                onClose={() => onSelectReport(null)}
                closeOnClick={false}
                maxWidth="280px"
              >
                <div className="space-y-3 p-1">
                  <h3 className="font-heading text-sm font-semibold text-foreground">
                    {selectedReport.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full"
                      style={{
                        borderColor: CATEGORY_COLORS[selectedReport.category],
                        color: CATEGORY_COLORS[selectedReport.category],
                      }}
                    >
                      {CATEGORY_LABELS[selectedReport.category]}
                    </Badge>
                    <StatusBadge status={selectedReport.status} />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {selectedReport.address || "Adresa nu este disponibilă."}
                  </p>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => onOpenDetails(selectedReport)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Vezi detalii
                  </Button>
                </div>
              </Popup>
            )}
          </Map>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            Rezolvat
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            În lucru
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
            Nou / în așteptare
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
