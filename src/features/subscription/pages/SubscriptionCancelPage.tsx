import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

import { Header } from "@/shared/components/layout/Header";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export default function SubscriptionCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container flex justify-center py-12 sm:py-16">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="items-center space-y-3">
            <XCircle className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="font-heading text-2xl">
              Plată anulată
            </CardTitle>
            <CardDescription>
              Plata a fost anulată și nu s-a perceput nicio sumă. Poți reveni
              oricând pentru a alege un abonament.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate("/subscription")}
            >
              Înapoi la abonamente
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
