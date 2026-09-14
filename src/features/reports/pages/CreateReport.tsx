import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";
import { createReport } from "@/features/reports/api/reports";
import { Header } from "@/shared/components/layout/Header";
import { ReportForm } from "@/features/reports/components/ReportForm";
import { toast } from "@/shared/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import type { CreateReportRequest } from "@/shared/types";

export default function CreateReportPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const handleSubmit = async (data: CreateReportRequest) => {
    setLoading(true);
    try {
      await createReport(data);

      toast({
        title: "Trimis!",
        description: "Raportul tău a fost creat cu succes.",
      });

      navigate("/reports");
    } catch (error) {
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut crea raportul.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          Raport nou
        </h1>

        <ReportForm onSubmit={handleSubmit} loading={loading} />
      </main>
    </div>
  );
}
