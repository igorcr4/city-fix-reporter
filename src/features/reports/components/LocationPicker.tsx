import { useState, useCallback, useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent, ViewState } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/shared/types";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Crosshair, MapPin, Loader2, X } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const initialCenter = useMemo(
    () =>
      latitude != null && longitude != null
        ? { lat: latitude, lng: longitude }
        : DEFAULT_MAP_CENTER,
    [latitude, longitude]
  );

  const [tempLocation, setTempLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null);

  const [modalViewState, setModalViewState] = useState<ViewState>({
    latitude: initialCenter.lat,
    longitude: initialCenter.lng,
    zoom: latitude != null && longitude != null ? 16 : DEFAULT_MAP_ZOOM,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const syncModalWithCurrentLocation = useCallback(() => {
    const center =
      latitude != null && longitude != null
        ? { lat: latitude, lng: longitude }
        : DEFAULT_MAP_CENTER;

    setTempLocation(
      latitude != null && longitude != null
        ? { lat: latitude, lng: longitude }
        : null
    );

    setModalViewState({
      latitude: center.lat,
      longitude: center.lng,
      zoom: latitude != null && longitude != null ? 16 : DEFAULT_MAP_ZOOM,
      bearing: 0,
      pitch: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  }, [latitude, longitude]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Eroare",
        description: "Geolocația nu este suportată de browser.",
        variant: "destructive",
      });
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;

        onChange(nextLat, nextLng);
        setTempLocation({ lat: nextLat, lng: nextLng });

        setModalViewState((prev) => ({
          ...prev,
          latitude: nextLat,
          longitude: nextLng,
          zoom: 16,
        }));

        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);

        let msg = "Nu s-a putut obține locația.";
        if (err.code === 1) msg = "Accesul la locație a fost refuzat.";
        if (err.code === 2) msg = "Locația nu este disponibilă.";
        if (err.code === 3) msg = "Timp expirat pentru localizare.";

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
  }, [onChange]);

  const handlePreviewMapClick = useCallback(() => {
    syncModalWithCurrentLocation();
    setIsMapOpen(true);
  }, [syncModalWithCurrentLocation]);

  const handleOpenMapPicker = useCallback(() => {
    syncModalWithCurrentLocation();
    setIsMapOpen(true);
  }, [syncModalWithCurrentLocation]);

  const handleModalMapClick = useCallback((e: MapLayerMouseEvent) => {
    setTempLocation({
      lat: e.lngLat.lat,
      lng: e.lngLat.lng,
    });
  }, []);

  const handleConfirmLocation = useCallback(() => {
    if (!tempLocation) {
      toast({
        title: "Locație lipsă",
        description: "Alege un punct pe hartă înainte să confirmi.",
        variant: "destructive",
      });
      return;
    }

    onChange(tempLocation.lat, tempLocation.lng);
    setIsMapOpen(false);
  }, [onChange, tempLocation]);

  const center =
    latitude != null && longitude != null
      ? { lat: latitude, lng: longitude }
      : DEFAULT_MAP_CENTER;

  return (
    <>
      <div className="flex flex-col gap-3">
        <Label>Locație</Label>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleUseMyLocation}
            disabled={geoLoading}
          >
            {geoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
            Locația mea
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleOpenMapPicker}
          >
            <MapPin className="h-4 w-4" />
            Alege pe hartă
          </Button>
        </div>

        <button
          type="button"
          onClick={handlePreviewMapClick}
          className="h-48 overflow-hidden rounded-lg border border-border text-left"
        >
          <Map
            initialViewState={{
              latitude: center.lat,
              longitude: center.lng,
              zoom: latitude != null && longitude != null ? 16 : DEFAULT_MAP_ZOOM,
            }}
            {...(latitude != null && longitude != null
              ? {
                  latitude: center.lat,
                  longitude: center.lng,
                  zoom: 16,
                }
              : {})}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            attributionControl={false}
            interactive={false}
          >
            {latitude != null && longitude != null && (
              <Marker latitude={latitude} longitude={longitude} anchor="bottom">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg">
                  <MapPin className="h-4 w-4 text-primary-foreground" />
                </div>
              </Marker>
            )}
          </Map>
        </button>

        {latitude != null && longitude != null ? (
          <p className="text-xs text-muted-foreground">
            📍 {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </p>
        ) : (
          <p className="text-xs text-destructive">
            ⚠ Apasă pe hartă sau folosește „Locația mea” pentru a seta locația.
          </p>
        )}
      </div>

      {isMapOpen && (
        <div className="fixed inset-0 z-[100] bg-background">
          <div className="flex h-full flex-col">
            <div className="mobile-modal-header flex items-center justify-between gap-3 border-b bg-background pb-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Alege locația pe hartă</h2>
                <p className="text-sm text-muted-foreground">
                  Apasă pe hartă pentru a seta punctul exact.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 touch-manipulation"
                onClick={() => setIsMapOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mobile-map-shell relative flex-1">
              <Map
                {...modalViewState}
                onMove={(evt) => setModalViewState(evt.viewState)}
                style={{ width: "100%", height: "100%" }}
                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                attributionControl={false}
                onClick={handleModalMapClick}
              >
                <NavigationControl position="top-right" showCompass={false} />

                {tempLocation && (
                  <Marker
                    latitude={tempLocation.lat}
                    longitude={tempLocation.lng}
                    anchor="bottom"
                    draggable
                    onDragEnd={(e) => {
                      setTempLocation({
                        lat: e.lngLat.lat,
                        lng: e.lngLat.lng,
                      });
                    }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg">
                      <MapPin className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </Marker>
                )}
              </Map>
            </div>

            <div className="mobile-modal-footer border-t bg-background pt-3">
              {tempLocation ? (
                <p className="mb-3 text-sm text-muted-foreground">
                  📍 {tempLocation.lat.toFixed(5)}, {tempLocation.lng.toFixed(5)}
                </p>
              ) : (
                <p className="mb-3 text-sm text-muted-foreground">
                  Selectează un punct pe hartă pentru a continua.
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 touch-manipulation"
                  onClick={() => setIsMapOpen(false)}
                >
                  Anulează
                </Button>

                <Button
                  type="button"
                  className="h-11 flex-1 touch-manipulation"
                  onClick={handleConfirmLocation}
                >
                  Confirmă locația
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
