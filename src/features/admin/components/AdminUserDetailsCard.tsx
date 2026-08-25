import { Building2, Mail, Shield, UserCog } from "lucide-react";

import type { AdminUser } from "@/features/admin/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

interface AdminUserDetailsCardProps {
  user: AdminUser;
  onPromote: (user: AdminUser) => void;
  onDemote: (user: AdminUser) => void;
  isPromoting: boolean;
  isDemoting: boolean;
}

const ROLE_LABELS: Record<AdminUser["role"], string> = {
  ROLE_USER: "User",
  ROLE_MUNICIPAL_ADMIN: "Municipal Admin",
  ROLE_ADMIN: "Admin",
};

const ROLE_BADGE_CLASSES: Record<AdminUser["role"], string> = {
  ROLE_USER: "bg-muted text-muted-foreground",
  ROLE_MUNICIPAL_ADMIN: "bg-amber-100 text-amber-800",
  ROLE_ADMIN: "bg-sky-100 text-sky-800",
};

export function AdminUserDetailsCard({
  user,
  onPromote,
  onDemote,
  isPromoting,
  isDemoting,
}: AdminUserDetailsCardProps) {
  const canPromote = user.role === "ROLE_USER";
  const canDemote = user.role === "ROLE_MUNICIPAL_ADMIN";
  const isBusy = isPromoting || isDemoting;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Utilizator găsit
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {user.username}
            </h2>
          </div>

          <Badge
            variant="secondary"
            className={`inline-flex w-fit items-center gap-1.5 px-3 py-1 ${ROLE_BADGE_CLASSES[user.role]}`}
          >
            <Shield className="h-3.5 w-3.5" />
            {ROLE_LABELS[user.role]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {user.email || "Email indisponibil"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rol curent
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
              <Shield className="h-4 w-4 text-muted-foreground" />
              {ROLE_LABELS[user.role]}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Oraș
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {user.municipality?.name || "Nealocată"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          {canPromote && (
            <Button
              type="button"
              onClick={() => onPromote(user)}
              disabled={isBusy}
              className="gap-2"
            >
              <UserCog className="h-4 w-4" />
              {isPromoting ? "Se promovează..." : "Promovează"}
            </Button>
          )}

          {canDemote && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onDemote(user)}
              disabled={isBusy}
              className="gap-2"
            >
              <UserCog className="h-4 w-4" />
              {isDemoting ? "Se retrogradează..." : "Retrogradează"}
            </Button>
          )}

          {!canPromote && !canDemote && (
            <Badge variant="outline" className="justify-center px-3 py-2 text-xs">
              Fără acțiuni disponibile
            </Badge>
          )}
        </div>
      </div>
    </article>
  );
}
