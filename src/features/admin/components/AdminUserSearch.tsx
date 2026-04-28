import { Loader2, Search } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

interface AdminUserSearchProps {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function AdminUserSearch({
  value,
  loading,
  onChange,
  onSubmit,
}: AdminUserSearchProps) {
  const canSearch = value.trim().length > 0 && !loading;

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canSearch) {
              onSubmit();
            }
          }}
          placeholder="Caută după username..."
          className="h-11 pl-9"
        />
      </div>

      <Button
        type="button"
        onClick={onSubmit}
        disabled={!canSearch}
        className="h-11 min-w-32"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Se caută
          </>
        ) : (
          "Caută user"
        )}
      </Button>
    </div>
  );
}
