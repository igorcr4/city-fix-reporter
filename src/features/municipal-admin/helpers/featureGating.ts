/**
 * Feature-gating pentru panoul de municipal admin — DOAR pentru afișare (UX).
 * Lista de feature-uri active vine de la GET /api/subscriptions/features.
 * Array gol = fără abonament activ.
 */
export interface MunicipalFeatureAccess {
  /** Există un abonament activ (lista de feature-uri nu e goală). */
  hasActiveSubscription: boolean;
  /** Toggle-ul „Zone critice" din filtre → TOP_CRITICAL_ZONES. */
  canSeeCriticalZones: boolean;
  /** Selectorul de interval de date din filtre → PERIOD_FILTER. */
  canUsePeriodFilter: boolean;
  /** Butonul de export CSV din filtre → CSV_EXPORT. */
  canExportCsv: boolean;
}

export function deriveFeatureAccess(features: string[]): MunicipalFeatureAccess {
  const active = new Set(features);

  return {
    hasActiveSubscription: features.length > 0,
    canSeeCriticalZones: active.has("TOP_CRITICAL_ZONES"),
    canUsePeriodFilter: active.has("PERIOD_FILTER"),
    canExportCsv: active.has("CSV_EXPORT"),
  };
}

/**
 * Secțiunile panoului. „Rapoarte" e mereu vizibilă; restul apar doar dacă
 * feature-ul lor e activ. Structură extensibilă — adaugă aici secțiuni noi.
 */
export type MunicipalSectionId =
  | "reports"
  | "period-statistics"
  | "top-categories"
  | "critical-zones"
  | "confirmation-statistics"
  | "average-resolution-time"
  | "performance";

export interface MunicipalSectionMeta {
  id: MunicipalSectionId;
  label: string;
  /** FeatureType necesar; `null` = mereu vizibilă. */
  feature: string | null;
}

const MUNICIPAL_SECTIONS: MunicipalSectionMeta[] = [
  { id: "reports", label: "Rapoarte", feature: null },
  {
    id: "period-statistics",
    label: "Statistici pe perioade",
    feature: "PERIOD_STATISTICS",
  },
  {
    id: "top-categories",
    label: "Top categorii",
    feature: "TOP_PROBLEM_CATEGORIES",
  },
  { id: "critical-zones", label: "Zone critice", feature: "TOP_CRITICAL_ZONES" },
  {
    id: "confirmation-statistics",
    label: "Confirmări cetățeni",
    feature: "CITIZEN_CONFIRMATION_STATISTICS",
  },
  {
    id: "average-resolution-time",
    label: "Timp mediu de rezolvare",
    feature: "AVERAGE_RESOLUTION_TIME",
  },
  {
    id: "performance",
    label: "Performanță",
    feature: "ADVANCED_STATISTICS",
  },
];

export function getAvailableSections(features: string[]): MunicipalSectionMeta[] {
  const active = new Set(features);

  return MUNICIPAL_SECTIONS.filter(
    (section) => section.feature === null || active.has(section.feature)
  );
}
