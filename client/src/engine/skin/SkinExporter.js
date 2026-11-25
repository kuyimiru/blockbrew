/**
 * SkinExporter.js - 皮肤 PNG 文件导出器
 *
 * 支持导出尺寸：64x64（标准）、128x128（高清）
 * 使用最近邻插值保持像素艺术风格。
 */

import { SkinData } from './SkinData.js';

const SKIN_SIZE = 64;

/**
 * 导出皮肤为 PNG Blob
 * @param {SkinData} skinData - 皮肤数据
 * @param {number} [size=64] - 导出尺寸（64 或 128）
 * @returns {Promise<Blob>} PNG Blob
 */
export async function exportSkin(skinData, size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false; // 保持像素艺术清晰度

  if (size === 64) {
    // 64x64 直接导出合成纹理
    const composed = skinData.compose();
    const imageData = ctx.createImageData(SKIN_SIZE, SKIN_SIZE);
    imageData.data.set(composed);
    ctx.putImageData(imageData, 0, 0);
  } else if (size === 128) {
    // 128x128 使用最近邻放大
    // 先创建 64x64 的离屏 canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = SKIN_SIZE;
    offscreen.height = SKIN_SIZE;
    const offCtx = offscreen.getContext('2d');
    const composed = skinData.compose();
    const offImageData = offCtx.createImageData(SKIN_SIZE, SKIN_SIZE);
    offImageData.data.set(composed);
    offCtx.putImageData(offImageData, 0, 0);

    // 最近邻放大
    ctx.drawImage(offscreen, 0, 0, size, size);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}

/**
 * 触发下载
 * @param {Blob} blob - PNG Blob
 * @param {string} filename - 文件名
 */
export function downloadSkin(blob, filename = 'blockbrew-skin.png') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 创建皮肤预览缩略图（用于列表展示）
 * @param {SkinData} skinData
 * @param {number} [thumbSize=64]
 * @returns {Promise<string>} Data URL
 */
export async function createThumbnail(skinData, thumbSize = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = thumbSize;
  canvas.height = thumbSize;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const composed = skinData.compose();
  const imageData = ctx.createImageData(SKIN_SIZE, SKIN_SIZE);
  imageData.data.set(composed);

  const offscreen = document.createElement('canvas');
  offscreen.width = SKIN_SIZE;
  offscreen.height = SKIN_SIZE;
  const offCtx = offscreen.getContext('2d');
  offCtx.putImageData(imageData, 0, 0);

  ctx.drawImage(offscreen, 0, 0, thumbSize, thumbSize);
  return canvas.toDataURL('image/png');
}
