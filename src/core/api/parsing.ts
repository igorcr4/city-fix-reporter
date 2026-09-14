/**
 * Helpere generice pentru citirea răspunsurilor API.
 *
 * Sunt strict agnostice față de domeniu: lucrează doar cu forme brute de JSON
 * (string, number, boolean, array, obiect, mesaj de eroare). Parserele care
 * cunosc un concept de business — normalizeAdminUser, normalizeCommentResponse,
 * normalizeReportResponse, normalizeRequest — rămân în modulul lor de feature.
 */

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Întoarce valoarea trimmed sau `null` dacă lipsește ori e string gol. */
export function readString(
  source: Record<string, unknown>,
  key: string
): string | null {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Întoarce numărul doar dacă e finit; altfel `null`. */
export function readNumber(
  source: Record<string, unknown>,
  key: string
): number | null {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Acceptă true, 1 și "true" (indiferent de capitalizare/spații). */
export function readBoolean(value: unknown): boolean {
  if (value === true) return true;
  if (value === 1) return true;
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  return false;
}

/**
 * Pentru endpoint-urile cu contract fix: lista trebuie să fie array la rădăcină.
 * Orice altă formă e o nepotrivire de contract și se semnalează, nu se ascunde
 * printr-o listă goală.
 */
export function expectArray(raw: unknown, resourceLabel: string): unknown[] {
  if (!Array.isArray(raw)) {
    throw new Error(
      `Răspuns neașteptat de la server pentru ${resourceLabel}: se aștepta o listă.`
    );
  }

  return raw;
}

const DEFAULT_LIST_KEYS = ["items", "content", "data", "results"] as const;

/**
 * Pentru endpoint-urile tolerante: acceptă fie un array la rădăcină, fie un
 * obiect care înfășoară lista într-una din cheile uzuale. `extraKeys` permite
 * chei suplimentare specifice unui endpoint (ex. "reports").
 */
export function extractListPayload<T>(raw: unknown, extraKeys: string[] = []): T[] {
  if (Array.isArray(raw)) return raw as T[];

  const record = asRecord(raw);
  if (record) {
    for (const key of [...DEFAULT_LIST_KEYS, ...extraKeys]) {
      const value = record[key];
      if (Array.isArray(value)) return value as T[];
    }
  }

  return [];
}

const SESSION_EXPIRED_MESSAGE =
  "Sesiunea nu mai este validă sau tokenul lipsește. Deloghează-te și autentifică-te din nou.";

const DEFAULT_FORBIDDEN_MESSAGE = "Nu ai permisiuni pentru această acțiune.";

export interface ParseErrorMessageOptions {
  /**
   * Mesajul pentru 403. Modulele de admin folosesc formulări mai specifice
   * ("...de admin", "...de municipal admin"), păstrate identic după unificare.
   */
  forbiddenMessage?: string;
}

/**
 * Transformă un răspuns eșuat într-un mesaj de eroare în română.
 *
 * Ordinea: 401 și 403 au mesaje fixe; altfel se încearcă `message`/`detail`/
 * `error` din corpul JSON; dacă corpul nu e JSON se întoarce textul brut, iar
 * dacă e gol se întoarce `fallback`.
 */
export async function parseErrorMessage(
  res: Response,
  fallback: string,
  options: ParseErrorMessageOptions = {}
): Promise<string> {
  if (res.status === 401) {
    return SESSION_EXPIRED_MESSAGE;
  }

  if (res.status === 403) {
    return options.forbiddenMessage ?? DEFAULT_FORBIDDEN_MESSAGE;
  }

  const text = (await res.text().catch(() => "")).trim();
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text) as {
      message?: string;
      error?: string;
      detail?: string;
    };

    return parsed.message ?? parsed.detail ?? parsed.error ?? fallback;
  } catch {
    return text;
  }
}
