/**
 * Helpere generice pentru denumiri administrative.
 *
 * Nu conțin reguli specifice vreunei țări: identitatea unei localități vine din
 * codurile CountryStateCity (countryIso2 + stateIso2 + cscCityId), iar
 * denumirile sunt folosite exact cum vin din CSC. O țară nouă nu cere cod nou.
 */

export function compactAdministrativeText(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

/**
 * Cheie de comparare tolerantă la diacritice, punctuație și majuscule, folosită
 * doar ca fallback când un prefill trebuie potrivit cu o opțiune CSC.
 * Funcționează pentru orice alfabet (\p{L}), nu doar latin.
 */
export function getAdministrativeMatchKey(
  value: string | null | undefined
): string {
  return compactAdministrativeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Termeni administrativi care \u00eenso\u021besc numele unei localit\u0103\u021bi \u00een unele surse
 * ("Chi\u0219in\u0103u Municipality" vs "Chi\u0219in\u0103u"). Lista e un vocabular de tipuri de
 * unit\u0103\u021bi administrative, aplicat uniform oric\u0103rei \u021b\u0103ri \u2014 nu un tabel de alias
 * pentru o \u021bar\u0103 anume. Se folose\u0219te doar la compara\u021bie, niciodat\u0103 la afi\u0219are.
 */
const ADMINISTRATIVE_UNIT_TERMS = [
  "municipality",
  "municipiul",
  "municipiu",
  "city",
  "orasul",
  "oras",
  "town",
  "village",
  "satul",
  "comuna",
  "commune",
  "county",
  "judetul",
  "judet",
  "raionul",
  "raion",
  "district",
  "province",
  "prefecture",
  "region",
  "regiunea",
];

/**
 * Cheie de compara\u021bie pentru localit\u0103\u021bi: cheia normalizat\u0103, din care se scot
 * termenii administrativi de la \u00eenceput \u0219i de la sf\u00e2r\u0219it. Dac\u0103 nu mai r\u0103m\u00e2ne
 * nimic (ex. numele chiar e "Sector 3"), se p\u0103streaz\u0103 cheia \u00eentreag\u0103.
 */
export function getLocalityMatchKey(value: string | null | undefined): string {
  const words = getAdministrativeMatchKey(value).split(" ").filter(Boolean);

  let start = 0;
  let end = words.length;

  while (start < end && ADMINISTRATIVE_UNIT_TERMS.includes(words[start])) start++;
  while (end > start && ADMINISTRATIVE_UNIT_TERMS.includes(words[end - 1])) end--;

  const stripped = words.slice(start, end).join(" ");
  return stripped || words.join(" ");
}
