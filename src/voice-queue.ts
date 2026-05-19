import { TTSEngine, TTSOptions } from "./tts/interface.js";

interface QueueItem {
  text: string;
  options?: TTSOptions;
}

export class VoiceQueue {
  private queue: QueueItem[] = [];
  private maxSize: number;
  private engine: TTSEngine;
  private processing = false;

  constructor(engine: TTSEngine, maxSize = 2) {
    this.engine = engine;
    this.maxSize = maxSize;
  }

  enqueue(text: string, options?: TTSOptions): void {
    while (this.queue.length >= this.maxSize) {
      this.queue.shift();
    }
    this.queue.push({ text, options });
    this.processQueue();
  }

  stop(): void {
    this.queue = [];
    this.engine.stop();
    this.processing = false;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      try {
        await this.engine.speak(item.text, item.options);
      } catch {
        // voice play failure is non-fatal
      }
    }

    this.processing = false;
  }
}
