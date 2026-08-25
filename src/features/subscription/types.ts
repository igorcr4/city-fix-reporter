export type SubscriptionPlan = "URBAN" | "CITY_PRO";

export type SubscriptionStatus =
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING"
  | "UNPAID";

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutPayload {
  municipalityId: number;
  plan: SubscriptionPlan;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface AccessRequestPayload {
  institutionName: string;
  employeePosition: string;
  justification: string;
}

/** Statusuri considerate „abonament activ" pentru afișarea butonului „Plan activ". */
const ACTIVE_STATUSES: SubscriptionStatus[] = ["ACTIVE", "PAST_DUE"];

export function isSubscriptionActive(
  subscription: Subscription | null | undefined
): boolean {
  return !!subscription && ACTIVE_STATUSES.includes(subscription.status);
}
