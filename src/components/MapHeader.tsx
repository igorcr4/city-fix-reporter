import { useNavigate } from "react-router-dom";
import { ProfileMenu } from "@/components/ProfileMenu";

export function MapHeader() {
  const navigate = useNavigate();

  return (
    <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-3">
      <button
        onClick={() => navigate("/")}
        className="rounded-lg bg-card/90 px-3 py-1.5 font-heading text-lg font-bold text-primary shadow-md backdrop-blur-md"
      >
        FixCity
      </button>
      <div className="rounded-full bg-card/90 shadow-md backdrop-blur-md">
        <ProfileMenu />
      </div>
    </header>
  );
}
