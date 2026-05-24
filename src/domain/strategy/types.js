// src/domain/strategy/types.js
// 策略检测结果的数据结构定义（JSDoc 类型约定）

/**
 * @typedef {Object} CellRef
 * @property {number} row - 行索引 0-8
 * @property {number} col - 列索引 0-8
 * @property {string} role - 该格在推理中的角色，如 'target' | 'related' | 'excluded' | 'occupied'
 * @property {number} [value] - 格内数字（如适用）
 */

/**
 * @typedef {Object} ReasoningStep
 * @property {number} step - 步骤序号
 * @property {string} description - 该步的中文描述
 */

/**
 * @typedef {Object} StrategyResult
 * @property {string} strategyName - 策略英文名，如 'Naked Single'
 * @property {string} chineseName - 策略中文名，如 '唯余法'
 * @property {number} difficulty - 难度等级 1~5
 * @property {CellRef} targetCell - 策略推导出的目标格
 * @property {CellRef[]} relatedCells - 推理链条中涉及的关联格
 * @property {ReasoningStep[]} reasoningSteps - 结构化推理步骤
 * @property {number[]} [candidates] - 涉及的候选数列表（如适用）
 * @property {number[]} [eliminatedCandidates] - 被排除的候选数（如适用）
 */

/**
 * @typedef {Object} Strategy
 * @property {string} name - 策略英文名
 * @property {string} chineseName - 策略中文名
 * @property {number} difficulty - 难度等级 1~5
 * @property {function} detect - (sudoku, row, col) => StrategyResult | null
 */

export default {};
