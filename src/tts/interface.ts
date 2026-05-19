export interface TTSOptions {
  voice?: string;
  rate?: number;
  volume?: number;
}

export interface TTSEngine {
  speak(text: string, options?: TTSOptions): Promise<void>;
  stop(): void;
  getVoices(): Promise<string[]>;
}
