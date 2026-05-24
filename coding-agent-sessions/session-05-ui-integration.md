# Session 05 · UI 集成 + 构建修复（WU-08 ~ WU-11）

## WU-08 · ChatPanel 基础 UI

### 验证
- Svelte 组件创建完成：折叠面板、消息列表、输入框、Enter 发送
- 占位回复逻辑，为 WU-09 接入引擎做准备
- 实际 85 行

---

## 构建修复 · PostCSS / Tailwind 版本冲突

### 偏航事件

在 WU-08 和 WU-09 之间，用户要求修复 `npm run build` 的构建失败。

### 诊断过程

1. **错误现象**：`TypeError: node.getIterator is not a function`（PostCSS 8 中移除了 PostCSS 7 的 API）
2. **依赖树分析**：
   ```
   tailwindcss@1.9.6 → postcss@7.0.39（内部）
   postcss@8.4.31（顶层）← svelte-preprocess
   ```
3. **根因定位**：`tailwindcss@1.9.6` 是 PostCSS 7 插件，在 PostCSS 8 管道中运行崩溃
4. **修复方案**（用户确认后执行）：
   - `tailwindcss: "^2.2.19"` — 原生支持 PostCSS 8
   - `tailwind.config.js` — 补回 `shadow-outline`（v2 中移除）
5. **二次错误**：`postcss-clean@1.1.0` 内部使用 PostCSS 6，产生不兼容节点
6. **最终修复**：`postcss-clean → cssnano@^5.1.15`

### 验证
- `npm run build` 成功（exit code 0）
- `dist/bundle.js` 正常生成

### 决策点
- 选择了升级而非降级策略（升级 tailwindcss + 替换 postcss-clean），避免了破坏 vitest/vite 的 PostCSS 8 依赖
- 这是一个典型的"理解复杂工具链"的 AD 难题

---

## WU-09 · ChatPanel 连接 AI 服务

### Prompt
```
继续
```

### Agent 回复
- 为确保 ChatPanel 能访问 Game 的 Sudoku 实例，在 grid store 新增了 `getSudoku()` 和 `getNextHint()` 两个访问器
- ChatPanel 的 `send()` 替换为真实引擎调用
- 实现了命令解析：`解释 (r,c)` / `候选数 (r,c)` / `下一步` / `帮助`
- 支持英文命令（explain / candidates / next / help）

### 验证
- `npm run build` OK
- 坐标解析（有/无括号、半角/全角逗号）OK
- 命令匹配测试 7/7 OK
- 实际净增约 65 行

---

## WU-10 · 棋盘关联格高亮

### Prompt
```
继续
```

### Agent 回复
- 新建 `highlight.js` store（writable，null = 无高亮）
- Board 订阅 highlight store，传递 3 个新 props 到 Cell
- Cell 新增 3 种 CSS 高亮样式：
  - `highlight-target`：绿色 ring（目标格）
  - `highlight-related`：蓝色 ring（关联格 / paired cells）
  - `highlight-excluded`：红色淡化（排除格 / occupied cells）
- ChatPanel 在 `explainCell` 时同步设置高亮，折叠/清空/非解释命令时清除

### 验证
- `npm run build` OK
- 高亮映射从 StrategyResult 正确提取 target/related/excluded
- 实际修改净增约 50 行

---

## WU-11 · App 集成 + 端到端验证

### CSS 兼容性微调
- `disabled:opacity-40` 在 Tailwind v2 中需显式启用 `disabled` variant
- 改用独立 CSS 规则 `.send-btn:disabled { opacity-40 }` 绕过

### 最终验证
- `npm run build` OK
- 21 项全系统测试全部通过：
  - 4 种策略检测 + 值验证
  - AI 解释生成（含坐标 0-based 验证）
  - 高亮映射
  - Sudoku 公共接口完整性
  - Fallback 兜底
