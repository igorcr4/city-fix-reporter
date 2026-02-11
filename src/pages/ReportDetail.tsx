import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getReportById, deleteReport } from "@/lib/api";
import type { Report } from "@/types";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Edit, Trash2, User } from "lucide-react";
import { motion } from "framer-motion";

// TODO: Mock — elimină când backend-ul e conectat
const MOCK_REPORT: Report = {
  id: 1,
  title: "Groapă mare pe strada Eminescu",
  description:
    "Groapă adâncă de circa 30cm situată pe banda 1, în dreptul numărului 45. Pune în pericol mașinile și bicicletele. A apărut după ploile de săptămâna trecută.",
  category: "DRUM",
  status: "OPEN",
  authorUsername: "ion.popescu",
  authorId: 1,
  createdAt: "2026-02-10T10:00:00Z",
  updatedAt: "2026-02-10T10:00:00Z",
};

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      // TODO: Înlocuiește cu apel real
      // const data = await getReportById(Number(id));
      setReport({ ...MOCK_REPORT, id: Number(id) });
    } catch {
      toast({ title: "Eroare", description: "Raportul nu a fost găsit.", variant: "destructive" });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!report || !confirm("Sigur vrei să ștergi acest raport?")) return;
    try {
      // TODO: Apel real deleteReport
      // await deleteReport(report.id);
      toast({ title: "Șters", description: "Raportul a fost șters cu succes." });
      navigate("/");
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut șterge raportul.", variant: "destructive" });
    }
  };

  if (loading || !report) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const isOwner = user?.id === report.authorId;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container flex flex-1 flex-col gap-4 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          {report.imageUrl && (
            <img src={report.imageUrl} alt={report.title} className="w-full rounded-lg object-cover" style={{ maxHeight: 300 }} />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} />
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              {CATEGORY_LABELS[report.category]}
            </span>
          </div>

          <h1 className="font-heading text-xl font-bold text-foreground">{report.title}</h1>

          <p className="text-sm leading-relaxed text-muted-foreground">{report.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {report.authorUsername}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Creat: {new Date(report.createdAt).toLocaleDateString("ro-RO")}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Actualizat: {new Date(report.updatedAt).toLocaleDateString("ro-RO")}
            </span>
          </div>

          {isOwner && (
            <div className="flex gap-3 pt-2">
              <Button onClick={() => navigate(`/reports/${report.id}/edit`)} className="flex-1 gap-2">
                <Edit className="h-4 w-4" />
                Editează
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Șterge
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
