"use client";

import { ClipboardList, ListOrdered, MapPin } from "lucide-react";

import { LogSheetTabs } from "@/components/log-sheet";
import { InstructionsList } from "@/components/route-instructions";
import { StopsList } from "@/components/route-stops";
import {
  RESULTS_TAB_TRIGGER_CLASS,
  RESULTS_TABS_CONTENT_CLASS,
  RESULTS_TABS_LIST_CLASS,
  RESULTS_TABS_ROOT_CLASS,
} from "@/components/shared/tab-styles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dashboardTheme } from "@/lib/dashboard-theme";
import type { TripPlanResponse } from "@/lib/types";
import { typography } from "@/lib/typography";

interface TripResultsTabsProps {
  plan: TripPlanResponse;
}

export function TripResultsTabs({ plan }: TripResultsTabsProps) {
  const logCount = plan.log_sheets.length;

  return (
    <Card className={dashboardTheme.card}>
      <CardHeader className="pb-3">
        <CardTitle className={typography.cardTitle}>Trip details</CardTitle>
        <CardDescription className={typography.cardDescription}>
          Step-by-step instructions, stops timeline, and filled daily ELD logs.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <Tabs defaultValue="instructions" className={RESULTS_TABS_ROOT_CLASS}>
          <TabsList className={RESULTS_TABS_LIST_CLASS}>
            <TabsTrigger
              value="instructions"
              className={RESULTS_TAB_TRIGGER_CLASS}
            >
              <ListOrdered className="size-4 opacity-60" />
              Instructions
              <span className={`${typography.metaLabel} text-gray-400`}>
                ({plan.instructions.length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="stops" className={RESULTS_TAB_TRIGGER_CLASS}>
              <MapPin className="size-4 opacity-60" />
              Stops &amp; rests
              <span className={`${typography.metaLabel} text-gray-400`}>({plan.stops.length})</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className={RESULTS_TAB_TRIGGER_CLASS}>
              <ClipboardList className="size-4 opacity-60" />
              Daily logs
              <span className={`${typography.metaLabel} text-gray-400`}>({logCount})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instructions" className={RESULTS_TABS_CONTENT_CLASS}>
            <InstructionsList instructions={plan.instructions} />
          </TabsContent>

          <TabsContent value="stops" className={RESULTS_TABS_CONTENT_CLASS}>
            <StopsList key={plan.id} stops={plan.stops} />
          </TabsContent>

          <TabsContent value="logs" className={`${RESULTS_TABS_CONTENT_CLASS} space-y-3`}>
            <p className={typography.cardDescription}>
              Duty timeline with connector dots, totals, remarks, and 70-hour / 8-day
              recap.
              {logCount > 1
                ? ` ${logCount} sheets generated for this trip.`
                : null}
            </p>
            <LogSheetTabs sheets={plan.log_sheets} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
