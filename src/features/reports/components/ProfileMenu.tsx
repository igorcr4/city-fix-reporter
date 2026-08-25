import { useAuth } from "@/core/auth/AuthContext";
import { isAdminUser, isMunicipalAdminUser } from "@/core/auth/roles";
import { useNavigate } from "react-router-dom";
import { User, FileText, LogOut, ShieldCheck, Building2, CreditCard } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          aria-label="Cont"
        >
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        collisionPadding={16}
        sideOffset={8}
        className="w-48 max-w-[calc(100vw-2rem)]"
      >
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-foreground">{user.username}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/my-reports")} className="gap-2">
          <FileText className="h-4 w-4" />
          Rapoartele mele
        </DropdownMenuItem>
        {isMunicipalAdminUser(user) && (
          <DropdownMenuItem
            onClick={() => navigate("/municipal-admin")}
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            Panou Administrativ
          </DropdownMenuItem>
        )}
        {isMunicipalAdminUser(user) && (
          <DropdownMenuItem
            onClick={() => navigate("/subscription/manage")}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Abonament
          </DropdownMenuItem>
        )}
        {isAdminUser(user) && (
          <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Admin panel
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Deconectare
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
