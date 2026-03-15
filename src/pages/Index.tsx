import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import { generateSensitivity } from "@/lib/sensitivityEngine";
import { SensitivityGrid } from "@/components/SensitivityGrid";
import { KeyActivation } from "@/components/KeyActivation";
import { Shield, Crosshair, RotateCw, Settings } from "lucide-react";

type Phase = "idle" | "scanning" | "done";

const Index = () => {
  const device = useDeviceDetect();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [sensitivity, setSensitivity] = useState<ReturnType<typeof generateSensitivity> | null>(null);
  const [activated, setActivated] = useState(() => localStorage.getItem("shadowsensi_activated") === "true");

  const handleGenerate = useCallback(() => {
    if (!device) return;
    setPhase("scanning");
    
    setTimeout(() => {
      const result = generateSensitivity(device.model, device.screen);
      setSensitivity(result);
      setPhase("done");
    }, 1800);
  }, [device]);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setSensitivity(null);
  }, []);

  return (
    <div className="min-h-screen bg-background relative scanline-overlay flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="font-display text-sm font-bold tracking-wider text-foreground">
          SHADOW<span className="text-primary">SENSI</span>
        </h1>
        <button
          onClick={() => navigate("/admin-login")}
          className="ml-auto text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        >
          <Settings className="w-3 h-3" />
        </button>
      </header>

      {!activated ? (
        <KeyActivation onActivated={() => setActivated(true)} />
      ) : (
        <main className="flex-1 flex flex-col px-4 py-6 gap-5 max-w-md mx-auto w-full">
          {/* Device Detection Box */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border p-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-primary/30" />
            <div className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] mb-3 uppercase">
              // SYSTEM STATUS
            </div>
            {device ? (
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DEVICE_ID:</span>
                  <span className="text-foreground">{device.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OS:</span>
                  <span className="text-foreground">{device.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DISPLAY:</span>
                  <span className="text-foreground">{device.screen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GPU:</span>
                  <span className="text-foreground truncate ml-4">{device.gpu}</span>
                </div>
              </div>
            ) : (
              <div className="font-mono text-xs text-muted-foreground flicker">
                Detectando dispositivo...
              </div>
            )}
          </motion.div>

          {/* Scanning Phase */}
          <AnimatePresence>
            {phase === "scanning" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-card border border-primary/30 p-4 space-y-3"
              >
                <div className="font-mono text-xs text-primary tracking-widest uppercase flicker">
                  ⟩ ANALISANDO HARDWARE...
                </div>
                <div className="h-1 bg-muted overflow-hidden">
                  <div className="h-full bg-primary scan-bar" />
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  Calculando sensibilidade otimizada para {device?.model}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button or Results */}
          {phase === "idle" && (
            <motion.button
              onClick={handleGenerate}
              disabled={!device}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.97 }}
              className="relative bg-primary/10 border border-primary/40 py-4 px-6 font-display text-sm font-bold tracking-widest text-primary uppercase transition-all hover:bg-primary/20 disabled:opacity-30 group"
              style={{ boxShadow: "var(--glow-primary)" }}
            >
              <Crosshair className="w-4 h-4 inline-block mr-2 -mt-0.5" />
              GERAR SENSIBILIDADE OTIMIZADA
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            </motion.button>
          )}

          {phase === "done" && sensitivity && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="font-mono text-[10px] text-primary tracking-widest uppercase text-center">
                ✓ SENSIBILIDADE GERADA COM SUCESSO
              </div>
              
              <SensitivityGrid data={sensitivity} active={phase === "done"} />

              <motion.button
                onClick={handleReset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                whileTap={{ scale: 0.97 }}
                className="w-full border border-border bg-card py-3 font-mono text-xs text-muted-foreground tracking-widest uppercase hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw className="w-3 h-3" />
                GERAR NOVAMENTE
              </motion.button>
            </motion.div>
          )}

          {/* Footer info */}
          <div className="mt-auto pt-8 text-center font-mono text-[9px] text-muted-foreground/50 tracking-widest uppercase space-y-1">
            <p>SHADOW SENSI // FREE FIRE</p>
            <p>OTIMIZADO PARA SEU DISPOSITIVO</p>
          </div>
        </main>
      )}
    </div>
  );
};

export default Index;
