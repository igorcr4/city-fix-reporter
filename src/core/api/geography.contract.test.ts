import { describe, expect, it, vi, afterEach } from "vitest";
import { getCities, getCountries, getGeocoding, getStates } from "./geography";

function mockResponse(body: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function stubFetch(body: unknown, status = 200) {
  const spy = vi.fn().mockResolvedValue(mockResponse(body, status));
  vi.stubGlobal("fetch", spy);
  return spy;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("contractul listelor", () => {
  it("parsează țările din {iso2, name}", async () => {
    stubFetch([
      { iso2: "MD", name: "Moldova" },
      { iso2: "RO", name: "Romania" },
    ]);

    await expect(getCountries()).resolves.toEqual([
      { iso2: "MD", name: "Moldova" },
      { iso2: "RO", name: "Romania" },
    ]);
  });

  it("parsează regiunile din {iso2, name}", async () => {
    stubFetch([{ iso2: "CU", name: "Chișinău Municipality" }]);

    await expect(getStates("MD")).resolves.toEqual([
      { iso2: "CU", name: "Chișinău Municipality" },
    ]);
  });

  it("parsează orașele fără id — doar {name}", async () => {
    stubFetch([{ name: "Chișinău" }, { name: "Durlești" }]);

    // Regresie: vechiul normalizator arunca orașele fără id, golind dropdown-ul.
    await expect(getCities("MD", "CU")).resolves.toEqual([
      { name: "Chișinău" },
      { name: "Durlești" },
    ]);
  });

  it("semnalează eroare când forma răspunsului nu respectă contractul", async () => {
    stubFetch({ items: [{ name: "Chișinău" }] });
    await expect(getCities("MD", "CU")).rejects.toThrow(/se aștepta o listă/);

    stubFetch([{ nume: "Chișinău" }]);
    await expect(getCities("MD", "CU")).rejects.toThrow(/"name"/);

    stubFetch([{ name: "Moldova" }]);
    await expect(getCountries()).rejects.toThrow(/"iso2" și "name"/);
  });
});

describe("geocodare prin backend", () => {
  it("întoarce locul rezolvat pentru un punct din Chișinău", async () => {
    const fetchSpy = stubFetch({
      countryIso2: "MD",
      stateIso2: "CU",
      country: "Moldova",
      state: "Chișinău Municipality",
      city: "Chișinău",
      latitude: 47.0105,
      longitude: 28.8638,
    });

    await expect(getGeocoding(47.0105, 28.8638)).resolves.toEqual({
      countryIso2: "MD",
      stateIso2: "CU",
      country: "Moldova",
      state: "Chișinău Municipality",
      city: "Chișinău",
      latitude: 47.0105,
      longitude: 28.8638,
    });

    const requestedUrl = String(fetchSpy.mock.calls[0][0]);
    expect(requestedUrl).toContain("/geography/geocoding");
    expect(requestedUrl).toContain("lat=47.0105");
    expect(requestedUrl).toContain("lon=28.8638");
  });

  it("întoarce null la 422 în loc să arunce (punct în larg)", async () => {
    stubFetch({ message: "Coordinates could not be resolved" }, 422);

    await expect(getGeocoding(0, 0)).resolves.toBeNull();
  });

  it("păstrează câmpurile nerezolvate ca null, fără să arunce", async () => {
    stubFetch({
      countryIso2: "MD",
      stateIso2: null,
      country: "Moldova",
      state: null,
      city: null,
      latitude: 47,
      longitude: 28,
    });

    const place = await getGeocoding(47, 28);
    expect(place).not.toBeNull();
    expect(place?.countryIso2).toBe("MD");
    expect(place?.stateIso2).toBeNull();
    expect(place?.city).toBeNull();
  });

  it("aruncă la erori reale de server", async () => {
    stubFetch({ message: "Boom" }, 500);

    await expect(getGeocoding(47, 28)).rejects.toThrow();
  });
});
