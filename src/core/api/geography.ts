import { apiFetch } from "@/core/api/http";
import {
  asRecord,
  expectArray,
  parseErrorMessage,
  readNumber,
  readString,
} from "@/core/api/parsing";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import type {
  GeocodedPlace,
  GeographyCity,
  GeographyCountry,
  GeographyState,
} from "@/shared/types";

const GEOGRAPHY_COUNTRIES_ENDPOINT = `${BASE_URL}/geography/countries`;
const GEOGRAPHY_STATES_ENDPOINT = `${BASE_URL}/geography/states`;
const GEOGRAPHY_CITIES_ENDPOINT = `${BASE_URL}/geography/cities`;
const GEOGRAPHY_GEOCODING_ENDPOINT = `${BASE_URL}/geography/geocoding`;

/** Backendul semnalează cu 422 că punctul nu poate fi rezolvat la o localitate. */
const UNPROCESSABLE_ENTITY = 422;

/** {iso2, name} — folosit identic pentru țări și regiuni. */
function parseIso2Entries<T extends GeographyCountry | GeographyState>(
  raw: unknown,
  resourceLabel: string
): T[] {
  return expectArray(raw, resourceLabel).map((entry, index) => {
    const record = asRecord(entry);
    const iso2 = record ? readString(record, "iso2") : null;
    const name = record ? readString(record, "name") : null;

    if (!iso2 || !name) {
      throw new Error(
        `Răspuns neașteptat de la server pentru ${resourceLabel}: elementul ${index + 1} nu conține "iso2" și "name".`
      );
    }

    return { iso2, name } as T;
  });
}

/** {name} — orașele nu au id sau cod. */
function parseCityEntries(raw: unknown): GeographyCity[] {
  return expectArray(raw, "orașe").map((entry, index) => {
    const record = asRecord(entry);
    const name = record ? readString(record, "name") : null;

    if (!name) {
      throw new Error(
        `Răspuns neașteptat de la server pentru orașe: elementul ${index + 1} nu conține "name".`
      );
    }

    return { name };
  });
}

export async function getCountries(): Promise<GeographyCountry[]> {
  const res = await apiFetch(GEOGRAPHY_COUNTRIES_ENDPOINT);

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Nu s-a putut încărca lista de țări.")
    );
  }

  return parseIso2Entries<GeographyCountry>(await res.json(), "țări");
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

  return parseIso2Entries<GeographyState>(await res.json(), "regiuni");
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

  return parseCityEntries(await res.json());
}

/**
 * Geocodare inversă făcută de backend. Întoarce `null` când serverul răspunde
 * 422 — adică punctul nu corespunde niciunei localități (ex. în larg). Nu e o
 * eroare de sistem, ci un caz normal în care utilizatorul alege manual.
 * Erorile reale (rețea, 5xx, sesiune expirată) sunt aruncate mai departe.
 */
export async function getGeocoding(
  latitude: number,
  longitude: number
): Promise<GeocodedPlace | null> {
  const searchParams = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
  });
  const res = await apiFetch(
    `${GEOGRAPHY_GEOCODING_ENDPOINT}?${searchParams.toString()}`
  );

  if (res.status === UNPROCESSABLE_ENTITY) return null;

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(
        res,
        "Nu s-a putut identifica automat locația pentru punctul ales."
      )
    );
  }

  const record = asRecord(await res.json());
  const countryIso2 = record ? readString(record, "countryIso2") : null;
  const country = record ? readString(record, "country") : null;

  // Fără țară nu avem de unde porni cascada; tratăm la fel ca 422.
  if (!record || !countryIso2 || !country) return null;

  return {
    countryIso2,
    country,
    stateIso2: readString(record, "stateIso2"),
    state: readString(record, "state"),
    city: readString(record, "city"),
    latitude: readNumber(record, "latitude") ?? latitude,
    longitude: readNumber(record, "longitude") ?? longitude,
  };
}
