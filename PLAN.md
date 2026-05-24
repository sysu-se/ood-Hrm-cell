# PLAN.md — AI Sudoku (AI Tutor) 开发路线图

## 总览

本计划将 AI Tutor 的开发拆分为 **11 个工作单元（WU）**，分为三个阶段：

| 阶段 | WU | 目标 |
|---|---|---|
| 阶段一：策略引擎 | WU-01 ~ WU-06 | 纯本地规则引擎，检测 4 种标准数独策略 |
| 阶段二：AI 解释服务 | WU-07 | Mock LLM，将策略输出转为中文解释 |
| 阶段三：UI 集成 | WU-08 ~ WU-11 | Chat 面板 + 棋盘高亮 + 端到端集成 |

每个 WU 新增代码 **≤ 100 行**，遵循 计划 → 实现 → 验证 流程。

---

## 阶段一：策略引擎（Strategy Engine）

### WU-01 · StrategyEngine 骨架 + 策略类型定义

**目标**：建立策略引擎的模块结构和策略接口约定。

**涉及文件**：
- `[新建]` `src/domain/strategy/types.js` — 定义 `StrategyResult` 数据结构（JSDoc 类型注释）
- `[新建]` `src/domain/strategy/index.js` — `StrategyEngine` 类骨架：策略注册表、`register()` 方法
- `[不改]` `src/domain/Sudoku.js` — 仅读取已有公共接口作为参考

**验收标准**：
1. `node -c` 语法检查通过
2. `StrategyEngine` 可实例化，`register(strategy)` 可注册策略对象
3. `StrategyResult` 结构体包含：`strategyName`、`chineseName`、`targetCell`、`relatedCells`、`reasoningSteps` 字段
4. 新增代码 ≤ 45 行

---

### WU-02 · Naked Single 策略（唯余法）

**目标**：实现最基础的策略 — 当某个空格只有唯一候选数时命中。

**涉及文件**：
- `[新建]` `src/domain/strategy/strategies/NakedSingle.js`
- `[不改]` `src/domain/Sudoku.js` — 调用 `getCandidates()` / `isValid()`

**验收标准**：
1. 输入一个空格坐标，若该格只有 1 个合法候选数 → 返回完整 `StrategyResult`
2. 若候选数 > 1 或格子非空 → 返回 `null`
3. `relatedCells` 包含导致排除的其他格子坐标（同行/列/宫的冲突数字位置）
4. 新增代码 ≤ 40 行

---

### WU-03 · Hidden Single 策略（摒除法）

**目标**：实现在一个行/列/宫内，某数字只有一个合法位置的检测。

**涉及文件**：
- `[新建]` `src/domain/strategy/strategies/HiddenSingle.js`
- `[不改]` `src/domain/Sudoku.js` — 调用 `getGrid()` / `isValid()` / `isGiven()`

**验收标准**：
1. 遍历 1~9 每个数字，在某行/列/宫中若只有 1 个合法位置 → 返回该位置的 `StrategyResult`
2. 若全盘无 Hidden Single → 返回 `null`
3. `relatedCells` 包含同一宫中占据该数字"其他位置"的已填格子
4. 新增代码 ≤ 55 行

---

### WU-04 · Naked Pair 策略（显性数对）

**目标**：检测某行/列/宫中，两个空格共享完全相同的 2 个候选数且只有这 2 个候选数的情况。

**涉及文件**：
- `[新建]` `src/domain/strategy/strategies/NakedPair.js`
- `[不改]` `src/domain/Sudoku.js` — 调用 `getCandidates()`

**验收标准**：
1. 对每行/列/宫，找到恰好有 2 个候选数的空格；若两个格子候选数完全相同 → 命中
2. 从该行/列/宫的其他空格中，排除这 2 个数字（作为 `relatedCells` 和 `eliminatedCandidates` 返回）
3. 无命中时返回 `null`
4. 新增代码 ≤ 75 行

---

### WU-05 · Pointing Pair 策略（区块排除）

**目标**：检测在一个宫中，某候选数只出现在同一行/列，从而排除该行/列（宫外）的该候选数。

**涉及文件**：
- `[新建]` `src/domain/strategy/strategies/PointingPair.js`
- `[不改]` `src/domain/Sudoku.js` — 调用 `getCandidates()`

**验收标准**：
1. 对每个宫 + 每个数字 1~9：若该数字在宫内的所有候选位置共享同一行/列 → 命中
2. 返回该行/列上（宫外）被排除候选数的格子作为 `relatedCells`
3. 无命中时返回 `null`
4. 新增代码 ≤ 70 行

---

### WU-06 · StrategyEngine.explainCell() 方法

**目标**：为策略引擎添加主入口方法 — 给定一个格子，按策略优先级依次检测，返回第一个命中的策略结论。

**涉及文件**：
- `[修改]` `src/domain/strategy/index.js` — 新增 `explainCell(row, col, sudoku)` 方法，注册全部 4 种策略
- `[不改]` `src/domain/Sudoku.js`

**验收标准**：
1. `explainCell(row, col, sudoku)` 按优先级（NakedSingle → HiddenSingle → NakedPair → PointingPair）依次检测
2. 返回第一个命中的策略的 `StrategyResult`
3. 若全部未命中，返回 `null`（附提示"需要更高级策略或探索模式"）
4. 新增代码 ≤ 45 行

---

