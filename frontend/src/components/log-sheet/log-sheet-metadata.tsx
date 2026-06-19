import {
  Building2,
  FileText,
  MapPin,
  Package,
  Truck,
} from "lucide-react";

import { LOG_DEFAULTS } from "@/lib/log-defaults";
import { logSheetLabels, typography } from "@/lib/typography";

import type { LogSheetSectionProps } from "./types";

export function LogSheetMetadata({ sheet }: LogSheetSectionProps) {
  const items = [
    {
      icon: Building2,
      label: logSheetLabels.carrier,
      value: sheet.carrier_name ?? LOG_DEFAULTS.carrierName,
    },
    {
      icon: Building2,
      label: logSheetLabels.mainOffice,
      value: sheet.main_office_address ?? LOG_DEFAULTS.mainOfficeAddress,
    },
    {
      icon: MapPin,
      label: logSheetLabels.homeTerminal,
      value: sheet.home_terminal ?? sheet.from_location,
    },
    {
      icon: Truck,
      label: logSheetLabels.truckTrailer,
      value: `${sheet.truck_number} · ${sheet.trailer_number}`,
    },
    {
      icon: FileText,
      label: logSheetLabels.bolManifest,
      value: sheet.shipping_document ?? "—",
    },
    { icon: Package, label: logSheetLabels.shipper, value: sheet.shipper },
    { icon: Package, label: logSheetLabels.commodity, value: sheet.commodity },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5"
        >
          <div className={`mb-1 flex items-center gap-1.5 ${typography.metaLabel}`}>
            <Icon className="size-3.5" />
            {label}
          </div>
          <p className={`${typography.bodySmall} font-medium text-slate-900`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
