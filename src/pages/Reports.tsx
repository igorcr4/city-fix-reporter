import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAllReports, getMyReports } from "@/lib/api";
import type { Report } from "@/types";
import { Header } from "@/components/Header";
import { ReportCard } from "@/components/ReportCard";
import { Loader2, AlertTriangle, Inbox } from "lucide-react";

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
    createdAt: "2026-02-11T07:00:00Z",
    updatedAt: "2026-02-11T07:00:00Z",
  },
];

export default function ReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    fetchReports();
  }, [isAuthenticated, tab]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Înlocuiește cu apeluri reale când backend-ul e conectat
      // const data = tab === "mine" ? await getMyReports() : await getAllReports();
      const data = tab === "mine"
        ? MOCK_REPORTS.filter((r) => r.authorId === user?.id)
        : MOCK_REPORTS;
      setReports(data);
    } catch {
      setError("Nu s-au putut încărca rapoartele.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container flex flex-1 flex-col gap-4 py-4">
        {/* Filter tabs */}
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setTab("all")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Toate rapoartele
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === "mine" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Rapoartele mele
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            <p className="text-sm">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">Niciun raport găsit.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((report, i) => (
              <ReportCard key={report.id} report={report} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
