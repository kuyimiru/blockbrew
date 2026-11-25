/**
 * adjustments/index.js - 图像调整函数集
 *
 * 对 Uint8Array RGBA 像素数据进行全局颜色调整。
 * 所有操作都是非破坏性的，返回新的 Uint8Array。
 */

/**
 * 色相偏移
 * @param {Uint8Array} data - 原始 RGBA 数据 (64x64x4)
 * @param {number} degrees - 偏移角度 (-180 ~ 180)
 * @returns {Uint8Array} 调整后的数据
 */
export function shiftHue(data, degrees) {
  if (degrees === 0) return new Uint8Array(data);
  const result = new Uint8Array(data);

  for (let i = 0; i < result.length; i += 4) {
    const a = result[i + 3];
    if (a === 0) continue; // 跳过透明像素

    const r = result[i] / 255;
    const g = result[i + 1] / 255;
    const b = result[i + 2] / 255;

    const [hr, hg, hb] = rgbToHueShift(r, g, b, degrees);
    result[i] = Math.round(hr * 255);
    result[i + 1] = Math.round(hg * 255);
    result[i + 2] = Math.round(hb * 255);
  }

  return result;
}

/**
 * 饱和度调整
 * @param {Uint8Array} data
 * @param {number} factor - 0-200（100 为不变）
 * @returns {Uint8Array}
 */
export function adjustSaturation(data, factor) {
  if (factor === 100) return new Uint8Array(data);
  const result = new Uint8Array(data);
  const f = factor / 100;

  for (let i = 0; i < result.length; i += 4) {
    const a = result[i + 3];
    if (a === 0) continue;

    const r = result[i] / 255;
    const g = result[i + 1] / 255;
    const b = result[i + 2] / 255;

    // 计算灰度值
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    result[i] = clamp(Math.round((gray + (r - gray) * f) * 255));
    result[i + 1] = clamp(Math.round((gray + (g - gray) * f) * 255));
    result[i + 2] = clamp(Math.round((gray + (b - gray) * f) * 255));
  }

  return result;
}

/**
 * 亮度调整
 * @param {Uint8Array} data
 * @param {number} factor - 0-200（100 为不变）
 * @returns {Uint8Array}
 */
export function adjustBrightness(data, factor) {
  if (factor === 100) return new Uint8Array(data);
  const result = new Uint8Array(data);
  const f = factor / 100;

  for (let i = 0; i < result.length; i += 4) {
    const a = result[i + 3];
    if (a === 0) continue;

    result[i] = clamp(Math.round(result[i] * f));
    result[i + 1] = clamp(Math.round(result[i + 1] * f));
    result[i + 2] = clamp(Math.round(result[i + 2] * f));
  }

  return result;
}

/**
 * 色温调整
 * @param {Uint8Array} data
 * @param {number} value - -100 ~ 100（负值=偏冷/蓝，正值=偏暖/橙）
 * @returns {Uint8Array}
 */
export function adjustTemperature(data, value) {
  if (value === 0) return new Uint8Array(data);
  const result = new Uint8Array(data);
  const factor = value / 100;

  for (let i = 0; i < result.length; i += 4) {
    const a = result[i + 3];
    if (a === 0) continue;

    if (factor > 0) {
      // 暖色：增加红，减少蓝
      result[i] = clamp(Math.round(result[i] + 40 * factor));
      result[i + 2] = clamp(Math.round(result[i + 2] - 40 * factor));
    } else {
      // 冷色：增加蓝，减少红
      result[i + 2] = clamp(Math.round(result[i + 2] - 40 * factor));
      result[i] = clamp(Math.round(result[i] + 40 * factor));
    }
  }

  return result;
}

/**
 * 透明度调整（仅影响当前图层）
 * @param {Uint8Array} data
 * @param {number} opacity - 0-100
 * @param {number} layerOffset - 图层起始字节偏移（0=内层, 8192=外层）
 * @returns {Uint8Array}
 */
export function adjustOpacity(data, opacity, layerOffset = 0) {
  const result = new Uint8Array(data);
  const alpha = Math.round((opacity / 100) * 255);
  const halfBytes = data.length / 2;

  for (let i = layerOffset; i < layerOffset + halfBytes; i += 4) {
    result[i + 3] = alpha;
  }

  return result;
}

// === 内部辅助函数 ===

function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

/**
 * RGB + 色相偏移 → RGB
 */
function rgbToHueShift(r, g, b, degrees) {
  const { h, s, v } = rgbToHSV(r, g, b);
  const newHue = ((h + degrees) % 360 + 360) % 360;
  return hsvToRGB(newHue, s, v);
}

function rgbToHSV(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  h = h * 60;
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return { h, s, v };
}

function hsvToRGB(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return [r + m, g + m, b + m];
}
