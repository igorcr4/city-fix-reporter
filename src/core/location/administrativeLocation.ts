export interface AdministrativeLocationInput {
  country?: string | null;
  state?: string | null;
  city?: string | null;
}

export interface AdministrativeLocationOptions {
  countries?: string[];
  states?: string[];
  cities?: string[];
}

export interface NormalizedAdministrativeLocation {
  country: string;
  state: string;
  city: string;
  isComplete: boolean;
  wasChanged: boolean;
}

type AdministrativeField = "country" | "state" | "city";

// Exact-value aliases only. The main path is canonical matching against
// geography API options; these keep known translated labels from splitting data.
const EDGE_CASE_ALIASES: Partial<Record<AdministrativeField, Record<string, string>>> = {
  country: {
    romania: "Romania",
    roumania: "Romania",
    rumania: "Romania",
  },
  state: {
    bucuresti: "Bucharest",
    "municipiul bucuresti": "Bucharest",
  },
  city: {
    bucuresti: "Bucharest",
    "municipiul bucuresti": "Bucharest",
  },
};

export function compactAdministrativeText(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

export function getAdministrativeMatchKey(
  value: string | null | undefined
): string {
  return compactAdministrativeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[șş]/gi, "s")
    .replace(/[țţ]/gi, "t")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function toStableDisplayValue(value: string): string {
  return compactAdministrativeText(value)
    .toLocaleLowerCase()
    .replace(/(^|[\s-])\p{L}/gu, (match) => match.toLocaleUpperCase());
}

function getAliasCanonicalValue(
  field: AdministrativeField,
  value: string
): string | null {
  const alias = EDGE_CASE_ALIASES[field]?.[getAdministrativeMatchKey(value)];
  return alias ?? null;
}

function canonicalizeFromOptions(
  field: AdministrativeField,
  value: string,
  options: string[] | undefined
): string {
  const compacted = compactAdministrativeText(value);
  if (!compacted) return "";

  const valueKey = getAdministrativeMatchKey(compacted);
  const aliasCanonicalValue = getAliasCanonicalValue(field, compacted);
  const aliasKey = aliasCanonicalValue
    ? getAdministrativeMatchKey(aliasCanonicalValue)
    : null;

  const matchedOption = options?.find((option) => {
    const optionKey = getAdministrativeMatchKey(option);
    return optionKey === valueKey || (!!aliasKey && optionKey === aliasKey);
  });

  if (matchedOption) return compactAdministrativeText(matchedOption);
  if (aliasCanonicalValue) return aliasCanonicalValue;

  return toStableDisplayValue(compacted);
}

export function normalizeAdministrativeLocation(
  input: AdministrativeLocationInput,
  options: AdministrativeLocationOptions = {}
): NormalizedAdministrativeLocation {
  const rawCountry = compactAdministrativeText(input.country);
  const rawState = compactAdministrativeText(input.state);
  const rawCity = compactAdministrativeText(input.city);

  const country = canonicalizeFromOptions("country", rawCountry, options.countries);
  const state = canonicalizeFromOptions("state", rawState, options.states);
  const city = canonicalizeFromOptions("city", rawCity, options.cities);

  return {
    country,
    state,
    city,
    isComplete: Boolean(country && state && city),
    wasChanged:
      country !== rawCountry || state !== rawState || city !== rawCity,
  };
}
