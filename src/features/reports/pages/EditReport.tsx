import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";
import { getReportById, updateReport } from "@/features/reports/api/reports";
import type { Report, UpdateReportRequest } from "@/shared/types";
import { Header } from "@/shared/components/layout/Header";
import { ReportForm } from "@/features/reports/components/ReportForm";
import { toast } from "@/shared/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function EditReportPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const loadReport = useCallback(async () => {
    if (!id) return;

    setPageLoading(true);
    try {
      const data = await getReportById(Number(id));

      if (!user || user.id !== data.userId) {
        toast({
          title: "Acces interzis",
          description: "Nu poți edita un raport care nu îți aparține.",
          variant: "destructive",
        });
        navigate(`/reports/${id}`);
        return;
      }

      setReport(data);
    } catch (error) {
      console.error("LOAD REPORT FOR EDIT ERROR:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut încărca raportul pentru editare.",
        variant: "destructive",
      });
      navigate("/reports");
    } finally {
      setPageLoading(false);
    }
  }, [id, navigate, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    loadReport();
  }, [isAuthenticated, navigate, loadReport]);

  const handleSubmit = async (data: UpdateReportRequest) => {
    if (!id) return;

    setLoading(true);
    try {
      await updateReport(Number(id), data);

      toast({
        title: "Actualizat!",
        description: "Raportul a fost modificat.",
      });

      navigate(`/reports/${id}`);
    } catch (error) {
      console.error("UPDATE REPORT ERROR:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza raportul.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading || !report) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header showCreateButton={false} showLogoutButton={false} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCreateButton={false} showLogoutButton={false} />

      <main className="container flex flex-1 flex-col gap-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </button>

        <h1 className="font-heading text-lg font-bold text-foreground">
          Editează raportul
        </h1>

        <ReportForm
          initialData={{
            title: report.title,
            description: report.description,
            category: report.category,
            latitude: report.latitude,
            longitude: report.longitude,
            address: report.address,
            imageUrl: report.imageUrl,
          }}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Salvează modificările"
        />
      </main>
    </div>
  );
}
