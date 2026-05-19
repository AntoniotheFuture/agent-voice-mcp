---
name: "agent-voice"
description: "通过TTS语音播报Agent任务生命周期节点。在任务开始/完成/失败、需要用户交互、到达关键里程碑时自动调用MCP语音工具播报。"
---

# Agent Voice 语音播报

在以下 **5 个场景** 必须调用 MCP 的 `agent-voice` 服务进行语音播报：

## 调用规则

### 1. task_start — 开始执行任务
接到用户新任务时，播报任务摘要：
```
mcp__agent-voice__speak(text="开始执行任务：<简短任务描述>", scene="task_start")
```

### 2. task_complete — 任务执行完成
任务完成后（包括代码修改、构建、测试全部通过后），播报完成信息：
```
mcp__agent-voice__speak(text="任务执行完成：<简短总结>", scene="task_complete")
```

### 3. task_error — 任务错误/失败
遇到编译错误、测试失败、运行时错误时：
```
mcp__agent-voice__speak(text="任务执行出错：<错误简述>", scene="task_error")
```

### 4. need_interaction — 需要用户交互
当需要用户确认、选择、输入时：
```
mcp__agent-voice__speak(text="需要你的确认：<问题简述>", scene="need_interaction")
```

### 5. milestone — 关键任务节点
到达重要里程碑时（如构建通过、测试全部通过、版本发布等）：
```
mcp__agent-voice__speak(text="关键节点：<里程碑描述>", scene="milestone")
```

## 注意事项

- 语音播报为非阻塞，调用后立即返回，不等待播报完成
- 播报文本应简洁，控制在 50 字以内
- 不要在循环或高频操作中调用
- 每个场景在一次对话中同类播报最多 1-2 次，避免扰民
- `scene` 参数会自动匹配配置文件中的场景音色/语速/音量
