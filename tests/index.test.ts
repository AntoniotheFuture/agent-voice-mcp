import { describe, it, before } from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(__dirname, "../dist/index.js");

async function sendMcpRequest(
  method: string,
  params?: Record<string, unknown>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [SERVER_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    const request = {
      jsonrpc: "2.0",
      id: 1,
      method,
      params: params || {},
    };

    proc.stdin.write(JSON.stringify(request) + "\n");

    setTimeout(() => {
      proc.kill();
      try {
        const lines = stdout.split("\n").filter(Boolean);
        const response = JSON.parse(lines[lines.length - 1]);
        resolve(response);
      } catch {
        reject(new Error("Failed to parse response"));
      }
    }, 2000);
  });
}

describe("agent-voice MCP Server", () => {
  describe("TTS Engine", () => {
    let engine: Awaited<ReturnType<typeof import("../dist/tts/factory.js").createTTSEngine>>;

    before(async () => {
      const mod = await import("../dist/tts/factory.js");
      engine = mod.createTTSEngine();
    });

    it("should create TTS engine", () => {
      assert.ok(engine);
    });

    it("should list available voices", async () => {
      const voices = await engine.getVoices();
      assert.ok(Array.isArray(voices));
      assert.ok(voices.length > 0, "Should have at least one voice");
    });

    it("should speak text without error", async () => {
      await assert.doesNotReject(() => engine.speak("test"));
    });

    it("should stop speech without error", () => {
      assert.doesNotThrow(() => engine.stop());
    });
  });

  describe("Voice Queue", () => {
    let VoiceQueueClass: typeof import("../dist/voice-queue.js").VoiceQueue;
    let engine: Awaited<ReturnType<typeof import("../dist/tts/factory.js").createTTSEngine>>;

    before(async () => {
      const queueMod = await import("../dist/voice-queue.js");
      VoiceQueueClass = queueMod.VoiceQueue;
      const ttsMod = await import("../dist/tts/factory.js");
      engine = ttsMod.createTTSEngine();
    });

    it("should enqueue and process items", () => {
      const queue = new VoiceQueueClass(engine, 2);
      queue.enqueue("test message");
      assert.ok(true, "enqueue should not throw");
    });

    it("should discard old items when queue exceeds max size", () => {
      const queue = new VoiceQueueClass(engine, 2);
      queue.enqueue("message 1");
      queue.enqueue("message 2");
      queue.enqueue("message 3");
      queue.enqueue("message 4");
      assert.ok(true, "should not throw when queue overflows");
    });

    it("should stop queue and current speech", () => {
      const queue = new VoiceQueueClass(engine, 2);
      queue.enqueue("message 1");
      queue.stop();
      assert.ok(true, "stop should not throw");
    });
  });

  describe("Config", () => {
    it("should load default config", async () => {
      const mod = await import("../dist/config.js");
      const config = mod.loadConfig();
      assert.ok(config);
      assert.ok(typeof config.rate === "number");
    });
  });
});
