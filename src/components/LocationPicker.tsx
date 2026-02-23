import { useState, useCallback } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Crosshair, MapPin, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [geoLoading, setGeoLoading] = useState(false);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: "Eroare", description: "Geolocația nu este suportată de browser.", variant: "destructive" });
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        let msg = "Nu s-a putut obține locația.";
        if (err.code === 1) msg = "Accesul la locație a fost refuzat.";
        if (err.code === 2) msg = "Locația nu este disponibilă.";
        if (err.code === 3) msg = "Timp expirat pentru localizare.";
        toast({ title: "Eroare locație", description: msg, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange]);

  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      onChange(e.lngLat.lat, e.lngLat.lng);
    },
    [onChange]
  );

  const center = latitude && longitude
    ? { lat: latitude, lng: longitude }
    : DEFAULT_MAP_CENTER;

  return (
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
          {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
          Locația mea
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          disabled
        >
          <MapPin className="h-4 w-4" />
          Alege pe hartă ↓
        </Button>
      </div>

      <div className="h-48 overflow-hidden rounded-lg border border-border">
        <Map
          initialViewState={{
            latitude: center.lat,
            longitude: center.lng,
            zoom: latitude ? 16 : DEFAULT_MAP_ZOOM,
          }}
          {...(latitude && longitude ? {
            latitude: center.lat,
            longitude: center.lng,
            zoom: 16,
          } : {})}
          style={{ width: "100%", height: "100%" }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          onClick={handleMapClick}
          attributionControl={false}
        >
          <NavigationControl position="top-right" showCompass={false} />
          {latitude && longitude && (
            <Marker
              latitude={latitude}
              longitude={longitude}
              anchor="bottom"
              draggable
              onDragEnd={(e) => {
                onChange(e.lngLat.lat, e.lngLat.lng);
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {latitude && longitude ? (
        <p className="text-xs text-muted-foreground">
          📍 {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      ) : (
        <p className="text-xs text-destructive">
          ⚠ Apasă pe hartă sau folosește „Locația mea" pentru a seta locația.
        </p>
      )}
    </div>
  );
}
