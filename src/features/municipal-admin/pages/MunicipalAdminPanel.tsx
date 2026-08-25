import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  Flame,
  Gauge,
  ThumbsUp,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { isMunicipalAdminUser } from "@/core/auth/roles";
import { getMunicipalAdminReports, updateMunicipalReport } from "@/features/municipal-admin/api/municipalReports";
import { getActiveFeatures } from "@/features/subscription/api/subscriptions";
import {
  deriveFeatureAccess,
  getAvailableSections,
  type MunicipalSectionId,
} from "@/features/municipal-admin/helpers/featureGating";
import { MunicipalDashboardSummary } from "@/features/municipal-admin/components/MunicipalDashboardSummary";
import { MunicipalPremiumUpsellCard } from "@/features/municipal-admin/components/MunicipalPremiumUpsellCard";
import {
  MunicipalPanelSidebar,
  type MunicipalSidebarItem,
} from "@/features/municipal-admin/components/MunicipalPanelSidebar";
import { MunicipalTopCategoriesSection } from "@/features/municipal-admin/components/MunicipalTopCategoriesSection";
import { MunicipalCriticalZonesSection } from "@/features/municipal-admin/components/MunicipalCriticalZonesSection";
import { MunicipalConfirmationStatisticsSection } from "@/features/municipal-admin/components/MunicipalConfirmationStatisticsSection";
import { MunicipalPeriodStatisticsSection } from "@/features/municipal-admin/components/MunicipalPeriodStatisticsSection";
import { MunicipalAverageResolutionTimeSection } from "@/features/municipal-admin/components/MunicipalAverageResolutionTimeSection";
import { MunicipalPerformanceSection } from "@/features/municipal-admin/components/MunicipalPerformanceSection";
import { MunicipalStatsRangeSelector } from "@/features/municipal-admin/components/MunicipalStatsRangeSelector";
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
import {
  DEFAULT_STATS_RANGE,
  filterReportsByRange,
  isRangeApplied,
  type StatsRange,
} from "@/features/municipal-admin/helpers/statsInterval";
import { getReportMapUrl } from "@/features/reports/helpers/reportMapNavigation";
import { downloadReportsCsv } from "@/features/municipal-admin/helpers/reportsCsv";
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
  dateFrom: null,
  dateTo: null,
};

