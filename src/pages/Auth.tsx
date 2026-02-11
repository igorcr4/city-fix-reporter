import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { login, register } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-city.jpg";
import { MapPin } from "lucide-react";

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword) return;
    setLoading(true);
    try {
      const user = await login({ username: loginUsername.trim(), password: loginPassword });
      setUser(user);
      toast({ title: "Bine ai venit!", description: `Salut, ${user.username}!` });
      navigate("/");
    } catch {
      toast({ title: "Eroare", description: "Autentificare eșuată. Verifică datele.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) return;
    if (regPassword.length < 6) {
      toast({ title: "Eroare", description: "Parola trebuie să aibă minim 6 caractere.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const user = await register({ username: regUsername.trim(), email: regEmail.trim(), password: regPassword });
      setUser(user);
      toast({ title: "Cont creat!", description: "Bine ai venit în FixCity!" });
      navigate("/");
    } catch {
      toast({ title: "Eroare", description: "Înregistrare eșuată. Încearcă din nou.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero section */}
      <div className="relative h-48 overflow-hidden sm:h-56">
        <img src={heroImage} alt="Oraș" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 to-primary/90" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground">
          <MapPin className="mb-2 h-8 w-8" />
          <h1 className="font-heading text-3xl font-bold">FixCity</h1>
          <p className="mt-1 text-sm opacity-90">Raportează. Rezolvă. Îmbunătățește.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mt-6 max-w-md">
        <div className="mb-6 flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
              tab === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Autentificare
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
              tab === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Înregistrare
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-user">Utilizator</Label>
              <Input id="login-user" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="username" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-pass">Parolă</Label>
              <Input id="login-pass" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••" required />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="mt-2 text-base">
              {loading ? "Se conectează..." : "Login"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reg-user">Utilizator</Label>
              <Input id="reg-user" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} placeholder="username" maxLength={50} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="email@exemplu.ro" maxLength={255} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-pass">Parolă</Label>
              <Input id="reg-pass" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="minim 6 caractere" required />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="mt-2 text-base">
              {loading ? "Se creează contul..." : "Creează cont"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
