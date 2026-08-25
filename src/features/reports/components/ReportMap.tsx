import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import MapView, { Marker, Popup } from "react-map-gl/maplibre";
import type {
  GeoJSONSource,
  MapLayerMouseEvent,
  MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Report } from "@/shared/types";
import {
  CATEGORY_LABELS,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/shared/types";
import {
  getReportMapMarkerColor,
  REPORT_MAP_CATEGORY_COLORS,
  RESOLVED_REPORT_MARKER_COLOR,
} from "@/features/reports/helpers/reportMapFilters";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  ExternalLink,
  Crosshair,
  Loader2,
  Compass,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/features/reports/components/StatusBadge";
import { toast } from "@/shared/hooks/use-toast";
import {
  ReportClusterLayer,
  REPORT_CLUSTER_COUNT_LAYER_ID,
  REPORT_CLUSTER_INTERACTIVE_LAYER_IDS,
  REPORT_CLUSTER_SOURCE_ID,
  REPORT_CLUSTERS_LAYER_ID,
  REPORT_FOCUSED_LAYER_ID,
  REPORT_MARKER_ICON_IDS,
  REPORT_RESOLVED_MARKER_ICON_ID,
  REPORT_UNCLUSTERED_LAYER_ID,
} from "@/features/reports/components/ReportClusterLayer";
import { ReportHeatmapLayer } from "@/features/reports/components/ReportHeatmapLayer";
import { createReportMapPointData } from "@/features/reports/helpers/reportMapGeoJson";
import {
  canRequestMapGeolocation,
  readStoredReportMapViewState,
  recordMapGeolocationOutcome,
  storeReportMapViewState,
} from "@/features/reports/helpers/reportMapState";
import { useAuth } from "@/core/auth/AuthContext";

interface ReportMapProps {
  reports: Report[];
  className?: string;
  focusedReportId?: number | null;
  focusedLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  /** Vizibilitatea stratului de densitate (heatmap) — controlat din afară. */
  isHeatmapVisible?: boolean;
}

function createReportMarkerSvg(color: string): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="34" r="26" fill="#0f172a" opacity="0.16"/>
  <circle cx="32" cy="30" r="26" fill="${color}" stroke="#ffffff" stroke-width="4"/>
  <svg x="16" y="14" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
</svg>
`;
}

function loadReportMarkerIcon(color: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image(64, 64);
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      createReportMarkerSvg(color)
    )}`;
  });
}

async function loadReportMarkerIcons(): Promise<
  Array<[string, HTMLImageElement]>
> {
  const categoryIcons = Object.entries(REPORT_MARKER_ICON_IDS).map(
    async ([category, iconId]): Promise<[string, HTMLImageElement]> => [
      iconId,
      await loadReportMarkerIcon(
        REPORT_MAP_CATEGORY_COLORS[category as keyof typeof REPORT_MAP_CATEGORY_COLORS]
      ),
    ]
  );

  return Promise.all([
    ...categoryIcons,
    [
      REPORT_RESOLVED_MARKER_ICON_ID,
      await loadReportMarkerIcon(RESOLVED_REPORT_MARKER_COLOR),
    ],
  ]);
}

