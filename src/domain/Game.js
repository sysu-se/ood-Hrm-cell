// src/domain/game.js
import { Sudoku } from './Sudoku';

export class Game {
  /**
   * @param {Sudoku} initialSudoku 初始棋盘
   */
  constructor(initialSudoku) {
    this._history = [initialSudoku];
    this._currentIndex = 0;

    // --- 新增：探索模式相关的状态 ---
    this._isExploring = false;
    this._exploreStartPoint = null;
    this._deadEnds = new Set(); // 存储失败路径的黑名单  
  }

  get isExploring() {
    return this._isExploring;
  }

  /** 获取当前Sudoku对象（注意要返回副本） */
  getSudoku() {
    return this._history[this._currentIndex].clone();
  }

  /**
   * 下棋操作
   * @param {{row: number, col: number, value: number}} move
   * @returns {boolean} 是否成功
   */
  guess(move) {
    // 新增:检查这一步是否在黑名单（死胡同）中
    if (this.isDeadEnd(move)) {
      console.warn("探索记忆：此路径之前已尝试并证明失败！");
      return false; 
    }

    const current = this._history[this._currentIndex];
    const newSudoku = current.clone();
    const success = newSudoku.guess(move);
    
    if (!success) return false;
    // 如果当前不在最新状态 截断后续历史
    if(this._currentIndex < this._history.length - 1){
      this._history = this._history.slice(0, this._currentIndex+1);
    }
    // 添加新状态
    this._history.push(newSudoku);
    this._currentIndex++;
    return true;
  }
  // --- 新增：探索模式核心方法 ---

  /** 开始探索：建立存档点 */
  startExplore() {
    if (this._isExploring) return false;
    this._isExploring = true;
    this._exploreStartPoint = this._currentIndex;
    return true;
  }

  /** 提交探索：探索成功，合并到主历史 */
  commitExplore() {
    if (!this._isExploring) return false;
    this._isExploring = false;
    this._exploreStartPoint = null;
    // 成功后不清空 _deadEnds，保留失败路径
    return true;
  }

  /** 放弃探索：回退到存档点，并记录死胡同 */
  rollbackExplore() {
    if (!this._isExploring || this._currentIndex <= this._exploreStartPoint) return false;

    // 记忆失败路径：对比存档点和走出的第一步，找出那个导致失败的“错误决定”
    const startSudoku = this._history[this._exploreStartPoint];
    const nextSudoku = this._history[this._exploreStartPoint + 1];
    const failedMove = this._getDiff(startSudoku, nextSudoku);

    if (failedMove) {
      const stateHash = startSudoku.toString(); // 用棋盘字符串作为当前局面的唯一哈希
      const deadEndKey = `${stateHash}|${failedMove.row},${failedMove.col},${failedMove.value}`;
      this._deadEnds.add(deadEndKey); // 加入黑名单
    }

    // 回退历史栈
    this._currentIndex = this._exploreStartPoint;
    this._history = this._history.slice(0, this._currentIndex + 1);
    return true;
  }

  /** 判断某个操作是否是已知的死胡同 */
  isDeadEnd(move) {
    const currentHash = this._history[this._currentIndex].toString();
    const deadEndKey = `${currentHash}|${move.row},${move.col},${move.value}`;
    return this._deadEnds.has(deadEndKey);
  }

  /** 辅助方法：找出两个棋盘的不同之处（用于找出走错的第一步） */
  _getDiff(sudoku1, sudoku2) {
    const grid1 = sudoku1.getGrid();
    const grid2 = sudoku2.getGrid();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid1[r][c] !== grid2[r][c]) {
          return { row: r, col: c, value: grid2[r][c] };
        }
      }
    }
    return null;
  }
  /** 
   * 撤销到上一步 
   * @returns {boolean} 是否成功撤回
   */
  undo() {
    if(this.canUndo()) {
      this._currentIndex--;
      return true;
    }
    return false;
  }

  /** 
   * 重做到下一步
   * @returns {boolean} 是否成功撤回
   */
  redo() {
    if(this.canRedo()) {
      this._currentIndex++;
      return true;
    }
    return false;
  }

  canUndo() {
    return this._currentIndex > 0;
  }
  canRedo() {
    return this._currentIndex < this._history.length-1;
  }
  // --- 新增：代理提示接口 ---

  /** 获取某格的候选数 */
  getCandidates(row, col) {
    return this._history[this._currentIndex].getCandidates(row, col);
  }

  /** 获取下一步唯一确定的提示 */
  getNextHint() {
    return this._history[this._currentIndex].getNextHint();
  }

  /** 
   * 游戏对象序列化为JSON 
   * @returns {Object}
   */
  toJSON() {
    return {
      history: this._history.map(s => s.toJSON()),
      currentIndex: this._currentIndex,
      isExploring: this._isExploring,
      exploreStartPoint: this._exploreStartPoint,
      deadEnds: Array.from(this._deadEnds) // Set转Array才能序列化
    };
  }

  /** 
   * 从 JSON 恢复 Game 对象
   * @param {Object} json
   * @returns {Game}
   */
  static fromJSON(json) {
    const history = json.history.map(data => Sudoku.fromJSON(data));
    const game = new Game(history[0]);
    game._history = history;
    game._currentIndex = json.currentIndex;
    game._isExploring = json.isExploring || false;
    game._exploreStartPoint = json.exploreStartPoint !== undefined ? json.exploreStartPoint : null;
    game._deadEnds = new Set(json.deadEnds || []);
    return game;
  }
}