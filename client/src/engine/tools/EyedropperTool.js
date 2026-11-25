/**
 * EyedropperTool.js - 取色器工具（点击吸取颜色到主色板）
 *
 * 点击后获取像素颜色，更新编辑器的 primaryColor。
 * 通过回调函数 onColorPicked 通知外部。
 */

import { BaseTool } from './BaseTool.js';

export class EyedropperTool extends BaseTool {
  constructor(onColorPicked) {
    super('eyedropper', 'crosshair');
    this.onColorPicked = onColorPicked || (() => {});
  }

  onPointerDown(x, y, skinData, color, symmetry, options = {}) {
    super.onPointerDown(x, y, skinData, color, symmetry, options);
    // 获取点击位置的像素颜色
    const hex = skinData.getPixelHex(x, y);
    this.onColorPicked(hex);
  }

  // 取色器不需要拖动
  onPointerMove(x, y, skinData, color, symmetry, options = {}) {
    // 可以实时预览颜色，但不修改像素
    if (this.isDrawing && this.onColorPicked) {
      const hex = skinData.getPixelHex(x, y);
      this.onColorPicked(hex);
    }
  }
}
