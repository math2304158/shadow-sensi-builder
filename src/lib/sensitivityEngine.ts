// Free Fire Sensitivity Engine — 0 to 200 scale
// Optimized for headshot accuracy and smooth gameplay per device

interface SensitivityResult {
  geral: number;
  pontoVermelho: number;
  mira2x: number;
  mira4x: number;
  miraAWM: number;
  cameraLivre: number;
}

// Device performance tiers based on pixel throughput
type Tier = "low" | "mid" | "high" | "ultra";

function getPerformanceTier(screenWidth: number, screenHeight: number, pixelRatio: number, model: string): Tier {
  const totalPixels = screenWidth * screenHeight * pixelRatio;
  const m = model.toLowerCase();

  // Ultra: flagship devices with top-tier processors
  const ultraPatterns = [
    "s24 ultra", "s23 ultra", "s22 ultra",
    "16 pro max", "15 pro max", "14 pro max", "13 pro max",
    "16 pro", "15 pro", "14 pro",
    "pixel 8 pro", "pixel 7 pro",
    "14 pro", "13 pro", "xiaomi 14",
    "find x7", "edge 50",
  ];
  if (ultraPatterns.some((p) => m.includes(p))) return "ultra";

  // High: flagship & upper mid-range
  const highPatterns = [
    "iphone 16", "iphone 15", "iphone 14", "iphone 13", "iphone 12",
    "s24", "s23", "s22", "s21",
    "pixel 8", "pixel 7",
    "xiaomi 13", "edge 40",
    "gt 5",
  ];
  if (highPatterns.some((p) => m.includes(p))) return "high";

  // Pixel-based fallback
  if (totalPixels > 2500000) return "high";
  if (totalPixels > 1200000) return "mid";
  return "low";
}

// Deterministic hash for consistent results per device
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Seeded pseudo-random for deterministic "optimized" values
function seededValue(seed: number, index: number, min: number, max: number): number {
  const x = Math.sin(seed * (index + 1) * 9301 + 49297) * 233280;
  const normalized = x - Math.floor(x);
  return Math.round(min + normalized * (max - min));
}

/**
 * Pro player headshot meta:
 * - GERAL: High (fast camera response for tracking)
 * - PONTO VERMELHO: High (close-range headshot flicks)
 * - MIRA 2X: Medium-high (mid-range precision)
 * - MIRA 4X: Medium (stability for medium-long range)
 * - AWM: Lower (precision for one-shot headshots)
 * - CÂMERA LIVRE: High (awareness & quick target acquisition)
 *
 * Ranges scale 0-200. Values tuned per performance tier.
 */

type RangeSet = {
  geral: [number, number];
  pv: [number, number];
  m2: [number, number];
  m4: [number, number];
  awm: [number, number];
  cam: [number, number];
};

const TIER_RANGES: Record<Tier, RangeSet> = {
  ultra: {
    geral: [168, 195],   // fast response, top hardware handles it
    pv: [160, 190],      // aggressive flicks for headshots
    m2: [140, 170],      // precise mid-range
    m4: [115, 145],      // stable long-range
    awm: [80, 115],      // very precise for one-taps
    cam: [155, 185],     // fast awareness
  },
  high: {
    geral: [155, 185],
    pv: [148, 178],
    m2: [128, 158],
    m4: [105, 135],
    awm: [70, 105],
    cam: [142, 175],
  },
  mid: {
    geral: [138, 168],
    pv: [130, 162],
    m2: [112, 145],
    m4: [90, 122],
    awm: [58, 92],
    cam: [128, 160],
  },
  low: {
    geral: [120, 155],
    pv: [112, 148],
    m2: [95, 130],
    m4: [78, 110],
    awm: [45, 80],
    cam: [110, 148],
  },
};

export function generateSensitivity(model: string, screenInfo: string): SensitivityResult {
  const seed = hashString(model + screenInfo);

  const w = parseInt(screenInfo.split("x")[0]) || 390;
  const h = parseInt(screenInfo.split("x")[1]) || 844;
  const ratio = parseFloat(screenInfo.split("@")[1]) || 2;

  const tier = getPerformanceTier(w, h, ratio, model);
  const r = TIER_RANGES[tier];

  return {
    geral: seededValue(seed, 1, r.geral[0], r.geral[1]),
    pontoVermelho: seededValue(seed, 2, r.pv[0], r.pv[1]),
    mira2x: seededValue(seed, 3, r.m2[0], r.m2[1]),
    mira4x: seededValue(seed, 4, r.m4[0], r.m4[1]),
    miraAWM: seededValue(seed, 5, r.awm[0], r.awm[1]),
    cameraLivre: seededValue(seed, 6, r.cam[0], r.cam[1]),
  };
}
