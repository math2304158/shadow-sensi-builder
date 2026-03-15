// Sensitivity generation based on device specs
// Uses screen resolution, pixel ratio, and performance hints to generate
// optimized Free Fire sensitivity values

interface SensitivityResult {
  geral: number;
  pontoVermelho: number;
  mira2x: number;
  mira4x: number;
  miraAWM: number;
  cameraLivre: number;
}

// Performance tier based on device characteristics
function getPerformanceTier(screenWidth: number, screenHeight: number, pixelRatio: number): "low" | "mid" | "high" {
  const totalPixels = screenWidth * screenHeight * pixelRatio;
  if (totalPixels > 2000000) return "high";
  if (totalPixels > 1000000) return "mid";
  return "low";
}

// Deterministic hash from device string for consistent results per device
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Seeded random from hash — gives consistent "optimized" values per device
function seededValue(seed: number, index: number, min: number, max: number): number {
  const x = Math.sin(seed * (index + 1) * 9301 + 49297) * 233280;
  const normalized = x - Math.floor(x);
  return Math.round(min + normalized * (max - min));
}

export function generateSensitivity(model: string, screenInfo: string): SensitivityResult {
  const seed = hashString(model + screenInfo);
  
  const w = parseInt(screenInfo.split("x")[0]) || 390;
  const h = parseInt(screenInfo.split("x")[1]) || 844;
  const ratio = parseFloat(screenInfo.split("@")[1]) || 2;
  
  const tier = getPerformanceTier(w, h, ratio);

  // Base ranges optimized by tier (pro player ranges)
  const ranges: Record<string, { geral: [number, number]; pv: [number, number]; m2: [number, number]; m4: [number, number]; awm: [number, number]; cam: [number, number] }> = {
    high: {
      geral: [85, 100],
      pv: [80, 95],
      m2: [70, 85],
      m4: [60, 78],
      awm: [45, 65],
      cam: [75, 90],
    },
    mid: {
      geral: [78, 95],
      pv: [72, 88],
      m2: [62, 78],
      m4: [52, 70],
      awm: [38, 58],
      cam: [68, 85],
    },
    low: {
      geral: [70, 88],
      pv: [65, 80],
      m2: [55, 72],
      m4: [45, 62],
      awm: [30, 50],
      cam: [60, 78],
    },
  };

  const r = ranges[tier];

  return {
    geral: seededValue(seed, 1, r.geral[0], r.geral[1]),
    pontoVermelho: seededValue(seed, 2, r.pv[0], r.pv[1]),
    mira2x: seededValue(seed, 3, r.m2[0], r.m2[1]),
    mira4x: seededValue(seed, 4, r.m4[0], r.m4[1]),
    miraAWM: seededValue(seed, 5, r.awm[0], r.awm[1]),
    cameraLivre: seededValue(seed, 6, r.cam[0], r.cam[1]),
  };
}
