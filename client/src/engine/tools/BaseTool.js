/**
 * BaseTool.js — 绘图工具基类
 *
 * 所有工具继承此基类实现 draw(x, y, skinData, color) 等生命周期方法。
 */
export class BaseTool {
  constructor(name, cursor = 'crosshair') {
    this.name = name;
    this.cursor = cursor;
    this.isDrawing = false;
  }

  onPointerDown(x, y, skinData, color, symmetry, options = {}) {
    this.isDrawing = true;
  }

  onPointerMove(x, y, skinData, color, symmetry, options = {}) {
    if (!this.isDrawing) return;
  }

  onPointerUp(x, y, skinData) {
    this.isDrawing = false;
  }

  /** 获取笔刷覆盖像素 */
  getBrushPixels(cx, cy, size) {
    const pixels = [];
    const half = Math.floor(size / 2);
    for (let dy = 0; dy < size; dy++)
      for (let dx = 0; dx < size; dx++) {
        const x = cx - half + dx, y = cy - half + dy;
        if (x >= 0 && x < 64 && y >= 0 && y < 64) pixels.push({ x, y });
      }
    return pixels;
  }

  /** 应用对称 */
  applyWithSymmetry(x, y, skinData, color, symmetry, pixelFn) {
    const positions = symmetry.getMirrorPositions(x, y);
    for (const pos of positions) pixelFn(pos.x, pos.y);
  }
}
