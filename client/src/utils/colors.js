/**
 * colors.js - 颜色工具函数和 Minecraft 经典 16 色预设
 * 提供 RGB/HSV/Hex 转换以及颜色解析
 */

/** Minecraft 经典 16 色预设 */
export const MINECRAFT_COLORS = [
  { name: '白色', hex: '#FFFFFF', rgb: [255, 255, 255] },
  { name: '橙色', hex: '#F9801D', rgb: [249, 128, 29] },
  { name: '品红', hex: '#C74EBD', rgb: [199, 78, 189] },
  { name: '淡蓝', hex: '#3AB3DA', rgb: [58, 179, 218] },
  { name: '黄色', hex: '#FED83D', rgb: [254, 216, 61] },
  { name: '黄绿', hex: '#80C71F', rgb: [128, 199, 31] },
  { name: '粉色', hex: '#F38BAA', rgb: [243, 139, 170] },
  { name: '深灰', hex: '#474F52', rgb: [71, 79, 82] },
  { name: '浅灰', hex: '#9D9D97', rgb: [157, 157, 151] },
  { name: '青色', hex: '#169C9C', rgb: [22, 156, 156] },
  { name: '紫色', hex: '#8932B8', rgb: [137, 50, 184] },
  { name: '蓝色', hex: '#3C44AA', rgb: [60, 68, 170] },
  { name: '棕色', hex: '#835432', rgb: [131, 84, 50] },
  { name: '绿色', hex: '#5E7C16', rgb: [94, 124, 22] },
  { name: '红色', hex: '#B02E26', rgb: [176, 46, 38] },
  { name: '黑色', hex: '#1D1D21', rgb: [29, 29, 33] },
];

/**
 * 皮肤常用颜色（肤色、发色等扩展调色板）
 */
export const SKIN_TONES = [
  { name: '浅肤色', hex: '#FADCC4' },
  { name: '中肤色', hex: '#E0B894' },
  { name: '深肤色', hex: '#C68642' },
  { name: '深棕肤色', hex: '#8D5524' },
  { name: '金色', hex: '#FFD700' },
  { name: '棕色发', hex: '#6B4226' },
  { name: '黑色发', hex: '#1A1A1A' },
  { name: '红色发', hex: '#CC4400' },
  { name: '蓝色眼', hex: '#4169E1' },
  { name: '绿色眼', hex: '#2E8B57' },
  { name: '棕色眼', hex: '#5C4033' },
];

/** 合并所有预设 */
export const ALL_PRESETS = [...MINECRAFT_COLORS];

/**
 * Hex 颜色转 RGB
 * @param {string} hex - 如 "#FF0000" 或 "FF0000"
 * @returns {[number, number, number]} [r, g, b] 0-255
 */
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/**
 * RGB 转 Hex
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string} "#RRGGBB"
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/**
 * RGB 转 HSV
 * @param {number} r - 0-255
 * @param {number} g - 0-255
 * @param {number} b - 0-255
 * @returns {{ h: number, s: number, v: number }} h:0-360, s:0-100, v:0-100
 */
export function rgbToHsv(r, g, b) {
  const nr = r / 255, ng = g / 255, nb = b / 255;
  const max = Math.max(nr, ng, nb), min = Math.min(nr, ng, nb);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === nr) h = ((ng - nb) / delta) % 6;
    else if (max === ng) h = (nb - nr) / delta + 2;
    else h = (nr - ng) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
}

/**
 * HSV 转 RGB
 * @param {number} h - 0-360
 * @param {number} s - 0-100
 * @param {number} v - 0-100
 * @returns {[number, number, number]} [r, g, b] 0-255
 */
export function hsvToRgb(h, s, v) {
  const ns = s / 100, nv = v / 100;
  const c = nv * ns;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = nv - c;

  let nr, ng, nb;
  if (h < 60) { nr = c; ng = x; nb = 0; }
  else if (h < 120) { nr = x; ng = c; nb = 0; }
  else if (h < 180) { nr = 0; ng = c; nb = x; }
  else if (h < 240) { nr = 0; ng = x; nb = c; }
  else if (h < 300) { nr = x; ng = 0; nb = c; }
  else { nr = c; ng = 0; nb = x; }

  return [
    Math.round((nr + m) * 255),
    Math.round((ng + m) * 255),
    Math.round((nb + m) * 255),
  ];
}

/**
 * HSV 对象转 Hex 字符串
 */
export function hsvToHex(h, s, v) {
  const [r, g, b] = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

/**
 * Hex 转 HSV 对象
 */
export function hexToHsv(hex) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHsv(r, g, b);
}

/**
 * 在 2D canvas 上绘制 HSV 色相环
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - 圆心 X
 * @param {number} cy - 圆心 Y
 * @param {number} radius - 半径
 */
export function drawColorWheel(ctx, cx, cy, radius) {
  const imageData = ctx.createImageData(radius * 2, radius * 2);
  for (let y = 0; y < radius * 2; y++) {
    for (let x = 0; x < radius * 2; x++) {
      const dx = x - radius, dy = y - radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const hue = (angle + 360) % 360;
      const saturation = dist / radius * 100;

      const [r, g, b] = hsvToRgb(hue, saturation, 100);
      const idx = (y * radius * 2 + x) * 4;
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, cx - radius, cy - radius);
}

/**
 * 在 2D canvas 上绘制饱和度/亮度选择三角
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} hue - 当前色相 0-360
 * @param {number} x - 三角左上角 X
 * @param {number} y - 三角左上角 Y
 * @param {number} size - 三角边长
 */
export function drawSVTriangle(ctx, hue, x, y, size) {
  const imageData = ctx.createImageData(size, size);
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Saturation = col/size (水平), Brightness = 1 - row/size (垂直)
      // 三角内判断
      const t = col / size;
      const vRow = row / size;
      if (vRow > 1 - t) continue; // 在三角形外

      const s = Math.min(100, t * 100);
      const v = Math.min(100, 100 - vRow * 100);
      const [r, g, b] = hsvToRgb(hue, s, v);
      const idx = (row * size + col) * 4;
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, x, y);
}
