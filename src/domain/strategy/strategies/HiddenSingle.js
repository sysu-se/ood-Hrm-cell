// src/domain/strategy/strategies/HiddenSingle.js
// 摒除法：在某行/列/宫中，某数字只能填入唯一格子

export const HiddenSingle = {
  name: 'Hidden Single',
  chineseName: '摒除法',
  difficulty: 2,

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

    const houses = [
      { type: '行', cells: this._rowCells(row, col) },
      { type: '列', cells: this._colCells(row, col) },
      { type: '宫', cells: this._boxCells(row, col) }
    ];

    for (let num = 1; num <= 9; num++) {
      for (const house of houses) {
        // 该 house 中是否已有此数字
        const exists = house.cells.some(
          c => grid[c.row][c.col] === num
        );
        if (exists) continue;

        let validCells = [];
        for (const c of house.cells) {
          if (grid[c.row][c.col] === 0 && sudoku.isValid(c.row, c.col, num)) {
            validCells.push(c);
          }
        }

        // house.cells 已排除目标格，若其他格均无法填 num 而目标格可以，即为 Hidden Single
        if (validCells.length === 0 && sudoku.isValid(row, col, num)) {
          const relatedCells = house.cells
            .filter(c => grid[c.row][c.col] === 0)
            .map(c => ({ row: c.row, col: c.col, role: 'excluded', value: num }));

          return {
            strategyName: this.name,
            chineseName: this.chineseName,
            difficulty: this.difficulty,
            targetCell: { row, col, value: num, role: 'target' },
            relatedCells,
            reasoningSteps: [
              {
                step: 1,
                description: `检查数字 ${num} 在当前${house.type}中的位置`
              },
              {
                step: 2,
                description: `当前${house.type}中其他空格均无法填入 ${num}（被各自列/行/宫中的 ${num} 摒除）`
              },
              {
                step: 3,
                description: `因此 (${row},${col}) 是该${house.type}中唯一能填 ${num} 的格子`
              }
            ],
            candidates: [num]
          };
        }
      }
    }

    return null;
  },

  _rowCells(row, excludeCol) {
    return Array.from({ length: 9 }, (_, c) => ({ row, col: c }))
      .filter(c => c.col !== excludeCol);
  },

  _colCells(excludeRow, col) {
    return Array.from({ length: 9 }, (_, r) => ({ row: r, col }))
      .filter(c => c.row !== excludeRow);
  },

  _boxCells(row, col) {
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    const cells = [];
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        if (!(r === row && c === col)) cells.push({ row: r, col: c });
      }
    }
    return cells;
  }
};

export default HiddenSingle;
