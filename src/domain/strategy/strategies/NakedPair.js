// src/domain/strategy/strategies/NakedPair.js
// 显性数对：某行/列/宫中两个格子共享完全相同的两个候选数

export const NakedPair = {
  name: 'Naked Pair',
  chineseName: '显性数对',
  difficulty: 3,

  /**
   * @param {import('../../Sudoku.js').Sudoku} sudoku
   * @param {number} row
   * @param {number} col
   * @returns {import('../types').StrategyResult | null}
   */
  detect(sudoku, row, col) {
    if (sudoku.isGiven(row, col)) return null;

    const grid = sudoku.getGrid();
    if (grid[row][col] !== 0) return null;

    const targetCands = sudoku.getCandidates(row, col);
    if (targetCands.length === 0) return null;

    const houses = [
      { type: '行', cells: this._houseCells('row', row, col) },
      { type: '列', cells: this._houseCells('col', row, col) },
      { type: '宫', cells: this._houseCells('box', row, col) }
    ];

    // 情形 A：目标格有恰好 2 个候选数，查找同宫中是否有相同候选数的格子
    if (targetCands.length === 2) {
      for (const house of houses) {
        const paired = house.cells.find(
          c => this._sameCandidates(sudoku, c.row, c.col, targetCands)
        );
        if (paired) {
          return this._buildResult(row, col, paired, house, targetCands, sudoku);
        }
      }
    }

    // 情形 B：目标格候选数 > 2，查找同宫中是否有数对可排除目标格的候选数
    for (const house of houses) {
      const empties = house.cells.filter(c => grid[c.row][c.col] === 0);
      for (let i = 0; i < empties.length; i++) {
        const aCands = sudoku.getCandidates(empties[i].row, empties[i].col);
        if (aCands.length !== 2) continue;

        for (let j = i + 1; j < empties.length; j++) {
          const bCands = sudoku.getCandidates(empties[j].row, empties[j].col);
          if (this._sameArray(aCands, bCands)) {
            const eliminated = targetCands.filter(v => aCands.includes(v));
            if (eliminated.length > 0) {
              return this._buildEliminationResult(row, col, empties[i], empties[j],
                house, aCands, eliminated, sudoku);
            }
          }
        }
      }
    }

    return null;
  },

  _sameCandidates(sudoku, r, c, cands) {
    const other = sudoku.getCandidates(r, c);
    return this._sameArray(other, cands);
  },

  _sameArray(a, b) {
    return a.length === b.length && a.every(v => b.includes(v));
  },

  _houseCells(type, row, col) {
    const cells = [];
    if (type === 'row') {
      for (let c = 0; c < 9; c++) if (c !== col) cells.push({ row, col: c });
    } else if (type === 'col') {
      for (let r = 0; r < 9; r++) if (r !== row) cells.push({ row: r, col });
    } else {
      const br = Math.floor(row / 3) * 3;
      const bc = Math.floor(col / 3) * 3;
      for (let r = br; r < br + 3; r++)
        for (let c = bc; c < bc + 3; c++)
          if (!(r === row && c === col)) cells.push({ row: r, col: c });
    }
    return cells;
  },

  _buildResult(row, col, paired, house, cands, sudoku) {
    const eliminated = house.cells.filter(
      c => !(c.row === paired.row && c.col === paired.col) &&
        sudoku.getCandidates(c.row, c.col).some(v => cands.includes(v))
    ).map(c => ({ row: c.row, col: c.col, role: 'excluded', candidates: cands }));

    return {
      strategyName: this.name,
      chineseName: this.chineseName,
      difficulty: this.difficulty,
      targetCell: { row, col, role: 'target' },
      relatedCells: [
        { row: paired.row, col: paired.col, role: 'paired' },
        ...eliminated
      ],
      reasoningSteps: [
        { step: 1, description: `当前${house.type}中，(${row},${col}) 和 (${paired.row},${paired.col}) 都有且仅有候选数 {${cands.join(',')}}` },
        { step: 2, description: `这形成了显性数对：${cands.join(' 和 ')} 必定占据这两个格子` },
        { step: 3, description: `因此可以从当前${house.type}的其他格子中排除 ${cands.join(' 和 ')}` }
      ],
      candidates: cands
    };
  },

  _buildEliminationResult(row, col, cellA, cellB, house, pairCands, eliminated, sudoku) {
    return {
      strategyName: this.name,
      chineseName: this.chineseName,
      difficulty: this.difficulty,
      targetCell: { row, col, role: 'target' },
      relatedCells: [
        { row: cellA.row, col: cellA.col, role: 'paired' },
        { row: cellB.row, col: cellB.col, role: 'paired' }
      ],
      reasoningSteps: [
        { step: 1, description: `当前${house.type}中，(${cellA.row},${cellA.col}) 和 (${cellB.row},${cellB.col}) 形成了显性数对 {${pairCands.join(',')}}` },
        { step: 2, description: `这意味着 ${pairCands.join(' 和 ')} 只能出现在这两个格子中` },
        { step: 3, description: `因此 (${row},${col}) 可以排除 ${eliminated.join(' 和 ')}` }
      ],
      candidates: sudoku.getCandidates(row, col).filter(v => !eliminated.includes(v)),
      eliminatedCandidates: eliminated
    };
  }
};

export default NakedPair;
