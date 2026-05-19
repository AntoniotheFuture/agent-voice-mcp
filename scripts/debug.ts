import { createTTSEngine } from "../src/tts/factory.js";
import { VoiceQueue } from "../src/voice-queue.js";
import { loadConfig } from "../src/config.js";

async function main() {
  console.log("=== agent-voice debug script ===\n");

  const config = loadConfig();
  console.log("Config loaded:", JSON.stringify(config, null, 2));

  const engine = createTTSEngine();
  console.log("\nTTS engine created:", engine.constructor.name);

  const voices = await engine.getVoices();
  console.log("\nAvailable voices:", voices.length);
  console.log("First 10 voices:", voices.slice(0, 10).join(", "));

  const queue = new VoiceQueue(engine);

  console.log("\n--- Test 1: Simple speak ---");
  queue.enqueue("你好，agent-voice 语音播报测试。");
  console.log("Enqueued first message");

  await sleep(2000);

  console.log("\n--- Test 2: Speak with rate ---");
  queue.enqueue("这是快速播报测试", { rate: 300 });

  await sleep(2000);

  console.log("\n--- Test 3: Queue overflow (enqueue 4 items with max 2) ---");
  queue.enqueue("第一条消息，将被丢弃");
  queue.enqueue("第二条消息");
  queue.enqueue("第三条消息");
  queue.enqueue("第四条消息");
  console.log("Enqueued 4 messages, first 2 should be discarded");

  await sleep(5000);

  console.log("\n--- Test 4: Stop ---");
  queue.enqueue("这条消息播放到一半会被停止");
  await sleep(500);
  queue.stop();
  console.log("Stop called");

  await sleep(1000);

  console.log("\n=== All tests completed ===");
  process.exit(0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Debug error:", err);
  process.exit(1);
});
