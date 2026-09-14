import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";
import { deleteReport, getReportById } from "@/features/reports/api/reports";
import { ReportCommentsSection } from "@/features/comments/components/ReportCommentsSection";
import { ConfirmationButton } from "@/features/confirmations/components/ConfirmationButton";
import type { Report } from "@/shared/types";
import { REPORT_STATUS, CATEGORY_LABELS } from "@/shared/types";
import { StatusBadge } from "@/features/reports/components/StatusBadge";
import { Header } from "@/shared/components/layout/Header";
import { Button } from "@/shared/components/ui/button";
import { toast } from "@/shared/hooks/use-toast";
import { ArrowLeft, Calendar, Edit, MapPin, Trash2, User } from "lucide-react";
import { motion } from "framer-motion";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    if (!id) {
      toast({
        title: "Eroare",
        description: "ID-ul raportului lipsește.",
        variant: "destructive",
      });
      navigate("/reports");
      return;
    }

    setLoading(true);
    try {
      const data = await getReportById(Number(id));
      setReport(data);
    } catch (error) {
      console.error("LOAD REPORT DETAIL ERROR:", error);
      toast({
        title: "Eroare",
        description: "Raportul nu a fost găsit.",
        variant: "destructive",
      });
      navigate("/reports");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleDelete = async () => {
    if (!report || !confirm("Sigur vrei să ștergi acest raport?")) return;

    try {
      await deleteReport(report.id);
      toast({
        title: "Șters",
        description: "Raportul a fost șters cu succes.",
      });
      navigate("/reports");
    } catch (error) {
      console.error("DELETE REPORT ERROR:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge raportul.",
        variant: "destructive",
      });
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

  const isOwner = user?.id === report.userId;
  const displayAddress = report.address?.trim();
  const showComparison =
    report.status === REPORT_STATUS.RESOLVED && !!report.imageUrl && !!report.afterImageUrl;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container flex flex-1 flex-col gap-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          {showComparison ? (
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Comparație înainte / după
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <figure className="space-y-2">
                  <div className="overflow-hidden rounded-lg bg-muted">
                    <img
                      src={report.imageUrl}
                      alt={`Înainte — ${report.title}`}
                      className="max-h-[420px] w-full object-contain"
                    />
                  </div>
                  <figcaption className="text-center">
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      Înainte
                    </span>
                  </figcaption>
                </figure>

                <figure className="space-y-2">
                  <div className="overflow-hidden rounded-lg bg-muted">
                    <img
                      src={report.afterImageUrl}
                      alt={`După — ${report.title}`}
                      className="max-h-[420px] w-full object-contain"
                    />
                  </div>
                  <figcaption className="text-center">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      După
                    </span>
                  </figcaption>
                </figure>
              </div>
            </div>
          ) : (
            report.imageUrl && (
              <div className="overflow-hidden rounded-lg bg-muted">
                <img
                  src={report.imageUrl}
                  alt={report.title}
                  className="max-h-[420px] w-full object-contain"
                />
              </div>
            )
          )}

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} />
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              {CATEGORY_LABELS[report.category] ?? report.category}
            </span>
          </div>

          <h1 className="font-heading text-xl font-bold text-foreground md:text-2xl">
            {report.title}
          </h1>

          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Descriere
            </p>
            <p className="text-sm leading-relaxed text-foreground/90 md:text-base">
              {report.description}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Adresă
            </p>
            <div className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90 md:text-base">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span>
                {displayAddress || "Adresa nu este disponibilă."}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {report.username ?? "Necunoscut"}
            </span>

            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Creat: {new Date(report.createdAt).toLocaleDateString("ro-RO")}
            </span>

            {report.updatedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Actualizat:{" "}
                {new Date(report.updatedAt).toLocaleDateString("ro-RO")}
              </span>
            )}
          </div>

          <div>
            <ConfirmationButton
              report={report}
              onConfirmationChange={({ confirmed, count }) =>
                setReport((current) =>
                  current && current.id === report.id
                    ? {
                        ...current,
                        confirmedByCurrentUser: confirmed,
                        confirmationCount: count,
                      }
                    : current
                )
              }
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <ReportCommentsSection reportId={report.id} />
          </div>

          {isOwner && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => navigate(`/reports/${report.id}/edit`)}
                className="flex-1 gap-2"
              >
                <Edit className="h-4 w-4" />
                Editează
              </Button>

              <Button
                variant="destructive"
                onClick={handleDelete}
                className="gap-2"
              >
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
