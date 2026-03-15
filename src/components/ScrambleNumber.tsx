import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ScrambleNumberProps {
  value: number;
  duration?: number;
  active: boolean;
}

export function ScrambleNumber({ value, duration = 800, active }: ScrambleNumberProps) {
  const [display, setDisplay] = useState("--");

  useEffect(() => {
    if (!active) {
      setDisplay("--");
      return;
    }

    let frame = 0;
    const totalFrames = Math.floor(duration / 30);
    
    const interval = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setDisplay(String(value));
        clearInterval(interval);
      } else {
        setDisplay(String(Math.floor(Math.random() * 100)));
      }
    }, 30);

    return () => clearInterval(interval);
  }, [value, duration, active]);

  return (
    <motion.span
      className="font-display text-4xl font-bold text-primary number-glow tabular-nums"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {display}
    </motion.span>
  );
}
