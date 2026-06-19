"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 px-4 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="max-w-md text-gray-500">
        The trip planner hit an unexpected error. You can try again or reload the page.
      </p>
      <div className="flex gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    </div>
  );
}
