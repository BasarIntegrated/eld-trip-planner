"use client";

import Link from "next/link";

import { AppLogo } from "@/components/shared/app-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { typography } from "@/lib/typography";

interface TripLoadErrorProps {
  title: string;
  description: string;
}

export function TripLoadError({ title, description }: TripLoadErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4">
      <AppLogo className="mb-8" />
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className={typography.cardTitle}>{title}</h1>
        <p className={`mt-2 ${typography.bodySmall} text-gray-600`}>{description}</p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "default" }), "mt-6 inline-flex")}
        >
          Plan a new trip
        </Link>
      </div>
    </div>
  );
}

export function TripLoadSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4">
      <AppLogo className="mb-6" />
      <p className={typography.bodySmall} role="status">
        Loading trip…
      </p>
    </div>
  );
}
