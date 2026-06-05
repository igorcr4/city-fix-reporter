import { Layer, Source, type HeatmapLayer } from "react-map-gl/maplibre";
import type { ReportMapPointFeatureCollection } from "@/features/reports/helpers/reportMapGeoJson";

interface ReportHeatmapLayerProps {
  data: ReportMapPointFeatureCollection;
  visible: boolean;
}

const HEATMAP_SOURCE_ID = "reports-heatmap-source";
const HEATMAP_LAYER_ID = "reports-heatmap-layer";

const heatmapLayer: HeatmapLayer = {
  id: HEATMAP_LAYER_ID,
  type: "heatmap",
  source: HEATMAP_SOURCE_ID,
  maxzoom: 18,
  paint: {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 0.6, 15, 1.8],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 18, 15, 42],
    "heatmap-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      9,
      0.72,
      17,
      0.38,
    ],
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(33, 102, 172, 0)",
      0.2,
      "rgb(103, 169, 207)",
      0.4,
      "rgb(209, 229, 240)",
      0.6,
      "rgb(253, 219, 199)",
      0.8,
      "rgb(239, 138, 98)",
      1,
      "rgb(178, 24, 43)",
    ],
  },
};

export function ReportHeatmapLayer({ data, visible }: ReportHeatmapLayerProps) {
  if (!visible || data.features.length === 0) return null;

  return (
    <Source id={HEATMAP_SOURCE_ID} type="geojson" data={data}>
      <Layer {...heatmapLayer} />
    </Source>
  );
}
