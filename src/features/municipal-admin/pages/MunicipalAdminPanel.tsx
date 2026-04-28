import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/core/auth/AuthContext";
import { isMunicipalAdminUser } from "@/core/auth/roles";
import { getMunicipalAdminReports, updateMunicipalReportStatus } from "@/features/municipal-admin/api/municipalReports";
import { MunicipalBeforeAfterPanel } from "@/features/municipal-admin/components/MunicipalBeforeAfterPanel";
import { MunicipalDashboardSummary } from "@/features/municipal-admin/components/MunicipalDashboardSummary";
import { MunicipalReportCard } from "@/features/municipal-admin/components/MunicipalReportCard";
import { MunicipalReportsFilters } from "@/features/municipal-admin/components/MunicipalReportsFilters";
import { MunicipalReportsMap } from "@/features/municipal-admin/components/MunicipalReportsMap";
import { MunicipalReportStatusDialog } from "@/features/municipal-admin/components/MunicipalReportStatusDialog";
import {
  filterAndSortMunicipalReports,
  getCategoryCounts,
  getMunicipalDashboardSummary,
  getStatusCounts,
} from "@/features/municipal-admin/helpers/reportFilters";
import type {
  MunicipalReportCategoryFilter,
  MunicipalReportFilters,
  MunicipalReportSort,
  MunicipalReportStatusFilter,
  MunicipalReportsSource,
} from "@/features/municipal-admin/types";
import type { Report, ReportStatus } from "@/shared/types";
import { Header } from "@/shared/components/layout/Header";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { toast } from "@/shared/hooks/use-toast";

const INITIAL_FILTERS: MunicipalReportFilters = {
  search: "",
  category: "ALL",
  status: "ALL",
  sort: "newest",
};

