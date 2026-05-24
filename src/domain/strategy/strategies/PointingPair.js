// src/domain/strategy/strategies/PointingPair.js
// 区块排除：某宫中某数字候选位全部落在同行/列，可排除该行/列宫外的该数字

export const PointingPair = {
  name: 'Pointing Pair',
  chineseName: '区块排除',
  difficulty: 3,

  /**
   * @param {import('../../Sudoku.js').Sudoku} sudoku
   * @param {number} row
   * @param {number} col
   * @returns {import('../types').StrategyResult | null}
   */
  detect(sudoku, row, col) {
    if (sudoku.isGiven(row, col)) return null;
    if (sudoku.getGrid()[row][col] !== 0) return null;

    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    // 同行带的其他两个宫
    for (let otherBC = 0; otherBC < 3; otherBC++) {
      if (otherBC === boxCol) continue;
      const result = this._checkBox(sudoku, boxRow, otherBC, 'row', row, col);
      if (result) return result;
    }

    // 同列带的其他两个宫
    for (let otherBR = 0; otherBR < 3; otherBR++) {
      if (otherBR === boxRow) continue;
      const result = this._checkBox(sudoku, otherBR, boxCol, 'col', row, col);
      if (result) return result;
    }

    return null;
  },

  /**
   * @param {import('../../Sudoku.js').Sudoku} sudoku
   * @param {number} bRow - 宫的行索引 0-2
   * @param {number} bCol - 宫的列索引 0-2
   * @param {'row'|'col'} direction - 检查行锁定还是列锁定
   * @param {number} targetRow
   * @param {number} targetCol
   */
  _checkBox(sudoku, bRow, bCol, direction, targetRow, targetCol) {
    const grid = sudoku.getGrid();
    const sr = bRow * 3, sc = bCol * 3;

    for (let num = 1; num <= 9; num++) {
      // 宫中是否已有此数字
      let exists = false;
      for (let r = sr; r < sr + 3; r++)
        for (let c = sc; c < sc + 3; c++)
          if (grid[r][c] === num) exists = true;
      if (exists) continue;

      // 收集宫中可填此数字的格子
      const cells = [];
      for (let r = sr; r < sr + 3; r++)
        for (let c = sc; c < sc + 3; c++)
          if (grid[r][c] === 0 && sudoku.isValid(r, c, num))
            cells.push({ row: r, col: c });

      if (cells.length === 0) continue;

      // 判断所有候选位是否在同行或同列
      const lockedLine = direction === 'row'
        ? (cells.every(c => c.row === cells[0].row) ? cells[0].row : null)
        : (cells.every(c => c.col === cells[0].col) ? cells[0].col : null);

      if (lockedLine === null) continue;

      // 目标格是否在锁定行/列上且在被排除的宫外区域
      const targetOnLine = direction === 'row' ? targetRow === lockedLine : targetCol === lockedLine;
      const targetInBox = (
        targetRow >= sr && targetRow < sr + 3 &&
        targetCol >= sc && targetCol < sc + 3
      );
      if (!targetOnLine || targetInBox) continue;

      // 目标格是否以 num 为候选数
      if (!sudoku.isValid(targetRow, targetCol, num)) continue;

      const boxCells = cells.map(c => ({ row: c.row, col: c.col, role: 'related', value: num }));
      const lineName = direction === 'row' ? `第 ${lockedLine} 行` : `第 ${lockedLine} 列`;

      return {
        strategyName: this.name,
        chineseName: this.chineseName,
        difficulty: this.difficulty,
        targetCell: { row: targetRow, col: targetCol, role: 'target' },
        relatedCells: [
          ...boxCells,
          { row: targetRow, col: targetCol, role: 'excluded', value: num }
        ],
        reasoningSteps: [
          { step: 1, description: `在第 ${bRow} 排第 ${bCol} 列的宫中，数字 ${num} 的所有候选位置都在${lineName}` },
          { step: 2, description: `因此该宫中 ${num} 必定在${lineName}，可以排除${lineName}上宫外的 ${num}` },
          { step: 3, description: `(${targetRow},${targetCol}) 在此行/列上且不在该宫中，可以排除 ${num}` }
        ],
        eliminatedCandidates: [num]
      };
    }

    return null;
  }
};

export default PointingPair;
