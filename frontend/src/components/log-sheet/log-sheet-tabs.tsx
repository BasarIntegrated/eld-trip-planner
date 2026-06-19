"use client";

import { ClipboardList } from "lucide-react";

import {
  RESULTS_TAB_TRIGGER_CLASS,
  RESULTS_TABS_CONTENT_CLASS,
  RESULTS_TABS_LIST_CLASS,
  RESULTS_TABS_ROOT_CLASS,
} from "@/components/shared/tab-styles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatShortLogDate } from "@/lib/log-format";
import type { LogSheet } from "@/lib/types";

import { LogSheetView } from "./log-sheet-view";

interface LogSheetTabsProps {
  sheets: LogSheet[];
}

const TAB_TRIGGER_CLASS = RESULTS_TAB_TRIGGER_CLASS;

export function LogSheetTabs({ sheets }: LogSheetTabsProps) {
  if (!sheets.length) {
    return null;
  }

  return (
    <Tabs defaultValue={sheets[0].date} className={RESULTS_TABS_ROOT_CLASS}>
      <TabsList className={RESULTS_TABS_LIST_CLASS}>
        {sheets.map((sheet, index) => (
          <TabsTrigger
            key={sheet.date}
            value={sheet.date}
            className={TAB_TRIGGER_CLASS}
          >
            <ClipboardList className="size-4 opacity-60" />
            <span className="font-medium">Day {index + 1}</span>
            <span className="text-sm text-slate-500">
              {formatShortLogDate(sheet.date)}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {sheets.map((sheet) => (
        <TabsContent key={sheet.date} value={sheet.date} className={RESULTS_TABS_CONTENT_CLASS}>
          <LogSheetView sheet={sheet} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