export function ReportMap({
  reports,
  className,
  focusedReportId,
  focusedLocation,
  isHeatmapVisible = false,
}: ReportMapProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef<MapRef | null>(null);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const initialMapViewState = useMemo(() => {
    if (focusedLocation) {
      return {
        latitude: focusedLocation.latitude,
        longitude: focusedLocation.longitude,
        zoom: 16,
        bearing: 0,
        pitch: 0,
      };
    }

    const storedViewState = readStoredReportMapViewState();
    if (storedViewState) {
      return storedViewState;
    }

    return {
      latitude: DEFAULT_MAP_CENTER.lat,
      longitude: DEFAULT_MAP_CENTER.lng,
      zoom: DEFAULT_MAP_ZOOM,
      bearing: 0,
      pitch: 0,
    };
  }, [focusedLocation]);

  const reportPointData = useMemo(() => createReportMapPointData(reports), [reports]);
  const reportsById = useMemo(
    () => new Map(reports.map((report) => [report.id, report])),
    [reports]
  );

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

  const autoCenteredRef = useRef(false);

  // La intrarea pe hartă, centrăm automat pe locația curentă a utilizatorului.
  // Harta se randează instant pe centrul stocat/implicit, apoi „zboară" la GPS.
  // Dacă geolocația eșuează, rămâne pe centrul curent (fără mesaj de eroare).
  // Excepție: dacă venim cu o locație țintă (deep-link), o respectăm pe aceea.
  // Limităm cererile automate (vezi canRequestMapGeolocation): dacă userul
  // refuză nu mai întrebăm, iar la erori mai încercăm o singură dată.
  useEffect(() => {
    if (autoCenteredRef.current) return;
    autoCenteredRef.current = true;

    const token = user?.token;
    if (focusedLocation || !navigator.geolocation || !token) return;
    if (!canRequestMapGeolocation(token)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        recordMapGeolocationOutcome(token, "success");
        const nextLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(nextLocation);
        flyToLocation(nextLocation);
      },
      (err) => {
        // code 1 = permisiune refuzată → nu mai întrebăm; altfel = eroare (retry o dată).
        recordMapGeolocationOutcome(
          token,
          err.code === err.PERMISSION_DENIED ? "denied" : "error"
        );
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
    );
  }, [focusedLocation, flyToLocation, user?.token]);

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

  const storeCurrentMapViewState = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const center = map.getCenter();

    storeReportMapViewState({
      latitude: center.lat,
      longitude: center.lng,
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    });
  }, []);

  const openSelectedReportDetails = useCallback(() => {
    if (!selectedReport) return;

    storeCurrentMapViewState();
    navigate(`/reports/${selectedReport.id}`);
  }, [navigate, selectedReport, storeCurrentMapViewState]);

  const ensureReportMarkerIcon = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const missingIconIds = [
      ...Object.values(REPORT_MARKER_ICON_IDS),
      REPORT_RESOLVED_MARKER_ICON_ID,
    ].filter((iconId) => !map.hasImage(iconId));

    if (missingIconIds.length === 0) return;

    void loadReportMarkerIcons()
      .then((icons) => {
        for (const [iconId, image] of icons) {
          if (!map.hasImage(iconId)) {
            map.addImage(iconId, image, { pixelRatio: 2 });
          }
        }
      })
      .catch((error) => {
        console.error("REPORT MARKER ICON LOAD ERROR:", error);
      });
  }, []);

  const handleClusterClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const clusterId = Number(feature?.properties?.cluster_id);

      if (!Number.isFinite(clusterId)) return;

      const source = mapRef.current
        ?.getMap()
        .getSource(REPORT_CLUSTER_SOURCE_ID) as GeoJSONSource | undefined;

      void source
        ?.getClusterExpansionZoom(clusterId)
        .then((zoom) => {
          mapRef.current?.easeTo({
            center: [event.lngLat.lng, event.lngLat.lat],
            zoom,
            duration: 700,
            essential: true,
          });
        })
        .catch((error) => {
          console.error("REPORT CLUSTER EXPANSION ERROR:", error);
        });
    },
    []
  );

  const handleReportPointClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const reportId = Number(feature?.properties?.reportId);

      if (!Number.isFinite(reportId)) return;

      const report = reportsById.get(reportId);
      if (report) {
        setSelectedReport(report);
      }
    },
    [reportsById]
  );

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (isHeatmapVisible) return;

      const layerId = event.features?.[0]?.layer.id;

      if (
        layerId === REPORT_CLUSTERS_LAYER_ID ||
        layerId === REPORT_CLUSTER_COUNT_LAYER_ID
      ) {
        handleClusterClick(event);
        return;
      }

      if (
        layerId === REPORT_UNCLUSTERED_LAYER_ID ||
        layerId === REPORT_FOCUSED_LAYER_ID
      ) {
        handleReportPointClick(event);
      }
    },
    [handleClusterClick, handleReportPointClick, isHeatmapVisible]
  );

  const handleInteractiveLayerMouseEnter = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.getCanvas().style.cursor = "pointer";
    }
  }, []);

  const handleInteractiveLayerMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.getCanvas().style.cursor = "";
    }
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

  useEffect(() => {
    if (isHeatmapVisible) {
      setSelectedReport(null);
    }
  }, [isHeatmapVisible]);

  useEffect(() => {
    if (selectedReport && !reportsById.has(selectedReport.id)) {
      setSelectedReport(null);
    }
  }, [reportsById, selectedReport]);

  return (
    <div className={className}>
      <MapView
        ref={mapRef}
        initialViewState={{
          latitude: initialMapViewState.latitude,
          longitude: initialMapViewState.longitude,
          zoom: initialMapViewState.zoom,
          bearing: initialMapViewState.bearing,
          pitch: initialMapViewState.pitch,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        attributionControl={false}
        onLoad={ensureReportMarkerIcon}
        onStyleData={ensureReportMarkerIcon}
        interactiveLayerIds={
          isHeatmapVisible ? undefined : REPORT_CLUSTER_INTERACTIVE_LAYER_IDS
        }
        onClick={handleMapClick}
        onMoveEnd={storeCurrentMapViewState}
        onMouseEnter={handleInteractiveLayerMouseEnter}
        onMouseLeave={handleInteractiveLayerMouseLeave}
      >
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

        <ReportHeatmapLayer data={reportPointData} visible={isHeatmapVisible} />

        <ReportClusterLayer
          data={reportPointData}
          visible={!isHeatmapVisible}
          focusedReportId={focusedReportId}
        />

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

        {selectedReport && (
          <Popup
            latitude={selectedReport.latitude}
            longitude={selectedReport.longitude}
            anchor="bottom"
            offset={[0, -16]}
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
                    borderColor: getReportMapMarkerColor(
                      selectedReport.category,
                      selectedReport.status
                    ),
                    color: getReportMapMarkerColor(
                      selectedReport.category,
                      selectedReport.status
                    ),
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
                onClick={openSelectedReportDetails}
              >
                <ExternalLink className="h-3 w-3" />
                Vezi detalii
              </Button>
            </div>
          </Popup>
        )}
      </MapView>
    </div>
  );
}
