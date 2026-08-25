import { apiFetch } from "@/core/api/http";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";

export interface ConfirmationToggleResult {
  /** Starea confirmării pentru utilizatorul curent, după toggle. */
  confirmed: boolean;
  /** Numărul total de confirmări ale raportului, după toggle. */
  count: number;
}

/**
 * Comută confirmarea („și eu văd problema") a utilizatorului curent pentru un
 * raport. Fără body — JWT-ul e atașat automat de `apiFetch`. Serverul întoarce
 * starea autoritară ({ confirmed, count }) pe care o folosim ca sursă de adevăr.
 */
export async function toggleReportConfirmation(
  reportId: number
): Promise<ConfirmationToggleResult> {
  const res = await apiFetch(`${BASE_URL}/confirmations/${reportId}`, {
    method: "POST",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text.trim() || "Confirmarea nu a putut fi înregistrată.");
  }

  const raw = (await res.json()) as { confirmed?: unknown; count?: unknown };
  const count = Number(raw.count ?? 0);

  return {
    confirmed: raw.confirmed === true,
    count: Number.isFinite(count) ? count : 0,
  };
}
