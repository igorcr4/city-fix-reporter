import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { createAccessRequest } from "@/features/subscription/api/subscriptions";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "@/shared/hooks/use-toast";

interface RequestSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormErrors {
  institutionName?: string;
  employeePosition?: string;
  justification?: string;
}

function validate(
  institutionName: string,
  employeePosition: string,
  justification: string
): FormErrors {
  const errors: FormErrors = {};

  if (!institutionName.trim()) {
    errors.institutionName = "Numele instituției este obligatoriu.";
  } else if (institutionName.trim().length > 150) {
    errors.institutionName = "Numele instituției este prea lung.";
  }

  if (!employeePosition.trim()) {
    errors.employeePosition = "Funcția este obligatorie.";
  } else if (employeePosition.trim().length > 150) {
    errors.employeePosition = "Funcția este prea lungă.";
  }

  if (justification.trim().length < 10) {
    errors.justification = "Oferă cel puțin 10 caractere de justificare.";
  } else if (justification.trim().length > 1000) {
    errors.justification = "Justificarea este prea lungă.";
  }

  return errors;
}

export function RequestSubscriptionDialog({
  open,
  onOpenChange,
}: RequestSubscriptionDialogProps) {
  const [institutionName, setInstitutionName] = useState("");
  const [employeePosition, setEmployeePosition] = useState("");
  const [justification, setJustification] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setInstitutionName("");
      setEmployeePosition("");
      setJustification("");
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validate(
      institutionName,
      employeePosition,
      justification
    );
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await createAccessRequest({
        institutionName: institutionName.trim(),
        employeePosition: employeePosition.trim(),
        justification: justification.trim(),
      });

      toast({
        title: "Cerere trimisă",
        description:
          "Cererea ta a fost înregistrată. Vei fi contactat după evaluare.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut trimite cererea.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicită abonament</DialogTitle>
          <DialogDescription>
            Completează datele instituției pentru a primi acces la abonamentele
            FixCity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="institutionName">Numele instituției</Label>
            <Input
              id="institutionName"
              value={institutionName}
              onChange={(event) => setInstitutionName(event.target.value)}
              placeholder="Ex: Primăria Sectorului 1"
              autoComplete="organization"
              disabled={submitting}
            />
            {errors.institutionName && (
              <p className="text-sm text-destructive">{errors.institutionName}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="employeePosition">Funcția ta</Label>
            <Input
              id="employeePosition"
              value={employeePosition}
              onChange={(event) => setEmployeePosition(event.target.value)}
              placeholder="Ex: Responsabil infrastructură"
              autoComplete="organization-title"
              disabled={submitting}
            />
            {errors.employeePosition && (
              <p className="text-sm text-destructive">
                {errors.employeePosition}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="justification">Justificare</Label>
            <Textarea
              id="justification"
              rows={4}
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
              placeholder="Descrie pe scurt de ce ai nevoie de acces la abonament."
              disabled={submitting}
            />
            {errors.justification && (
              <p className="text-sm text-destructive">{errors.justification}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se trimite...
                </>
              ) : (
                "Trimite cererea"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
