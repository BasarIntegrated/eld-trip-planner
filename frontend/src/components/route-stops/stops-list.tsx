"use client";

import { ScrollablePanel } from "@/components/shared/scrollable-panel";
import { formatStopsSummary } from "@/lib/stops-grouping";
import type { RouteStop } from "@/lib/types";
import { typography } from "@/lib/typography";

import { useExpandedDays } from "./hooks/use-expanded-days";
import { StopDaySection } from "./stop-day-section";
import { StopItemsList } from "./stop-items-list";

interface StopsListProps {
  stops: RouteStop[];
}

export function StopsList({ stops }: StopsListProps) {
  const { dayGroups, expandedDays, toggleDay, useDaySections } = useExpandedDays(stops);

  if (!stops.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className={typography.helperText}>
        {formatStopsSummary(stops.length, dayGroups.length)}
      </p>

      <ScrollablePanel>
        {useDaySections ? (
          dayGroups.map((group) => (
            <StopDaySection
              key={group.dateKey}
              group={group}
              expanded={expandedDays.has(group.dateKey)}
              onToggle={() => toggleDay(group.dateKey)}
            />
          ))
        ) : (
          <StopItemsList stops={stops} />
        )}
      </ScrollablePanel>
    </div>
  );
}
