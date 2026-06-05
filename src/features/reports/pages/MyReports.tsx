import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import { Header } from "@/shared/components/layout/Header";
import { getMyReports } from "@/core/api/api";
import type { Report, ReportCategory } from "@/shared/types";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  DEFAULT_MAP_ZOOM,
} from "@/shared/types";

import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Expand, Loader2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { reverseGeocodeCoordinates } from "@/core/api/api";

type SortKey = "newest" | "oldest";

const categories: Array<ReportCategory | "ALL"> = ["ALL", "ROAD", "LIGHTING", "WASTE", "VANDALISM", "OTHER"];

function MiniMap({
  report,
  onShowOnMap,
}: {
  report: Report;
  onShowOnMap: (report: Report) => void;
}) {
  return (
    <button
      type="button"
      className="group/map relative h-36 w-full overflow-hidden rounded-md border border-border bg-muted text-left transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={(event) => {
        event.stopPropagation();
        onShowOnMap(report);
      }}
      aria-label={`Arată pe hartă raportul ${report.title || report.id}`}
    >
      <div className="h-full w-full transition duration-300 group-hover/map:scale-[1.03]">
        <Map
          initialViewState={{
            latitude: report.latitude,
            longitude: report.longitude,
            zoom: 15,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          attributionControl={false}
          dragPan={false}
          dragRotate={false}
          scrollZoom={false}
          doubleClickZoom={false}
          touchZoomRotate={false}
          keyboard={false}
          interactive={false}
        >
          <Marker latitude={report.latitude} longitude={report.longitude} anchor="bottom">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: CATEGORY_COLORS[report.category] }}
              title={CATEGORY_LABELS[report.category] ?? report.category}
            >
              <MapPin className="h-4 w-4 text-white" />
            </div>
          </Marker>
        </Map>
      </div>

      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[11px] font-medium text-foreground opacity-0 shadow-sm backdrop-blur-md transition group-hover/map:opacity-100 group-focus-visible/map:opacity-100">
        <Expand className="h-3 w-3" />
        Arată pe hartă
      </span>
    </button>
  );
}

export default function MyReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ReportCategory | "ALL">("ALL");
  const [sort, setSort] = useState<SortKey>("newest");
  const [showFilters, setShowFilters] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyReports();
      setReports(data);
    } catch (err) {
      console.error("LOAD MY REPORTS ERROR:", err);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca rapoartele tale.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openReportOnMap = (report: Report) => {
    const searchParams = new URLSearchParams({
      reportId: String(report.id),
      lat: String(report.latitude),
      lng: String(report.longitude),
    });

    navigate(`/reports?${searchParams.toString()}`);
  };

  useEffect(() => {
    const reportsWithoutAddress = reports.filter((report) => !report.address?.trim());
    if (reportsWithoutAddress.length === 0) return;

    let cancelled = false;

    const hydrateAddresses = async () => {
      const resolved = await Promise.all(
        reportsWithoutAddress.map(async (report) => {
          try {
            const address = await reverseGeocodeCoordinates(
              report.latitude,
              report.longitude
            );

            return {
              id: report.id,
              address,
            };
          } catch (error) {
            console.error("REPORT ADDRESS RESOLVE ERROR:", error);
            return {
              id: report.id,
              address: null,
            };
          }
        })
      );

      if (cancelled) return;

      setReports((current) =>
        current.map((report) => {
          const match = resolved.find((item) => item.id === report.id);
          if (!match?.address) return report;

          return {
            ...report,
            address: match.address,
          };
        })
      );
    };

    hydrateAddresses();

    return () => {
      cancelled = true;
    };
  }, [reports]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = reports.slice();

    if (category !== "ALL") {
      list = list.filter((r) => r.category === category);
    }

    if (q) {
      list = list.filter((r) => {
        const inTitle = (r.title ?? "").toLowerCase().includes(q);
        const inDesc = (r.description ?? "").toLowerCase().includes(q);
        const inAddr = (r.address ?? "").toLowerCase().includes(q);
        return inTitle || inDesc || inAddr;
      });
    }

    list.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sort === "newest" ? db - da : da - db;
    });

    return list;
  }, [reports, query, category, sort]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCreateButton={false} showLogoutButton={false} />

      <main className="container flex flex-1 flex-col gap-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-lg font-bold">Rapoartele mele</h1>
            <p className="text-sm text-muted-foreground">
              Lista rapoartelor create de tine. Apasă pe un raport ca să vezi detalii.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtre
            </Button>

            <Button type="button" size="sm" onClick={() => navigate("/reports/new")}>
              + Raport nou
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card/50 p-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Caută după titlu / descriere / adresă..."
                className="pl-9"
              />
            </div>

            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ReportCategory | "ALL")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "ALL" ? "Toate categoriile" : CATEGORY_LABELS[c] ?? c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger>
                <SelectValue placeholder="Sortare" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Cele mai noi</SelectItem>
                <SelectItem value="oldest">Cele mai vechi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-14 text-center">
            <p className="text-base font-medium">Nu ai rapoarte încă.</p>
            <p className="text-sm text-muted-foreground">
              Creează primul raport și îl vei vedea aici.
            </p>
            <Button className="mt-2" onClick={() => navigate("/reports/new")}>
              + Creează raport
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-6">
            {filtered.map((r) => (
              <article
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/reports/${r.id}`)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  navigate(`/reports/${r.id}`);
                }}
                className="group w-full cursor-pointer rounded-lg border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[260px_1fr]">
                  <MiniMap report={r} onShowOnMap={openReportOnMap} />

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[r.category] ?? r.category}
                      </Badge>

                      <Badge variant="secondary" className="text-xs">
                        {STATUS_LABELS[r.status] ?? r.status}
                      </Badge>

                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("ro-RO")}
                      </span>

                      {r.updatedAt && (
                        <span className="text-xs text-muted-foreground">
                          • actualizat {new Date(r.updatedAt).toLocaleDateString("ro-RO")}
                        </span>
                      )}
                    </div>

                    <h2 className="line-clamp-1 font-heading text-base font-semibold group-hover:text-primary">
                      {r.title || "(Fără titlu)"}
                    </h2>

                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {r.description}
                    </p>

                    <div className="text-xs text-muted-foreground">
                      📍 {r.address?.trim() || "Adresa nu este disponibilă încă."}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
