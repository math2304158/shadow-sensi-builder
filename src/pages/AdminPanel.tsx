import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Plus, LogOut, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function generateKeyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "SS-";
  for (let i = 0; i < 4; i++) {
    if (i > 0) key += "-";
    for (let j = 0; j < 4; j++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return key;
}

interface AccessKey {
  id: string;
  key_code: string;
  is_used: boolean;
  created_at: string;
  used_at: string | null;
}

const AdminPanel = () => {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [keyCount, setKeyCount] = useState(1);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin-login");
      return;
    }
    const { data: hasRole } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!hasRole) {
      await supabase.auth.signOut();
      navigate("/admin-login");
    }
  }, [navigate]);

  const fetchKeys = useCallback(async () => {
    const { data } = await supabase
      .from("access_keys")
      .select("*")
      .order("created_at", { ascending: false });
    setKeys(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth().then(fetchKeys);
  }, [checkAuth, fetchKeys]);

  const handleCreateKeys = async () => {
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newKeys = Array.from({ length: keyCount }, () => ({
      key_code: generateKeyCode(),
      created_by: user.id,
    }));

    const { error } = await supabase.from("access_keys").insert(newKeys);
    if (error) {
      toast({ title: "Erro", description: "Falha ao criar keys", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: `${keyCount} key(s) criada(s)` });
      fetchKeys();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("access_keys").delete().eq("id", id);
    if (!error) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast({ title: "Key removida" });
    }
  };

  const handleCopy = (keyCode: string, id: string) => {
    navigator.clipboard.writeText(keyCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
  };

  const usedCount = keys.filter((k) => k.is_used).length;
  const availableCount = keys.filter((k) => !k.is_used).length;

  return (
    <div className="min-h-screen bg-background scanline-overlay flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="font-display text-sm font-bold tracking-wider text-foreground">
          SHADOW<span className="text-primary">SENSI</span>
          <span className="text-muted-foreground ml-2 text-[10px]">// PAINEL ADMIN</span>
        </h1>
        <button
          onClick={handleLogout}
          className="ml-auto text-muted-foreground hover:text-primary transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "TOTAL", value: keys.length },
            { label: "DISPONÍVEIS", value: availableCount },
            { label: "USADAS", value: usedCount },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border p-3 text-center">
              <div className="font-mono text-lg text-primary font-bold">{stat.value}</div>
              <div className="font-mono text-[8px] text-muted-foreground tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Create Keys */}
        <div className="bg-card border border-border p-4 space-y-3">
          <div className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] uppercase">
            // GERAR NOVAS KEYS
          </div>
          <div className="flex gap-2">
            <select
              value={keyCount}
              onChange={(e) => setKeyCount(Number(e.target.value))}
              className="bg-background border border-border px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {[1, 5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>{n} key{n > 1 ? "s" : ""}</option>
              ))}
            </select>
            <button
              onClick={handleCreateKeys}
              disabled={creating}
              className="flex-1 bg-primary/10 border border-primary/40 py-2 font-display text-xs font-bold tracking-widest text-primary uppercase hover:bg-primary/20 disabled:opacity-30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-3 h-3" />
              {creating ? "CRIANDO..." : "CRIAR"}
            </button>
          </div>
        </div>

        {/* Keys List */}
        <div className="space-y-1">
          <div className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] uppercase mb-2">
            // KEYS ({keys.length})
          </div>
          {loading ? (
            <div className="font-mono text-xs text-muted-foreground flicker">Carregando...</div>
          ) : keys.length === 0 ? (
            <div className="font-mono text-xs text-muted-foreground">Nenhuma key criada ainda.</div>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className={`bg-card border p-3 flex items-center gap-2 ${
                  key.is_used ? "border-muted opacity-50" : "border-border"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-foreground truncate">{key.key_code}</div>
                  <div className="font-mono text-[9px] text-muted-foreground">
                    {key.is_used ? "⊘ USADA" : "◉ DISPONÍVEL"}
                  </div>
                </div>
                {!key.is_used && (
                  <>
                    <button
                      onClick={() => handleCopy(key.key_code, key.id)}
                      className="text-muted-foreground hover:text-primary transition-colors p-1"
                    >
                      {copiedId === key.id ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
