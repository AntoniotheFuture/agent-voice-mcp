import { existsSync, readFileSync } from "fs";
import path from "path";
import os from "os";

export interface SceneConfig {
  voice?: string;
  rate?: number;
  volume?: number;
}

export interface AgentVoiceConfig {
  voice?: string;
  rate?: number;
  volume?: number;
  scenes?: {
    task_start?: SceneConfig;
    task_complete?: SceneConfig;
    task_error?: SceneConfig;
    need_interaction?: SceneConfig;
    milestone?: SceneConfig;
  };
  serve?: {
    port?: number;
  };
}

const DEFAULT_CONFIG_PATH = path.join(os.homedir(), ".agent-voice", "config.json");

const DEFAULT_CONFIG: AgentVoiceConfig = {
  voice: undefined,
  rate: 175,
  volume: 1.0,
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

interface ResolvedOptions {
  voice?: string;
  rate?: number;
  volume?: number;
}

export function resolveOptions(
  config: AgentVoiceConfig,
  scene?: string,
  override?: ResolvedOptions
): ResolvedOptions {
  const result: ResolvedOptions = {
    voice: config.voice,
    rate: config.rate,
    volume: config.volume,
  };

  if (scene && config.scenes) {
    const sceneConfig = config.scenes[scene as keyof typeof config.scenes];
    if (sceneConfig) {
      if (sceneConfig.voice !== undefined) result.voice = sceneConfig.voice;
      if (sceneConfig.rate !== undefined) result.rate = sceneConfig.rate;
      if (sceneConfig.volume !== undefined) result.volume = sceneConfig.volume;
    }
  }

  if (override?.voice !== undefined) result.voice = override.voice;
  if (override?.rate !== undefined) result.rate = override.rate;
  if (override?.volume !== undefined) result.volume = override.volume;

  return result;
}
