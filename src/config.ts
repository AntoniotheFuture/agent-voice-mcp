import { existsSync, readFileSync } from "fs";
import path from "path";
import os from "os";

export interface AgentVoiceConfig {
  voice?: string;
  rate?: number;
  serve?: {
    port?: number;
  };
}

const DEFAULT_CONFIG_PATH = path.join(os.homedir(), ".agent-voice", "config.json");

const DEFAULT_CONFIG: AgentVoiceConfig = {
  voice: undefined,
  rate: 175,
  serve: {
    port: 3000,
  },
};

let cachedConfig: AgentVoiceConfig | null = null;

export function loadConfig(configPath?: string): AgentVoiceConfig {
  if (cachedConfig) return cachedConfig;

  const resolvedPath = configPath || DEFAULT_CONFIG_PATH;

  let fileConfig: Partial<AgentVoiceConfig> = {};
  if (existsSync(resolvedPath)) {
    try {
      fileConfig = JSON.parse(readFileSync(resolvedPath, "utf-8"));
    } catch {
      console.error(`Failed to parse config file: ${resolvedPath}, using defaults`);
    }
  }

  cachedConfig = { ...DEFAULT_CONFIG, ...fileConfig, serve: { ...DEFAULT_CONFIG.serve, ...fileConfig.serve } };
  return cachedConfig;
}

export function getConfigPath(customPath?: string): string {
  return customPath || DEFAULT_CONFIG_PATH;
}
