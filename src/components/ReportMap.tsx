import { useRef, useState, useCallback, useEffect } from "react";
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Report } from "@/types";
import { CATEGORY_COLORS, CATEGORY_LABELS, STATUS_LABELS, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";

interface ReportMapProps {
  reports: Report[];
  className?: string;
}

export function ReportMap({ reports, className }: ReportMapProps) {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const mapCenter = userLocation ?? DEFAULT_MAP_CENTER;

  return (
    <div className={className}>
      <Map
        initialViewState={{
          latitude: mapCenter.lat,
          longitude: mapCenter.lng,
          zoom: DEFAULT_MAP_ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        attributionControl={false}
      >
        <NavigationControl position="top-left" showCompass={false} />
        <GeolocateControl
          position="top-left"
          trackUserLocation
          onGeolocate={(e) => {
            setUserLocation({ lat: e.coords.latitude, lng: e.coords.longitude });
          }}
        />

        {reports.map((report) => (
          <Marker
            key={report.id}
            latitude={report.latitude}
            longitude={report.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedReport(report);
            }}
          >
            <div
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110"
              style={{ backgroundColor: CATEGORY_COLORS[report.category] }}
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
            offset={[0, -36] as [number, number]}
            onClose={() => setSelectedReport(null)}
            closeOnClick={false}
            className="report-popup"
            maxWidth="280px"
          >
            <div className="flex flex-col gap-2 p-1">
              <h3 className="font-heading text-sm font-bold leading-tight text-foreground">
                {selectedReport.title}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-xs"
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
                {new Date(selectedReport.createdAt).toLocaleDateString("ro-RO")}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-1 w-full gap-1.5 text-xs"
                onClick={() => navigate(`/reports/${selectedReport.id}`)}
              >
                <ExternalLink className="h-3 w-3" />
                Vezi detalii
              </Button>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
