"use client";

import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

import {
  MAP_BOUNDS_MAX_ZOOM,
  MAP_BOUNDS_PADDING,
} from "@/lib/map-constants";

interface FitRouteBoundsProps {
  positions: [number, number][];
  planId: string;
}

export function FitRouteBounds({ positions, planId }: FitRouteBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) return;

    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, {
      padding: MAP_BOUNDS_PADDING,
      maxZoom: MAP_BOUNDS_MAX_ZOOM,
    });
  }, [map, planId, positions]);

  return null;
}
