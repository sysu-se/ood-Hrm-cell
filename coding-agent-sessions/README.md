# coding-agent-sessions — AI Sudoku Riding 记录

本目录保存本次 Agentic Development 的 Riding 消息集。

## 会话索引

| 文件 | 内容 | WU 覆盖 |
|---|---|---|
| [session-01-architecture.md](session-01-architecture.md) | 产品架构设计：3 种 AI 方案讨论与选定 | 架构决策 |
| [session-02-harness.md](session-02-harness.md) | 驾驭文件生成：AGENTS.md + PLAN.md | Harness |
| [session-03-strategy-engine.md](session-03-strategy-engine.md) | 阶段一：策略引擎核心（WU-01 ~ WU-06） | WU-01~06 |
| [session-04-ai-explain.md](session-04-ai-explain.md) | 阶段二：AI 解释服务（WU-07）+ 坐标修复 | WU-07 |
| [session-05-ui-integration.md](session-05-ui-integration.md) | 阶段三：UI 集成（WU-08 ~ WU-11）+ 构建修复 | WU-08~11 |
| [session-06-delivery.md](session-06-delivery.md) | 最终验证 + AGENTIC.md + 交付 | 交付 |

## 格式说明

每个 session 文件采用以下结构：

```
## 轮次 N：<Prompt 摘要>

### Prompt（关键部分）
<用户给出的关键指令>

### Agent 回复摘要
<Agent 的关键行动和输出>

### 决策点
<该轮次中的关键决策和偏航修正>
```

这些记录展示了真实的 Riding 过程，包括：
- Harness 通过 AGENTS.md/PLAN.md 约束 Agent 行为
- Agent 的偏航事件及 Steering 修正
- 每个 WU 的计划 → 实现 → 验证 闭环
- 关键技术决策（Mock 模式、0-based 坐标、构建修复）
