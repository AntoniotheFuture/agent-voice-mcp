import { createTTSEngine } from "../src/tts/factory.js";
import { VoiceQueue } from "../src/voice-queue.js";
import { loadConfig, resolveOptions } from "../src/config.js";

async function main() {
  console.log("=== agent-voice v0.0.2 debug script ===\n");

  const config = loadConfig();
  console.log("Config loaded:", JSON.stringify(config, null, 2));

  const engine = createTTSEngine();
  console.log("\nTTS engine created:", engine.constructor.name);

  const voices = await engine.getVoices();
  console.log("\nAvailable voices:", voices.length);
  console.log("First 10 voices:", voices.slice(0, 10).join(", "));

  const queue = new VoiceQueue(engine);

  console.log("\n--- Test 1: Simple speak (global defaults) ---");
  const opts1 = resolveOptions(config);
  console.log("Resolved options:", opts1);
  queue.enqueue("你好，agent-voice 语音播报测试，使用全局默认配置。");

  await sleep(2000);

  console.log("\n--- Test 2: Speak with call-time override ---");
  const opts2 = resolveOptions(config, undefined, { rate: 300 });
  console.log("Resolved options:", opts2);
  queue.enqueue("这是快速播报，call-time override rate=300", opts2);

  await sleep(2000);

  console.log("\n--- Test 3: Scene config (task_error style) ---");
  const taskErrorConfig: import("../src/config.js").AgentVoiceConfig = {
    rate: 175,
    volume: 1.0,
    scenes: { task_error: { voice: voices[0], rate: 150 } },
  };
  const opts3 = resolveOptions(taskErrorConfig, "task_error");
  console.log("Resolved options:", opts3);
  queue.enqueue("任务出错提醒，使用场景配置", opts3);

  await sleep(2000);

  console.log("\n--- Test 4: Queue overflow (enqueue 4 items with max 2) ---");
  queue.enqueue("第一条消息，将被丢弃");
  queue.enqueue("第二条消息");
  queue.enqueue("第三条消息");
  queue.enqueue("第四条消息");
  console.log("Enqueued 4 messages, first 2 should be discarded");

  await sleep(5000);

  console.log("\n--- Test 5: Stop ---");
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
