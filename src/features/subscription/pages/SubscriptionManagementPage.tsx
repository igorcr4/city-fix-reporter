import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ro } from "date-fns/locale/ro";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  Loader2,
} from "lucide-react";

import { useAuth } from "@/core/auth/AuthContext";
import { isMunicipalAdminUser } from "@/core/auth/roles";
import {
  cancelSubscription,
  getCurrentSubscription,
} from "@/features/subscription/api/subscriptions";
import { PlanCard } from "@/features/subscription/components/PlanCard";
import { PLANS } from "@/features/subscription/plans";
import {
  isSubscriptionActive,
  type Subscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@/features/subscription/types";
import { Header } from "@/shared/components/layout/Header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { toast } from "@/shared/hooks/use-toast";

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: "Activ",
  PAST_DUE: "Restanță la plată",
  CANCELED: "Anulat",
  INCOMPLETE: "Incomplet",
  INCOMPLETE_EXPIRED: "Expirat",
  TRIALING: "Perioadă de probă",
  UNPAID: "Neplătit",
};

function getPlanName(plan: string): string {
  return PLANS.find((definition) => definition.plan === plan)?.name ?? plan;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return format(date, "d MMMM yyyy", { locale: ro });
}

export default function SubscriptionManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMunicipalAdmin = isMunicipalAdminUser(user);

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (user && !isMunicipalAdmin) {
      navigate("/subscription", { replace: true });
    }
  }, [user, isMunicipalAdmin, navigate]);

  const loadSubscription = async () => {
    setLoading(true);

    try {
      const data = await getCurrentSubscription();
      setSubscription(data);
    } catch (error) {
      setSubscription(null);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut încărca abonamentul.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isMunicipalAdmin) return;
    void loadSubscription();
  }, [isMunicipalAdmin]);

  const handleCancel = async () => {
    setCanceling(true);

    try {
      await cancelSubscription();
      toast({
        title: "Anulare programată",
        description:
          "Abonamentul va rămâne activ până la finalul perioadei curente.",
      });
      setConfirmOpen(false);
      await loadSubscription();
    } catch (error) {
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut anula abonamentul.",
        variant: "destructive",
      });
    } finally {
      setCanceling(false);
    }
  };

  if (user && !isMunicipalAdmin) {
    return null;
  }

  const hasActiveSubscription = isSubscriptionActive(subscription);
  const validUntil = subscription
    ? formatDate(subscription.currentPeriodEnd)
    : "";

  const renderPlanAction = (plan: SubscriptionPlan) => {
    const ownsThisPlan = subscription?.plan === plan;

    if (ownsThisPlan) {
      return (
        <Button size="lg" className="w-full" disabled>
          Planul tău actual
        </Button>
      );
    }

    // Schimbarea planului necesită un endpoint dedicat în backend (încă inexistent).
    return (
      <Button size="lg" variant="outline" className="w-full" disabled>
        Schimbă planul (în curând)
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showCreateButton={false} />

      <main className="container max-w-5xl py-10">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Abonament</h1>
          <p className="mt-2 text-muted-foreground">
            Gestionează abonamentul orașului tău: detalii, perioadă de
            valabilitate, anulare și plan.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-52 rounded-xl" />
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
            </div>
          </div>
        ) : !hasActiveSubscription ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">
                  Nu ai un abonament activ
                </p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Activează un abonament ca să deblochezi instrumentele
                  administrative pentru orașul tău.
                </p>
              </div>
              <Button size="lg" onClick={() => navigate("/subscription")}>
                Vezi planurile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Detalii abonament
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className={cn(
                      subscription?.status === "ACTIVE" &&
                        "border-transparent bg-emerald-500 text-white hover:bg-emerald-500"
                    )}
                  >
                    {subscription
                      ? STATUS_LABELS[subscription.status] ?? subscription.status
                      : ""}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem
                    label="Plan"
                    value={subscription ? getPlanName(subscription.plan) : "-"}
                  />
                  <DetailItem
                    label="Status"
                    value={
                      subscription
                        ? STATUS_LABELS[subscription.status] ??
                          subscription.status
                        : "-"
                    }
                  />
                  <DetailItem
                    label="Început perioadă"
                    value={
                      subscription
                        ? formatDate(subscription.currentPeriodStart)
                        : "-"
                    }
                  />
                  <DetailItem label="Valabil până la" value={validUntil} />
                </div>

                {subscription?.cancelAtPeriodEnd ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Abonamentul va fi anulat la {validUntil}. Până atunci
                      rămâne activ și nu vei mai fi taxat după această dată.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <CalendarClock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">
                          Anulează abonamentul
                        </p>
                        <p className="text-muted-foreground">
                          Rămâne activ până la {validUntil}, apoi se oprește.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmOpen(true)}
                    >
                      Anulează abonamentul
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Planuri
                </h2>
                <p className="text-sm text-muted-foreground">
                  Planul tău actual este evidențiat. Schimbarea planului va fi
                  disponibilă în curând.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {PLANS.map((planDefinition) => (
                  <PlanCard
                    key={planDefinition.plan}
                    plan={planDefinition}
                    action={renderPlanAction(planDefinition.plan)}
                    isCurrent={
                      hasActiveSubscription &&
                      subscription?.plan === planDefinition.plan
                    }
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !canceling && setConfirmOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmă anularea</AlertDialogTitle>
            <AlertDialogDescription>
              Abonamentul va rămâne activ până la {validUntil}, apoi se va opri.
              Nu vei mai fi taxat după această dată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={canceling}>Renunță</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleCancel();
              }}
              disabled={canceling}
            >
              {canceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se anulează...
                </>
              ) : (
                "Confirmă anularea"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
