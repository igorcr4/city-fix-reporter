import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getReportById, updateReport } from "@/lib/api";
import type { Report, CreateReportRequest } from "@/types";
import { Header } from "@/components/Header";
import { ReportForm } from "@/components/ReportForm";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function EditReportPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    // TODO: Apel real getReportById
    setReport({
      id: Number(id),
      title: "Groapă mare pe strada Eminescu",
      description: "Groapă adâncă de circa 30cm.",
      category: "DRUM",
      status: "OPEN",
      authorUsername: "ion.popescu",
      authorId: 1,
      latitude: 44.4350,
      longitude: 26.1020,
      createdAt: "2026-02-10T10:00:00Z",
      updatedAt: "2026-02-10T10:00:00Z",
    });
  }, [id, isAuthenticated]);

  const handleSubmit = async (data: CreateReportRequest) => {
    setLoading(true);
    try {
      // TODO: Apel real updateReport
      // await updateReport(Number(id), data);
      toast({ title: "Actualizat!", description: "Raportul a fost modificat." });
      navigate(`/reports/${id}`);
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut actualiza raportul.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex flex-1 flex-col gap-4 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </button>
        <h1 className="font-heading text-lg font-bold text-foreground">Editează raportul</h1>
        <ReportForm
          initialData={{ title: report.title, description: report.description, category: report.category, latitude: report.latitude, longitude: report.longitude }}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Salvează modificările"
        />
      </main>
    </div>
  );
}
