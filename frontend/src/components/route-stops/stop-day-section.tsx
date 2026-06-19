"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";

import type { StopDayGroup } from "@/lib/stops-grouping";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { StopItemsList } from "./stop-items-list";

interface StopDaySectionProps {
  group: StopDayGroup;
  expanded: boolean;
  onToggle: () => void;
}

export function StopDaySection({ group, expanded, onToggle }: StopDaySectionProps) {
  const panelId = useId();

  return (
    <section className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        id={`${panelId}-trigger`}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full min-h-11 items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 sm:px-4"
      >
        <div>
          <p className={`${typography.sectionTitle} text-sm`}>{group.heading}</p>
          <p className={typography.helperText}>
            {group.stops.length} stop{group.stops.length === 1 ? "" : "s"}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {expanded ? (
        <div id={panelId} role="region" aria-labelledby={`${panelId}-trigger`}>
          <StopItemsList stops={group.stops} nested />
        </div>
      ) : null}
    </section>
  );
}
