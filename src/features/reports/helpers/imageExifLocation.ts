import exifr from "exifr";

export interface ExifGpsLocation {
  latitude: number;
  longitude: number;
}

function isValidCoordinate(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    // (0, 0) e aproape mereu o valoare bogus, nu o locație reală.
    !(latitude === 0 && longitude === 0)
  );
}

/**
 * Încearcă să extragă coordonatele GPS din metadatele EXIF ale unei poze.
 * Întoarce `null` pentru orice caz în care nu există GPS valid:
 * fișier non-imagine, poză fără EXIF, EXIF fără GPS, sau eroare de parsare.
 */
export async function extractImageGpsLocation(
  file: File
): Promise<ExifGpsLocation | null> {
  if (!file.type.startsWith("image/")) return null;

  try {
    const gps = await exifr.gps(file);

    if (gps && isValidCoordinate(gps.latitude, gps.longitude)) {
      return { latitude: gps.latitude, longitude: gps.longitude };
    }

    return null;
  } catch {
    // Orice eroare (format nesuportat, EXIF corupt etc.) → selecție manuală.
    return null;
  }
}