## 阶段二：AI 解释服务（Mock LLM）

### WU-07 · AIExplainService — 模板化中文解释生成

**目标**：创建 Mock 模式的 AI 解释服务，将策略引擎的结构化输出转化为高质量中文自然语言。

**涉及文件**：
- `[新建]` `src/services/AIExplainService.js`
- `[不改]` `src/domain/strategy/types.js` — 仅读取类型定义

**验收标准**：
1. `explain(strategyResult)` 方法接收 `StrategyResult`，返回中文自然语言字符串
2. 每种策略有独立的解释模板，说明 **策略名 + 推理过程 + 结论**
3. 输出的中文流畅自然，包含策略的中文名、关联格坐标、推理链条
4. 若 `strategyResult` 为 `null`，返回友好提示（"当前盘面无法用基础策略直接推断此格，建议进入探索模式"）
5. 纯模板生成，无网络请求，无外部依赖
6. 新增代码 ≤ 80 行

**模板示例**（NakedSingle 的中文模板）：
> "这里用到了**唯余法**。第 {row} 行第 {col} 列的这个空格，它的同行、同列和同宫中已经出现了 {occupied}，因此只剩下 {value} 可以填入。"

---

## 阶段三：UI 集成

### WU-08 · ChatPanel 基础 UI 组件

**目标**：创建一个基础的对话面板 Svelte 组件（先静态，不连引擎）。

**涉及文件**：
- `[新建]` `src/components/Chat/index.svelte` — 聊天面板组件

**验收标准**：
1. 渲染一个底部聊天面板：消息列表区域 + 输入框 + 发送按钮
2. 消息列表支持显示"用户消息"和"AI 消息"，用不同样式区分
3. 输入框支持 Enter 发送、Shift+Enter 换行
4. 面板可通过按钮折叠/展开
5. 新增代码 ≤ 80 行

---

### WU-09 · ChatPanel 连接 AI 服务

**目标**：将 ChatPanel 与游戏状态、策略引擎和 AI 解释服务打通。

**涉及文件**：
- `[修改]` `src/components/Chat/index.svelte` — 新增 store 订阅和消息处理逻辑
- `[不改]` `src/domain/*` — 通过导入调用

**验收标准**：
1. 用户输入"解释 (3,5)" 或 "为什么这格是 X" → 调用 `StrategyEngine.explainCell()` → 调用 `AIExplainService.explain()` → 显示 AI 回复
2. 用户输入"下一步该看哪里？" → 调用 `getNextHint()` → 以自然语言提示
3. 用户输入"候选数 (3,5)" → 调用 `getCandidates()` → 显示 "该格可能的数字：{list}"
4. 对话历史在组件内正确维护
5. 新增/修改代码 ≤ 65 行

---

### WU-10 · 棋盘关联格高亮

**目标**：当 AI 解释某个策略时，在棋盘上高亮关联格，帮助用户"看见"推理过程。

**涉及文件**：
- `[新建]` `src/node_modules/@sudoku/stores/highlight.js` — 高亮状态 writable store
- `[修改]` `src/components/Board/Cell.svelte` — 响应高亮状态，添加 CSS 类
- `[修改]` `src/components/Chat/index.svelte` — 当显示 AI 解释时，同步更新高亮 store

**验收标准**：
1. AI 回复中包含 `relatedCells` 坐标时，棋盘对应格子显示高亮
2. 提供 3 种高亮样式：目标格（绿色边框）、关联格（蓝色半透明）、排除格（红色淡化）
3. 用户点击棋盘其他位置或关闭 Chat 面板时，高亮自动清除
4. 新增/修改代码 ≤ 70 行

---

### WU-11 · App 集成 + 端到端验证

**目标**：将 ChatPanel 集成到主应用布局中，完成端到端验证。

**涉及文件**：
- `[修改]` `src/App.svelte` — 引入 ChatPanel 组件，调整布局
- 可能需要引入一个简单的布局容器

**验收标准**：
1. Chat 面板出现在游戏界面底部或侧边，不遮挡棋盘
2. 完整用户流程可走通：开始游戏 → 点击格子 → 输入"解释这格" → 看到 AI 中文解释 → 棋盘高亮关联格 → 高亮可关闭
3. 已有功能（undo/redo、hint、explore mode）不受影响
4. `npm run dev` 可正常启动，无编译错误
5. 新增/修改代码 ≤ 50 行

---

## 预估总计

| 指标 | 数值 |
|---|---|
| WU 总数 | 11 |
| 新增文件 | ~10 |
| 修改文件 | ~4 |
| 预估总新增代码行数 | ~675 行 |
| 修改已有接口 | 0（严格遵守架构约束） |

## 依赖关系图

```
WU-01 (骨架)
  ├─→ WU-02 (Naked Single)
  ├─→ WU-03 (Hidden Single)
  ├─→ WU-04 (Naked Pair)
  └─→ WU-05 (Pointing Pair)
         └─→ WU-06 (explainCell 集成)
                └─→ WU-07 (AIExplainService)
                       └─→ WU-09 (ChatPanel + 服务连接)
                              ├─→ WU-10 (棋盘高亮)
                              └─→ WU-11 (App 集成)
        WU-08 (ChatPanel UI 壳) ──┘
```

WU-02 ~ WU-05 互不依赖，可并行开发。WU-08 可与 WU-01 ~ WU-07 并行开发。
