import { CloudTTSProvider, CloudTTSParams, VolcanoConfig } from "../types.js";

export class VolcanoProvider implements CloudTTSProvider {
  readonly type = "volcano" as const;
  private config: VolcanoConfig;

  constructor(config: VolcanoConfig) {
    this.config = config;
  }

  async synthesize(params: CloudTTSParams): Promise<Buffer> {
    const voice = params.voice || this.config.voice || "BV001_streaming";
    const cluster = this.config.cluster || "volcano_tts";

    const bodyObj: Record<string, unknown> = {
      app: { appid: this.config.appId, token: "placeholder_token", cluster },
      user: { uid: "agent-voice" },
      audio: {
        voice_type: voice,
        encoding: "wav",
        rate: 24000,
        speed_ratio: params.rate ? params.rate / 200 : 1.0,
        volume_ratio: params.volume ?? 1.0,
      },
      request: { reqid: `agent-voice-${Date.now()}`, operation: "query", text: params.text, text_type: "plain" },
    };

    const body = JSON.stringify(bodyObj);

    const controller = new AbortController();
    const timeout = this.config.timeout || 30000;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer;${this.config.token}`,
          "Content-Type": "application/json",
        },
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Volcano TTS HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json() as Record<string, unknown>;
      if (data.code !== 3000) {
        throw new Error(`Volcano TTS API error: code=${data.code}, message=${data.message}`);
      }

      const audioBase64 = data.data as string;
      if (!audioBase64) throw new Error("Volcano TTS response missing audio data");

      return Buffer.from(audioBase64, "base64");
    } finally {
      clearTimeout(timer);
    }
  }

  async getVoices(): Promise<string[]> {
    return [];
  }
}
