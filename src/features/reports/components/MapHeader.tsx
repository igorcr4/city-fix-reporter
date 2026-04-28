import { useNavigate } from "react-router-dom";
import { ProfileMenu } from "@/features/reports/components/ProfileMenu";
import type { ReportCategory } from "@/shared/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/shared/types";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { MapPin, SlidersHorizontal } from "lucide-react";

interface MapHeaderProps {
  selectedCategory: ReportCategory | "ALL";
  onCategoryChange: (category: ReportCategory | "ALL") => void;
}

const categories: Array<ReportCategory | "ALL"> = [
  "ALL",
  "ROAD",
  "LIGHTING",
  "WASTE",
  "VANDALISM",
  "OTHER",
];

export function MapHeader({
  selectedCategory,
  onCategoryChange,
}: MapHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="absolute left-0 right-0 top-0 z-30 px-4 py-3">
      <div className="relative flex items-center justify-end">
        <button
          onClick={() => navigate("/reports")}
          className="absolute left-1/2 -translate-x-1/2 rounded-lg bg-card/90 px-3 py-1.5 font-heading text-lg font-bold text-primary shadow-md backdrop-blur-md"
        >
          FixCity
        </button>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-full bg-card/90 px-3 shadow-md backdrop-blur-md"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {selectedCategory !== "ALL" && (
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-white/80 shadow-sm"
                    style={{ backgroundColor: CATEGORY_COLORS[selectedCategory] }}
                  >
                    <MapPin className="h-3 w-3 text-white" />
                  </span>
                )}
                <span className="hidden sm:inline">
                  {selectedCategory === "ALL"
                    ? "Filtru"
                    : CATEGORY_LABELS[selectedCategory]}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuRadioGroup
                value={selectedCategory}
                onValueChange={(value) =>
                  onCategoryChange(value as ReportCategory | "ALL")
                }
              >
                {categories.map((category) => (
                  <DropdownMenuRadioItem key={category} value={category}>
                    <span className="flex items-center gap-2">
                      {category === "ALL" ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-foreground/70" />
                      ) : (
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full border border-white/80 shadow-sm"
                          style={{ backgroundColor: CATEGORY_COLORS[category] }}
                        >
                          <MapPin className="h-3 w-3 text-white" />
                        </span>
                      )}
                      <span>
                        {category === "ALL"
                          ? "Toate categoriile"
                          : CATEGORY_LABELS[category]}
                      </span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="rounded-full bg-card/90 shadow-md backdrop-blur-md">
            <ProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
