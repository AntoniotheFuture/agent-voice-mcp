# agent-voice v0.0.5

为 AI Agent 提供 TTS 语音播报能力的通用 MCP 服务。在 Agent 的任务生命周期、关键节点、交互式询问时自动通过 TTS 语音提醒用户。适用于 Trae、Claude Desktop、Cursor、WindSurf 等所有支持 MCP 的 Agent。

> **不限于 Trae** — 本服务基于标准 MCP 协议（stdio 传输），任何 MCP 客户端均可接入。

## 系统要求

- **Node.js** >= 18
- **操作系统**: macOS / Windows / Linux

## 快速开始

### 1. 安装

**方式一：npm 全局安装（推荐）**

```bash
npm install -g agent-voice-mcp
```

**方式二：手动安装**

```bash
git clone https://github.com/AntoniotheFuture/agent-voice-mcp.git
cd agent-voice
npm install
npm run build
```

### 2. 配置 MCP 客户端

在 **任意 MCP 客户端**（Trae / Claude Desktop / Cursor / WindSurf 等）中添加 stdio 服务器，以下二选一：

**方式一：npx 自动下载运行（推荐普通用户）**

```json
{
  "mcpServers": {
    "agent-voice": {
      "command": "npx",
      "args": ["-y", "agent-voice-mcp"]
    }
  }
}
```

**方式二：本地项目文件运行（推荐开发调试）**

```json
{
  "mcpServers": {
    "agent-voice": {
      "command": "node",
      "args": ["/完整路径/agent-voice/dist/index.js"]
    }
  }
}
```

#### Trae 用户

将以下内容配置到MCP配置：

```json
{
  "mcpServers": {
    "agent-voice": {
      "command": "npx",
      "args": ["-y", "agent-voice-mcp"]
    }
  }
}
```

> **注意**：如本地开发调试，可将 `command` 改为 `"node"`，`args` 改为 `["dist/index.js"]` 使用本地编译产物。

#### Claude Desktop 用户

在 `~/Library/Application Support/Claude/claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "agent-voice": {
      "command": "npx",
      "args": ["-y", "agent-voice-mcp"]
    }
  }
}
```

其他 MCP 客户端请参考其官方文档，核心都是添加 stdio 服务器，命令和参数相同。

### 3. 配置 Skill（行为约定）

在项目根目录创建 `.trae/skills/agent-voice/SKILL.md`（仅 Trae 需要，其他 Agent 请参考其 skill 配置方式）：

```markdown
---
name: "agent-voice"
description: "通过TTS语音播报Agent任务生命周期节点。在任务开始/完成/失败、需要用户交互、到达关键里程碑时自动调用MCP语音工具播报。"
---

# Agent Voice 语音播报

在以下 **5 个场景** 必须调用 MCP 的 `agent-voice` 服务进行语音播报：

### 1. task_start — 开始执行任务
mcp__agent-voice__speak(text="开始执行任务：<简短任务描述>", scene="task_start")

### 2. task_complete — 任务执行完成
mcp__agent-voice__speak(text="任务执行完成：<简短总结>", scene="task_complete")

### 3. task_error — 任务错误/失败
mcp__agent-voice__speak(text="任务执行出错：<错误简述>", scene="task_error")

### 4. need_interaction — 需要用户交互
mcp__agent-voice__speak(text="需要你的确认：<问题简述>", scene="need_interaction")

### 5. milestone — 关键任务节点
mcp__agent-voice__speak(text="关键节点：<里程碑描述>", scene="milestone")

## 注意事项
- 语音播报为非阻塞，调用后立即返回
- 播报文本应简洁，控制在 50 字以内
- 不要在循环或高频操作中调用
- 每个场景在一次对话中同类播报最多 1-2 次
```

### 4. 强制规则（确保 Agent 使用语音播报）

