"use client";

import { Check, Link2 } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildTripShareUrl } from "@/lib/trip-url";

interface CopyTripLinkButtonProps {
  tripId: string;
}

export function CopyTripLinkButton({ tripId }: CopyTripLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const url = buildTripShareUrl(tripId);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this trip link:", url);
    }
  }, [tripId]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      aria-label={copied ? "Trip Link Copied" : "Share"}
    >
      {copied ? (
        <>
          <Check aria-hidden="true" />
          Trip Link Copied
        </>
      ) : (
        <>
          <Link2 aria-hidden="true" />
          Share
        </>
      )}
    </Button>
  );
}
