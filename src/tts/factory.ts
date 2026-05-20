import { TTSEngine } from "./interface.js";
import { MacOSSayEngine } from "./macos-say.js";
import { PiperTTSEngine } from "./piper-tts.js";
import os from "os";

let cachedEngine: TTSEngine | null = null;

export interface EngineOptions {
  engine?: string;
  modelPath?: string;
  configPath?: string;
}

export function createTTSEngine(options?: EngineOptions): TTSEngine {
  if (cachedEngine) {
    return cachedEngine;
  }

  const platform = os.platform();
  const engineType = options?.engine || "say";

  if (platform === "darwin" && engineType === "piper") {
    cachedEngine = new PiperTTSEngine(options?.modelPath, options?.configPath);
    return cachedEngine;
  }

  if (platform === "darwin") {
    cachedEngine = new MacOSSayEngine();
    return cachedEngine;
  }

  throw new Error(`Unsupported platform: ${platform}. Only macOS (darwin) is supported.`);
}