仅配置 MCP 和 Skill 还不够，Agent 不会自动使用 MCP 工具——你需要通过**规则（Rules）或提示词（Prompts）**强制 Agent 在任务中调用语音播报。

#### Trae 用户

在项目根目录创建 `.trae/rules/project_rules.md`，写入：

```markdown
在每次任务中，必须调用 agent-voice MCP 服务进行语音播报，生命周期节点包括：
1. 任务开始时 — task_start
2. 每个子任务完成时 — milestone
3. 任务全部完成时 — task_complete
4. 遇到错误时 — task_error
5. 需要用户确认时 — need_interaction

示例：
mcp__agent-voice__speak(text="开始执行任务：...", scene="task_start", emotion="calm")
```

#### 其他 Agent（Claude Desktop / Cursor / WindSurf 等）

在你的 Agent 系统提示词（System Prompt）或项目规则中加入：

```
You have access to the "agent-voice" MCP server. For EVERY task you perform,
you MUST call mcp__agent-voice__speak at the following lifecycle points:
- task_start: when you begin working on a task
- milestone: when you complete a subtask or key step
- task_complete: when all tasks are done
- task_error: when you encounter an error
- need_interaction: when you need user confirmation
Keep the text under 50 characters. Use the appropriate "scene" parameter.
```

### 5. 重启客户端

配置完成后重启你的 MCP 客户端，Agent 即可在任务关键节点自动语音播报。

---

## 配置文件

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
      "voice": "Tingting",
      "rate": 250,
      "volume": 1.0,
      "emotion": "angry"
    },
    "need_interaction": {
      "voice": "Tingting",
      "rate": 200,
      "volume": 1.0
    },
    "milestone": {
      "voice": "Tingting",
      "rate": 220,
      "volume": 0.9,
      "emotion": "happy"
    }
  }
}
```

### 配置项说明

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `engine` | TTS 引擎：`piper` / `cloud` | `piper` |
| `voice` | 默认音色 | `Tingting` |
| `rate` | 语速 50-300 | `200` |
| `volume` | 音量 0-1 | `0.8` |
| `scenes` | 各场景独立配置 | - |

---

## TTS 引擎

### 本地引擎

| 引擎 | 平台 | 说明 |
|------|------|------|
| `piper` | macOS / Windows / Linux | 跨平台神经网络 TTS，支持多语言 |
| `say` | macOS 专用 | 系统内置音色，无需安装 |
| `edge` | 全部平台 | Edge TTS，API 调用需网络 |

### 云端引擎

`engine: "cloud"` 开启，支持三种主流云端 TTS 服务商，**无需写代码**，通过参数配置即可接入：

| 类型 | 认证方式 | 适用服务商 |
|------|----------|-----------|
| `openai` | Bearer Token | OpenAI TTS、DeepSeek 及所有兼容 `/v1/audio/speech` 的服务 |
| `volcano` | Bearer Token | 火山引擎（豆包语音合成） |
| `custom` | 模板变量 | 任意 HTTP API |

### 1. OpenAI 兼容型 (`provider: "openai"`)

适用于 OpenAI TTS、DeepSeek 及所有兼容 `/v1/audio/speech` 接口的服务。

```json
{
  "engine": "cloud",
  "cloud": {
    "provider": "openai",
    "apiKey": "sk-your-key-here",
    "baseUrl": "https://api.openai.com/v1",
    "model": "tts-1",
    "voice": "alloy",
    "timeout": 30000
  },
  "rate": 200,
  "volume": 0.8
}
```

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `apiKey` | API 密钥 | 必填 |
| `baseUrl` | API 基础地址 | `https://api.openai.com/v1` |
| `model` | 模型名 | `tts-1` |
| `voice` | 音色 | `alloy` |
| `timeout` | 超时 (ms) | 30000 |

**可选音色**: `alloy` / `echo` / `fable` / `onyx` / `nova` / `shimmer`

---

### 2. 火山引擎型 (`provider: "volcano"`)

