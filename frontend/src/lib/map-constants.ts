export const MAP_HEIGHT_CLASS = "h-[min(52vw,280px)] sm:h-[360px] lg:h-[420px]";

export const MAP_CONTAINER_CLASS = `${MAP_HEIGHT_CLASS} z-0 w-full touch-pan-x touch-pan-y`;

export const MAP_DEFAULT_CENTER: [number, number] = [39.8, -98.5];

export const MAP_DEFAULT_ZOOM = 6;

import { colors } from "@/lib/design-system";

export const MAP_POLYLINE_COLOR = colors.primary;

export const MAP_BOUNDS_PADDING: [number, number] = [40, 40];

export const MAP_BOUNDS_MAX_ZOOM = 10;

export const MAP_MARKER_FALLBACK_COLOR = "#334155";
