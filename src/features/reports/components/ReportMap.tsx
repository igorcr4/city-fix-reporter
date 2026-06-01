import { useRef, useState, useCallback, useEffect } from "react";
import Map, { Marker, Popup } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Report } from "@/shared/types";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/shared/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  ExternalLink,
  MapPin,
  Crosshair,
  Loader2,
  Compass,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/features/reports/components/StatusBadge";
import { toast } from "@/shared/hooks/use-toast";

interface ReportMapProps {
  reports: Report[];
  className?: string;
  focusedReportId?: number | null;
  focusedLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}

export function ReportMap({
  reports,
  className,
  focusedReportId,
  focusedLocation,
}: ReportMapProps) {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef | null>(null);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const flyToLocation = useCallback(
    (location: { lat: number; lng: number }, resetOrientation = false) => {
      const options = {
        center: [location.lng, location.lat],
        zoom: 16,
        duration: 1200,
        essential: true,
        ...(resetOrientation ? { bearing: 0, pitch: 0 } : {}),
      };

      mapRef.current?.flyTo(options);
    },
    []
  );

  const requestUserLocation = useCallback(
    (resetOrientation = false) => {
      if (!navigator.geolocation || geoLoading) return;

      setGeoLoading(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nextLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };

          setUserLocation(nextLocation);
          setGeoLoading(false);
          flyToLocation(nextLocation, resetOrientation);
        },
        (err) => {
          setGeoLoading(false);

          console.error("GEOLOCATION ERROR:", err);

          if (userLocation) {
            flyToLocation(userLocation, resetOrientation);
            return;
          }

          let msg = "Nu s-a putut obține locația.";
          if (err.code === 1) msg = "Accesul la locație a fost refuzat.";
          if (err.code === 2) msg = "Locația nu este disponibilă momentan.";
          if (err.code === 3) msg = "Timpul pentru localizare a expirat.";

          toast({
            title: "Eroare locație",
            description: msg,
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 30000,
        }
      );
    },
    [flyToLocation, geoLoading, userLocation]
  );

  const handleLocateMe = useCallback(() => {
    requestUserLocation(false);
  }, [requestUserLocation]);

  const handleZoomIn = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentZoom = map.getZoom();
    map.easeTo({
      zoom: currentZoom + 1,
      duration: 300,
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentZoom = map.getZoom();
    map.easeTo({
      zoom: currentZoom - 1,
      duration: 300,
    });
  }, []);

  const handleResetMapView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const center = map.getCenter();
    const zoom = map.getZoom();

    map.flyTo({
      center,
      zoom,
      bearing: 0,
      pitch: 0,
      duration: 900,
      essential: true,
    });
  }, []);

  useEffect(() => {
    if (!focusedLocation) return;

    const focusedReport =
      focusedReportId != null
        ? reports.find((report) => report.id === focusedReportId)
        : null;

    mapRef.current?.flyTo({
      center: [focusedLocation.longitude, focusedLocation.latitude],
      zoom: 16,
      bearing: 0,
      pitch: 0,
      duration: 900,
      essential: true,
    });

    if (focusedReport) {
      setSelectedReport(focusedReport);
    }
  }, [focusedLocation, focusedReportId, reports]);

  return (
    <div className={className}>
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: focusedLocation?.latitude ?? DEFAULT_MAP_CENTER.lat,
          longitude: focusedLocation?.longitude ?? DEFAULT_MAP_CENTER.lng,
          zoom: focusedLocation ? 16 : DEFAULT_MAP_ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        attributionControl={false}
      >
        {/* Butoane reale de zoom */}
        <div className="mobile-map-control-left mobile-map-control-top absolute z-10 overflow-hidden rounded-xl bg-card/90 shadow-md backdrop-blur-md">
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex h-11 w-11 touch-manipulation items-center justify-center border-b border-border text-2xl font-semibold text-foreground transition hover:bg-muted"
            aria-label="Mărește harta"
          >
            +
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-11 w-11 touch-manipulation items-center justify-center text-2xl font-semibold text-foreground transition hover:bg-muted"
            aria-label="Micșorează harta"
          >
            −
          </button>
        </div>

        {/* Buton custom pentru locația curentă */}
        <div className="mobile-map-actions-top mobile-map-control-left absolute z-10 flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-11 w-11 touch-manipulation rounded-xl shadow-md"
            onClick={handleLocateMe}
            disabled={geoLoading}
          >
            {geoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-11 w-11 touch-manipulation rounded-xl shadow-md"
            onClick={handleResetMapView}
            aria-label="Resetează harta"
            title="Resetează harta"
            disabled={geoLoading}
          >
            <Compass className="h-4 w-4" />
          </Button>
        </div>

        {/* Marker pentru locația userului */}
        {userLocation && (
          <Marker
            latitude={userLocation.lat}
            longitude={userLocation.lng}
            anchor="center"
          >
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 animate-pulse" />
              <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow-md" />
            </div>
          </Marker>
        )}

        {/* Markere pentru rapoarte */}
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
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110 ${
                focusedReportId === report.id ? "ring-4 ring-primary/30" : ""
              }`}
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
            offset={[0, -36]}
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
