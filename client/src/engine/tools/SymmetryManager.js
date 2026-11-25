/**
 * SymmetryManager.js - 对称绘制管理器
 *
 * 根据对称模式计算镜像像素位置：
 * - horizontal: 水平翻转（x → 63-x）
 * - vertical: 垂直翻转（y → 63-y）
 * - both: 水平和垂直都翻转
 */

const SKIN_SIZE = 64;

export class SymmetryManager {
  /**
   * @param {'none'|'horizontal'|'vertical'|'both'} mode
   */
  constructor(mode = 'none') {
    this.mode = mode;
  }

  setMode(mode) {
    this.mode = mode;
  }

  /**
   * 获取所有对称位置（包括原始位置）
   * @param {number} x - 原始 X 坐标
   * @param {number} y - 原始 Y 坐标
   * @returns {Array<{x: number, y: number}>}
   */
  getMirrorPositions(x, y) {
    const positions = [{ x, y }];
    switch (this.mode) {
      case 'horizontal':
        positions.push({ x: SKIN_SIZE - 1 - x, y });
        break;
      case 'vertical':
        positions.push({ x, y: SKIN_SIZE - 1 - y });
        break;
      case 'both':
        positions.push(
          { x: SKIN_SIZE - 1 - x, y },
          { x, y: SKIN_SIZE - 1 - y },
          { x: SKIN_SIZE - 1 - x, y: SKIN_SIZE - 1 - y }
        );
        break;
    }
    return positions;
  }

  /**
   * 获取对称位置（不包含原点）
   * @param {number} x
   * @param {number} y
   * @returns {Array<{x: number, y: number}>}
   */
  getMirrorsOnly(x, y) {
    const all = this.getMirrorPositions(x, y);
    return all.slice(1);
  }
}
