import { describe, it, before } from "node:test";
import assert from "node:assert";

describe("Cloud TTS Providers", () => {
  let OpenAIProvider: typeof import("../dist/tts/cloud/providers/openai.js").OpenAIProvider;
  let VolcanoProvider: typeof import("../dist/tts/cloud/providers/volcano.js").VolcanoProvider;
  let CustomHTTPProvider: typeof import("../dist/tts/cloud/providers/custom.js").CustomHTTPProvider;

  before(async () => {
    const openaiMod = await import("../dist/tts/cloud/providers/openai.js");
    OpenAIProvider = openaiMod.OpenAIProvider;
    const volcanoMod = await import("../dist/tts/cloud/providers/volcano.js");
    VolcanoProvider = volcanoMod.VolcanoProvider;
    const customMod = await import("../dist/tts/cloud/providers/custom.js");
    CustomHTTPProvider = customMod.CustomHTTPProvider;
  });

  it("should create OpenAI provider", () => {
    const provider = new OpenAIProvider({ provider: "openai", apiKey: "sk-test" });
    assert.strictEqual(provider.type, "openai");
  });

  it("should create Volcano provider", () => {
    const provider = new VolcanoProvider({
      provider: "volcano",
      token: "test-token",
      appId: "test-app",
    });
    assert.strictEqual(provider.type, "volcano");
  });

  it("should create CustomHTTP provider", () => {
    const provider = new CustomHTTPProvider({
      provider: "custom",
      url: "https://example.com/tts",
      bodyTemplate: '{"text":"{{text}}"}',
    });
    assert.strictEqual(provider.type, "custom");
  });

  it("should list OpenAI voices", async () => {
    const provider = new OpenAIProvider({ provider: "openai", apiKey: "sk-test" });
    const voices = await provider.getVoices();
    assert.ok(voices.length > 0);
    assert.ok(voices.includes("alloy"));
    assert.ok(voices.includes("nova"));
  });

  it("should list Volcano voices", async () => {
    const provider = new VolcanoProvider({
      provider: "volcano",
      token: "token",
      appId: "app",
    });
    const voices = await provider.getVoices();
    assert.ok(Array.isArray(voices));
  });

  it("should throw error with invalid credentials", async () => {
    const provider = new OpenAIProvider({ provider: "openai", apiKey: "sk-invalid", baseUrl: "https://invalid.example.com", timeout: 3000 });
    await assert.rejects(
      () =>
        provider.synthesize({
          text: "test",
          voice: "alloy",
        }),
      /(OpenAI TTS|fetch failed|aborted|timeout)/i
    );
  });

  it("should throw Volcano error with invalid credentials", async () => {
    const provider = new VolcanoProvider({
      provider: "volcano",
      token: "invalid-token",
      appId: "invalid",
      timeout: 3000,
    });
    await assert.rejects(
      () =>
        provider.synthesize({
          text: "test",
          voice: "zh_female_qingrun",
        }),
      /Volcano TTS/
    );
  });

  it("should synthesize with real Volcano credentials", { timeout: 20000 }, async () => {
    const { loadConfig } = await import("../dist/config.js");
    const path = await import("path");
    const os = await import("os");
    const configPath = path.join(os.homedir(), ".agent-voice", "debug-cloud.json");
    const config = loadConfig(configPath);
    const cloud = (config as unknown as Record<string, unknown>).cloud as Record<string, unknown> | undefined;

    if (!cloud) {
      assert.fail("No debug-cloud.json found at ~/.agent-voice/debug-cloud.json. Set it up with Volcano credentials.");
      return;
    }
    if (!cloud.token || String(cloud.token).includes("${")) {
      assert.fail("VOLCANO_TOKEN env var not set. Run: export VOLCANO_TOKEN=your-token");
      return;
    }

    const provider = new VolcanoProvider({
      provider: "volcano",
      token: cloud.token as string,
      appId: cloud.appId as string,
      cluster: (cloud.cluster as string) || "volcano_tts",
      voice: cloud.voice as string | undefined,
      timeout: 15000,
    });

    const buffer = await provider.synthesize({ text: "你好，这是自动化测试。" });
    assert.ok(buffer.length > 0, "Should return non-empty audio buffer");
  });
});
