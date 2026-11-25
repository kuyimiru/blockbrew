import { BaseTool } from './BaseTool.js';

export class PencilTool extends BaseTool {
  constructor() { super('pencil'); this.lastX = -1; this.lastY = -1; }

  onPointerDown(x, y, skinData, color, symmetry) {
    super.onPointerDown(x, y, skinData, color, symmetry);
    this.lastX = x; this.lastY = y;
    this.applyWithSymmetry(x, y, skinData, color, symmetry,
      (px, py) => skinData.setPixelHex(px, py, color, 255));
  }

  onPointerMove(x, y, skinData, color, symmetry) {
    if (!this.isDrawing) return;
    this.drawLine(this.lastX, this.lastY, x, y, skinData, color, symmetry);
    this.lastX = x; this.lastY = y;
  }

  onPointerUp() { super.onPointerUp(); this.lastX = -1; this.lastY = -1; }

  drawLine(x0, y0, x1, y1, skinData, color, symmetry) {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, cx = x0, cy = y0;
    while (true) {
      this.applyWithSymmetry(cx, cy, skinData, color, symmetry,
        (px, py) => skinData.setPixelHex(px, py, color, 255));
      if (cx === x1 && cy === y1) break;
      const e2 = err * 2;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx) { err += dx; cy += sy; }
    }
  }
}
