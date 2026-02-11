import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createReport } from "@/lib/api";
import { Header } from "@/components/Header";
import { ReportForm } from "@/components/ReportForm";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import type { CreateReportRequest } from "@/types";

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
      // TODO: Apel real createReport
      // await createReport(data);
      toast({ title: "Trimis!", description: "Raportul tău a fost creat cu succes." });
      navigate("/");
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut crea raportul.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex flex-1 flex-col gap-4 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </button>
        <h1 className="font-heading text-lg font-bold text-foreground">Raport nou</h1>
        <ReportForm onSubmit={handleSubmit} loading={loading} />
      </main>
    </div>
  );
}
