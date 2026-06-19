import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Shared max-height for scrollable tab panels (stops, instructions). */
export const SCROLL_PANEL_MAX_HEIGHT_CLASS = "max-h-96 sm:max-h-[28rem]";

interface ScrollablePanelProps {
  children: ReactNode;
  className?: string;
  maxHeightClass?: string;
}

/** Fixed-max-height scroll region for long tab content. */
export function ScrollablePanel({
  children,
  className,
  maxHeightClass = SCROLL_PANEL_MAX_HEIGHT_CLASS,
}: ScrollablePanelProps) {
  return (
    <div
      className={cn(
        "overflow-y-auto overscroll-y-contain rounded-lg border border-slate-200 bg-white",
        maxHeightClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
