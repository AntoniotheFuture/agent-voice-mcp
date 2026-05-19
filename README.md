# agent-voice v0.0.3

为开发 Agent 提供 TTS 语音播报能力的本地 MCP 服务。在 Agent 的任务生命周期、关键节点、交互式询问时自动通过 TTS 语音提醒开发者，提升开发沉浸感和效率。

## 系统要求

- **Node.js** >= 22
- **操作系统**: macOS（利用系统内置 `say` 命令，支持 177 个音色）

## 快速开始

### 1. 克隆并安装

```bash
cd agent-voice
npm install
npm run build
```

### 2. 配置 Trae MCP 服务

在项目根目录创建 `.trae/mcp.json`：

```json
{
  "mcpServers": {
    "agent-voice": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

或者通过 Trae 全局设置 → 搜索 "MCP" → 添加 stdio 服务器：
- 命令: `node`
- 参数: `/完整路径/agent-voice/dist/index.js`

### 3. 配置 Skill（行为约定）

在项目根目录创建 `.trae/skills/agent-voice/SKILL.md`：

```markdown
---
name: "agent-voice"
description: "通过TTS语音播报Agent任务生命周期节点。在任务开始/完成/失败、需要用户交互、到达关键里程碑时自动调用MCP语音工具播报。"
---

# Agent Voice 语音播报

在以下 **5 个场景** 必须调用 MCP 的 `agent-voice` 服务进行语音播报：

### 1. task_start — 开始执行任务
接到用户新任务时，播报任务摘要：
mcp__agent-voice__speak(text="开始执行任务：<简短任务描述>", scene="task_start")

### 2. task_complete — 任务执行完成
任务完成后播报完成信息：
mcp__agent-voice__speak(text="任务执行完成：<简短总结>", scene="task_complete")

### 3. task_error — 任务错误/失败
遇到编译错误、测试失败、运行时错误时：
mcp__agent-voice__speak(text="任务执行出错：<错误简述>", scene="task_error")

### 4. need_interaction — 需要用户交互
当需要用户确认、选择、输入时：
mcp__agent-voice__speak(text="需要你的确认：<问题简述>", scene="need_interaction")

### 5. milestone — 关键任务节点
到达重要里程碑时（如构建通过、测试全部通过）：
mcp__agent-voice__speak(text="关键节点：<里程碑描述>", scene="milestone")

## 注意事项
- 语音播报为非阻塞，调用后立即返回
- 播报文本应简洁，控制在 50 字以内
- 不要在循环或高频操作中调用
- 每个场景在一次对话中同类播报最多 1-2 次
```

### 4. 重启 Trae

配置完成后重启 Trae，Agent 即可在任务关键节点自动语音播报。

---

## 配置文件参考

配置文件路径: `~/.agent-voice/config.json`（可选，不创建则使用内置默认值）

### 完整配置示例

```json
{
  "voice": "Tingting",
  "rate": 200,
  "volume": 0.8,
  "scenes": {
    "task_start": {
      "voice": "Tingting",
      "rate": 180,
      "volume": 1.0,
      "emotion": "calm"
    },
    "task_complete": {
      "voice": "Tingting",
      "rate": 220,
      "volume": 0.9,
      "emotion": "happy"
    },
    "task_error": {
      "voice": "Bad News",
      "rate": 180,
      "volume": 0.9,
      "emotion": "calm"
    },
    "need_interaction": {
      "voice": "Tingting",
      "rate": 190,
      "volume": 0.85,
      "emotion": "calm"
    },
    "milestone": {
      "voice": "Tingting",
      "rate": 230,
      "volume": 0.9,
      "emotion": "excited"
    }
  }
}
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `voice` | string | 系统默认 | TTS 音色名称，可用音色通过 `get_voices` 工具查询 |
| `rate` | number | 200 | 语速，范围 50-300 词/分钟 |
| `volume` | number | 1.0 | 音量，范围 0-1 |
| `scenes` | object | - | 场景独立配置，优先级高于全局配置 |
| `scenes.<scene>.voice` | string | 继承全局 | 该场景的音色 |
| `scenes.<scene>.rate` | number | 继承全局 | 该场景的语速 |
| `scenes.<scene>.volume` | number | 继承全局 | 该场景的音量 |
| `scenes.<scene>.emotion` | string | - | 该场景的情感类型：neutral/happy/sad/angry/calm/excited |
| `scenes.<scene>.emotionIntensity` | number | 1.0 | 该场景的情感强度，范围 0-1 |

### 参数优先级

```
Agent 调用时传入的参数  >  场景配置 (scenes.<scene>)  >  全局配置  >  内置默认值
```

---

## MCP 工具 API 参考

### speak — 语音播报

播报文本。非阻塞，调用后立即返回。队列上限 2 条，旧的未播报语音会被丢弃。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `text` | string | 是 | 要播报的文本内容 |
| `voice` | string | 否 | TTS 音色名称，不传则使用配置文件默认音色 |
| `rate` | number | 否 | 语速，范围 50-300 词/分钟，不传则使用配置文件默认值 |
| `volume` | number | 否 | 音量，范围 0-1，不传则使用配置文件默认值 |
| `scene` | string | 否 | 播报场景类型，传入后自动应用该场景在配置中的音色/语速/音量。可选值: `task_start` / `task_complete` / `task_error` / `need_interaction` / `milestone` |
| `emotion` | string | 否 | 情感类型：`neutral` / `happy` / `sad` / `angry` / `calm` / `excited`。macOS 上通过音色切换和语速调节模拟 |
| `emotionIntensity` | number | 否 | 情感强度，范围 0-1，默认 1.0 |

