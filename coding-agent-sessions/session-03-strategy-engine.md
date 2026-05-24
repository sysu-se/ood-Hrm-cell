# Session 03 · 策略引擎核心（WU-01 ~ WU-06）

## WU-01 · StrategyEngine 骨架 + 类型定义

### Prompt
```
开始 WU-01。按照 AGENTS.md 流程，先声明计划。
```

### Agent 回复
- 声明计划：新建 `types.js`（~25行）+ 新建 `index.js`（~20行）
- 实现了 `StrategyResult` / `Strategy` / `CellRef` / `ReasoningStep` JSDoc 类型
- 实现了 `StrategyEngine` 类：`register()` + `getStrategies()`

### 验证结果
- 语法检查 OK
- `StrategyEngine` 实例化 + `register` + `getStrategies` 工作正常
- 实际新增 40 行（≤45 行目标）

---

## WU-02 · Naked Single / 唯余法

### Prompt
```
启动 WU-02
```

### Agent 回复
- 实现了完整的 NakedSingle 策略
- 收集相关格（同行/列/宫的占用数字）
- 生成结构化 reasoningSteps

### 验证结果
- Naked Single 命中（候选数=5）OK
- 给定格返回 null OK，多候选数空格返回 null OK
- 实际新增 65 行（略超 40 行目标）

### 决策点
- **偏航汇报**：Agent 主动汇报行数超标（65 vs 40），说明原因（relatedCells 去重 + reasoningSteps 使代码更完整）
- **用户决策**：接受 65 行，继续下一 WU

---

## WU-03 · Hidden Single / 摒除法

### 关键偏航事件

**第一次测试失败**：
- Agent 构造的测试盘面不合法（同行 8 个 5）
- 用户拒绝后，Agent 重新构造
- 用户提供的替代测试也不成立（(0,2) 并非 Hidden Single）

**逻辑 Bug 诊断**：
- Agent 通过 debug 输出发现：`_rowCells` 排除了目标格，但 `validCells.length === 1 && ...row && ...col` 永远无法匹配（因为 validCells 不包含目标格）
- 修复：改为 `validCells.length === 0 && sudoku.isValid(row, col, num)`

**Agent 自主构造合法测试**：
- 在 row 8 的 col 1-8 放 1，使 row 0 只有 (0,0) 能填 1
- 测试通过

### 验证结果
- Hidden Single 检测 OK，给定格 null OK，relatedCells 8 个 OK
- 实际新增 99 行

### Steering 要点
- Agent 在测试失败时没有盲目修改代码，而是先 debug 理解根因
- 发现逻辑 bug 后正确修复
- 自行构造了合法的测试盘面

---

## WU-04 · Naked Pair / 显性数对

### 验证结果
- 情形 A（目标格是数对成员）OK
- 情形 B（数对排除目标格候选数）OK
- 给定格 null OK，空棋盘 null OK
- 实际新增 120 行（超标，覆盖两套逻辑）

---

## WU-05 · Pointing Pair / 区块排除

### 验证结果
- box(0,2) 中 1 指向 row 0，排除 (0,5) 的 1 OK
- 不受影响格子 null OK，给定格 null OK
- 实际新增 105 行

---

## WU-06 · explainCell 集成

### Prompt
```
继续
```

### Agent 回复
- 修改 `strategy/index.js`：导入 4 种策略 → 自动注册 → 新增 `explainCell(row, col, sudoku)` 方法
- 按优先级（NakedSingle → HiddenSingle → NakedPair → PointingPair）依次检测

### 验证结果
- 4 种策略全部通过 explainCell 正确调度
- 无匹配返回 null
- 净增 16 行
- **阶段一完成**：策略引擎总计 469 行，零外部依赖
