import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";
import { isMunicipalAdminUser } from "@/core/auth/roles";
import { getMunicipalAdminReports, updateMunicipalReport } from "@/features/municipal-admin/api/municipalReports";
import { MunicipalDashboardSummary } from "@/features/municipal-admin/components/MunicipalDashboardSummary";
import { MunicipalReportCard } from "@/features/municipal-admin/components/MunicipalReportCard";
import { MunicipalReportsFilters } from "@/features/municipal-admin/components/MunicipalReportsFilters";
import { MunicipalReportsPagination } from "@/features/municipal-admin/components/MunicipalReportsPagination";
import {
  MunicipalReportUpdateDialog,
  type MunicipalReportUpdateData,
} from "@/features/municipal-admin/components/MunicipalReportUpdateDialog";
import {
  filterAndSortMunicipalReports,
  getMunicipalDashboardSummary,
} from "@/features/municipal-admin/helpers/reportFilters";
import { paginateItems } from "@/features/municipal-admin/helpers/reportPagination";
import type {
  MunicipalReportCategoryFilter,
  MunicipalReportFilters,
  MunicipalReportSort,
} from "@/features/municipal-admin/types";
import type { Report } from "@/shared/types";
import { Header } from "@/shared/components/layout/Header";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { toast } from "@/shared/hooks/use-toast";

const INITIAL_FILTERS: MunicipalReportFilters = {
  search: "",
  category: "ALL",
  status: "ACTIVE",
  criticalOnly: false,
  sort: "newest",
};

export default function MunicipalAdminPanelPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MunicipalReportFilters>(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updateDialogReport, setUpdateDialogReport] = useState<Report | null>(null);
  const [reportUpdateLoading, setReportUpdateLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
      return;
    }

    if (user && !isMunicipalAdminUser(user)) {
      navigate("/reports", { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const loadReports = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const nextReports = await getMunicipalAdminReports();
      setReports(nextReports);
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
    }
  }, [user]);

  useEffect(() => {
    if (!user || !isMunicipalAdminUser(user)) return;
    void loadReports();
  }, [loadReports, user]);

  const filteredReports = useMemo(
    () => filterAndSortMunicipalReports(reports, filters),
    [filters, reports]
  );
  const paginatedReports = useMemo(
    () => paginateItems(filteredReports, currentPage),
    [currentPage, filteredReports]
  );

  const dashboardSummary = useMemo(
    () => getMunicipalDashboardSummary(reports),
    [reports]
  );
  const hasReports = reports.length > 0;

  useEffect(() => {
    setCurrentPage((page) =>
      page === paginatedReports.currentPage ? page : paginatedReports.currentPage
    );
  }, [paginatedReports.currentPage]);

  const updateFilters = useCallback(
    (updater: (current: MunicipalReportFilters) => MunicipalReportFilters) => {
      setCurrentPage(1);
      setFilters(updater);
    },
    []
  );

  const handleReportUpdate = async (data: MunicipalReportUpdateData) => {
    if (!updateDialogReport) return;

    setReportUpdateLoading(true);

    try {
      const updatedReport = await updateMunicipalReport(
        updateDialogReport,
        data
      );

      setReports((current) =>
        current.map((report) =>
          report.id === updatedReport.id ? updatedReport : report
        )
      );
      setUpdateDialogReport(null);

      toast({
        title: "Raport actualizat",
        description: "Raportul a fost actualizat cu succes.",
      });
    } catch (error) {
      console.error("UPDATE MUNICIPAL REPORT ERROR:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut actualiza raportul.",
        variant: "destructive",
      });
    } finally {
      setReportUpdateLoading(false);
    }
  };

  if (!isAuthenticated || (user && !isMunicipalAdminUser(user))) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCreateButton={false} />

      <main className="container flex flex-1 flex-col gap-4 py-4">
        <MunicipalDashboardSummary
          summary={dashboardSummary}
          activeStatus={filters.status}
          onStatusSelect={(status) =>
            updateFilters((current) => ({
              ...current,
              search: "",
              category: "ALL",
              status,
            }))
          }
        />

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Nu am putut încărca panoul municipal</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <MunicipalReportsFilters
          filters={filters}
          onSearchChange={(search) =>
            updateFilters((current) => ({ ...current, search }))
          }
          onCategoryChange={(category) =>
            updateFilters((current) => ({
              ...current,
              category: category as MunicipalReportCategoryFilter,
            }))
          }
          onCriticalOnlyChange={(criticalOnly) =>
            updateFilters((current) => ({ ...current, criticalOnly }))
          }
          onSortChange={(sort) =>
            updateFilters((current) => ({ ...current, sort: sort as MunicipalReportSort }))
          }
        />

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
        ) : (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Rapoarte municipalitate
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredReports.length} rezultate după filtre.
                </p>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <Card className="rounded-lg border-dashed shadow-sm">
                <CardContent className="flex min-h-[180px] flex-col items-center justify-center gap-2 text-center">
                  <p className="text-base font-semibold text-foreground">
                    {hasReports
                      ? "Nu există rapoarte pentru filtrele curente"
                      : "Nu există încă rapoarte pentru această municipalitate"}
                  </p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {hasReports
                      ? "Ajustează căutarea, categoria sau starea ca să vezi rapoartele relevante pentru municipalitatea ta."
                      : "Când vor fi create rapoarte relevante, acestea vor apărea aici împreună cu statisticile aferente."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-2.5">
                  {paginatedReports.items.map((report) => (
                    <MunicipalReportCard
                      key={report.id}
                      report={report}
                      onOpenDetails={() => navigate(`/reports/${report.id}`)}
                      onOpenUpdateDialog={() => setUpdateDialogReport(report)}
                    />
                  ))}
                </div>

                <MunicipalReportsPagination
                  currentPage={paginatedReports.currentPage}
                  totalPages={paginatedReports.totalPages}
                  totalItems={filteredReports.length}
                  startItem={paginatedReports.startItem}
                  endItem={paginatedReports.endItem}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </section>
        )}
      </main>

      <MunicipalReportUpdateDialog
        open={!!updateDialogReport}
        report={updateDialogReport}
        loading={reportUpdateLoading}
        onOpenChange={(open) => !open && setUpdateDialogReport(null)}
        onConfirm={handleReportUpdate}
      />
    </div>
  );
}
