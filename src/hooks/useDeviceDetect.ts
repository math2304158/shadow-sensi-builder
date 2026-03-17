import { useEffect, useState } from "react";

interface DeviceInfo {
  model: string;
  os: string;
  screen: string;
  gpu: string;
}

// Comprehensive iPhone screen mapping (logical width x height)
const IPHONE_SCREENS: Record<string, string> = {
  "430x932@3": "iPhone 16 Pro Max",
  "402x874@3": "iPhone 16 Pro",
  "393x852@3": "iPhone 16",
  "430x932@3_alt": "iPhone 15 Pro Max",
  "393x852@3_alt": "iPhone 15 Pro",
  "393x852@2": "iPhone 15",
  "430x932@3_14pm": "iPhone 14 Pro Max",
  "393x852@3_14p": "iPhone 14 Pro",
  "390x844@3": "iPhone 14 / 13 / 12",
  "428x926@3": "iPhone 14 Plus / 13 Pro Max / 12 Pro Max",
  "375x812@3": "iPhone 13 Mini / 12 Mini / X / XS / 11 Pro",
  "414x896@3": "iPhone 11 Pro Max / XS Max",
  "414x896@2": "iPhone 11 / XR",
  "375x667@2": "iPhone SE (2nd/3rd gen) / 8 / 7 / 6s",
  "414x736@3": "iPhone 8 Plus / 7 Plus / 6s Plus",
  "320x568@2": "iPhone SE (1st gen) / 5s / 5",
};

// Resolve iPhone model from screen dimensions
function resolveIPhoneModel(w: number, h: number, ratio: number): string {
  // Try exact match first
  const key = `${w}x${h}@${ratio}`;
  if (IPHONE_SCREENS[key]) return IPHONE_SCREENS[key];

  // Fuzzy match within tolerance
  for (const [k, model] of Object.entries(IPHONE_SCREENS)) {
    const parts = k.split(/[x@_]/);
    const kw = parseInt(parts[0]);
    const kh = parseInt(parts[1]);
    const kr = parseInt(parts[2]);
    if (Math.abs(kw - w) <= 5 && Math.abs(kh - h) <= 10 && kr === ratio) {
      return model;
    }
  }

  return `iPhone (${w}x${h}@${ratio}x)`;
}

// Known Android device screen fingerprints
const ANDROID_SCREENS: Record<string, string> = {
  "412x915": "Samsung Galaxy S24 Ultra",
  "412x892": "Samsung Galaxy S24+",
  "360x780": "Samsung Galaxy S24",
  "384x854": "Samsung Galaxy S23 Ultra",
  "360x800": "Samsung Galaxy S23 / A54 / A34",
  "412x883": "Samsung Galaxy S22 Ultra",
  "360x780_s22": "Samsung Galaxy S22",
  "393x873": "Google Pixel 8 Pro",
  "412x892_p8": "Google Pixel 8",
  "411x891": "Google Pixel 7 Pro",
  "412x915_p7": "Google Pixel 7",
  "393x851": "Xiaomi 14 Pro",
  "393x873_x14": "Xiaomi 14",
  "412x919": "Xiaomi 13 Pro",
  "393x851_x13": "Xiaomi 13",
  "360x800_m": "Motorola Edge 40 / Moto G84",
  "412x915_m": "Motorola Edge 50 Pro",
  "360x780_r": "Realme GT 5 Pro",
  "412x892_o": "OPPO Find X7 Ultra",
};

function resolveAndroidModel(ua: string, w: number, h: number): string {
  // 1. Try Build/ model from UA (most reliable)
  const buildMatch = ua.match(/;\s*([^;)]+)\s*Build\//);
  if (buildMatch) {
    const raw = buildMatch[1].trim();
    // Clean common prefixes
    return raw
      .replace(/^(SAMSUNG|samsung)\s*/i, "")
      .replace(/^(SM-[A-Z]\d+[A-Z]?\/?[A-Z0-9]*)/, (m) => {
        return mapSamsungModel(m) || m;
      });
  }

  // 2. Fallback: screen fingerprint
  const screenKey = `${w}x${h}`;
  for (const [k, model] of Object.entries(ANDROID_SCREENS)) {
    const base = k.split("_")[0];
    if (base === screenKey) return model;
  }

  return `Android (${w}x${h})`;
}

