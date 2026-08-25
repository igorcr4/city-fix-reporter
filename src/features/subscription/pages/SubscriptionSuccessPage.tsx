import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

import { getCurrentSubscription } from "@/features/subscription/api/subscriptions";
import { PLANS } from "@/features/subscription/plans";
import {
  isSubscriptionActive,
  type Subscription,
} from "@/features/subscription/types";
import { Header } from "@/shared/components/layout/Header";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { toast } from "@/shared/hooks/use-toast";

type Phase = "checking" | "active" | "pending";

const MAX_AUTO_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3000;

function getPlanName(plan: string): string {
  return PLANS.find((definition) => definition.plan === plan)?.name ?? plan;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("checking");
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    const wait = (ms: number) =>
      new Promise((resolve) => window.setTimeout(resolve, ms));

    const poll = async () => {
      for (let attempt = 0; attempt < MAX_AUTO_ATTEMPTS; attempt++) {
        try {
          const data = await getCurrentSubscription();
          if (cancelled) return;

          setSubscription(data);

          if (isSubscriptionActive(data)) {
            setPhase("active");
            return;
          }
        } catch {
          // Eroarea poate fi tranzitorie cât timp webhook-ul procesează plata;
          // continuăm să reîncercăm și marcăm „în așteptare" la final.
          if (cancelled) return;
        }

        if (attempt < MAX_AUTO_ATTEMPTS - 1) {
          await wait(RETRY_DELAY_MS);
          if (cancelled) return;
        }
      }

      if (!cancelled) {
        setPhase("pending");
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRecheck = async () => {
    setPhase("checking");

    try {
      const data = await getCurrentSubscription();
      setSubscription(data);
      setPhase(isSubscriptionActive(data) ? "active" : "pending");
    } catch (error) {
      setPhase("pending");
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut verifica abonamentul.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container flex justify-center py-12 sm:py-16">
        <Card className="w-full max-w-md text-center">
          {phase === "checking" && (
            <>
              <CardHeader className="items-center space-y-3">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <CardTitle className="font-heading text-2xl">
                  Se procesează plata...
                </CardTitle>
                <CardDescription>
                  Verificăm starea abonamentului. Durează doar câteva momente.
                </CardDescription>
              </CardHeader>
            </>
          )}

          {phase === "active" && (
            <>
              <CardHeader className="items-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-primary" />
                <CardTitle className="font-heading text-2xl">
                  Abonamentul tău este activ!
                </CardTitle>
                <CardDescription>
                  Mulțumim! Plata a fost confirmată cu succes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {subscription && (
                  <>
                    <p className="text-foreground">
                      Plan:{" "}
                      <span className="font-semibold">
                        {getPlanName(subscription.plan)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Valabil până la {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate("/subscription")}
                >
                  Înapoi la abonamente
                </Button>
              </CardFooter>
            </>
          )}

          {phase === "pending" && (
            <>
              <CardHeader className="items-center space-y-3">
                <Clock className="h-12 w-12 text-muted-foreground" />
                <CardTitle className="font-heading text-2xl">
                  Plata a fost inițiată
                </CardTitle>
                <CardDescription>
                  Abonamentul se activează în câteva momente. Poți verifica din
                  nou starea sau revii mai târziu.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleRecheck}
                >
                  Verifică din nou
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate("/subscription")}
                >
                  Înapoi la abonamente
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
