import { describe, expect, it, vi, afterEach } from "vitest";
import { createReport } from "./reports";
import type { CreateReportRequest } from "@/shared/types";

afterEach(() => {
  vi.unstubAllGlobals();
});

const EXPECTED_KEYS = [
  "title",
  "description",
  "category",
  "latitude",
  "longitude",
  "address",
  "countryIso2",
  "stateIso2",
  "cityName",
  "stateName",
  "countryName",
].sort();

describe("payload-ul de creare a raportului", () => {
  it("conține exact câmpurile din contract, fără câmpuri în plus", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          category: "ROAD",
          status: "NEW",
          latitude: 47.0105,
          longitude: 28.8638,
          createdAt: "2026-01-01T00:00:00Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchSpy);

    const request: CreateReportRequest = {
      title: "Groapă",
      description: "Groapă adâncă",
      category: "ROAD",
      latitude: 47.0105,
      longitude: 28.8638,
      address: "Strada Ismail 12",
      countryIso2: "MD",
      stateIso2: "CU",
      countryName: "Moldova",
      stateName: "Chișinău Municipality",
      cityName: "Chișinău",
    };

    await createReport(request);

    const body = fetchSpy.mock.calls[0][1].body as FormData;
    const dataBlob = body.get("data") as Blob;
    // jsdom nu implementează Blob.text(); FileReader funcționează.
    const raw = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(dataBlob);
    });
    const payload = JSON.parse(raw);

    expect(Object.keys(payload).sort()).toEqual(EXPECTED_KEYS);
    expect(payload.cityName).toBe("Chișinău");
    expect(payload.countryIso2).toBe("MD");
    expect(payload.stateIso2).toBe("CU");
  });
});
