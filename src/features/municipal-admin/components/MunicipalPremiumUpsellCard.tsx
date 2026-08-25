import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

export function MunicipalPremiumUpsellCard() {
  const navigate = useNavigate();

  return (
    <Card className="mx-auto w-full max-w-7xl rounded-lg border-dashed border-primary/40 bg-primary/5 shadow-sm">
      <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              Activează un abonament ca să deblochezi funcțiile administrative
            </p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Filtre avansate, zone critice, statistici și export devin
              disponibile odată cu un abonament activ pentru orașul tău.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="shrink-0"
          onClick={() => navigate("/subscription")}
        >
          Vezi abonamente
        </Button>
      </CardContent>
    </Card>
  );
}
