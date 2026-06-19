"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { dashboardTheme } from "@/lib/dashboard-theme";
import { MAP_HEIGHT_CLASS } from "@/lib/map-constants";
import type { TripPlanResponse } from "@/lib/types";
import { typography } from "@/lib/typography";

const RouteMapInner = dynamic(
  () => import("./route-map-inner").then((mod) => mod.RouteMapInner),
  {
    ssr: false,
    loading: () => (
      <Skeleton className={`${MAP_HEIGHT_CLASS} w-full rounded-2xl`} />
    ),
  },
);

interface RouteMapProps {
  plan: TripPlanResponse | null;
  overlay?: ReactNode;
}

export function RouteMap({ plan, overlay }: RouteMapProps) {
  if (!plan) {
    return (
      <div
        className={`flex ${MAP_HEIGHT_CLASS} items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 ${dashboardTheme.card}`}
      >
        Submit a trip to preview the route map.
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${dashboardTheme.card}`}>
      {overlay}
      <RouteMapInner key={plan.id} plan={plan} />
      <p className={`border-t border-gray-100 px-4 py-2.5 ${typography.helperText}`}>
        Routes connect city centers (OSRM via OpenStreetMap). Stops and drive times use
        the planned corridor between each leg.
      </p>
    </div>
  );
}
