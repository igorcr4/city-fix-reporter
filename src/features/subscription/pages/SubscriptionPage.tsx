import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/core/auth/AuthContext";
import { isMunicipalAdminUser } from "@/core/auth/roles";
import {
  createCheckoutSession,
  getCurrentSubscription,
} from "@/features/subscription/api/subscriptions";
import { PlanCard } from "@/features/subscription/components/PlanCard";
import { RequestSubscriptionDialog } from "@/features/subscription/components/RequestSubscriptionDialog";
import { PLANS } from "@/features/subscription/plans";
import {
  isSubscriptionActive,
  type Subscription,
  type SubscriptionPlan,
} from "@/features/subscription/types";
import { Header } from "@/shared/components/layout/Header";
import { Button } from "@/shared/components/ui/button";
import { toast } from "@/shared/hooks/use-toast";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const isMunicipalAdmin = isMunicipalAdminUser(user);

  const [requestOpen, setRequestOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    if (!isMunicipalAdmin) return;

    let active = true;

    const loadSubscription = async () => {
      try {
        const data = await getCurrentSubscription();
        if (active) {
          setSubscription(data);
        }
      } catch (error) {
        if (active) {
          setSubscription(null);
          toast({
            title: "Eroare",
            description:
              error instanceof Error
                ? error.message
                : "Nu s-a putut încărca abonamentul curent.",
            variant: "destructive",
          });
        }
      }
    };

    loadSubscription();

    return () => {
      active = false;
    };
  }, [isMunicipalAdmin]);

  const hasActiveSubscription = isSubscriptionActive(subscription);

  const handleBuy = async (plan: SubscriptionPlan) => {
    if (!user?.municipalityId) {
      toast({
        title: "Oraș lipsă",
        description:
          "Contul tău nu are un oraș asociat. Contactează un administrator.",
        variant: "destructive",
      });
      return;
    }

    setCheckoutPlan(plan);

    try {
      const { checkoutUrl } = await createCheckoutSession({
        municipalityId: user.municipalityId,
        plan,
      });
      window.location.href = checkoutUrl;
    } catch (error) {
      setCheckoutPlan(null);
      toast({
        title: "Eroare",
        description:
          error instanceof Error ? error.message : "Nu s-a putut iniția plata.",
        variant: "destructive",
      });
    }
  };

  const renderAction = (plan: SubscriptionPlan) => {
    if (!isMunicipalAdmin) {
      return (
        <Button
          size="lg"
          className="w-full transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-600"
          onClick={() => setRequestOpen(true)}
        >
          Solicită abonament
        </Button>
      );
    }

    if (hasActiveSubscription) {
      const ownsThisPlan = subscription?.plan === plan;

      return (
        <Button size="lg" className="w-full" disabled>
          {ownsThisPlan ? "Plan activ" : "Ai deja un abonament activ"}
        </Button>
      );
    }

    const isCheckingOutThisPlan = checkoutPlan === plan;

    return (
      <Button
        size="lg"
        className="w-full transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-600"
        onClick={() => handleBuy(plan)}
        disabled={checkoutPlan !== null}
      >
        {isCheckingOutThisPlan ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Se redirecționează...
          </>
        ) : (
          "Cumpără"
        )}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 sm:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Abonamente
          </h1>
          <p className="mt-3 text-muted-foreground">
            Alege planul potrivit pentru orașul tău și deblochează
            instrumente avansate de analiză a raportărilor.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          {PLANS.map((planDefinition) => (
            <PlanCard
              key={planDefinition.plan}
              plan={planDefinition}
              action={renderAction(planDefinition.plan)}
              isCurrent={
                hasActiveSubscription &&
                subscription?.plan === planDefinition.plan
              }
            />
          ))}
        </div>
      </main>

      <RequestSubscriptionDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
      />
    </div>
  );
}
