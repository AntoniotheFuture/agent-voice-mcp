import { TTSEngine } from "./interface.js";
import { MacOSSayEngine } from "./macos-say.js";
import os from "os";

let cachedEngine: TTSEngine | null = null;

export function createTTSEngine(): TTSEngine {
  if (cachedEngine) {
    return cachedEngine;
  }

  const platform = os.platform();

  switch (platform) {
    case "darwin":
      cachedEngine = new MacOSSayEngine();
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}. Only macOS is supported in v0.0.1.`);
  }

  return cachedEngine;
}
