import { colors, gradients } from "@/lib/design-system";

/** Shared dashboard shell styles (green-accent fleet UI). */
export const dashboardTheme = {
  page: "min-h-screen bg-gray-100",
  shell: "flex min-h-screen",
  sidebar:
    "sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white px-5 py-6 lg:flex",
  main: "flex min-w-0 flex-1 flex-col",
  mainInner: "flex flex-1 flex-col gap-5 overflow-x-hidden p-4 sm:gap-6 sm:p-6 lg:p-8",
  card: "rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
  cardInset: "rounded-xl border border-gray-100 bg-gray-50",
  navItem:
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900",
  navItemActive:
    "flex w-full items-center gap-3 rounded-xl bg-brand-soft px-3 py-2.5 text-base font-semibold text-brand",
  accent: colors.primary,
  accentSoft: colors.primarySoft,
  accentGradient: gradients.primary,
} as const;
