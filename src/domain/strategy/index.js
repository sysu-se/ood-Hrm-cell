// src/domain/strategy/index.js
// StrategyEngine — 策略注册与调度中心

import { NakedSingle } from './strategies/NakedSingle.js';
import { HiddenSingle } from './strategies/HiddenSingle.js';
import { NakedPair } from './strategies/NakedPair.js';
import { PointingPair } from './strategies/PointingPair.js';

/**
 * @typedef {import('./types').Strategy} Strategy
 * @typedef {import('./types').StrategyResult} StrategyResult
 * @typedef {import('../Sudoku.js').Sudoku} Sudoku
 */

export class StrategyEngine {
  constructor() {
    /** @type {Strategy[]} */
    this._strategies = [];
    // 按优先级注册内置策略：简单 → 复杂
    this.register(NakedSingle);
    this.register(HiddenSingle);
    this.register(NakedPair);
    this.register(PointingPair);
  }

  /**
   * 注册一个策略到引擎中
   * @param {Strategy} strategy
   */
  register(strategy) {
    if (!strategy.name || typeof strategy.detect !== 'function') {
      throw new Error('Strategy must have a name and a detect(sudoku, row, col) method');
    }
    this._strategies.push(strategy);
  }

  /**
   * 获取已注册的策略列表（按 difficulty 升序）
   * @returns {Strategy[]}
   */
  getStrategies() {
    return [...this._strategies].sort((a, b) => a.difficulty - b.difficulty);
  }

  /**
   * 解释某个格子的推理逻辑：按优先级依次尝试所有策略
   * @param {number} row
   * @param {number} col
   * @param {Sudoku} sudoku
   * @returns {StrategyResult | null}
   */
  explainCell(row, col, sudoku) {
    for (const strategy of this._strategies) {
      const result = strategy.detect(sudoku, row, col);
      if (result) return result;
    }
    return null;
  }
}

export default StrategyEngine;
