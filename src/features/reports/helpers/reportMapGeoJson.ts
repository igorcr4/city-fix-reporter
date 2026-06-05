import type { Feature, FeatureCollection, Point } from "geojson";
import type { Report, ReportCategory, ReportStatus } from "@/shared/types";

export interface ReportMapPointProperties {
  reportId: number;
  category: ReportCategory;
  status: ReportStatus;
  weight: number;
}

export type ReportMapPointFeature = Feature<Point, ReportMapPointProperties>;
export type ReportMapPointFeatureCollection = FeatureCollection<
  Point,
  ReportMapPointProperties
>;

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

export function createReportMapPointData(
  reports: Report[]
): ReportMapPointFeatureCollection {
  const features = reports.flatMap<ReportMapPointFeature>((report) => {
    if (!isValidCoordinate(report.latitude, report.longitude)) {
      return [];
    }

    return [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [report.longitude, report.latitude],
        },
        properties: {
          reportId: report.id,
          category: report.category,
          status: report.status,
          weight: 1,
        },
      },
    ];
  });

  return {
    type: "FeatureCollection",
    features,
  };
}
