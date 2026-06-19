import type { RouteStop } from "@/lib/types";
import { cn } from "@/lib/utils";

import { StopItem } from "./stop-item";

interface StopItemsListProps {
  stops: RouteStop[];
  nested?: boolean;
}

export function StopItemsList({ stops, nested = false }: StopItemsListProps) {
  return (
    <ul className={cn("space-y-2", nested ? "px-3 pb-3 sm:px-4" : "p-3 sm:p-4")}>
      {stops.map((stop, index) => (
        <StopItem key={`${stop.type}-${stop.time}-${index}`} stop={stop} />
      ))}
    </ul>
  );
}
