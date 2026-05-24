# Session 04 · AI 解释服务 + 坐标修复（WU-07）

## WU-07 · AIExplainService / Mock LLM 模板

### Prompt
```
继续
```

### Agent 回复
- 创建 `src/services/AIExplainService.js`
- 为每种策略实现独立的模板方法
- fallback 模板：无策略命中时的友好建议
- 模板使用 Markdown 格式（`**策略名**`、换行分段）

### 验证结果
- 4 种策略 + fallback 全部生成中文解释
- 解释包含策略名、推理过程、结论
- 零网络请求、零外部依赖
- 实际新增 105 行

### 用户反馈
```
WU-07 模板质量通过，中文解释也可以。但有一个坐标显示 bug：
内部坐标从 0 开始，显示给用户时应该不用加一，且给结论的时候也是按照内部坐标就行
请统一修复所有模板的坐标显示
```

---

## 坐标修复 · 全局 +1 清零

### 偏航事件

Agent 在模板中默认对所有坐标加了 `+ 1`（如 `第 ${row + 1} 行第 ${col + 1} 列`），这不符合项目的 0-based 约定。

### Steering 行为

用户明确指出：内部坐标从 0 开始，显示时不需要加一。

### Agent 修复

修改了 **6 个文件**：

| 文件 | 修复内容 |
|---|---|
| `AIExplainService.js` | 5 个模板方法 + fallback，改为 `(${row},${col})` |
| `NakedSingle.js` | reasoningSteps 坐标 |
| `HiddenSingle.js` | reasoningSteps 坐标 |
| `NakedPair.js` | `_buildResult` + `_buildEliminationResult` 坐标 |
| `PointingPair.js` | reasoningSteps + `lineName` 坐标 |

### 验证
- Grep 确认：`+ 1` 残留 0 处
- 端到端测试：所有输出坐标均为 0-based
- 用户认可

### 决策点
这是一个典型的 UX 决策：0-based vs 1-based 坐标显示。Agent 默认选择了 1-based（更符合非程序员直觉），但项目内部使用 0-based，保持一致性比用户体验更重要。
