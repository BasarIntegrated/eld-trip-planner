"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

import { Badge } from "@/components/ui/badge";
import { formatStopDateTime } from "@/lib/datetime";
import {
  MAP_CONTAINER_CLASS,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_POLYLINE_COLOR,
} from "@/lib/map-constants";
import type { TripPlanResponse } from "@/lib/types";

import { FitRouteBounds } from "./fit-route-bounds";
import { createStopMarkerIcon, stopMarkerColor } from "./stop-marker-icon";

interface RouteMapInnerProps {
  plan: TripPlanResponse;
}

export function RouteMapInner({ plan }: RouteMapInnerProps) {
  const positions = plan.route.polyline.map(
    ([lat, lng]) => [lat, lng] as [number, number],
  );
  const center =
    positions[Math.floor(positions.length / 2)] ?? MAP_DEFAULT_CENTER;

  return (
    <div
      role="region"
      aria-label={`Route map from ${plan.summary.current_location} to ${plan.summary.dropoff_location}`}
    >
      <MapContainer
      center={center}
      zoom={MAP_DEFAULT_ZOOM}
      scrollWheelZoom
      touchZoom
      dragging
      className={`${MAP_CONTAINER_CLASS} rounded-2xl`}
    >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRouteBounds positions={positions} planId={plan.id} />
        <Polyline
          positions={positions}
          pathOptions={{ color: MAP_POLYLINE_COLOR, weight: 4 }}
        />
        {plan.stops.map((stop) => (
          <Marker
            key={`${stop.type}-${stop.lat}-${stop.lng}-${stop.time}`}
            position={[stop.lat, stop.lng]}
            icon={createStopMarkerIcon(stopMarkerColor(stop.type))}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <Badge variant="secondary">{stop.label}</Badge>
                <p className="font-medium">{stop.location}</p>
                <p className="text-slate-600">{formatStopDateTime(stop.time)}</p>
                {stop.duration_minutes ? (
                  <p className="text-slate-600">{stop.duration_minutes} min</p>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
    </div>
  );
}