**返回值**: `{ content: [{ type: "text", text: "OK: queued \"...\"" }] }`

### stop — 停止播报

停止当前正在播放的语音并清空播报队列。

**参数**: 无

**返回值**: `{ content: [{ type: "text", text: "OK: voice stopped and queue cleared" }] }`

### get_voices — 获取可用音色

获取当前 TTS 引擎可用的所有音色列表。

**参数**: 无

**返回值**: `{ content: [{ type: "text", text: "[..." }] }` — JSON 数组格式的音色名列表

---

## 常用音色推荐

| 语言 | 音色名 | 描述 |
|------|--------|------|
| 🇨🇳 中文 | Tingting | 标准中文女声 |
| 🇨🇳 中文 | Sinji | 粤语女声 |
| 🇨🇳 中文 | Meijia | 中文女声 |
| 🇺🇸 英文 | Samantha | 美式英语女声 |
| 🇺🇸 英文 | Alex | 美式英语男声 |
| 🇺🇸 英文 | Daniel | 英式英语男声 |
| 🇺🇸 英文 | Karen | 澳式英语女声 |
| ⚠️ 报错专用 | Bad News | 独特警报风格 |
| ⚠️ 报错专用 | Bells | 铃声风格 |

完整音色列表可通过 `get_voices` 工具获取。

## 情感模拟

macOS `say` 命令不支持原生情感参数，agent-voice 通过音色映射和语速调节模拟情感：

| 情感 | 参数值 | 模拟策略 |
|------|--------|---------|
| Neutral | `neutral` | 无调整，使用原始音色 |
| Happy | `happy` | 语速 +15% |
| Sad | `sad` | 切换 Whisper 音色，语速 -25% |
| Calm | `calm` | 切换 Whisper 音色，语速 -15% |
| Excited | `excited` | 语速 +25% |

情感强度通过 `emotionIntensity`（0-1）控制，默认 1.0，值越小效果越弱。

---

## 调试与测试

```bash
# 编译项目
npm run build

# 运行调试脚本（会实际播放语音测试各项功能）
npm run debug

# 运行测试用例
npm test

# 开发模式（监听文件变更自动编译）
npm run dev
```

---

## 项目结构

```
agent-voice/
├── src/
│   ├── index.ts           # MCP Server 入口 (stdio 传输)
│   ├── config.ts          # 配置管理与参数解析
│   ├── voice-queue.ts     # 非阻塞语音播报队列
│   └── tts/
│       ├── interface.ts   # TTS 抽象层接口
│       ├── macos-say.ts   # macOS say 命令实现
│       └── factory.ts     # TTS 引擎工厂（平台自动选择）
├── tests/
│   └── index.test.ts      # 测试用例 (13 个)
├── scripts/
│   └── debug.ts           # 调试脚本
├── .trae/
│   ├── mcp.json           # Trae MCP 配置
│   └── skills/
│       └── agent-voice/
│           └── SKILL.md   # Agent 行为约定
└── dist/                  # 编译产物
```

---

## 常见问题

### Q: 重启 Trae 后语音没触发？

确认两件事：
1. `.trae/mcp.json` 配置正确，MCP 服务已连接
2. `.trae/skills/agent-voice/SKILL.md` Skill 文件存在

### Q: 音色名包含空格（如 "Bad News"）能用吗？

可以。v0.0.2+ 已修复多词音色名解析，`Bad News`、`Good News`、`Pipe Organ` 等均可正常使用。

### Q: 如何确认 MCP 服务正在运行？

在 Trae 中查看 MCP 服务状态，或在对话中直接说"帮我获取可用音色"，Agent 会调用 `get_voices` 工具验证。

### Q: 支持 Windows/Linux 吗？

当前版本仅支持 macOS。后续版本将支持更多平台的 TTS 引擎。

---

## 更新日志

### v0.0.3
- 新增 `emotion` 情感参数：neutral/happy/sad/angry/calm/excited 六种情感
- 新增 `emotionIntensity` 情感强度参数（0-1）
- macOS say 不支持原生情感，通过音色切换（Whisper/Bad News）和语速调节模拟
- 配置文件 scenes 支持 `emotion` 和 `emotionIntensity` 字段
- SKILL.md 新增情感文本风格指引，Agent 根据情感生成不同风格播报文本
- 新增 7 个测试用例（共 19 个）

### v0.0.2
- 配置文件新增 `volume`（音量）全局参数
- 新增 `scenes` 场景独立配置，5 个场景各可指定 voice/rate/volume
- 实现三级参数优先级：调用参数 > 场景配置 > 全局配置 > 默认值
- speak 工具所有 TTS 参数均为可选
- 修复多词音色名解析（Bad News、Good News 等）
- 修复队列竞态条件

### v0.0.1
- MCP Server 基础框架，stdio 传输
- macOS say 命令 TTS 驱动（177 个音色）
- 非阻塞语音播报队列（上限 2 条）
- speak / stop / get_voices 三个 MCP 工具
- JSON 配置文件管理
