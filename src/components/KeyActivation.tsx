import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface KeyActivationProps {
  onActivated: () => void;
}

export const KeyActivation = ({ onActivated }: KeyActivationProps) => {
  const [keyInput, setKeyInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyInput.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);

    // Check if key exists and is unused
    const { data: keyData, error: fetchError } = await supabase
      .from("access_keys")
      .select("id, is_used")
      .eq("key_code", trimmed)
      .maybeSingle();

    if (fetchError || !keyData) {
      toast({ title: "Key inválida", description: "Essa key não existe", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (keyData.is_used) {
      toast({ title: "Key já utilizada", description: "Essa key já foi usada por outra pessoa", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Mark key as used
    const { error: updateError } = await supabase
      .from("access_keys")
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq("id", keyData.id);

    if (updateError) {
      toast({ title: "Erro", description: "Não foi possível ativar a key", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Save activation in localStorage
    localStorage.setItem("shadowsensi_activated", "true");
    localStorage.setItem("shadowsensi_key", trimmed);
    toast({ title: "✓ Key ativada!", description: "Acesso liberado para gerar sensibilidade" });
    onActivated();
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex items-center justify-center px-4"
    >
      <form onSubmit={handleActivate} className="w-full max-w-sm space-y-4">
        <div className="bg-card border border-border p-6 space-y-4">
          <div className="text-center space-y-2">
            <KeyRound className="w-8 h-8 text-primary mx-auto" />
            <div className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] uppercase">
              // ACESSO RESTRITO
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              Insira uma key de acesso para desbloquear a geração de sensibilidade
            </p>
          </div>

          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
            placeholder="SS-XXXX-XXXX-XXXX-XXXX"
            className="w-full bg-background border border-border px-3 py-3 font-mono text-sm text-foreground text-center tracking-widest focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/30"
            required
          />

          <button
            type="submit"
            disabled={loading || !keyInput.trim()}
            className="w-full bg-primary/10 border border-primary/40 py-3 font-display text-xs font-bold tracking-widest text-primary uppercase hover:bg-primary/20 disabled:opacity-30 transition-colors flex items-center justify-center gap-2"
            style={{ boxShadow: "var(--glow-primary)" }}
          >
            <ArrowRight className="w-3 h-3" />
            {loading ? "VERIFICANDO..." : "ATIVAR KEY"}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
