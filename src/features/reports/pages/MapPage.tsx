import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/core/auth/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Report, ReportCategory } from "@/shared/types";
import { ReportMap } from "@/features/reports/components/ReportMap";
import { MapHeader } from "@/features/reports/components/MapHeader";
import { FloatingAddButton } from "@/features/reports/components/FloatingAddButton";
import { Loader2 } from "lucide-react";
import { getAllReports } from "@/core/api/api";

export default function MapPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ReportCategory | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      if (!isAuthenticated) {
        navigate("/auth");
        return;
      }

      try {
        setLoading(true);
        const data = await getAllReports();

        if (!isMounted) return;
        setReports(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("LOAD REPORTS ERROR:", error);

        if (!isMounted) return;
        // păstrăm harta vizibilă chiar dacă request-ul eșuează
        setReports([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  const filteredReports = useMemo(() => {
    if (selectedCategory === "ALL") return reports;
    return reports.filter((report) => report.category === selectedCategory);
  }, [reports, selectedCategory]);

  const focusedMapTarget = useMemo(() => {
    const latitudeParam = searchParams.get("lat");
    const longitudeParam = searchParams.get("lng");
    const reportIdParam = searchParams.get("reportId");

    if (!latitudeParam || !longitudeParam) {
      return null;
    }

    const latitude = Number(latitudeParam);
    const longitude = Number(longitudeParam);
    const reportId = reportIdParam ? Number(reportIdParam) : null;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude,
      longitude,
      reportId: reportId !== null && Number.isFinite(reportId) ? reportId : null,
    };
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden">
      <MapHeader
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Harta este mereu prezentă; dacă nu sunt rapoarte, doar nu apar marker-ele */}
      <ReportMap
        reports={filteredReports}
        className="h-full w-full"
        focusedReportId={focusedMapTarget?.reportId ?? null}
        focusedLocation={focusedMapTarget}
      />

      <FloatingAddButton />
    </div>
  );
}
