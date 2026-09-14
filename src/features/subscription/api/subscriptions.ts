import { apiFetch } from "@/core/api/http";
import { parseErrorMessage } from "@/core/api/parsing";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import type {
  AccessRequestPayload,
  CheckoutPayload,
  CheckoutResponse,
  Subscription,
} from "@/features/subscription/types";

const SUBSCRIPTIONS_ENDPOINT = `${BASE_URL}/subscriptions`;
const CURRENT_ENDPOINT = `${SUBSCRIPTIONS_ENDPOINT}/current`;
const CHECKOUT_ENDPOINT = `${SUBSCRIPTIONS_ENDPOINT}/checkout`;
const FEATURES_ENDPOINT = `${SUBSCRIPTIONS_ENDPOINT}/features`;
const CANCEL_ENDPOINT = `${SUBSCRIPTIONS_ENDPOINT}/cancel`;
const ACCESS_REQUEST_ENDPOINT = `${BASE_URL}/requests/create`;

/** Abonamentul curent al municipalității. Întoarce `null` dacă nu există încă unul. */
export async function getCurrentSubscription(): Promise<Subscription | null> {
  const res = await apiFetch(CURRENT_ENDPOINT);

  if (res.status === 204 || res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut încărca abonamentul curent.")
    );
  }

  const text = await res.text().catch(() => "");
  if (!text) return null;

  return JSON.parse(text) as Subscription;
}

/** Lista de funcții (FeatureType-uri) active pentru abonamentul curent. */
export async function getActiveFeatures(): Promise<string[]> {
  const res = await apiFetch(FEATURES_ENDPOINT);

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-au putut încărca funcțiile active.")
    );
  }

  const raw = await res.json();
  return Array.isArray(raw) ? (raw as string[]) : [];
}

/** Creează o sesiune de checkout Stripe și întoarce URL-ul de redirecționare. */
export async function createCheckoutSession(
  payload: CheckoutPayload
): Promise<CheckoutResponse> {
  const res = await apiFetch(CHECKOUT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut iniția plata abonamentului.")
    );
  }

  return (await res.json()) as CheckoutResponse;
}

/** Trimite o cerere de acces la abonament (pentru useri fără rol de municipal admin). */
export async function createAccessRequest(
  payload: AccessRequestPayload
): Promise<void> {
  const res = await apiFetch(ACCESS_REQUEST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut trimite cererea.")
    );
  }
}

/** Anulează abonamentul curent (rămâne activ până la finalul perioadei). */
export async function cancelSubscription(): Promise<void> {
  const res = await apiFetch(CANCEL_ENDPOINT, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut anula abonamentul.")
    );
  }
}
