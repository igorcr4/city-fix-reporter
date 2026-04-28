import { useAuth } from "@/core/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface HeaderProps {
  showCreateButton?: boolean;
  showLogoutButton?: boolean;
}

export function Header({
  showCreateButton = true,
  showLogoutButton = true,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="font-heading text-xl font-bold text-primary"
        >
          FixCity
        </button>

        {user && (showCreateButton || showLogoutButton) && (
          <div className="flex items-center gap-2">
            {showCreateButton && (
              <Button
                size="sm"
                onClick={() => navigate("/reports/new")}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Raport nou</span>
              </Button>
            )}

            {showLogoutButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}