const SECTION_ICONS: Record<MunicipalSectionId, LucideIcon> = {
  reports: ClipboardList,
  "period-statistics": TrendingUp,
  "top-categories": BarChart3,
  "critical-zones": Flame,
  "confirmation-statistics": ThumbsUp,
  "average-resolution-time": Timer,
  performance: Gauge,
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
  const [features, setFeatures] = useState<string[]>([]);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<MunicipalSectionId>("reports");
  const [statsRange, setStatsRange] = useState<StatsRange>(DEFAULT_STATS_RANGE);

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
          : "Nu s-au putut încărca rapoartele orașului."
      );
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca rapoartele orașului.",
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

  useEffect(() => {
    if (!user || !isMunicipalAdminUser(user)) return;

    let active = true;

    const loadFeatures = async () => {
      try {
        const activeFeatures = await getActiveFeatures();
        if (active) {
          setFeatures(activeFeatures);
        }
      } catch {
        // Feature-gating-ul e doar pentru afișare; dacă apelul eșuează,
        // tratăm ca fără feature-uri active (ascundem funcțiile premium).
        if (active) {
          setFeatures([]);
        }
      } finally {
        if (active) {
          setFeaturesLoaded(true);
        }
      }
    };

    void loadFeatures();

    return () => {
      active = false;
    };
  }, [user]);

  const featureAccess = useMemo(() => deriveFeatureAccess(features), [features]);
  const sections = useMemo(() => getAvailableSections(features), [features]);

  const sidebarItems = useMemo<MunicipalSidebarItem[]>(
    () =>
      sections.map((section) => ({
        id: section.id,
        label: section.label,
        icon: SECTION_ICONS[section.id],
      })),
    [sections]
  );

  // Dacă secțiunea activă nu mai e disponibilă (ex. feature dezactivat), revino la Rapoarte.
  useEffect(() => {
    if (!sections.some((section) => section.id === activeSection)) {
      setActiveSection("reports");
    }
  }, [sections, activeSection]);

  useEffect(() => {
    if (featuresLoaded && !featureAccess.canSeeCriticalZones) {
      setFilters((current) =>
        current.criticalOnly ? { ...current, criticalOnly: false } : current
      );
    }
  }, [featuresLoaded, featureAccess.canSeeCriticalZones]);

  useEffect(() => {
    if (featuresLoaded && !featureAccess.canUsePeriodFilter) {
      setFilters((current) =>
        current.dateFrom || current.dateTo
          ? { ...current, dateFrom: null, dateTo: null }
          : current
      );
    }
  }, [featuresLoaded, featureAccess.canUsePeriodFilter]);

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

  // Un singur interval controlează toate cardurile de statistici. Câmpul de dată
  // diferă per metrică: volumul se filtrează după `createdAt`, timpul mediu de
  // rezolvare după `resolvedAt`.
  const statsReportsByCreatedAt = useMemo(
    () => filterReportsByRange(reports, statsRange, "createdAt"),
    [reports, statsRange]
  );
  const statsReportsByResolvedAt = useMemo(
    () => filterReportsByRange(reports, statsRange, "resolvedAt"),
    [reports, statsRange]
  );
  const rangeApplied = isRangeApplied(statsRange);

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

  const handleExportCsv = () => {
    downloadReportsCsv(filteredReports);
  };

  const handleReportUpdate = async (data: MunicipalReportUpdateData) => {
    if (!updateDialogReport) return;
    // Fără abonament activ, actualizarea rapoartelor nu e permisă (doar vizualizare).
    if (!featureAccess.hasActiveSubscription) return;

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

  const renderReportsSection = () => (
    <div className="flex flex-col gap-4">
      {featureAccess.hasActiveSubscription && (
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
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Nu am putut încărca panoul</AlertTitle>
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
        onDateRangeChange={(range) =>
          updateFilters((current) => ({
            ...current,
            dateFrom: range.from,
            dateTo: range.to,
          }))
        }
        onExportCsv={handleExportCsv}
        showCriticalZones={featureAccess.canSeeCriticalZones}
        showPeriodFilter={featureAccess.canUsePeriodFilter}
        showCsvExport={featureAccess.canExportCsv}
      />

      {loading ? (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(248px,280px))]">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-[360px] rounded-lg" />
          ))}
        </div>
      ) : (
        <section className="w-full space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Rapoartele orașului
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
                    : "Nu există încă rapoarte pentru acest oraș"}
                </p>
                <p className="max-w-md text-sm text-muted-foreground">
                  {hasReports
                    ? "Ajustează căutarea, categoria sau starea ca să vezi rapoartele relevante pentru orașul tău."
                    : "Când vor fi create rapoarte relevante, acestea vor apărea aici împreună cu statisticile aferente."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(248px,280px))]">
                {paginatedReports.items.map((report) => (
                  <MunicipalReportCard
                    key={report.id}
                    report={report}
                    onOpenDetails={() => navigate(`/reports/${report.id}`)}
                    onOpenOnMap={() => navigate(getReportMapUrl(report))}
                    onOpenUpdateDialog={() => setUpdateDialogReport(report)}
                    canManage={featureAccess.hasActiveSubscription}
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
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "top-categories":
        return (
          <MunicipalTopCategoriesSection
            reports={statsReportsByCreatedAt}
            rangeApplied={rangeApplied}
          />
        );
      case "period-statistics":
        return (
          <MunicipalPeriodStatisticsSection
            reports={statsReportsByCreatedAt}
            rangeApplied={rangeApplied}
          />
        );
      case "critical-zones":
        return (
          <MunicipalCriticalZonesSection
            reports={statsReportsByCreatedAt}
            rangeApplied={rangeApplied}
          />
        );
      case "confirmation-statistics":
        return (
          <MunicipalConfirmationStatisticsSection
            reports={statsReportsByCreatedAt}
            rangeApplied={rangeApplied}
          />
        );
      case "average-resolution-time":
        return (
          <MunicipalAverageResolutionTimeSection
            reports={statsReportsByResolvedAt}
            rangeApplied={rangeApplied}
          />
        );
      case "performance":
        return (
          <MunicipalPerformanceSection
            reports={statsReportsByCreatedAt}
            rangeApplied={rangeApplied}
          />
        );
      case "reports":
      default:
        return renderReportsSection();
    }
  };

  const showSidebar = featuresLoaded && featureAccess.hasActiveSubscription;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCreateButton={false} />

      {showSidebar ? (
        <div className="container flex flex-1 flex-col gap-4 py-4 md:flex-row md:items-start">
          <MunicipalPanelSidebar
            items={sidebarItems}
            activeId={activeSection}
            onSelect={setActiveSection}
          />
          <div className="min-w-0 flex-1">
            {activeSection !== "reports" && (
              <div className="mb-4 flex justify-end">
                <MunicipalStatsRangeSelector
                  value={statsRange}
                  onChange={setStatsRange}
                />
              </div>
            )}
            {renderActiveSection()}
          </div>
        </div>
      ) : (
        <main className="container flex flex-1 flex-col gap-4 py-4">
          {featuresLoaded && !featureAccess.hasActiveSubscription && (
            <MunicipalPremiumUpsellCard />
          )}
          {renderReportsSection()}
        </main>
      )}

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
