/**
 * EraserTool.js — 橡皮擦工具
 *
 * 根据当前编辑图层（内层/外层）执行不同擦除逻辑：
 * - 内层 (editOuterLayer=false)：擦除 → 还原为灰白基底色 #C8C8C8（模拟空白模型底面）
 * - 外层 (editOuterLayer=true)：擦除 → 设为完全透明 alpha=0（移除叠加层）
 */
import { BaseTool } from './BaseTool.js';

/** 内层基底色（匹配 generateBlankSkin 的灰白画布） */
const BASE_GRAY_R = 0xC8;
const BASE_GRAY_G = 0xC8;
const BASE_GRAY_B = 0xC8;

export class EraserTool extends BaseTool {
  constructor() { super('eraser'); }

  onPointerDown(x, y, skinData, color, symmetry, options = {}) {
    super.onPointerDown(x, y, skinData, color, symmetry, options);
    const size = options.brushSize || 1;
    const editOuter = options.editOuterLayer || false;
    const pixels = this.getBrushPixels(x, y, size);

    for (const { x: px, y: py } of pixels) {
      this.applyWithSymmetry(px, py, skinData, null, symmetry,
        (sx, sy) => {
          if (editOuter) {
            // 外层：擦除 = 完全透明
            skinData.setPixel(sx, sy, 0, 0, 0, 0);
          } else {
            // 内层：擦除 = 恢复灰白基底色
            skinData.setPixel(sx, sy, BASE_GRAY_R, BASE_GRAY_G, BASE_GRAY_B, 255);
          }
        });
    }
  }

  onPointerMove(x, y, skinData, color, symmetry, options = {}) {
    if (!this.isDrawing) return;
    const size = options.brushSize || 1;
    const editOuter = options.editOuterLayer || false;
    const pixels = this.getBrushPixels(x, y, size);

    for (const { x: px, y: py } of pixels) {
      this.applyWithSymmetry(px, py, skinData, null, symmetry,
        (sx, sy) => {
          if (editOuter) {
            skinData.setPixel(sx, sy, 0, 0, 0, 0);
          } else {
            skinData.setPixel(sx, sy, BASE_GRAY_R, BASE_GRAY_G, BASE_GRAY_B, 255);
          }
        });
    }
  }
}
