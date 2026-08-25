import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPinned, ShieldCheck, UserRoundCheck, UsersRound } from "lucide-react";

import { useAuth } from "@/core/auth/AuthContext";
import { isAdminUser } from "@/core/auth/roles";
import {
  demoteToRegularUser,
  findAdminUserByUsername,
  promoteToMunicipalAdmin,
} from "@/features/admin/api/admin";
import { AdminUserDetailsCard } from "@/features/admin/components/AdminUserDetailsCard";
import { AdminUserSearch } from "@/features/admin/components/AdminUserSearch";
import { PromoteMunicipalAdminDialog } from "@/features/admin/components/PromoteMunicipalAdminDialog";
import { SubscriptionRequestsSection } from "@/features/admin/components/SubscriptionRequestsSection";
import type {
  AdminUser,
  PromoteMunicipalAdminPayload,
} from "@/features/admin/types";
import { Header } from "@/shared/components/layout/Header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { toast } from "@/shared/hooks/use-toast";

const ROLE_LABELS: Record<AdminUser["role"], string> = {
  ROLE_USER: "User",
  ROLE_MUNICIPAL_ADMIN: "Municipal Admin",
  ROLE_ADMIN: "Admin",
};

export default function AdminControlPanelPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [lastSearchedUsername, setLastSearchedUsername] = useState("");
  const [foundUser, setFoundUser] = useState<AdminUser | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<AdminUser | null>(null);
  const [promoteLoadingUserId, setPromoteLoadingUserId] = useState<number | null>(
    null
  );
  const [demoteTarget, setDemoteTarget] = useState<AdminUser | null>(null);
  const [demoteLoadingUserId, setDemoteLoadingUserId] = useState<number | null>(null);

  useEffect(() => {
    if (user && !isAdminUser(user)) {
      navigate("/reports", { replace: true });
    }
  }, [navigate, user]);

  const searchUser = useCallback(async (username: string) => {
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      setFoundUser(null);
      setHasSearched(false);
      setLastSearchedUsername("");
      setErrorMessage(null);
      return;
    }

    setSearchLoading(true);
    setErrorMessage(null);
    setLastSearchedUsername(normalizedUsername);

    try {
      const adminUser = await findAdminUserByUsername(normalizedUsername);
      setFoundUser(adminUser);
      setHasSearched(true);
    } catch (error) {
      setFoundUser(null);
      setHasSearched(true);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "A apărut o eroare la căutarea utilizatorului."
      );
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSubmitSearch = () => {
    void searchUser(query);
  };

  const refreshFoundUser = async (fallbackUsername: string) => {
    await searchUser(lastSearchedUsername || fallbackUsername);
  };

  const handlePromote = async (payload: PromoteMunicipalAdminPayload) => {
    if (!promoteTarget) return;

    setPromoteLoadingUserId(promoteTarget.id);

    try {
      await promoteToMunicipalAdmin(promoteTarget.id, payload);
      toast({
        title: "Promovare reușită",
        description: `${promoteTarget.username} a fost promovat la municipal admin.`,
      });
      setPromoteTarget(null);
      await refreshFoundUser(promoteTarget.username);
    } catch (error) {
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut promova utilizatorul.",
        variant: "destructive",
      });
    } finally {
      setPromoteLoadingUserId(null);
    }
  };

  const handleDemote = async () => {
    if (!demoteTarget) return;

    setDemoteLoadingUserId(demoteTarget.id);

    try {
      await demoteToRegularUser(demoteTarget.id);
      toast({
        title: "Retrogradare reușită",
        description: `${demoteTarget.username} a revenit la rolul de user simplu.`,
      });
      setDemoteTarget(null);
      await refreshFoundUser(demoteTarget.username);
    } catch (error) {
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut retrograda utilizatorul.",
        variant: "destructive",
      });
    } finally {
      setDemoteLoadingUserId(null);
    }
  };

  if (user && !isAdminUser(user)) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCreateButton={false} />

      <main className="container flex flex-1 flex-col gap-6 py-6">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-gradient-to-br from-primary/10 via-card to-card p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Acces admin
                </div>
                <div>
                  <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                    Admin Control Panel
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                    Caută un utilizator după username, alege locația administrată
                    și gestionează rolul de municipal admin într-un flow clar.
                  </p>
                </div>
              </div>

              <div className="w-full max-w-xl">
                <AdminUserSearch
                  value={query}
                  loading={searchLoading}
                  onChange={setQuery}
                  onSubmit={handleSubmitSearch}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserRoundCheck className="h-4 w-4" />
                Utilizator
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {foundUser?.username ||
                  (hasSearched ? "Negăsit" : "Așteaptă căutare")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Rol curent
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {foundUser ? ROLE_LABELS[foundUser.role] : "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPinned className="h-4 w-4" />
                Oraș
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {foundUser?.municipality?.name || "-"}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="px-6 pb-6">
              <Alert variant="destructive">
                <AlertTitle>Eroare</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </div>
          )}
        </section>

        <section className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Rezultat căutare
              </h2>
              <p className="text-sm text-muted-foreground">
                {lastSearchedUsername
                  ? `Ultima căutare: ${lastSearchedUsername}`
                  : "Introdu username-ul exact pentru a încărca utilizatorul."}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleSubmitSearch}
              disabled={searchLoading || query.trim().length === 0}
            >
              {searchLoading ? "Se caută..." : "Reîncarcă rezultatul"}
            </Button>
          </div>

          {searchLoading ? (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            </div>
          ) : foundUser ? (
            <AdminUserDetailsCard
              user={foundUser}
              onPromote={setPromoteTarget}
              onDemote={setDemoteTarget}
              isPromoting={promoteLoadingUserId === foundUser.id}
              isDemoting={demoteLoadingUserId === foundUser.id}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/70 px-6 py-16 text-center">
              <UsersRound className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">
                  {hasSearched
                    ? "Nu am găsit niciun utilizator"
                    : "Caută un utilizator"}
                </p>
                <p className="max-w-md text-sm text-muted-foreground">
                  {hasSearched
                    ? "Verifică username-ul și încearcă din nou."
                    : "După căutare, aici vei vedea datele userului și acțiunile disponibile pentru roluri."}
                </p>
              </div>
            </div>
          )}
        </section>

        <SubscriptionRequestsSection />
      </main>

      <PromoteMunicipalAdminDialog
        open={!!promoteTarget}
        onOpenChange={(open) => !open && setPromoteTarget(null)}
        user={promoteTarget}
        loading={promoteLoadingUserId !== null}
        onConfirm={handlePromote}
      />

      <AlertDialog
        open={!!demoteTarget}
        onOpenChange={(open) => !open && setDemoteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmă retrogradarea</AlertDialogTitle>
            <AlertDialogDescription>
              {demoteTarget
                ? `Vrei să îl retrogradezi pe ${demoteTarget.username} la rolul de user simplu? Orașul asociat va fi eliminat din UI după succes.`
                : "Confirmă retrogradarea userului selectat."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={demoteLoadingUserId !== null}>
              Anulează
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDemote}
              disabled={demoteLoadingUserId !== null}
            >
              {demoteLoadingUserId !== null
                ? "Se retrogradează..."
                : "Confirmă"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
