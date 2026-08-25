/**
 * Helper generic pentru denumiri administrative.
 *
 * Identitatea unei localități vine din backend (countryIso2 + stateIso2 +
 * cityName) — frontendul nu mai potrivește denumiri și nu are reguli specifice
 * vreunei țări. Aici rămâne doar normalizarea de spații pentru afișare.
 */

export function compactAdministrativeText(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}
