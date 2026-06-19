/**
 * Typography scale (Tailwind defaults):
 * - Page title:     30–36px (text-3xl / sm:text-4xl)
 * - Card title:     20–24px (text-xl / sm:text-2xl)
 * - Body / labels:  16px     (text-base)
 * - Secondary/meta: 14px     (text-sm — avoid text-xs / 12px)
 */
export const typography = {
  pageTitle:
    "font-sans text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl",
  pageDescription: "font-sans text-base leading-relaxed text-gray-500 sm:text-lg",
  cardTitle:
    "font-sans text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl",
  cardDescription: "font-sans text-base leading-relaxed text-gray-500",
  sectionTitle: "font-sans text-base font-semibold text-gray-900",
  fieldLabel: "font-sans text-base font-medium text-gray-700",
  metaLabel: "font-sans text-sm font-medium text-gray-500",
  statLabel: "font-sans text-sm font-medium text-gray-500",
  statValue: "font-sans text-xl font-semibold tabular-nums text-gray-900 sm:text-2xl",
  helperText: "font-sans text-xs leading-relaxed text-gray-500",
  errorText: "font-sans text-base text-destructive",
  overline:
    "font-sans text-sm font-semibold uppercase tracking-wider text-gray-500",
  tabularValue: "font-sans tabular-nums",
  bodySmall: "font-sans text-base text-gray-700",
} as const;

/** Standard trip form field labels (sentence case). */
export const tripFormLabels = {
  current_location: "Current location",
  pickup_location: "Pickup location",
  dropoff_location: "Dropoff location",
  current_cycle_used: "Cycle hours used",
  submit: "Plan route and logs",
  submitLoading: "Planning route and logs…",
} as const;

/** Standard log sheet metadata labels (sentence case). */
export const logSheetLabels = {
  driverDailyLog: "Driver's daily log (24 hours)",
  carrier: "Carrier",
  mainOffice: "Main office",
  homeTerminal: "Home terminal",
  truckTrailer: "Truck & trailer",
  bolManifest: "BOL / manifest",
  shipper: "Shipper",
  commodity: "Commodity",
  dutyStatus: "24-hour duty status",
  remarks: "Remarks",
  cycleRecap: "70-hour / 8-day recap",
  cycleUsed: "Cycle used",
  onDutyToday: "On duty today (lines 3 & 4)",
  totalOnDuty: "Total on duty — 8 days incl. today",
  hoursAvailable: "Hours available",
  propertyCarrying: "Property-carrying driver",
} as const;
