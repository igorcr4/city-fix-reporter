import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function FloatingAddButton() {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate("/reports/new")}
      size="lg"
      className="mobile-map-floating-action fixed z-50 h-14 w-14 touch-manipulation rounded-full shadow-xl"
      aria-label="Raport nou"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
