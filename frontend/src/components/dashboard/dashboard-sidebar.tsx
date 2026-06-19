"use client";

import { Pencil } from "lucide-react";

import { AppLogo } from "@/components/shared/app-logo";
import { TripInputDetails } from "@/components/trip-planner/trip-input-details";
import { Button } from "@/components/ui/button";
import { dashboardTheme } from "@/lib/dashboard-theme";
import type { TripPlanResponse } from "@/lib/types";

interface DashboardSidebarProps {
  plan: TripPlanResponse;
  onEditTrip: () => void;
}

export function DashboardSidebar({ plan, onEditTrip }: DashboardSidebarProps) {
  return (
    <aside className={dashboardTheme.sidebar}>
      <a
        href="/"
        className="mb-6 block w-full rounded-xl px-1 text-left transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        aria-label="Back to home"
      >
        <AppLogo size={72} showWordmark stacked />
      </a>

      <div className="mb-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
        <TripInputDetails summary={plan.summary} variant="sidebar" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full shrink-0 rounded-xl border-gray-200"
        onClick={onEditTrip}
      >
        <Pencil className="size-4" />
        Edit trip
      </Button>
    </aside>
  );
}
