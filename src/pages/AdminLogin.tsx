import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, LogIn } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({ title: "Erro", description: "Credenciais inválidas", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check if user has admin role
    const { data: hasRole } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });

    if (!hasRole) {
      await supabase.auth.signOut();
      toast({ title: "Acesso negado", description: "Você não tem permissão de administrador", variant: "destructive" });
      setLoading(false);
      return;
    }

    navigate("/admin");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background scanline-overlay flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="font-display text-sm font-bold tracking-wider text-foreground">
          SHADOW<span className="text-primary">SENSI</span>
          <span className="text-muted-foreground ml-2 text-[10px]">// ADMIN</span>
        </h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div className="bg-card border border-border p-6 space-y-4">
            <div className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] uppercase">
              // AUTENTICAÇÃO ADMIN
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                E-MAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                SENHA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary/10 border border-primary/40 py-3 font-display text-xs font-bold tracking-widest text-primary uppercase hover:bg-primary/20 disabled:opacity-30 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-3 h-3" />
              {loading ? "VERIFICANDO..." : "ACESSAR PAINEL"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AdminLogin;
