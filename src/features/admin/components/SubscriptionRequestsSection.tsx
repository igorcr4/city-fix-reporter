import { useEffect, useState } from "react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  Inbox,
  Loader2,
  RefreshCw,
  UserRound,
} from "lucide-react";

import {
  approveRequest,
  getPendingRequests,
  rejectRequest,
} from "@/features/admin/api/requests";
import { PromoteMunicipalAdminDialog } from "@/features/admin/components/PromoteMunicipalAdminDialog";
import type {
  MunicipalityRequest,
  PromoteMunicipalAdminPayload,
} from "@/features/admin/types";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { toast } from "@/shared/hooks/use-toast";

function formatDate(value: string): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SubscriptionRequestsSection() {
  const [requests, setRequests] = useState<MunicipalityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<MunicipalityRequest | null>(
    null
  );
  const [approving, setApproving] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await getPendingRequests();
      setRequests(data);
    } catch (error) {
      setRequests([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nu s-au putut încărca cererile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const handleReject = async (request: MunicipalityRequest) => {
    setRejectingId(request.id);

    try {
      await rejectRequest(request.id);
      toast({
        title: "Cerere respinsă",
        description: `Cererea de la ${request.institutionName} a fost respinsă.`,
      });
      setRequests((current) =>
        current.filter((item) => item.id !== request.id)
      );
    } catch (error) {
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut respinge cererea.",
        variant: "destructive",
      });
    } finally {
      setRejectingId(null);
    }
  };

  const handleApprove = async (payload: PromoteMunicipalAdminPayload) => {
    if (!approveTarget) return;

    setApproving(true);

    try {
      await approveRequest(approveTarget.id, payload);
      toast({
        title: "Cerere aprobată",
        description: `${approveTarget.institutionName} a fost aprobată și userul a fost promovat la municipal admin.`,
      });
      const approvedId = approveTarget.id;
      setApproveTarget(null);
      setRequests((current) => current.filter((item) => item.id !== approvedId));
    } catch (error) {
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut aproba cererea.",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Cereri de abonament
          </h2>
          <p className="text-sm text-muted-foreground">
            Cereri de acces la abonament în așteptarea aprobării.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void loadRequests()}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          {loading ? "Se încarcă..." : "Reîncarcă"}
        </Button>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Eroare</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(248px,280px))]">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/70 px-6 py-16 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">
              Nicio cerere în așteptare
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Cererile noi de abonament vor apărea aici pentru aprobare.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(248px,280px))]">
          {requests.map((request) => {
            const isRejecting = rejectingId === request.id;
            const isBusy = isRejecting || approving;

            return (
              <Card
                key={request.id}
                className="flex h-full flex-col overflow-hidden rounded-lg border-border/80 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <CardContent className="flex h-full flex-col p-3">
                  <div className="flex flex-1 flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-primary">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug text-foreground">
                          {request.institutionName}
                        </h3>
                      </span>
                      <Badge
                        variant="secondary"
                        className="shrink-0 rounded-md border-transparent bg-amber-500/15 px-2 py-0 text-[11px] text-amber-600"
                      >
                        În așteptare
                      </Badge>
                    </div>

                    <div className="grid gap-1.5 text-xs text-muted-foreground">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{request.username}</span>
                      </span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {request.employeePosition}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {formatDate(request.createdAt)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-foreground">
                        Justificare
                      </p>
                      <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                        {request.justification}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-1.5 border-t pt-2.5">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setApproveTarget(request)}
                      disabled={isBusy}
                    >
                      Aprobă
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 px-2 text-xs"
                      onClick={() => void handleReject(request)}
                      disabled={isBusy}
                    >
                      {isRejecting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Se respinge...
                        </>
                      ) : (
                        "Respinge"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PromoteMunicipalAdminDialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && !approving && setApproveTarget(null)}
        user={approveTarget ? { username: approveTarget.institutionName } : null}
        loading={approving}
        onConfirm={handleApprove}
      />
    </section>
  );
}
