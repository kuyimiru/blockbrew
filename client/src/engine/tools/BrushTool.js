import { BaseTool } from './BaseTool.js';

export class BrushTool extends BaseTool {
  constructor() { super('brush'); }

  onPointerDown(x, y, skinData, color, symmetry, options = {}) {
    super.onPointerDown(x, y, skinData, color, symmetry, options);
    const size = options.brushSize || 1;
    const pixels = this.getBrushPixels(x, y, size);
    for (const { x: px, y: py } of pixels)
      this.applyWithSymmetry(px, py, skinData, color, symmetry,
        (sx, sy) => skinData.setPixelHex(sx, sy, color, 255));
  }

  onPointerMove(x, y, skinData, color, symmetry, options = {}) {
    if (!this.isDrawing) return;
    const size = options.brushSize || 1;
    const pixels = this.getBrushPixels(x, y, size);
    for (const { x: px, y: py } of pixels)
      this.applyWithSymmetry(px, py, skinData, color, symmetry,
        (sx, sy) => skinData.setPixelHex(sx, sy, color, 255));
  }
}
