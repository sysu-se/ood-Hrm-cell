# Session 02 · 驾驭框架建立

## AGENTS.md 关键设定

| 设定 | 内容 |
|---|---|
| Agent 角色 | 增量构建者，非独立决策者 |
| 不可修改边界 | Sudoku.js / Game.js / index.js 公共接口 |
| 工作流 | 计划 → 实现 → 验证（每 WU 三步闭环） |
| 代码规范 | ≤100 行/WU，先列文件清单再写代码 |
| 禁止行为 | 修改已有接口、跳过计划、夹带私货、引入外部依赖、调用真实 API |

## PLAN.md 路线图

```
阶段一：策略引擎（WU-01 ~ WU-06）
  WU-01: StrategyEngine 骨架 + 类型定义（~45行）
  WU-02: Naked Single / 唯余法（~40行）
  WU-03: Hidden Single / 摒除法（~55行）
  WU-04: Naked Pair / 显性数对（~75行）
  WU-05: Pointing Pair / 区块排除（~70行）
  WU-06: explainCell 集成（~45行）

阶段二：AI 解释服务（WU-07）
  WU-07: AIExplainService Mock 模板（~80行）

阶段三：UI 集成（WU-08 ~ WU-11）
  WU-08: ChatPanel 基础 UI（~80行）
  WU-09: ChatPanel 连接引擎（~65行）
  WU-10: 棋盘高亮（~70行）
  WU-11: App 集成 + E2E 验证（~50行）
```

依赖关系：WU-02~05 可并行，WU-08 可与阶段一并行。

## Steering 规则

1. 每个 WU 开始前必须声明：目标、涉及文件、预估行数
2. 用户确认后方可执行
3. 执行完成后立即验证
4. 验证结果汇报给用户
5. 如有超标/偏离，主动汇报