export default function MunicipalAdminPanelPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<MunicipalReportFilters>(INITIAL_FILTERS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<MunicipalReportsSource | null>(null);
  const [recommendedEndpoint, setRecommendedEndpoint] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [statusDialogReport, setStatusDialogReport] = useState<Report | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const scope = useMemo(
    () => ({
      municipalityId: user?.municipalityId ?? null,
      municipalityName: user?.municipalityName ?? null,
    }),
    [user?.municipalityId, user?.municipalityName]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
      return;
    }

    if (user && !isMunicipalAdminUser(user)) {
      navigate("/reports", { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const loadReports = async (mode: "initial" | "refresh" = "initial") => {
    if (!user) return;

    if (!scope.municipalityId && !scope.municipalityName) {
      setReports([]);
      setDataSource(null);
      setRecommendedEndpoint(null);
      setLoading(false);
      setRefreshing(false);
      setErrorMessage(
        "Contul tău de municipal admin nu are încă o municipalitate alocată."
      );
      return;
    }

    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setErrorMessage(null);

    try {
      const result = await getMunicipalAdminReports(scope);
      setReports(result.reports);
      setDataSource(result.source);
      setRecommendedEndpoint(result.recommendedEndpoint ?? null);
    } catch (error) {
      console.error("LOAD MUNICIPAL REPORTS ERROR:", error);
      setReports([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nu s-au putut încărca rapoartele municipalității."
      );
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca rapoartele municipalității.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user || !isMunicipalAdminUser(user)) return;
    void loadReports("initial");
  }, [scope, user]);

  const filteredReports = useMemo(
    () => filterAndSortMunicipalReports(reports, filters),
    [filters, reports]
  );

  const dashboardSummary = useMemo(
    () => getMunicipalDashboardSummary(reports),
    [reports]
  );
  const categoryCounts = useMemo(() => getCategoryCounts(reports), [reports]);
  const statusCounts = useMemo(() => getStatusCounts(reports), [reports]);

  useEffect(() => {
    if (filteredReports.length === 0) {
      setSelectedReportId(null);
      return;
    }

    const currentSelectionStillVisible = filteredReports.some(
      (report) => report.id === selectedReportId
    );

    if (!currentSelectionStillVisible) {
      setSelectedReportId(filteredReports[0].id);
    }
  }, [filteredReports, selectedReportId]);

  const selectedReport =
    filteredReports.find((report) => report.id === selectedReportId) ??
    filteredReports[0] ??
    null;

  const handleStatusUpdate = async (status: ReportStatus) => {
    if (!statusDialogReport) return;

    setStatusUpdateLoading(true);

    try {
      const updatedReport = await updateMunicipalReportStatus(
        statusDialogReport,
        status
      );

      setReports((current) =>
        current.map((report) =>
          report.id === updatedReport.id ? updatedReport : report
        )
      );
      setStatusDialogReport(null);

      toast({
        title: "Status actualizat",
        description: "Raportul a fost actualizat cu succes.",
      });
    } catch (error) {
      console.error("UPDATE MUNICIPAL REPORT STATUS ERROR:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut actualiza statusul raportului.",
        variant: "destructive",
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  if (!isAuthenticated || (user && !isMunicipalAdminUser(user))) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCreateButton={false} />

      <main className="container flex flex-1 flex-col gap-6 py-6">
        <section className="overflow-hidden rounded-[32px] border border-border bg-card shadow-sm">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))] p-6 text-white md:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/90">
                  <ShieldCheck className="h-4 w-4" />
                  ROLE_MUNICIPAL_ADMIN
                </div>

                <div className="space-y-2">
                  <h1 className="font-heading text-3xl font-semibold tracking-tight">
                    Municipal Admin Panel
                  </h1>
                  <p className="max-w-3xl text-sm text-white/75 md:text-base">
                    Gestionezi statusurile, urmărești harta rapoartelor și vezi
                    contextul before/after doar pentru municipalitatea ta.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-white/80">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <Building2 className="h-4 w-4" />
                    {scope.municipalityName || "Municipalitate nealocată"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <LayoutDashboard className="h-4 w-4" />
                    {dashboardSummary.total} rapoarte gestionabile
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  onClick={() => void loadReports("refresh")}
                  disabled={loading || refreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Reîncarcă
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => navigate("/reports")}
                >
                  <Sparkles className="h-4 w-4" />
                  Hartă publică
                </Button>
              </div>
            </div>
          </div>
        </section>

        <MunicipalDashboardSummary summary={dashboardSummary} />

        {dataSource === "client-fallback" && (
          <Alert>
            <AlertTitle>Fallback client-side activ</AlertTitle>
            <AlertDescription>
              Panelul funcționează, dar pentru izolare strictă pe municipalitate
              backend-ul ar trebui să expună un endpoint dedicat precum{" "}
              <span className="font-mono">{recommendedEndpoint}</span>. Până
              atunci, filtrarea se face pe client pe baza datelor deja primite.
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Nu am putut încărca panoul municipal</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <MunicipalReportsFilters
          filters={filters}
          onSearchChange={(search) =>
            setFilters((current) => ({ ...current, search }))
          }
          onCategoryChange={(category) =>
            setFilters((current) => ({
              ...current,
              category: category as MunicipalReportCategoryFilter,
            }))
          }
          onStatusChange={(status) =>
            setFilters((current) => ({
              ...current,
              status: status as MunicipalReportStatusFilter,
            }))
          }
          onSortChange={(sort) =>
            setFilters((current) => ({ ...current, sort: sort as MunicipalReportSort }))
          }
          categoryCounts={categoryCounts}
          statusCounts={statusCounts}
        />

        {loading ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_430px]">
            <div className="space-y-4">
              <Skeleton className="h-56 rounded-3xl" />
              <Skeleton className="h-56 rounded-3xl" />
              <Skeleton className="h-56 rounded-3xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-[420px] rounded-3xl" />
              <Skeleton className="h-[380px] rounded-3xl" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_430px]">
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Rapoarte municipalitate
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredReports.length} rezultate afișate din {reports.length}{" "}
                    rapoarte.
                  </p>
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <Card className="rounded-3xl border-dashed shadow-sm">
                  <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
                    <p className="text-lg font-semibold text-foreground">
                      Nu există rapoarte pentru filtrele curente
                    </p>
                    <p className="max-w-md text-sm text-muted-foreground">
                      Ajustează căutarea, categoria sau statusul ca să vezi
                      rapoartele relevante pentru municipalitatea ta.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredReports.map((report) => (
                  <MunicipalReportCard
                    key={report.id}
                    report={report}
                    active={selectedReport?.id === report.id}
                    onSelect={() => setSelectedReportId(report.id)}
                    onOpenDetails={() => navigate(`/reports/${report.id}`)}
                    onOpenStatusDialog={() => setStatusDialogReport(report)}
                  />
                ))
              )}
            </section>

            <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
              <MunicipalReportsMap
                reports={filteredReports}
                selectedReport={selectedReport}
                onSelectReport={(report) => setSelectedReportId(report?.id ?? null)}
                onOpenDetails={(report) => navigate(`/reports/${report.id}`)}
              />

              <MunicipalBeforeAfterPanel
                report={selectedReport}
                onOpenDetails={() =>
                  selectedReport && navigate(`/reports/${selectedReport.id}`)
                }
                onOpenStatusDialog={() =>
                  selectedReport && setStatusDialogReport(selectedReport)
                }
              />
            </aside>
          </div>
        )}
      </main>

      <MunicipalReportStatusDialog
        open={!!statusDialogReport}
        report={statusDialogReport}
        loading={statusUpdateLoading}
        onOpenChange={(open) => !open && setStatusDialogReport(null)}
        onConfirm={handleStatusUpdate}
      />
    </div>
  );
}
