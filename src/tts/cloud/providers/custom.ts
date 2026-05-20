import { CloudTTSProvider, CloudTTSParams, CustomHTTPConfig } from "../types.js";

export class CustomHTTPProvider implements CloudTTSProvider {
  readonly type = "custom" as const;
  private config: CustomHTTPConfig;

  constructor(config: CustomHTTPConfig) {
    this.config = config;
  }

  async synthesize(params: CloudTTSParams): Promise<Buffer> {
    const url = this.renderTemplate(this.config.url, params);
    const method = (this.config.method || "POST").toUpperCase();

    const headers: Record<string, string> = {};
    if (this.config.headers) {
      for (const [key, value] of Object.entries(this.config.headers)) {
        headers[key] = this.renderTemplate(value, params);
      }
    }

    const body = this.renderTemplate(this.config.bodyTemplate, params);

    const controller = new AbortController();
    const timeout = this.config.timeout || 30000;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (method !== "GET" && method !== "HEAD") {
        fetchOptions.body = body;
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Custom HTTP TTS ${response.status}: ${errText}`);
      }

      const responseType = this.config.responseType || "binary";
      if (responseType === "binary") {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }

      const json = await response.json() as Record<string, unknown>;
      const audioField = this.config.responseAudioField || "data";
      const audioValue = json[audioField];

      if (typeof audioValue === "string") {
        if (audioValue.startsWith("http")) {
          const audioResp = await fetch(audioValue, { signal: controller.signal });
          if (!audioResp.ok) {
            throw new Error(`Failed to fetch audio URL: ${audioResp.status}`);
          }
          const audioBuffer = await audioResp.arrayBuffer();
          return Buffer.from(audioBuffer);
        }
        return Buffer.from(audioValue, "base64");
      }

      throw new Error(`Custom HTTP response missing audio data at field "${audioField}"`);
    } finally {
      clearTimeout(timer);
    }
  }

  private renderTemplate(template: string, params: CloudTTSParams): string {
    return template
      .replace(/\{\{text\}\}/g, encodeURIComponent(params.text))
      .replace(/\{\{rawText\}\}/g, params.text)
      .replace(/\{\{voice\}\}/g, params.voice || "")
      .replace(/\{\{rate\}\}/g, String(params.rate ?? 200))
      .replace(/\{\{volume\}\}/g, String(params.volume ?? 1.0));
  }

  async getVoices(): Promise<string[]> {
    return [];
  }
}
