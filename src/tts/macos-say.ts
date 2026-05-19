import { spawn } from "child_process";
import { TTSEngine, TTSOptions } from "./interface.js";

export class MacOSSayEngine implements TTSEngine {
  private currentProcess: ReturnType<typeof spawn> | null = null;

  async speak(text: string, options?: TTSOptions): Promise<void> {
    await this.stop();

    const args: string[] = [];

    if (options?.voice) {
      args.push("-v", options.voice);
    }
    if (options?.rate !== undefined) {
      const rate = Math.max(50, Math.min(300, Math.round(options.rate)));
      args.push("-r", String(rate));
    }

    if (options?.volume !== undefined) {
      const vol = Math.max(0, Math.min(1, options.volume)).toFixed(2);
      text = `[[volm ${vol}]] ${text}`;
    }
    args.push(text);

    return new Promise<void>((resolve, reject) => {
      this.currentProcess = spawn("say", args, { stdio: "ignore" });

      this.currentProcess.on("close", (code) => {
        this.currentProcess = null;
        if (code === 0 || code === null) {
          resolve();
        } else {
          reject(new Error(`say command exited with code ${code}`));
        }
      });

      this.currentProcess.on("error", (err) => {
        this.currentProcess = null;
        reject(err);
      });
    });
  }

  stop(): void {
    if (this.currentProcess) {
      this.currentProcess.kill("SIGTERM");
      this.currentProcess = null;
    }
  }

  async getVoices(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const proc = spawn("say", ["-v", "?"]);
      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });
      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`say -v ? exited with code ${code}: ${stderr}`));
          return;
        }
        const voices = stdout
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            const parts = line.split(/\s+/);
            return parts[0];
          })
          .filter(Boolean);
        resolve(voices);
      });

      proc.on("error", reject);
    });
  }
}
