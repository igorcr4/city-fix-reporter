import type { ReactNode } from "react";
import { Check } from "lucide-react";

import type { PlanDefinition } from "@/features/subscription/plans";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";

interface PlanCardProps {
  plan: PlanDefinition;
  action: ReactNode;
  /** Planul pe care utilizatorul îl are activ acum → chenar verde. */
  isCurrent?: boolean;
}

export function PlanCard({ plan, action, isCurrent = false }: PlanCardProps) {
  // „Recomandat" (albastru) doar pentru planul evidențiat care NU e cel curent.
  const showRecommended = plan.highlighted && !isCurrent;

  return (
    <Card
      className={cn(
        "flex flex-col",
        isCurrent
          ? "border-2 border-emerald-500 shadow-lg"
          : plan.highlighted && "border-primary shadow-lg"
      )}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-heading text-2xl">{plan.name}</CardTitle>
          {showRecommended && <Badge>Recomandat</Badge>}
        </div>
        <p className="text-3xl font-bold text-foreground">{plan.priceLabel}</p>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="grid gap-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>{action}</CardFooter>
    </Card>
  );
}
