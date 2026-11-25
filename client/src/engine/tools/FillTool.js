import { BaseTool } from './BaseTool.js';

export class FillTool extends BaseTool {
  constructor() { super('fill'); }

  onPointerDown(x, y, skinData, color, symmetry) {
    super.onPointerDown(x, y, skinData, color, symmetry);
    const count = skinData.floodFill(x, y, color);
    if (count > 0 && symmetry && symmetry.mode !== 'none') {
      const mirrors = symmetry.getMirrorsOnly(x, y);
      for (const m of mirrors) skinData.floodFill(m.x, m.y, color);
    }
  }
}
