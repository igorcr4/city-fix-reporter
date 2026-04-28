import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function FloatingAddButton() {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate("/reports/new")}
      size="lg"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl md:bottom-8 md:right-8"
      aria-label="Raport nou"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
