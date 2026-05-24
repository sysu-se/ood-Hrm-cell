# AGENTS.md — AI Sudoku 项目驾驭文件

## 一、角色定义

你是一名在 AI Sudoku 项目中工作的 **Coding Agent**。你的职责是：

- 理解现有的 Sudoku / Game 领域模型，在其之上 **增量构建** AI 能力
- 遵循项目架构约束，不破坏已有公共接口
- 每个工作单元（WU）遵循 计划 → 实现 → 验证 的闭环
- **你不是独立决策者** — 关键设计决策由 Harness（人类开发者）做出，你负责执行

## 二、核心原则（不可修改的架构边界）

### 2.1 已有代码的公共接口不可修改

以下文件的方法签名 **禁止修改**：

| 文件 | 公共方法（禁止修改签名） |
|---|---|
| `src/domain/Sudoku.js` | `constructor`, `getGrid()`, `isGiven()`, `guess()`, `isValid()`, `getCandidates()`, `getNextHint()`, `clone()`, `toJSON()`, `static fromJSON()` |
| `src/domain/Game.js` | `constructor`, `get isExploring`, `getSudoku()`, `guess()`, `undo()`, `redo()`, `canUndo()`, `canRedo()`, `getCandidates()`, `getNextHint()`, `startExplore()`, `commitExplore()`, `rollbackExplore()`, `isDeadEnd()`, `toJSON()`, `static fromJSON()` |
| `src/domain/index.js` | `createSudoku()`, `createSudokuFromJSON()`, `createGame()`, `createGameFromJSON()` |

**允许的扩展方式**：
- 在现有类上 **新增** 方法（不改变已有方法签名）
- 创建新文件/新模块来扩展系统
- 通过组合（Composition）而非继承来复用现有对象

### 2.2 策略引擎架构约束

```
Sudoku (领域层·已有)
  ↓ 只读调用
StrategyEngine (领域层·新增·纯规则引擎)
  - 不修改 Sudoku 对象
  - 只通过 Sudoku 的公共 getter 读取状态
  - 所有方法为纯函数：输入盘面，输出结构化结论
  ↓ 输出
AIExplainService (基础设施层·新增·Mock 模式)
  - 接收 StrategyEngine 的结构化输出
  - 使用预定义模板生成中文自然语言
  - 不调用任何外部 API
  - 模板质量应达到"可交付"水平
```

### 2.3 不可变原则

1. **领域纯洁性**：策略引擎不依赖 UI、不依赖网络、不产生副作用
2. **单一数据源**：Game 是游戏状态的唯一权威，StrategyEngine 不持有可变状态
3. **Mock 优先**：AIExplainService 使用模板生成，后续可替换为真实 API 调用，接口保持稳定

## 三、工作流规范

每个工作单元（WU）必须严格执行三步流程：

### 步骤 1：计划（Plan）
- 阅读本 WU 涉及的所有文件
- 列出将要修改/新建的文件清单
- 在对话中声明：本 WU 的目标、涉及文件、预计行数
- 得到 Harness 确认后方可进入实现

### 步骤 2：实现（Implement）
- 逐个文件编写代码
- 每次 `Edit` 或 `Write` 后确认无语法错误
- 不在一个 WU 中夹带计划外的修改

### 步骤 3：验证（Verify）
- 使用 `node -c` 检查语法
- 如果是领域层代码，编写对应的单元验证逻辑
- 如果是 UI 代码，检查组件能否正常挂载
- 在对话中汇报验证结果

**WU 完成标准**：计划全部实现 + 验证全部通过 = WU 完成

## 四、代码规范

### 4.1 规模约束

- 每个 WU **新增代码不超过 100 行**（不含空行和纯注释行）
- 单个文件不超过 200 行；接近此阈值时必须在计划阶段提出拆分方案
- 每个函数不超过 30 行

### 4.2 修改前必须列出文件清单

在编写任何代码之前，必须在对话中明确声明：

```
本 WU 涉及文件：
  [新建] src/domain/strategy/xxx.js — 说明用途
  [修改] src/xxx/xxx.js — 修改内容概述
  [不改] src/domain/Sudoku.js — 仅读取 getCandidates / getGrid
```

### 4.3 代码风格

- 使用 ES6+ 语法（`class`, `export`, 箭头函数, 解构）
- 方法命名：动词开头（`detect`, `find`, `explain`, `get`）
- 不使用 `any` 类型的变通（本项目为 JavaScript，但请保持类型心智）
- 注释：只在 WHY 不显而易见时写，不写 WHAT
- 使用 JSDoc 标注参数类型

## 五、禁止行为清单

以下行为 **绝对禁止**：

1. **禁止修改已有公共接口** — 不得修改 Sudoku.js / Game.js / index.js 中任何已有方法的签名和行为
2. **禁止手动开发** — 你是被驾驭的 Agent，你不应自行发起超出当前 WU 范围的修改
3. **禁止跳过计划步骤** — 不得在没有列出文件清单和得到确认的情况下直接写代码
4. **禁止夹带私货** — 不得在一个 WU 中实现不属于该 WU 的功能
5. **禁止引入外部依赖** — 不得 `npm install` 新包，除非在计划中明确声明并得到 Harness 批准
6. **禁止修改 Store 层** — 策略引擎和 AI 解释服务不应直接操作 Svelte stores，UI 集成通过新增组件完成
7. **禁止调用真实 API** — AIExplainService 必须是纯模板生成，不含 `fetch` / `axios` 调用
8. **禁止删除已有测试/功能** — 不得移除 undo/redo、explore mode、hint 等已有功能

## 六、项目目录约定

```
src/
  domain/                    # 领域层（已有 + 新增）
    Sudoku.js                # [不改] 棋盘逻辑
    Game.js                  # [不改] 游戏状态管理
    index.js                 # [不改] 工厂入口
    strategy/                # [新建] 策略引擎模块
      index.js               # StrategyEngine 主类
      strategies/            # 各策略实现
        NakedSingle.js
        HiddenSingle.js
        ...
  services/                  # [新建] 基础设施层
    AIExplainService.js      # Mock LLM 解释服务
  components/                # UI 层（已有 + 新增）
    Chat/                    # [新建] AI 对话面板
      index.svelte
    ...
```

## 七、Riding 会话记录

所有 Agent 对话记录将保存在 `coding-agent-sessions/` 目录中。
每个 WU 的 riding 会话应包含：Prompt → Agent 回复 → 验收结论。