// Map Samsung model numbers to marketing names
function mapSamsungModel(code: string): string | null {
  const map: Record<string, string> = {
    "SM-S928": "Galaxy S24 Ultra",
    "SM-S926": "Galaxy S24+",
    "SM-S921": "Galaxy S24",
    "SM-S918": "Galaxy S23 Ultra",
    "SM-S916": "Galaxy S23+",
    "SM-S911": "Galaxy S23",
    "SM-S908": "Galaxy S22 Ultra",
    "SM-S906": "Galaxy S22+",
    "SM-S901": "Galaxy S22",
    "SM-A546": "Galaxy A54",
    "SM-A346": "Galaxy A34",
    "SM-A256": "Galaxy A25",
    "SM-A156": "Galaxy A15",
    "SM-A057": "Galaxy A05s",
    "SM-A145": "Galaxy A14",
    "SM-A047": "Galaxy A04s",
    "SM-G990": "Galaxy S21 FE",
    "SM-G998": "Galaxy S21 Ultra",
    "SM-G996": "Galaxy S21+",
    "SM-G991": "Galaxy S21",
  };
  const prefix = code.substring(0, 6);
  return map[prefix] || null;
}

async function detectOS(ua: string): Promise<string> {
  // Try User-Agent Client Hints API first (accurate versions)
  if ("userAgentData" in navigator && (navigator as any).userAgentData) {
    try {
      const uaData = await (navigator as any).userAgentData.getHighEntropyValues([
        "platform",
        "platformVersion",
        "model",
      ]);
      const platform = uaData.platform || "";
      const ver = uaData.platformVersion || "";

      if (/iOS|iPhone|iPad/i.test(platform) || /iPhone|iPad/.test(ua)) {
        // On iOS Safari, platformVersion may not be available via Client Hints
        // but on Chromium-based browsers it is
        if (ver) return `iOS ${ver}`;
      }
      if (/Android/i.test(platform)) {
        if (ver) return `Android ${ver}`;
      }
      if (/macOS|Mac OS/i.test(platform)) {
        if (ver) {
          // macOS Client Hints returns major.minor.patch
          return `macOS ${ver}`;
        }
      }
      if (/Windows/i.test(platform)) {
        if (ver) {
          // Windows Client Hints: major >= 13 means Windows 11
          const major = parseInt(ver.split(".")[0]);
          if (major >= 13) return "Windows 11";
          return "Windows 10";
        }
      }
    } catch {}
  }

  // Fallback: parse UA string (may be frozen/inaccurate on newer OS versions)
  if (/iPhone|iPad/.test(ua)) {
    const match = ua.match(/OS (\d+)[_.](\d+)(?:[_.](\d+))?/);
    if (match) return `iOS ${match[1]}.${match[2]}${match[3] ? "." + match[3] : ""}`;
    return "iOS";
  }
  if (/Android/.test(ua)) {
    const match = ua.match(/Android\s([\d.]+)/);
    return `Android ${match ? match[1] : ""}`.trim();
  }
  if (/Mac/.test(ua)) {
    const match = ua.match(/Mac OS X (\d+)[_.](\d+)(?:[_.](\d+))?/);
    if (match) return `macOS ${match[1]}.${match[2]}${match[3] ? "." + match[3] : ""}`;
    return "macOS";
  }
  if (/Windows NT 10/.test(ua)) return "Windows 10/11";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown OS";
}

function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  const w = screen.width;
  const h = screen.height;
  const ratio = window.devicePixelRatio || 1;
  const os = detectOS(ua);
  let model = "Unknown Device";

  if (/iPhone/.test(ua)) {
    model = resolveIPhoneModel(w, h, Math.round(ratio));
  } else if (/iPad/.test(ua)) {
    model = "iPad";
    if (w >= 1024) model = "iPad Pro";
    else if (w >= 820) model = "iPad Air";
  } else if (/Android/.test(ua)) {
    model = resolveAndroidModel(ua, w, h);
  } else {
    if (/Mac/.test(ua)) model = "Desktop Mac";
    else if (/Windows/.test(ua)) model = "Desktop PC";
    else if (/Linux/.test(ua)) model = "Desktop Linux";
  }

  return {
    model,
    os,
    screen: `${w}x${h}@${Math.round(ratio)}x`,
    gpu: getGPU(),
  };
}

function getGPU(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl && gl instanceof WebGLRenderingContext) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        return typeof renderer === "string" ? renderer.substring(0, 40) : "N/A";
      }
    }
  } catch {}
  return "N/A";
}

export function useDeviceDetect() {
  const [device, setDevice] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  return device;
}
