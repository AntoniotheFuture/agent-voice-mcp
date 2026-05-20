import { createHmac, createHash } from "crypto";
import { CloudTTSProvider, CloudTTSParams, VolcanoConfig } from "../types.js";

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

export class VolcanoProvider implements CloudTTSProvider {
  readonly type = "volcano" as const;
  private config: VolcanoConfig;

  constructor(config: VolcanoConfig) {
    this.config = config;
  }

  private signRequest(
    method: string,
    path: string,
    query: string,
    headers: Record<string, string>,
    body: string,
    timestamp: string
  ): string {
    const region = "cn-north-1";
    const service = "sami";

    const signedHeaders = Object.keys(headers)
      .map((k) => k.toLowerCase())
      .sort()
      .join(";");

    const canonicalHeaders = Object.keys(headers)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((k) => `${k.toLowerCase()}:${headers[k].trim()}`)
      .join("\n");

    const hashedPayload = sha256(body);

    const canonicalRequest = [
      method,
      path,
      query,
      canonicalHeaders + "\n",
      signedHeaders,
      hashedPayload,
    ].join("\n");

    const date = timestamp.substring(0, 8);
    const credentialScope = `${date}/${region}/${service}/request`;
    const hashedCanonicalRequest = sha256(canonicalRequest);

    const stringToSign = [
      "HMAC-SHA256",
      timestamp,
      credentialScope,
      hashedCanonicalRequest,
    ].join("\n");

    const kSecret = Buffer.from(this.config.secretKey, "utf-8");
    const kDate = hmacSha256(kSecret, date);
    const kRegion = hmacSha256(kDate, region);
    const kService = hmacSha256(kRegion, service);
    const kSigning = hmacSha256(kService, "request");
    const signature = hmacSha256(kSigning, stringToSign).toString("hex");

    return `HMAC-SHA256 Credential=${this.config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  async synthesize(params: CloudTTSParams): Promise<Buffer> {
    const voice = params.voice || this.config.voice || "zh_female_qingrun";
    const cluster = this.config.cluster || "volcano_tts";

    const bodyObj: Record<string, unknown> = {
      app: { appid: this.config.appId, token: "placeholder_token", cluster },
      user: { uid: "agent-voice" },
      audio: {
        voice_type: voice,
        encoding: "mp3",
        rate: 24000,
        speed_ratio: params.rate ? params.rate / 200 : 1.0,
        volume_ratio: params.volume ?? 1.0,
      },
      request: { reqid: `agent-voice-${Date.now()}`, text: params.text, text_type: "plain" },
    };

    const body = JSON.stringify(bodyObj);
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const path = "/api/v1/tts";
    const query = "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Host": "openspeech.bytedance.com",
      "X-Date": timestamp,
    };

    const authorization = this.signRequest("POST", path, query, headers, body, timestamp);
    headers["Authorization"] = authorization;

    const controller = new AbortController();
    const timeout = this.config.timeout || 30000;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`https://openspeech.bytedance.com${path}`, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Volcano TTS HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json() as Record<string, unknown>;
      if (data.code !== 3000 && data.code !== 0) {
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
    return [
      "zh_female_qingrun", "zh_male_qingrun", "zh_female_tianmei",
      "zh_male_chunhou", "zh_female_xiaoqian", "zh_male_xiaoyu",
    ];
  }
}
