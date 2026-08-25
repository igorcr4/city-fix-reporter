import type { Report, ReportCategory } from "@/shared/types";

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

const METERS_PER_LAT_DEGREE = 111_320;

function getCandidateCellKeys(
  report: Report,
  cellSizeDegrees: number,
  radiusMeters: number
): string[] {
  const latCell = getCoordinateCell(report.latitude, cellSizeDegrees);
  const lngCell = getCoordinateCell(report.longitude, cellSizeDegrees);

  // Câte celule trebuie parcurse pe fiecare axă ca să acoperim `radiusMeters`.
  // Pe longitudine un grad înseamnă mai puțini metri (factorul cos(lat)), deci
  // raza acoperă mai multe celule — altfel ratăm rapoarte vecine est-vest.
  const metersPerLngDegree =
    METERS_PER_LAT_DEGREE * Math.cos(toRadians(report.latitude));
  const latSpan = Math.max(
    1,
    Math.ceil(radiusMeters / METERS_PER_LAT_DEGREE / cellSizeDegrees)
  );
  const lngSpan =
    metersPerLngDegree > 0
      ? Math.max(1, Math.ceil(radiusMeters / metersPerLngDegree / cellSizeDegrees))
      : latSpan;

  const keys: string[] = [];

  for (let latOffset = -latSpan; latOffset <= latSpan; latOffset += 1) {
    for (let lngOffset = -lngSpan; lngOffset <= lngSpan; lngOffset += 1) {
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
  // Zonele critice reflectă problemele active; rapoartele rezolvate nu contează.
  const reportsWithCoordinates = reports.filter(
    (report) =>
      report.status !== "RESOLVED" &&
      isValidCoordinate(report.latitude, report.longitude)
  );

  if (reportsWithCoordinates.length < minimumReports) {
    return new Set();
  }

  const cellSizeDegrees = radiusMeters / METERS_PER_LAT_DEGREE;
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

    for (const key of getCandidateCellKeys(report, cellSizeDegrees, radiusMeters)) {
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

export interface CriticalReportZone {
  id: string;
  reports: Report[];
  reportCount: number;
  centerLatitude: number;
  centerLongitude: number;
  topCategory: ReportCategory;
  address?: string;
}

function buildZone(members: Report[]): CriticalReportZone {
  const reportCount = members.length;
  const centerLatitude =
    members.reduce((sum, report) => sum + report.latitude, 0) / reportCount;
  const centerLongitude =
    members.reduce((sum, report) => sum + report.longitude, 0) / reportCount;

  const categoryCounts = new Map<ReportCategory, number>();
  for (const member of members) {
    categoryCounts.set(
      member.category,
      (categoryCounts.get(member.category) ?? 0) + 1
    );
  }

  let topCategory = members[0].category;
  let topCount = 0;
  for (const [category, count] of categoryCounts) {
    if (count > topCount) {
      topCount = count;
      topCategory = category;
    }
  }

  const representativeId = members
    .map((member) => member.id)
    .reduce((min, id) => (id < min ? id : min), members[0].id);

  return {
    id: `zone-${representativeId}`,
    reports: members,
    reportCount,
    centerLatitude,
    centerLongitude,
    topCategory,
    address: members.find((member) => member.address)?.address,
  };
}

/**
 * Grupează rapoartele critice în zone (clustere de rapoarte apropiate),
 * ordonate descrescător după numărul de rapoarte. Reutilizează detecția
 * existentă `getCriticalReportIds` și aceeași logică de distanță.
 */
export function getCriticalReportZones(
  reports: Report[],
  radiusMeters = CRITICAL_REPORT_ZONE_CONFIG.radiusMeters,
  minimumReports = CRITICAL_REPORT_ZONE_CONFIG.minimumReports
): CriticalReportZone[] {
  const criticalReportIds = getCriticalReportIds(
    reports,
    radiusMeters,
    minimumReports
  );

  const criticalReports = reports.filter(
    (report) =>
      criticalReportIds.has(report.id) &&
      isValidCoordinate(report.latitude, report.longitude)
  );

  const visited = new Set<number>();
  const zones: CriticalReportZone[] = [];

  for (const start of criticalReports) {
    if (visited.has(start.id)) continue;

    const members: Report[] = [];
    const stack = [start];
    visited.add(start.id);

    while (stack.length > 0) {
      const current = stack.pop() as Report;
      members.push(current);

      for (const candidate of criticalReports) {
        if (visited.has(candidate.id)) continue;
        if (getDistanceMeters(current, candidate) <= radiusMeters) {
          visited.add(candidate.id);
          stack.push(candidate);
        }
      }
    }

    zones.push(buildZone(members));
  }

  return zones.sort((left, right) => right.reportCount - left.reportCount);
}
