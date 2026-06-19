import L from "leaflet";

import { STOP_COLORS } from "@/lib/log-grid";
import { MAP_MARKER_FALLBACK_COLOR } from "@/lib/map-constants";

export function stopMarkerColor(type: string): string {
  return STOP_COLORS[type] ?? MAP_MARKER_FALLBACK_COLOR;
}

export function createStopMarkerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35);background:${color}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}
