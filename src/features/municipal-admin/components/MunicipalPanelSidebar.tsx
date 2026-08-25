import type { LucideIcon } from "lucide-react";

import type { MunicipalSectionId } from "@/features/municipal-admin/helpers/featureGating";
import { cn } from "@/shared/utils/utils";

export interface MunicipalSidebarItem {
  id: MunicipalSectionId;
  label: string;
  icon: LucideIcon;
}

interface MunicipalPanelSidebarProps {
  items: MunicipalSidebarItem[];
  activeId: MunicipalSectionId;
  onSelect: (id: MunicipalSectionId) => void;
}

export function MunicipalPanelSidebar({
  items,
  activeId,
  onSelect,
}: MunicipalPanelSidebarProps) {
  return (
    <nav
      aria-label="Secțiuni panou"
      className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-2 shadow-sm md:w-56 md:shrink-0 md:flex-col md:overflow-visible"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeId;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors md:w-full",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
