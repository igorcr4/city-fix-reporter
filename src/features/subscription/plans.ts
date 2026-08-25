import type { SubscriptionPlan } from "@/features/subscription/types";

export interface PlanDefinition {
  plan: SubscriptionPlan;
  name: string;
  priceLabel: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const URBAN_FEATURES = [
  "Filtrare după perioadă",
  "Istoric statusuri",
  "Comparație înainte/după rezolvare",
  "Statistici pe perioade",
  "Top categorii de probleme",
  "Top zone critice",
  "Export CSV",
  "Conturi administrative extinse",
];

const CITY_PRO_EXTRA_FEATURES = [
  "Statistici despre confirmările cetățenilor",
  "Prioritizare automată",
  "Scor de prioritate",
  "Timp mediu de rezolvare",
  "Statistici avansate",
];

export const PLANS: PlanDefinition[] = [
  {
    plan: "URBAN",
    name: "Urban",
    priceLabel: "€299/lună",
    description: "Toate instrumentele esențiale pentru gestionarea raportărilor.",
    features: URBAN_FEATURES,
  },
  {
    plan: "CITY_PRO",
    name: "City Pro",
    priceLabel: "€499/lună",
    description: "Tot ce include Urban, plus:",
    features: CITY_PRO_EXTRA_FEATURES,
    highlighted: true,
  },
];
