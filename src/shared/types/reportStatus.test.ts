import { describe, expect, it } from "vitest";
import {
  REPORT_STATUS,
  STATUS_COLORS,
  STATUS_LABELS,
  type ReportStatus,
} from "./index";

/**
 * Valorile sunt trimise și primite de la backend, iar culorile apar în
 * grafice. Un typo nu ar da eroare de compilare, ci ar strica filtrarea sau
 * ar schimba culorile — de aici testul pe valori concrete.
 */
describe("contractul de status", () => {
  it("păstrează exact valorile de pe fir", () => {
    expect(REPORT_STATUS).toEqual({
      NEW: "NEW",
      IN_PROGRESS: "IN_PROGRESS",
      RESOLVED: "RESOLVED",
    });
  });

  it("păstrează etichetele în română", () => {
    expect(STATUS_LABELS).toEqual({
      NEW: "Nou",
      IN_PROGRESS: "În lucru",
      RESOLVED: "Rezolvat",
    });
  });

  it("păstrează culorile care erau duplicate în cele două componente", () => {
    expect(STATUS_COLORS).toEqual({
      NEW: "#f59e0b",
      IN_PROGRESS: "#0ea5e9",
      RESOLVED: "#10b981",
    });
  });

  it("ține tipul, valorile, etichetele și culorile în sincron", () => {
    const statuses = Object.values(REPORT_STATUS);

    // Dacă cineva adaugă un status în REPORT_STATUS fără etichetă sau culoare,
    // testul cade aici, nu în producție.
    for (const status of statuses) {
      expect(STATUS_LABELS[status]).toBeTruthy();
      expect(STATUS_COLORS[status]).toMatch(/^#[0-9a-f]{6}$/i);
    }

    expect(Object.keys(STATUS_LABELS).sort()).toEqual([...statuses].sort());
    expect(Object.keys(STATUS_COLORS).sort()).toEqual([...statuses].sort());

    // Tipul se derivă din constantă: atribuirea de mai jos compilează doar
    // dacă ReportStatus acoperă exact aceste valori.
    const check: ReportStatus[] = statuses;
    expect(check).toHaveLength(3);
  });
});
