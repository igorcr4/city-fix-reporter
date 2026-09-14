import { describe, expect, it } from "vitest";
import {
  asRecord,
  expectArray,
  extractListPayload,
  parseErrorMessage,
  readBoolean,
  readNumber,
  readString,
} from "./parsing";

function failed(body: string | null, status = 500) {
  return new Response(body, { status });
}

const SESSION_EXPIRED =
  "Sesiunea nu mai este validă sau tokenul lipsește. Deloghează-te și autentifică-te din nou.";

describe("parseErrorMessage", () => {
  it("întoarce mesajul de sesiune expirată la 401", async () => {
    await expect(parseErrorMessage(failed(null, 401), "fallback")).resolves.toBe(
      SESSION_EXPIRED
    );
  });

  it("folosește mesajul implicit de 403 când nu se dă altul", async () => {
    // Comportamentul din geography.ts și subscriptions.ts.
    await expect(parseErrorMessage(failed(null, 403), "fallback")).resolves.toBe(
      "Nu ai permisiuni pentru această acțiune."
    );
  });

  it("păstrează formulările specifice de 403 ale modulelor de admin", async () => {
    await expect(
      parseErrorMessage(failed(null, 403), "fallback", {
        forbiddenMessage: "Nu ai permisiuni de admin pentru această acțiune.",
      })
    ).resolves.toBe("Nu ai permisiuni de admin pentru această acțiune.");

    await expect(
      parseErrorMessage(failed(null, 403), "fallback", {
        forbiddenMessage:
          "Nu ai permisiuni de municipal admin pentru această acțiune.",
      })
    ).resolves.toBe("Nu ai permisiuni de municipal admin pentru această acțiune.");
  });

  it("citește message, apoi detail, apoi error din corpul JSON", async () => {
    await expect(
      parseErrorMessage(failed('{"message":"M","detail":"D","error":"E"}'), "fb")
    ).resolves.toBe("M");

    await expect(
      parseErrorMessage(failed('{"detail":"D","error":"E"}'), "fb")
    ).resolves.toBe("D");

    await expect(parseErrorMessage(failed('{"error":"E"}'), "fb")).resolves.toBe("E");

    await expect(parseErrorMessage(failed('{"altceva":"X"}'), "fb")).resolves.toBe(
      "fb"
    );
  });

  it("întoarce textul brut când corpul nu e JSON", async () => {
    await expect(parseErrorMessage(failed("Ceva a mers prost"), "fb")).resolves.toBe(
      "Ceva a mers prost"
    );
  });

  it("cade pe fallback pentru corp gol sau doar spații", async () => {
    await expect(parseErrorMessage(failed(""), "fb")).resolves.toBe("fb");
    // Varianta din comments.ts făcea trim înainte de a decide; se păstrează.
    await expect(parseErrorMessage(failed("   \n  "), "fb")).resolves.toBe("fb");
  });
});

describe("extractListPayload", () => {
  it("acceptă array la rădăcină", () => {
    expect(extractListPayload<number>([1, 2])).toEqual([1, 2]);
  });

  it("acceptă cheile uzuale de împachetare", () => {
    for (const key of ["items", "content", "data", "results"]) {
      expect(extractListPayload<number>({ [key]: [7] })).toEqual([7]);
    }
  });

  it("acceptă chei suplimentare doar când sunt cerute explicit", () => {
    // municipalReports.ts avea "reports" în lista proprie; se păstrează prin extraKeys.
    expect(extractListPayload<number>({ reports: [1] })).toEqual([]);
    expect(extractListPayload<number>({ reports: [1] }, ["reports"])).toEqual([1]);
  });

  it("întoarce listă goală pentru forme necunoscute", () => {
    expect(extractListPayload<number>({ altceva: [1] })).toEqual([]);
    expect(extractListPayload<number>(null)).toEqual([]);
    expect(extractListPayload<number>("text")).toEqual([]);
  });
});

describe("expectArray", () => {
  it("trece array-urile mai departe", () => {
    expect(expectArray([1], "țări")).toEqual([1]);
  });

  it("aruncă mesaj clar pentru orice altă formă", () => {
    expect(() => expectArray({ items: [] }, "orașe")).toThrow(
      "Răspuns neașteptat de la server pentru orașe: se aștepta o listă."
    );
  });
});

describe("citirea câmpurilor", () => {
  it("asRecord acceptă doar obiecte simple", () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
    expect(asRecord([1])).toBeNull();
    expect(asRecord(null)).toBeNull();
    expect(asRecord("text")).toBeNull();
  });

  it("readString face trim și respinge stringurile goale", () => {
    expect(readString({ a: "  x  " }, "a")).toBe("x");
    expect(readString({ a: "   " }, "a")).toBeNull();
    expect(readString({ a: 5 }, "a")).toBeNull();
    expect(readString({}, "a")).toBeNull();
  });

  it("readNumber acceptă doar numere finite", () => {
    expect(readNumber({ a: 0 }, "a")).toBe(0);
    expect(readNumber({ a: -1.5 }, "a")).toBe(-1.5);
    expect(readNumber({ a: NaN }, "a")).toBeNull();
    expect(readNumber({ a: Infinity }, "a")).toBeNull();
    expect(readNumber({ a: "5" }, "a")).toBeNull();
  });

  it("readBoolean păstrează semantica din comments (true, 1, \"true\")", () => {
    expect(readBoolean(true)).toBe(true);
    expect(readBoolean(1)).toBe(true);
    expect(readBoolean(" TRUE ")).toBe(true);
    expect(readBoolean("false")).toBe(false);
    expect(readBoolean(0)).toBe(false);
    expect(readBoolean(null)).toBe(false);
    expect(readBoolean(undefined)).toBe(false);
  });
});
