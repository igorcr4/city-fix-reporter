import { apiFetch } from "@/core/api/http";
import type {
  GeographyCity,
  GeographyCountry,
  GeographyState,
} from "@/shared/types";

const BASE_URL = "http://localhost:8080/api";

const GEOGRAPHY_COUNTRIES_ENDPOINT = `${BASE_URL}/geography/countries`;
const GEOGRAPHY_STATES_ENDPOINT = `${BASE_URL}/geography/states`;
const GEOGRAPHY_CITIES_ENDPOINT = `${BASE_URL}/geography/cities`;

interface RawCountry {
  id?: number;
  name?: string;
  countryName?: string;
  iso2?: string;
  countryIso2?: string;
  code?: string;
}

interface RawState {
  id?: number;
  name?: string;
  stateName?: string;
  iso2?: string;
  stateIso2?: string;
  code?: string;
}

interface RawCity {
  id?: number;
  cityId?: number;
  municipalityId?: number;
  name?: string;
  cityName?: string;
  municipalityName?: string;
  countryIso2?: string;
  stateIso2?: string;
}

function normalizeCountry(raw: RawCountry): GeographyCountry | null {
  const iso2 = raw.iso2 ?? raw.countryIso2 ?? raw.code;
  const name = raw.name ?? raw.countryName;

  if (!iso2 || !name) return null;

  return {
    id: raw.id,
    name,
    iso2,
  };
}

function normalizeState(raw: RawState): GeographyState | null {
  const iso2 = raw.iso2 ?? raw.stateIso2 ?? raw.code;
  const name = raw.name ?? raw.stateName;

  if (!iso2 || !name) return null;

  return {
    id: raw.id,
    name,
    iso2,
  };
}

function normalizeCity(raw: RawCity): GeographyCity | null {
  const id = raw.id ?? raw.cityId ?? raw.municipalityId;
  const name = raw.name ?? raw.cityName ?? raw.municipalityName;

  if (!id || !name) return null;

  return {
    id: Number(id),
    name,
    countryIso2: raw.countryIso2,
    stateIso2: raw.stateIso2,
  };
}

function extractListPayload<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];

  if (raw && typeof raw === "object") {
    const listCandidates = [
      "items",
      "content",
      "data",
      "results",
      "countries",
      "states",
      "cities",
    ] as const;

    for (const key of listCandidates) {
      const value = (raw as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as T[];
    }
  }

  return [];
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  if (res.status === 401) {
    return "Sesiunea nu mai este validă sau tokenul lipsește. Deloghează-te și autentifică-te din nou.";
  }

  if (res.status === 403) {
    return "Nu ai permisiuni pentru această acțiune.";
  }

  const text = await res.text().catch(() => "");
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

export async function getCountries(): Promise<GeographyCountry[]> {
  const res = await apiFetch(GEOGRAPHY_COUNTRIES_ENDPOINT);

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut încărca lista de țări.")
    );
  }

  const raw = extractListPayload<RawCountry>(await res.json());
  return raw
    .map(normalizeCountry)
    .filter((country): country is GeographyCountry => !!country);
}

export async function getStates(countryIso2: string): Promise<GeographyState[]> {
  const searchParams = new URLSearchParams({ countryIso2 });
  const res = await apiFetch(`${GEOGRAPHY_STATES_ENDPOINT}?${searchParams.toString()}`);

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(
        res,
        "Nu s-a putut încărca lista de regiuni pentru țara selectată."
      )
    );
  }

  const raw = extractListPayload<RawState>(await res.json());
  return raw
    .map(normalizeState)
    .filter((state): state is GeographyState => !!state);
}

export async function getCities(
  countryIso2: string,
  stateIso2: string
): Promise<GeographyCity[]> {
  const searchParams = new URLSearchParams({ countryIso2, stateIso2 });
  const res = await apiFetch(`${GEOGRAPHY_CITIES_ENDPOINT}?${searchParams.toString()}`);

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(
        res,
        "Nu s-a putut încărca lista de orașe pentru regiunea selectată."
      )
    );
  }

  const raw = extractListPayload<RawCity>(await res.json());
  return raw
    .map(normalizeCity)
    .filter((city): city is GeographyCity => !!city);
}
