import Image from "next/image";

import { cn } from "@/lib/utils";

/** Intrinsic dimensions of public/eld-trip-planner-logo.png (3:2). */
const LOGO_WIDTH = 1536;
const LOGO_HEIGHT = 1024;

interface AppLogoProps {
  size?: number;
  showWordmark?: boolean;
  stacked?: boolean;
  className?: string;
}

export function AppLogo({
  size = 40,
  showWordmark = false,
  stacked = false,
  className,
}: AppLogoProps) {
  const logo = (
    <Image
      src="/eld-trip-planner-logo.png"
      alt="ELD Trip Planner"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className="shrink-0 rounded-xl"
      style={{ height: size, width: "auto" }}
      priority
    />
  );

  const wordmark = showWordmark ? (
    <div className={cn("min-w-0", stacked && "text-center")}>
      <p
        className={cn(
          "truncate font-semibold text-gray-900",
          stacked ? "text-lg" : "text-base",
        )}
      >
        ELD Trip Planner
      </p>
      <p className="truncate text-sm text-gray-500">Spotter AI</p>
    </div>
  ) : null;

  if (stacked && showWordmark) {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        {logo}
        {wordmark}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {logo}
      {wordmark}
    </div>
  );
}
