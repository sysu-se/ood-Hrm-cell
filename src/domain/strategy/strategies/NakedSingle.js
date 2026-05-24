// src/domain/strategy/strategies/NakedSingle.js
// 唯余法：当一个空格的所有其他数字都被同行/列/宫的数字排除时，只剩唯一候选数

import { Sudoku } from '../../Sudoku.js';

export const NakedSingle = {
  name: 'Naked Single',
  chineseName: '唯余法',
  difficulty: 1,

  /**
   * @param {Sudoku} sudoku
   * @param {number} row
   * @param {number} col
   * @returns {import('../types').StrategyResult | null}
   */
  detect(sudoku, row, col) {
    if (sudoku.isGiven(row, col)) return null;

    const grid = sudoku.getGrid();
    if (grid[row][col] !== 0) return null;

    const candidates = sudoku.getCandidates(row, col);
    if (candidates.length !== 1) return null;

    const value = candidates[0];
    const relatedCells = [];

    // 收集同行/列/宫中"占据"了其他数字的格子作为关联格
    for (let i = 0; i < 9; i++) {
      if (i !== col && grid[row][i] !== 0) {
        relatedCells.push({ row, col: i, role: 'occupied', value: grid[row][i] });
      }
      if (i !== row && grid[i][col] !== 0) {
        relatedCells.push({ row: i, col, role: 'occupied', value: grid[i][col] });
      }
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (!(r === row && c === col) && grid[r][c] !== 0) {
          const alreadyAdded = relatedCells.some(
            cell => cell.row === r && cell.col === c
          );
          if (!alreadyAdded) {
            relatedCells.push({ row: r, col: c, role: 'occupied', value: grid[r][c] });
          }
        }
      }
    }

    const occupied = [...new Set(relatedCells.map(c => c.value))].sort((a, b) => a - b);

    return {
      strategyName: this.name,
      chineseName: this.chineseName,
      difficulty: this.difficulty,
      targetCell: { row, col, value, role: 'target' },
      relatedCells,
      reasoningSteps: [
        {
          step: 1,
          description: `(${row},${col}) 是空格，检查其候选数`
        },
        {
          step: 2,
          description: `同行/列/宫中已出现数字：${occupied.join('、')}，排除了 8 个数字`
        },
        {
          step: 3,
          description: `唯一剩余的数字是 ${value}，因此该格只能填 ${value}`
        }
      ],
      candidates: [value]
    };
  }
};

export default NakedSingle;