适用于豆包语音合成（openspeech.bytedance.com）。

```json
{
  "engine": "cloud",
  "cloud": {
    "provider": "volcano",
    "token": "你的Access Token",
    "appId": "你的App ID",
    "voice": "zh_female_qingxinnvsheng_mars_bigtts",
    "cluster": "volcano_tts",
    "timeout": 30000
  }
}
```

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `token` | Access Token（在火山引擎控制台获取） | 必填 |
| `appId` | 应用 ID | 必填 |
| `voice` | 音色类型 | `BV001_streaming` |
| `cluster` | 引擎集群 | `volcano_tts` |
| `timeout` | 超时 (ms) | 30000 |

**推荐音色（需与 cluster 匹配）**:

| cluster | 适用音色 |
|---------|---------|
| `volcano_tts` | `zh_female_qingxinnvsheng_mars_bigtts` |
| `volcano_mega` | `zh_male_qianran_mars_bigtts` |
| `volcano_icl` | `zh_female_tianerxiaowa_mars` |

> 获取 Token：火山引擎控制台 → 语音合成 → 找到 AppID + AccessToken（注意不是 SecretKey）

---

### 3. 通用 HTTP 型 (`provider: "custom"`)

通过模板变量 `{{text}}` `{{voice}}` `{{rate}}` `{{volume}}` 拼装请求，适配任意 HTTP API。

```json
{
  "engine": "cloud",
  "cloud": {
    "provider": "custom",
    "method": "POST",
    "url": "https://your-tts-api.com/tts",
    "headers": {
      "Authorization": "Bearer your-token"
    },
    "bodyTemplate": "{\"text\":\"{{text}}\",\"voice\":\"{{voice}}\"}",
    "responseAudioPath": "data.audio",
    "timeout": 30000
  }
}
```

| 字段 | 说明 |
|------|------|
| `method` | HTTP 方法 |
| `url` | 请求地址，支持模板变量 |
| `headers` | 请求头 |
| `bodyTemplate` | 请求体模板，支持 `{{text}}` `{{voice}}` `{{rate}}` `{{volume}}` |
| `responseAudioPath` | 响应中音频数据的 JSON 路径（支持嵌套如 `data.result`） |

---

## 本地音色

### Piper 音色（跨平台，推荐）

| 语言 | 音色 | 说明 |
|------|------|------|
| 🇨🇳 中文 | ZXH | 中文男声 |
| 🇨🇳 中文 | ZhVits | 中文女声 |
| 🇺🇸 英文 | en_US-lessac-medium | 英式英语女声 |
| 🇺🇸 英文 | en_US-lessac-lcast | 美式英语女声 |

下载模型后放在 `models/piper/` 目录，配置 `voice: "模型文件名"` 即可使用。

### macOS say 音色

通过 `npm run voices:mac` 可列出系统所有可用音色，部分音色：

| 语言 | 音色 | 说明 |
|------|------|------|
| 🇨🇳 中文 | Tingting | macOS 中文女声 |
| 🇨🇳 中文 | Sinji | 粤语女声 |
| 🇨🇳 中文 | Meijia | 中文女声 |
| 🇺🇸 英文 | Samantha | 美式英语女声 |
| 🇺🇸 英文 | Alex | 美式英语男声 |
| 🇺🇸 英文 | Daniel | 英式英语男声 |
| 🇺🇸 英文 | Karen | 澳式英语女声 |
| ⚠️ 报错专用 | Bad News | 独特警报风格 |
| ⚠️ 报错专用 | Bells | 铃声风格 |

完整音色列表可通过 `get_voices` 工具获取。

---

## MCP 工具 API 参考

### speak

语音播报，支持场景和情绪配置。

