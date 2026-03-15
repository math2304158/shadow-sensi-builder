import { motion } from "framer-motion";
import { ScrambleNumber } from "./ScrambleNumber";

interface SensitivityData {
  geral: number;
  pontoVermelho: number;
  mira2x: number;
  mira4x: number;
  miraAWM: number;
  cameraLivre: number;
}

interface SensitivityGridProps {
  data: SensitivityData;
  active: boolean;
}

const labels: { key: keyof SensitivityData; label: string }[] = [
  { key: "geral", label: "GERAL" },
  { key: "pontoVermelho", label: "PONTO VERMELHO" },
  { key: "mira2x", label: "MIRA 2X" },
  { key: "mira4x", label: "MIRA 4X" },
  { key: "miraAWM", label: "MIRA AWM" },
  { key: "cameraLivre", label: "CÂMERA LIVRE" },
];

export function SensitivityGrid({ data, active }: SensitivityGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {labels.map(({ key, label }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 + 0.2, duration: 0.3 }}
          className="bg-card border border-border p-4 flex flex-col items-center gap-2 relative overflow-hidden"
        >
          {/* Subtle top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-primary/40" />
          
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            {label}
          </span>
          <ScrambleNumber value={data[key]} active={active} duration={800 + i * 150} />
        </motion.div>
      ))}
    </div>
  );
}
