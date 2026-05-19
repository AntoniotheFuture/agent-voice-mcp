# agent-voice v0.0.2

为开发 Agent 提供 TTS 语音播报能力的本地 MCP 服务。

## 系统要求

- Node.js >= 22
- macOS（当前版本仅支持 macOS 的 `say` 命令）

## 安装

```bash
cd agent-voice
npm install
npm run build
```

## 在 Trae 中配置 MCP 服务

在 Trae 的 MCP 服务配置中添加以下配置：

**配置方式一：项目级配置**

在项目根目录创建 `.trae/mcp.json`：

```json
{
  "mcpServers": {
    "agent-voice": {
      "command": "node",
      "args": ["/Users/antonioliang/Documents/projects/agent-voice/dist/index.js"]
    }
  }
}
```

**配置方式二：全局配置**

在 Trae 设置中搜索 "MCP"，添加 stdio 类型的服务器：
- 命令: `node`
- 参数: `/Users/antonioliang/Documents/projects/agent-voice/dist/index.js`

## 配置 TTS 参数

在 `~/.agent-voice/config.json` 创建配置文件（可选）：

```json
{
  "voice": "Tingting",
  "rate": 175,
  "volume": 1.0
}
```

### 场景独立配置

可为不同播报场景配置不同的音色、语速和音量。调用 `speak` 时传入 `scene` 参数即可自动应用：

```json
{
  "voice": "Tingting",
  "rate": 175,
  "volume": 1.0,
  "scenes": {
    "task_start": {
      "rate": 180
    },
    "task_complete": {
      "rate": 160
    },
    "task_error": {
      "voice": "Bad News",
      "rate": 150,
      "volume": 0.9
    },
    "need_interaction": {
      "rate": 170
    }
  }
}
```

### 优先级规则

```
调用时参数 > 场景配置 > 全局配置 > 内置默认值
```

- 最高优先：Agent 调用 `speak` 时显式传入的 `voice`/`rate`/`volume`
- 次优先：配置文件中 `scenes.<scene>` 下的对应参数
- 兜底：配置文件全局的 `voice`/`rate`/`volume`
- 最终兜底：内置默认值（rate=175, volume=1.0）

## MCP 工具说明

### speak

播报文本。非阻塞，超过 2 条的队列中旧语音会被丢弃。

参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 要播报的文本 |
| voice | string | 否 | 音色名称，不传则用配置文件 |
| rate | number | 否 | 语速 50-300，不传则用配置文件 |
| volume | number | 否 | 音量 0-1，不传则用配置文件 |
| scene | string | 否 | 场景：task_start / task_complete / task_error / need_interaction / milestone |

### stop

停止当前语音并清空队列。

### get_voices

获取可用音色列表。

## 调试

```bash
# 运行调试脚本
npm run debug

# 运行测试
npm test
```

## 项目结构

```
agent-voice/
├── src/
│   ├── index.ts           # MCP Server 入口
│   ├── config.ts          # 配置管理
│   ├── voice-queue.ts     # 语音播报队列
│   └── tts/
│       ├── interface.ts   # TTS 抽象接口
│       ├── macos-say.ts   # macOS say 命令实现
│       └── factory.ts     # TTS 引擎工厂
├── tests/
│   └── index.test.ts      # 测试用例
├── scripts/
│   └── debug.ts           # 调试脚本
└── dist/                  # 构建产物

## 更新日志

### v0.0.2
- 支持通过配置文件设置全局 `volume`（音量）
- 支持场景独立配置：`scenes.<scene>` 可为各场景指定不同的 voice/rate/volume
- 参数优先级：调用时参数 > 场景配置 > 全局配置 > 内置默认值
- speak 工具所有 TTS 参数均为可选，不传自动应用配置

### v0.0.1
- 初始版本，MCP Server 基础框架
- macOS say 命令 TTS 驱动（177 个音色）
- 非阻塞语音播报队列
- speak / stop / get_voices 三个 MCP 工具
```
