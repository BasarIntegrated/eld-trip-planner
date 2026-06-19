import { Pencil } from "lucide-react";

import { AppLogo } from "@/components/shared/app-logo";
import { Button } from "@/components/ui/button";
import { typography } from "@/lib/typography";

interface DashboardHeaderProps {
  onEditTrip: () => void;
}

/** Mobile-only app branding; desktop uses the sidebar. */
export function DashboardHeader({ onEditTrip }: DashboardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 lg:hidden">
      <div>
        <AppLogo size={48} className="mb-2" />
        <p className={`${typography.overline} text-brand`}>Spotter AI Assessment</p>
        <h1 className={`mt-1 ${typography.cardTitle} text-gray-900`}>
          ELD Trip Planner
        </h1>
      </div>

      <Button
        type="button"
        variant="outline"
        className="shrink-0 rounded-xl border-gray-200"
        onClick={onEditTrip}
      >
        <Pencil className="size-4" />
        Edit trip
      </Button>
    </header>
  );
}
