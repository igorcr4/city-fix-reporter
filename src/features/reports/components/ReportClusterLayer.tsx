import {
  Layer,
  Source,
  type CircleLayer,
  type SymbolLayer,
} from "react-map-gl/maplibre";
import type { ReportMapPointFeatureCollection } from "@/features/reports/helpers/reportMapGeoJson";
import type { ReportCategory } from "@/shared/types";

interface ReportClusterLayerProps {
  data: ReportMapPointFeatureCollection;
  visible: boolean;
  focusedReportId?: number | null;
}

export const REPORT_CLUSTER_SOURCE_ID = "reports-cluster-source";
export const REPORT_CLUSTERS_LAYER_ID = "reports-clusters-layer";
export const REPORT_CLUSTER_COUNT_LAYER_ID = "reports-cluster-count-layer";
export const REPORT_UNCLUSTERED_LAYER_ID = "reports-unclustered-layer";
export const REPORT_FOCUSED_LAYER_ID = "reports-focused-layer";

export const REPORT_MARKER_ICON_IDS: Record<ReportCategory, string> = {
  ROAD: "report-marker-road",
  LIGHTING: "report-marker-lighting",
  WASTE: "report-marker-waste",
  VANDALISM: "report-marker-vandalism",
  OTHER: "report-marker-other",
};

export const REPORT_CLUSTER_INTERACTIVE_LAYER_IDS = [
  REPORT_CLUSTERS_LAYER_ID,
  REPORT_CLUSTER_COUNT_LAYER_ID,
  REPORT_UNCLUSTERED_LAYER_ID,
  REPORT_FOCUSED_LAYER_ID,
];

const clusteredPointFilter = ["has", "point_count"];
const unclusteredPointFilter = ["!", ["has", "point_count"]];

const clusterCircleLayer: CircleLayer = {
  id: REPORT_CLUSTERS_LAYER_ID,
  type: "circle",
  source: REPORT_CLUSTER_SOURCE_ID,
  filter: clusteredPointFilter,
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#2563eb",
      10,
      "#f59e0b",
      30,
      "#dc2626",
    ],
    "circle-radius": [
      "step",
      ["get", "point_count"],
      20,
      10,
      26,
      30,
      34,
    ],
    "circle-opacity": 0.9,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 2,
  },
};

const clusterCountLayer: SymbolLayer = {
  id: REPORT_CLUSTER_COUNT_LAYER_ID,
  type: "symbol",
  source: REPORT_CLUSTER_SOURCE_ID,
  filter: clusteredPointFilter,
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
    "text-size": 12,
    "text-allow-overlap": true,
  },
  paint: {
    "text-color": "#ffffff",
  },
};

const unclusteredReportLayer: SymbolLayer = {
  id: REPORT_UNCLUSTERED_LAYER_ID,
  type: "symbol",
  source: REPORT_CLUSTER_SOURCE_ID,
  filter: unclusteredPointFilter,
  layout: {
    "icon-image": [
      "match",
      ["get", "category"],
      "ROAD",
      REPORT_MARKER_ICON_IDS.ROAD,
      "LIGHTING",
      REPORT_MARKER_ICON_IDS.LIGHTING,
      "WASTE",
      REPORT_MARKER_ICON_IDS.WASTE,
      "VANDALISM",
      REPORT_MARKER_ICON_IDS.VANDALISM,
      "OTHER",
      REPORT_MARKER_ICON_IDS.OTHER,
      REPORT_MARKER_ICON_IDS.OTHER,
    ],
    "icon-size": 0.92,
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
  },
};

function createFocusedReportLayer(reportId: number): CircleLayer {
  return {
    id: REPORT_FOCUSED_LAYER_ID,
    type: "circle",
    source: REPORT_CLUSTER_SOURCE_ID,
    filter: [
      "all",
      unclusteredPointFilter,
      ["==", ["get", "reportId"], reportId],
    ],
    paint: {
      "circle-color": "rgba(37, 99, 235, 0)",
      "circle-radius": 19,
      "circle-stroke-color": "#2563eb",
      "circle-stroke-width": 4,
      "circle-stroke-opacity": 0.35,
    },
  };
}

export function ReportClusterLayer({
  data,
  visible,
  focusedReportId,
}: ReportClusterLayerProps) {
  if (!visible || data.features.length === 0) return null;

  return (
    <Source
      id={REPORT_CLUSTER_SOURCE_ID}
      type="geojson"
      data={data}
      cluster
      clusterMaxZoom={14}
      clusterRadius={48}
    >
      <Layer {...clusterCircleLayer} />
      <Layer {...clusterCountLayer} />
      {focusedReportId != null && (
        <Layer {...createFocusedReportLayer(focusedReportId)} />
      )}
      <Layer {...unclusteredReportLayer} />
    </Source>
  );
}
