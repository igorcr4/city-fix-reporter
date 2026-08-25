import type { MentionUser } from "@/features/comments/types";
import { cn } from "@/shared/utils/utils";

interface MentionSuggestionsProps {
  users: MentionUser[];
  activeIndex: number;
  onSelect: (user: MentionUser) => void;
  onActiveIndexChange: (index: number) => void;
}

export function MentionSuggestions({
  users,
  activeIndex,
  onSelect,
  onActiveIndexChange,
}: MentionSuggestionsProps) {
  if (users.length === 0) return null;

  return (
    <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
      <div className="max-h-48 overflow-y-auto py-1">
        {users.map((user, index) => (
          <button
            key={`${user.userId}-${user.username}`}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
              index === activeIndex
                ? "bg-accent text-accent-foreground"
                : "text-popover-foreground hover:bg-accent/70"
            )}
            onMouseEnter={() => onActiveIndexChange(index)}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(user);
            }}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {user.username.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 truncate font-medium">@{user.username}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
