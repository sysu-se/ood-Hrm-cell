<script>
  import { StrategyEngine } from '../../domain/strategy/index.js';
  import { AIExplainService } from '../../services/AIExplainService.js';
  import { grid } from '@sudoku/stores/grid';
  import { highlight, clearHighlight } from '@sudoku/stores/highlight';

  const engine = new StrategyEngine();
  const ai = new AIExplainService();

  let expanded = false;
  let messages = [];
  let input = '';

  function toggle() {
    expanded = !expanded;
    if (!expanded) clearHighlight();
  }

  function send() {
    const text = input.trim();
    if (!text) return;

    messages = [...messages, { role: 'user', text }];

    const response = handleQuery(text);
    messages = [...messages, { role: 'ai', text: response }];

    input = '';
  }

  function handleQuery(query) {
    const coords = parseCoords(query);
    const lower = query.toLowerCase();

    // "解释 (r,c)" / "explain (r,c)" / "帮我看 (r,c)"
    if (coords && /解释|explain|why|为什么|帮我看|analyze|查看/.test(lower)) {
      return explainCell(coords.row, coords.col);
    }

    // "候选数 (r,c)" / "candidates (r,c)"
    if (coords && /候选|candidate|可能/.test(lower)) {
      return getCandidates(coords.row, coords.col);
    }

    // "下一步" / "next" / "hint"
    if (/下一步|next|hint|提示/.test(lower)) {
      return getNextHint();
    }

    // "帮助" / "help"
    if (/帮助|help|怎么|功能/.test(lower)) {
      return [
        '我可以帮你做以下事情：',
        '',
        '**解释 (行,列)** — 用策略引擎分析某个格子',
        '  例："解释 (0,2)"',
        '',
        '**候选数 (行,列)** — 查看某个格子的候选数字',
        '  例："候选数 (3,5)"',
        '',
        '**下一步** — 查找全盘唯一确定的格子',
        '',
        '坐标格式：(row,col)，内部坐标从 0 开始'
      ].join('\n');
    }

    // 只有坐标没有命令 → 默认解释
    if (coords) {
      return explainCell(coords.row, coords.col);
    }

    return '请用以下格式提问：\n"解释 (行,列)" · "候选数 (行,列)" · "下一步"\n坐标从 0 开始，(0,0) 是左上角';
  }

  function parseCoords(str) {
    const m = str.match(/\(?\s*(\d)\s*[,，]\s*(\d)\s*\)?/);
    if (!m) return null;
    return { row: parseInt(m[1]), col: parseInt(m[2]) };
  }

  function explainCell(row, col) {
    const sudoku = grid.getSudoku();
    if (!sudoku) return '请先生成一局游戏。';
    if (row < 0 || row > 8 || col < 0 || col > 8) return '坐标超出范围，请输入 0-8 之间的数字。';

    const result = engine.explainCell(row, col, sudoku);
    // 同步棋盘高亮
    if (result) {
      highlight.set({
        target: result.targetCell,
        related: result.relatedCells.filter(c => c.role === 'paired' || c.role === 'related'),
        excluded: result.relatedCells.filter(c => c.role === 'excluded' || c.role === 'occupied')
      });
    } else {
      clearHighlight();
    }
    return ai.explain(result, { row, col });
  }

  function getCandidates(row, col) {
    clearHighlight();
    const cands = grid.getCandidates(col, row); // grid API: (x=col, y=row)
    if (!cands || cands.length === 0) {
      return `(${row},${col}) 是固定格或已填数字，没有候选数。`;
    }
    return `(${row},${col}) 的候选数字：${cands.join('、')}`;
  }

  function getNextHint() {
    clearHighlight();
    const hint = grid.getNextHint();
    if (!hint) {
      return '当前盘面没有唯一确定的格子。建议进入**探索模式**进行试错推理。';
    }
    // 高亮 hints 的格子
    highlight.set({
      target: hint,
      related: [],
      excluded: []
    });
    return [
      `全盘扫描发现：(${hint.row},${hint.col}) 有唯一候选数 **${hint.value}**。`,
      '',
      '你可以手动填入，或点击"提示"按钮自动填入。'
    ].join('\n');
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function clearMessages() {
    messages = [];
    clearHighlight();
  }
</script>

<div class="chat-panel" class:expanded>
  <button class="chat-toggle" on:click={toggle}>
    {expanded ? '收起 AI 导师' : 'AI 导师'}
    <span class="toggle-icon">{expanded ? '▼' : '▲'}</span>
  </button>

  {#if expanded}
    <div class="chat-body">
      <div class="messages">
        {#if messages.length === 0}
          <div class="empty-hint">
            向我提问：<br />
            "解释 (3,5)" · "下一步该看哪里？" · "候选数 (0,2)"
          </div>
        {/if}
        {#each messages as msg}
          <div class="message {msg.role}">
            <span class="role-label">{msg.role === 'user' ? '你' : 'AI 导师'}</span>
            <div class="msg-text">{msg.text}</div>
          </div>
        {/each}
      </div>

      <div class="input-row">
        <textarea
          bind:value={input}
          on:keydown={handleKeydown}
          placeholder="输入问题..."
          rows="1"
        />
        <button class="send-btn" on:click={send} disabled={!input.trim()}>发送</button>
      </div>

      {#if messages.length > 0}
        <button class="clear-btn" on:click={clearMessages}>清空对话</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .chat-panel {
    @apply fixed bottom-0 left-0 right-0 z-30 bg-gray-900 border-t border-gray-700;
    max-height: 40vh;
    display: flex;
    flex-direction: column;
  }

  .chat-toggle {
    @apply w-full py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700;
    @apply flex items-center justify-center gap-2;
  }

  .toggle-icon {
    @apply text-xs;
  }

  .chat-body {
    @apply flex flex-col px-4 pb-3;
    max-height: 35vh;
  }

  .messages {
    @apply flex-1 overflow-y-auto py-2 space-y-2;
    min-height: 60px;
  }

  .empty-hint {
    @apply text-gray-500 text-sm text-center py-4 leading-relaxed;
  }

  .message {
    @apply rounded-lg px-3 py-2 text-sm max-w-full;
  }

  .message.user {
    @apply bg-blue-800 text-blue-100 self-end ml-8;
  }

  .message.ai {
    @apply bg-gray-700 text-gray-100 self-start mr-8;
    white-space: pre-wrap;
  }

  .role-label {
    @apply text-xs font-bold opacity-60 block mb-1;
  }

  .msg-text {
    @apply leading-relaxed;
  }

  .input-row {
    @apply flex gap-2 mt-2;
  }

  textarea {
    @apply flex-1 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 text-sm;
    @apply border border-gray-600 outline-none resize-none;
  }

  textarea:focus {
    @apply border-blue-500;
  }

  .send-btn {
    @apply px-4 py-2 bg-blue-600 text-white text-sm rounded-lg;
    @apply hover:bg-blue-500;
  }

  .send-btn:disabled {
    @apply opacity-40 cursor-not-allowed;
  }

  .clear-btn {
    @apply text-xs text-gray-500 hover:text-gray-300 mt-1 self-start;
  }
</style>
