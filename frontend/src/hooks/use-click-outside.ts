"use client";

import { type RefObject, useEffect } from "react";

/**
 * Calls `handler` when a pointer event occurs outside `ref`.
 * Pass `enabled: false` to skip listener registration.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        handler();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ref, handler, enabled]);
}
