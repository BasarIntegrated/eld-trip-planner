"use client";

import { Loader2, LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";

interface UseMyLocationButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLocating?: boolean;
}

export function UseMyLocationButton({
  onClick,
  disabled,
  isLocating,
}: UseMyLocationButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-9 shrink-0 px-2 font-medium text-brand hover:bg-brand-soft hover:text-brand"
      onClick={onClick}
      disabled={disabled || isLocating}
      aria-busy={isLocating}
    >
      {isLocating ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Locating…
        </>
      ) : (
        <>
          <LocateFixed className="size-3.5" />
          Use my location
        </>
      )}
    </Button>
  );
}
