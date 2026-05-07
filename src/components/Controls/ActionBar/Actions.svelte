<script>
	import { candidates } from '@sudoku/stores/candidates';
	import { userGrid } from '@sudoku/stores/grid';
	import { cursor } from '@sudoku/stores/cursor';
	import { hints } from '@sudoku/stores/hints';
	import { notes } from '@sudoku/stores/notes';
	import { settings } from '@sudoku/stores/settings';
	import { keyboardDisabled } from '@sudoku/stores/keyboard';
	import { gamePaused } from '@sudoku/stores/game';
	// 新增：引入 exploreStore 和 grid
	import { grid, exploreStore } from '@sudoku/stores/grid';
	
	$: hintsAvailable = $hints > 0;

	// 【修复缺点 4】：通过读取 $grid 强制触发 Svelte 响应式更新
	$: canUndo = $grid && grid.canUndo();
	$: canRedo = $grid && grid.canRedo();

	// --- 提示功能 ---
	
	function handleHintCandidates() {
		// 内容1.候选提示：获取当前格子的候选数，并自动填入草稿(Notes)中
		if ($cursor.x !== null && $cursor.y !== null) {
			const domainCandidates = grid.getCandidates($cursor.x, $cursor.y);
			
			if (domainCandidates.length > 0) {
				const pos = { x: $cursor.x, y: $cursor.y };
				
				// 1. 先清空该格子可能残留的手动笔记
				if ($candidates.hasOwnProperty(pos.x + ',' + pos.y)) {
					candidates.clear(pos);
				}
				
				// 2. 利用 store 提供的 add 方法，把候选数逐个加进去
				domainCandidates.forEach(num => {
					candidates.add(pos, num);
				});

			} else {
				alert("该格子已填或无可用候选数！");
			}
		} else {
			alert("请先选中一个空格子！");
		}
	}

	function handleNextHint() {
		// 内容2.下一步提示：调用 Domain 寻找全盘唯一解并填入
		if (hintsAvailable) {
			const success = grid.applyHint();
			if (!success && !$exploreStore) {
				alert("当前没有唯一确定的格子！你需要开启【探索模式】。");
			} else if (success) {
				hints.useHint(); // 扣除提示次数
			}
		}
	}

	// --- 探索模式 ---

	function toggleExplore() {
		if (!$exploreStore) grid.startExplore();
	}
	function commitExplore() {
		grid.commitExplore();
	}
	function rollbackExplore() {
		grid.rollbackExplore();
	}
</script>

<div class="action-buttons space-x-3 flex-wrap">

	<!-- 撤销/重做 (状态现已响应式绑定 canUndo / canRedo) -->
	<button class="btn btn-round" disabled={$gamePaused || !canUndo} title="Undo" on:click={() => grid.undo()}>
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
		</svg>
	</button>

	<button class="btn btn-round" disabled={$gamePaused || !canRedo} title="Redo" on:click={() => grid.redo()}>
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 90 00-8 8v2M21 10l-6 6m6-6l-6-6" />
		</svg>
	</button>

	<!-- Hint 1: 候选提示 -->
	<button class="btn btn-round" disabled={$keyboardDisabled || $cursor.x === null} on:click={handleHintCandidates} title="显示候选数">
		<span class="font-bold text-lg text-gray-600">C</span>
	</button>

	<!-- Hint 2: 下一步提示 -->
	<button class="btn btn-round btn-badge" disabled={$keyboardDisabled || !hintsAvailable || ($cursor.x !== null && $userGrid[$cursor.y][$cursor.x] !== 0)} on:click={handleNextHint} title="下一步提示">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
		</svg>
		{#if $settings.hintsLimited}
			<span class="badge" class:badge-primary={hintsAvailable}>{$hints}</span>
		{/if}
	</button>

	<button class="btn btn-round btn-badge" on:click={notes.toggle} title="Notes ({$notes ? 'ON' : 'OFF'})">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
		</svg>
		<span class="badge tracking-tighter" class:badge-primary={$notes}>{$notes ? 'ON' : 'OFF'}</span>
	</button>

	<!-- 探索模式控制面板 -->
	<div class="flex space-x-1 border-l-2 border-gray-300 pl-3">
		{#if !$exploreStore}
			<button class="btn btn-round border-dashed border-2 border-blue-400 text-blue-600" title="进入探索模式" on:click={toggleExplore}>
				探
			</button>
		{:else}
			<!-- 探索中：允许提交或回滚 -->
			<button class="btn btn-round bg-green-100 text-green-700 font-bold" title="确认探索(提交)" on:click={commitExplore}>
				✓
			</button>
			<button class="btn btn-round bg-red-100 text-red-700 font-bold" title="回溯放弃(记忆死胡同)" on:click={rollbackExplore}>
				✗
			</button>
		{/if}
	</div>

</div>

<style>
	.action-buttons {
		@apply flex justify-evenly self-end;
	}
	.btn-badge { @apply relative; }
	.badge {
		min-height: 20px; min-width: 20px;
		@apply p-1 rounded-full leading-none text-center text-xs text-white bg-gray-600 inline-block absolute top-0 left-0;
	}
	.badge-primary { @apply bg-primary; }
</style>