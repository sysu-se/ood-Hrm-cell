// src/services/AIExplainService.js
// Mock AI 解释服务 — 纯模板生成，将策略结论翻译为中文自然语言

export class AIExplainService {
  /**
   * @param {import('../domain/strategy/types').StrategyResult | null} result
   * @param {{row: number, col: number}} [cell]
   * @returns {string}
   */
  explain(result, cell) {
    if (!result) return this._fallback(cell);

    switch (result.strategyName) {
      case 'Naked Single':   return this._explainNakedSingle(result);
      case 'Hidden Single':  return this._explainHiddenSingle(result);
      case 'Naked Pair':     return this._explainNakedPair(result);
      case 'Pointing Pair':  return this._explainPointingPair(result);
      default:               return this._fallback(cell);
    }
  }

  _explainNakedSingle(r) {
    const { row, col, value } = r.targetCell;
    const occupied = [...new Set(r.relatedCells.map(c => c.value))].sort((a, b) => a - b);
    return [
      `**${r.chineseName}**（${r.strategyName}）`,
      '',
      `(${row},${col}) 是空格。`,
      `检查它的同行、同列和同宫，已出现数字：${occupied.join('、')}。`,
      `排除了这 ${occupied.length} 个数字后，只剩下 **${value}** 可以填入。`,
      '',
      `结论：(${row},${col}) = **${value}**`
    ].join('\n');
  }

  _explainHiddenSingle(r) {
    const { row, col, value } = r.targetCell;
    const step1 = r.reasoningSteps[0]?.description || '';
    const houseMatch = step1.match(/当前(.)/);
    const houseName = houseMatch ? houseMatch[1] : '区域';
    return [
      `**${r.chineseName}**（${r.strategyName}）`,
      '',
      `虽然 (${row},${col}) 有多个候选数，但数字 **${value}** 在当前${houseName}中的其他空格均无法填入——`,
      `这些空格各自的行/列/宫中已经存在 ${value}，将它们"摒除"了。`,
      '',
      `因此 (${row},${col}) 是当前${houseName}中唯一能填 **${value}** 的格子。`,
      '',
      `结论：(${row},${col}) = **${value}**`
    ].join('\n');
  }

  _explainNakedPair(r) {
    const { row, col } = r.targetCell;
    const paired = r.relatedCells.find(c => c.role === 'paired');
    const cands = r.candidates;
    const step1 = r.reasoningSteps[0]?.description || '';
    const houseMatch = step1.match(/当前(.)/);
    const houseName = houseMatch ? houseMatch[1] : '区域';

    let text = [
      `**${r.chineseName}**（${r.strategyName}）`,
      ''
    ];
    if (paired) {
      text.push(
        `在当前${houseName}中，(${row},${col}) 和 (${paired.row},${paired.col}) 都**有且仅有**两个候选数：{${cands.join(', ')}}。`,
        '',
        `这形成了"显性数对"：${cands.join(' 和 ')} 必定占据这两个格子（暂时不确定各自位置）。`
      );
    } else {
      const pairedCells = r.relatedCells.filter(c => c.role === 'paired');
      const coords = pairedCells.map(c => `(${c.row},${c.col})`).join(' 和 ');
      text.push(
        `在当前${houseName}中，${coords} 形成了显性数对 {${cands.join(', ')}}。`
      );
    }
    if (r.eliminatedCandidates?.length) {
      text.push(
        '',
        `因此 (${row},${col}) 可以排除候选数：${r.eliminatedCandidates.join('、')}。`,
        `更新后该格的候选数为：{${r.candidates.join(', ')}}。`
      );
    }
    return text.join('\n');
  }

  _explainPointingPair(r) {
    const { row, col } = r.targetCell;
    const step1 = r.reasoningSteps[0]?.description || '';
    const eliminated = r.eliminatedCandidates || [];

    return [
      `**${r.chineseName}**（${r.strategyName}）`,
      '',
      step1 + '。',
      `因此该数字必定出现在这一行/列上，可以排除同行/列（宫外）的 ${eliminated.join('、')}。`,
      '',
      `受影响的格子 (${row},${col}) 可以排除候选数：${eliminated.join('、')}。`
    ].join('\n');
  }

  _fallback(cell) {
    if (!cell) return '当前盘面无法用基础策略直接推断，建议查看候选数或进入探索模式。';
    return [
      `(${cell.row},${cell.col}) 无法用基础策略（唯余法、摒除法、显性数对、区块排除）直接推断。`,
      '',
      '建议：',
      '- 使用"候选数"功能查看该格可能的数字',
      '- 查看其他区域是否还有线索',
      '- 进入**探索模式**进行试错推理'
    ].join('\n');
  }
}

export default AIExplainService;