```
mcp__agent-voice__speak(
  text: string,       // 播报文本，控制在 50 字以内
  scene?: "task_start" | "task_complete" | "task_error" | "need_interaction" | "milestone",
  emotion?: "neutral" | "happy" | "sad" | "angry" | "calm" | "excited",
  voice?: string,      // 覆盖默认音色
  rate?: number,      // 覆盖默认语速
  volume?: number     // 覆盖默认音量
)
```

### stop

立即停止当前播报。

```
mcp__agent-voice__stop()
```

### get_voices

获取当前引擎支持的所有音色列表。

```
mcp__agent-voice__get_voices() => string[]
```

---

## 调试

### 本地云端 TTS 调试

```bash
npm run debug-cloud
```

读取 `~/.agent-voice/debug-cloud.json` 配置，直连云端 API 并播放音频，用于排查云端合成问题。

### 音色预览

```bash
npm run voices:mac       # macOS say 音色
npm run voices:piper     # Piper 音色
```

---

## 项目结构

```
agent-voice/
├── src/
│   ├── index.ts           # MCP Server 入口 (stdio 传输)
│   ├── config.ts          # 配置加载与 ${ENV_VAR} 插值
│   ├── voice-queue.ts    # 播报队列（防重复、防打断）
│   └── tts/
│       ├── factory.ts          # TTS 引擎工厂
│       ├── interface.ts        # TTS 引擎接口
│       ├── piper-tts.ts        # Piper 跨平台引擎
│       ├── say-mac.ts          # macOS say 引擎
│       ├── edge-tts.ts         # Edge TTS 引擎
│       └── cloud/
│           ├── engine.ts        # 云端 TTS 引擎
│           ├── types.ts        # 云端类型定义
│           └── providers/
│               ├── openai.ts    # OpenAI 兼容 Bearer Token
│               ├── volcano.ts   # 火山引擎 Bearer Token
│               └── custom.ts    # 通用 HTTP 模板
├── .trae/
│   ├── mcp.json           # Trae MCP 配置
│   └── skills/agent-voice/SKILL.md  # Skill 行为约定
├── models/piper/          # Piper 模型目录
└── tests/                 # 测试套件
```

---

## 常见问题

### Q: 重启后语音没触发？
1. `.trae/mcp.json` 配置正确，MCP 服务已连接
2. Skill 文件 `.trae/skills/agent-voice/SKILL.md` 存在且格式正确
3. 重启客户端后等待几秒让 MCP 服务初始化

### Q: 火山引擎报 403 错误？
检查 `voice` 和 `cluster` 是否匹配，可参考上表中的推荐搭配，不同集群支持的音色不同。

### Q: 如何确认 MCP 服务正在运行？
在对话中直接说"获取可用音色"，Agent 会调用 `get_voices` 工具验证。

### Q: 云端 TTS Token 怎么配置更安全？
敏感凭证建议直接写入 `~/.agent-voice/config.json`（不在项目目录中，不会被 git 追踪），也可以使用 `${ENV_VAR}` 语法从环境变量读取。

### Q: afplay 播放失败？
macOS 用户检查是否安装了 afplay（系统自带）。如果 afplay 无响应（如卡死或超时），可能是音频格式问题或系统音频服务异常，尝试重启音频服务：`killall coreaudiod`。

---

## 更新日志

### v0.0.4
- **解绑 Trae**：构建通用 MCP TTS 服务，支持所有 MCP 客户端
- 新增云端 TTS 引擎，支持 OpenAI、火山引擎、Custom HTTP 三种类型
- Piper 引擎提升为跨平台通用选项（`engine: "piper"` 所有平台均可用）
- MCP 启动时自动播报"agent-voice 服务已启动"提示语
- 新增 `debug-cloud` 一键调试脚本
- 新增 `voice-queue` 防重复播报机制
- 新增环境变量 `${ENV_VAR}` 配置插值支持
- 新增情绪（emotion）参数，对应场景情绪音色
- MCP Server 基础框架，stdio 传输
- speak / stop / get_voices 三个 MCP 工具
- 完整测试套件（33 个测试用例）
