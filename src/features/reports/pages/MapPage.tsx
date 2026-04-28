import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/core/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import type { Report, ReportCategory } from "@/shared/types";
import { ReportMap } from "@/features/reports/components/ReportMap";
import { MapHeader } from "@/features/reports/components/MapHeader";
import { FloatingAddButton } from "@/features/reports/components/FloatingAddButton";
import { Loader2 } from "lucide-react";
import { getAllReports } from "@/core/api/api";

export default function MapPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapHeader
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Harta este mereu prezentă; dacă nu sunt rapoarte, doar nu apar marker-ele */}
      <ReportMap reports={filteredReports} className="h-full w-full" />

      <FloatingAddButton />
    </div>
  );
}
