import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import type { Report } from "@/types";
import { ReportMap } from "@/components/ReportMap";
import { MapHeader } from "@/components/MapHeader";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { Loader2, Inbox } from "lucide-react";

// TODO: Date mock pentru demo — elimină când backend-ul e conectat
const MOCK_REPORTS: Report[] = [
  {
    id: 1,
    title: "Groapă mare pe strada Eminescu",
    description: "Groapă adâncă de circa 30cm care pune în pericol mașinile.",
    category: "DRUM",
    status: "OPEN",
    authorUsername: "ion.popescu",
    authorId: 1,
    latitude: 44.4350,
    longitude: 26.1020,
    createdAt: "2026-02-10T10:00:00Z",
    updatedAt: "2026-02-10T10:00:00Z",
  },
  {
    id: 2,
    title: "Stâlp de iluminat nefuncțional",
    description: "Stâlpul de pe colțul străzii Libertății nu funcționează de 3 zile.",
    category: "ILUMINAT",
    status: "IN_PROGRESS",
    authorUsername: "maria.ionescu",
    authorId: 2,
    latitude: 44.4280,
    longitude: 26.1100,
    createdAt: "2026-02-08T14:30:00Z",
    updatedAt: "2026-02-09T09:00:00Z",
  },
  {
    id: 3,
    title: "Gunoi abandonat lângă parc",
    description: "Saci de gunoi aruncați lângă intrarea în Parcul Central.",
    category: "GUNOI",
    status: "RESOLVED",
    authorUsername: "ion.popescu",
    authorId: 1,
    latitude: 44.4260,
    longitude: 26.0950,
    createdAt: "2026-02-05T08:00:00Z",
    updatedAt: "2026-02-07T16:00:00Z",
  },
  {
    id: 4,
    title: "Graffiti pe clădirea primăriei",
    description: "Vandalism pe peretele lateral al primăriei.",
    category: "VANDALISM",
    status: "OPEN",
    authorUsername: "alex.popa",
    authorId: 3,
    latitude: 44.4310,
    longitude: 26.0970,
    createdAt: "2026-02-11T07:00:00Z",
    updatedAt: "2026-02-11T07:00:00Z",
  },
];

export default function ReportsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    // TODO: Replace with real API call
    setTimeout(() => {
      setReports(MOCK_REPORTS);
      setLoading(false);
    }, 300);
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapHeader />

      {reports.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted text-muted-foreground">
          <Inbox className="h-12 w-12" />
          <p className="text-base font-medium">Niciun raport în această zonă.</p>
          <p className="text-sm">Fii primul care raportează o problemă!</p>
        </div>
      ) : (
        <ReportMap reports={reports} className="h-full w-full" />
      )}

      <FloatingAddButton />
    </div>
  );
}
