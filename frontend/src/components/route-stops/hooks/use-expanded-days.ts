"use client";

import { useCallback, useMemo, useState } from "react";

import { groupStopsByDay, type StopDayGroup } from "@/lib/stops-grouping";
import type { RouteStop } from "@/lib/types";

import { AUTO_COLLAPSE_THRESHOLD } from "../constants";

function defaultExpandedDays(groups: StopDayGroup[], stopCount: number): Set<string> {
  if (groups.length <= 1 || stopCount <= AUTO_COLLAPSE_THRESHOLD) {
    return new Set(groups.map((group) => group.dateKey));
  }

  return new Set([groups[groups.length - 1].dateKey]);
}

export function useExpandedDays(stops: RouteStop[]) {
  const dayGroups = useMemo(() => groupStopsByDay(stops), [stops]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() =>
    defaultExpandedDays(dayGroups, stops.length),
  );

  const toggleDay = useCallback((dateKey: string) => {
    setExpandedDays((current) => {
      const next = new Set(current);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  }, []);

  return {
    dayGroups,
    expandedDays,
    toggleDay,
    useDaySections: dayGroups.length > 1,
  };
}
