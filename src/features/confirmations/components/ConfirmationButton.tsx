import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThumbsUp } from "lucide-react";

import { useAuth } from "@/core/auth/AuthContext";
import {
  toggleReportConfirmation,
  type ConfirmationToggleResult,
} from "@/features/confirmations/api/confirmations";
import type { Report } from "@/shared/types";
import { REPORT_STATUS } from "@/shared/types";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/utils";

interface ConfirmationButtonProps {
  report: Pick<
    Report,
    "id" | "status" | "userId" | "confirmationCount" | "confirmedByCurrentUser"
  >;
  /** Notificat cu starea autoritară după fiecare toggle reușit. */
  onConfirmationChange?: (result: ConfirmationToggleResult) => void;
  className?: string;
}

export function ConfirmationButton({
  report,
  onConfirmationChange,
  className,
}: ConfirmationButtonProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [confirmed, setConfirmed] = useState(report.confirmedByCurrentUser);
  const [count, setCount] = useState(report.confirmationCount);
  const [pending, setPending] = useState(false);

  // Re-sincronizează dacă se schimbă raportul afișat (ex. navigare între detalii).
  useEffect(() => {
    setConfirmed(report.confirmedByCurrentUser);
    setCount(report.confirmationCount);
  }, [report.id, report.confirmedByCurrentUser, report.confirmationCount]);

  const isResolved = report.status === REPORT_STATUS.RESOLVED;
  const isAuthor = isAuthenticated && user?.id === report.userId;
  // Cazuri pe care backend-ul le refuză oricum → butonul nu trebuie apăsabil.
  const locked = isResolved || isAuthor;

  const handleClick = async () => {
    // Utilizator nelogat: nu poate confirma fără cont, îl trimitem spre login.
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (locked || pending) return;

    setPending(true);
    try {
      const result = await toggleReportConfirmation(report.id);
      // Serverul e sursa de adevăr: setăm exact ce a întors.
      setConfirmed(result.confirmed);
      setCount(result.count);
      onConfirmationChange?.(result);
    } catch (error) {
      // 403/409 sau alte erori: nu stricăm UI-ul, păstrăm starea curentă.
      console.error("TOGGLE CONFIRMATION ERROR:", error);
    } finally {
      setPending(false);
    }
  };

  const lockedReason = isResolved
    ? "Raportul este rezolvat — confirmările sunt închise."
    : isAuthor
      ? "Nu poți confirma propriul raport."
      : undefined;

  return (
    <Button
      type="button"
      variant={confirmed ? "default" : "outline"}
      size="sm"
      className={cn("gap-2", className)}
      onClick={handleClick}
      disabled={pending || locked}
      title={lockedReason}
      aria-pressed={confirmed}
    >
      <ThumbsUp className={cn("h-4 w-4", confirmed && "fill-current")} />
      <span>Și eu văd problema</span>
      <span
        className={cn(
          "rounded-full px-1.5 text-xs font-semibold tabular-nums",
          confirmed
            ? "bg-primary-foreground/20"
            : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </Button>
  );
}
