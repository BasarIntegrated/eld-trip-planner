"use client";

import { CircleHelp } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

import { useClickOutside } from "@/hooks/use-click-outside";

export function LocationFormatHelp() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close, open);

  return (
    <div
      ref={rootRef}
      className="group relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        aria-label="How to enter locations"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <CircleHelp className="size-4" />
      </button>
      <div
        id={panelId}
        role="tooltip"
        className={`absolute left-1/2 top-full z-20 mt-1.5 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-600 shadow-lg transition-opacity ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <p className="mb-1 font-medium text-slate-900">How to enter locations</p>
        <p>
          Use a real US city and state (<span className="font-medium">City, ST</span>).
          Verified on submit — invalid entries show an error on the field.
        </p>
        <p className="mt-2 text-slate-500">
          e.g. Green Bay, WI · Fond du Lac, WI · New York, NY
        </p>
      </div>
    </div>
  );
}
