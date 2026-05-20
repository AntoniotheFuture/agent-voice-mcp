import { writeFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { spawn } from "child_process";
import { TTSEngine, TTSOptions } from "../interface.js";
import { CloudTTSConfig, CloudTTSProvider, CloudProviderType } from "./types.js";
import { OpenAIProvider } from "./providers/openai.js";
import { VolcanoProvider } from "./providers/volcano.js";
import { CustomHTTPProvider } from "./providers/custom.js";

function createProvider(config: CloudTTSConfig): CloudTTSProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "volcano":
      return new VolcanoProvider(config);
    case "custom":
      return new CustomHTTPProvider(config);
    default:
      throw new Error(`Unknown cloud TTS provider: ${(config as CloudTTSConfig).provider}`);
  }
}

export class CloudTTSEngine implements TTSEngine {
  private provider: CloudTTSProvider;
  private currentProcess: ReturnType<typeof spawn> | null = null;
  private tempFile: string | null = null;

  constructor(config: CloudTTSConfig) {
    this.provider = createProvider(config);
  }

  get providerType(): CloudProviderType {
    return this.provider.type;
  }

  async speak(text: string, options?: TTSOptions): Promise<void> {
    await this.stop();

    try {
      const audioBuffer = await this.provider.synthesize({
        text,
        voice: options?.voice,
        rate: options?.rate,
        volume: options?.volume,
      });

      const ext = ".mp3";
      const tempFile = path.join(tmpdir(), `agent-voice-cloud-${Date.now()}${ext}`);
      this.tempFile = tempFile;
      writeFileSync(tempFile, audioBuffer);

      await this.playAudio(tempFile);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cloud TTS request failed";
      throw new Error(message);
    }
  }

  private playAudio(filePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const player = spawn("afplay", [filePath], { stdio: "ignore" });
      this.currentProcess = player;

      player.on("close", (code) => {
        this.currentProcess = null;
        this.cleanupTempFile();
        if (code === 0 || code === null) {
          resolve();
        } else {
          reject(new Error(`afplay exited with code ${code}`));
        }
      });

      player.on("error", (err) => {
        this.currentProcess = null;
        this.cleanupTempFile();
        reject(err);
      });
    });
  }

  stop(): void {
    if (this.currentProcess) {
      this.currentProcess.kill("SIGTERM");
      this.currentProcess = null;
    }
    this.cleanupTempFile();
  }

  private cleanupTempFile(): void {
    if (this.tempFile) {
      try {
        if (existsSync(this.tempFile)) {
          unlinkSync(this.tempFile);
        }
      } catch {
        // ignore cleanup errors
      }
      this.tempFile = null;
    }
  }

  async getVoices(): Promise<string[]> {
    return this.provider.getVoices();
  }
}
