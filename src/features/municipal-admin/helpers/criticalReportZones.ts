import type { Report } from "@/shared/types";

const EARTH_RADIUS_METERS = 6_371_000;

export const CRITICAL_REPORT_ZONE_CONFIG = {
  radiusMeters: 250,
  minimumReports: 3,
} as const;

function isValidCoordinate(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(left: Report, right: Report): number {
  const latDelta = toRadians(right.latitude - left.latitude);
  const lngDelta = toRadians(right.longitude - left.longitude);
  const leftLat = toRadians(left.latitude);
  const rightLat = toRadians(right.latitude);

  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(leftLat) * Math.cos(rightLat) * Math.sin(lngDelta / 2) ** 2;

  return (
    2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function getCoordinateCell(value: number, cellSizeDegrees: number): number {
  return Math.floor(value / cellSizeDegrees);
}

function getSpatialCellKey(latCell: number, lngCell: number): string {
  return `${latCell}:${lngCell}`;
}

function getCandidateCellKeys(
  report: Report,
  cellSizeDegrees: number
): string[] {
  const latCell = getCoordinateCell(report.latitude, cellSizeDegrees);
  const lngCell = getCoordinateCell(report.longitude, cellSizeDegrees);
  const keys: string[] = [];

  for (let latOffset = -1; latOffset <= 1; latOffset += 1) {
    for (let lngOffset = -1; lngOffset <= 1; lngOffset += 1) {
      keys.push(getSpatialCellKey(latCell + latOffset, lngCell + lngOffset));
    }
  }

  return keys;
}

export function getCriticalReportIds(
  reports: Report[],
  radiusMeters = CRITICAL_REPORT_ZONE_CONFIG.radiusMeters,
  minimumReports = CRITICAL_REPORT_ZONE_CONFIG.minimumReports
): Set<number> {
  const reportsWithCoordinates = reports.filter((report) =>
    isValidCoordinate(report.latitude, report.longitude)
  );

  if (reportsWithCoordinates.length < minimumReports) {
    return new Set();
  }

  const cellSizeDegrees = radiusMeters / 111_320;
  const reportsByCell = new Map<string, Report[]>();

  for (const report of reportsWithCoordinates) {
    const key = getSpatialCellKey(
      getCoordinateCell(report.latitude, cellSizeDegrees),
      getCoordinateCell(report.longitude, cellSizeDegrees)
    );
    const reportsInCell = reportsByCell.get(key);

    if (reportsInCell) {
      reportsInCell.push(report);
    } else {
      reportsByCell.set(key, [report]);
    }
  }

  const criticalReportIds = new Set<number>();

  for (const report of reportsWithCoordinates) {
    let nearbyReports = 0;

    for (const key of getCandidateCellKeys(report, cellSizeDegrees)) {
      const candidates = reportsByCell.get(key);
      if (!candidates) continue;

      for (const candidate of candidates) {
        if (getDistanceMeters(report, candidate) <= radiusMeters) {
          nearbyReports += 1;
          if (nearbyReports >= minimumReports) {
            criticalReportIds.add(report.id);
            break;
          }
        }
      }

      if (criticalReportIds.has(report.id)) break;
    }
  }

  return criticalReportIds;
}
