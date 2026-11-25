/**
 * BodyPartHighlighter.js — 身体部位高亮覆盖层生成器
 *
 * 根据 UV 映射表为 2D 纹理的每个部位区域染色不同的 RGB 颜色，
 * 用于在 2D 展开图中快速识别各身体部位对应的纹理区域。
 */
import { BODY_PARTS, FACE_ORDER, UV_INNER } from '../skin/UVMap.js';

/** 每个身体部位的独立高亮色（带透明度） */
const PART_COLORS = {
  head:     { r: 255, g: 180, b: 50,  a: 90,  label: '头部',   hex: '#FFB432' },
  body:     { r: 50,  g: 180, b: 255, a: 90,  label: '身体',   hex: '#32B4FF' },
  rightArm: { r: 255, g: 80,  b: 80,  a: 90,  label: '右臂',   hex: '#FF5050' },
  leftArm:  { r: 80,  g: 220, b: 80,  a: 90,  label: '左臂',   hex: '#50DC50' },
  rightLeg: { r: 200, g: 80,  b: 220, a: 90,  label: '右腿',   hex: '#C850DC' },
  leftLeg:  { r: 255, g: 220, b: 60,  a: 90,  label: '左腿',   hex: '#FFDC3C' },
};

/**
 * 生成身体部位高亮覆盖层 Canvas
 * @param {number} [size=64] - 纹理尺寸（正方形）
 * @returns {{ canvas: HTMLCanvasElement, legend: Array<{label:string, hex:string}> }}
 */
export function generateBodyPartOverlay(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const scale = size / 64;

  for (const partId of BODY_PARTS) {
    const color = PART_COLORS[partId];
    if (!color) continue;

    const uvFaces = UV_INNER[partId]?.faces;
    if (!uvFaces) continue;

    ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a / 255})`;

    for (const faceId of FACE_ORDER) {
      const rect = uvFaces[faceId];
      if (!rect) continue;

      const x = Math.round(rect.x * scale);
      const y = Math.round(rect.y * scale);
      const w = Math.round(rect.w * scale);
      const h = Math.round(rect.h * scale);

      ctx.fillRect(x, y, w, h);
    }
  }

  // 部位间边界线
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  for (const partId of BODY_PARTS) {
    const uvFaces = UV_INNER[partId]?.faces;
    if (!uvFaces) continue;
    for (const faceId of FACE_ORDER) {
      const rect = uvFaces[faceId];
      if (!rect) continue;
      const x = Math.round(rect.x * scale);
      const y = Math.round(rect.y * scale);
      const w = Math.round(rect.w * scale);
      const h = Math.round(rect.h * scale);
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
  }

  // 生成图例
  const legend = BODY_PARTS.map(id => ({
    label: PART_COLORS[id]?.label || id,
    hex: PART_COLORS[id]?.hex || '#888',
  }));

  return { canvas, legend };
}

export { PART_COLORS };
