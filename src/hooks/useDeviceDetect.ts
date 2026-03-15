import { useEffect, useState } from "react";

interface DeviceInfo {
  model: string;
  os: string;
  screen: string;
  gpu: string;
}

function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  let model = "UNKNOWN_DEVICE";
  let os = "UNKNOWN_OS";

  // OS detection
  if (/iPhone/.test(ua)) {
    const match = ua.match(/iPhone OS (\d+[_\.]\d+)/);
    os = `iOS ${match ? match[1].replace("_", ".") : ""}`.trim();
    // iPhone model guess from screen
    const w = screen.width;
    const h = screen.height;
    const ratio = window.devicePixelRatio || 1;
    if ((w === 430 && h === 932) || (w === 393 && h === 852)) model = "iPhone 15 Pro Max";
    else if (w === 393 && h === 852) model = "iPhone 15 Pro";
    else if (w === 390 && h === 844) model = "iPhone 14";
    else if (w === 428 && h === 926) model = "iPhone 13 Pro Max";
    else if (w === 375 && h === 812) model = "iPhone X/11 Pro";
    else if (w === 414 && h === 896) model = "iPhone 11";
    else if (w === 375 && h === 667) model = "iPhone SE";
    else model = `iPhone (${w}x${h}@${ratio}x)`;
  } else if (/Android/.test(ua)) {
    const match = ua.match(/Android\s([\d.]+)/);
    os = `Android ${match ? match[1] : ""}`.trim();
    // Try to get model
    const modelMatch = ua.match(/;\s*([^;)]+)\s*Build\//);
    if (modelMatch) {
      model = modelMatch[1].trim();
    } else {
      model = `Android Device (${screen.width}x${screen.height})`;
    }
  } else {
    // Desktop fallback
    if (/Mac/.test(ua)) { os = "macOS"; model = "Desktop Mac"; }
    else if (/Windows/.test(ua)) { os = "Windows"; model = "Desktop PC"; }
    else if (/Linux/.test(ua)) { os = "Linux"; model = "Desktop Linux"; }
    else { model = "Unknown Device"; os = "Unknown OS"; }
  }

  const gpu = getGPU();

  return {
    model,
    os,
    screen: `${screen.width}x${screen.height}@${window.devicePixelRatio || 1}x`,
    gpu,
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
        return typeof renderer === "string" ? renderer.substring(0, 30) : "N/A";
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
