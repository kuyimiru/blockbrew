/**
 * SkinImporter.js - 皮肤 PNG 文件导入器
 *
 * 支持尺寸：64x64, 64x32（旧格式，自动扩展为 64x64）, 128x128
 * 验证 Minecraft 皮肤格式并转换为 SkinData。
 */

import { SkinData } from './SkinData.js';

/**
 * 从 PNG 文件导入皮肤
 * @param {File|Blob} file - PNG 文件
 * @returns {Promise<{skinData: SkinData, size: string, error: string|null}>}
 */
export async function importSkin(file) {
  try {
    // 读取为 ImageData
    const imageData = await loadImageToImageData(file);
    const { width, height } = imageData;

    // 验证尺寸
    if (![64, 128].includes(width) || ![32, 64, 128].includes(height)) {
      return {
        skinData: null,
        size: `${width}x${height}`,
        error: `不支持的尺寸 ${width}x${height}。支持：64x32, 64x64, 128x128`,
      };
    }

    // 转换为 SkinData
    let skinData;

    if (width === 64 && height === 32) {
      // 旧格式 64x32：仅内层，扩展到 64x64（内层在上半，外层空白在下半）
      skinData = expandLegacySkin(imageData);
    } else if (width === 64 && height === 64) {
      // 标准 64x64 格式
      skinData = new SkinData(new Uint8Array(imageData.data));
    } else if (width === 128 && height === 128) {
      // 高清 128x128：降采样到 64x64（最近邻采样保持像素艺术风格）
      skinData = downscaleSkin(imageData);
    } else if (width === 128 && height === 64) {
      // 128x64：降采样到 64x64
      skinData = downscaleSkin(imageData);
    }

    return { skinData, size: `${width}x${height}`, error: null };
  } catch (err) {
    return { skinData: null, size: 'unknown', error: `导入失败：${err.message}` };
  }
}

/**
 * 将文件加载为 ImageData
 * @param {File|Blob} file
 * @returns {Promise<ImageData>}
 */
function loadImageToImageData(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法加载图片文件'));
    };

    img.src = url;
  });
}

/**
 * 扩展旧格式 64x32 → 64x64
 * 旧格式只有内层（上半部分），外层（下半部分）填充空白
 */
function expandLegacySkin(imageData) {
  const data = new Uint8Array(SkinData.TOTAL_BYTES);
  // 复制旧格式数据到上半部分
  for (let i = 0; i < 64 * 32 * 4; i++) {
    data[i] = imageData.data[i];
  }
  // 下半部分填充白色
  for (let i = 64 * 32 * 4; i < SkinData.TOTAL_BYTES; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = 255;
  }
  return new SkinData(data);
}

/**
 * 将高清皮肤降采样到 64x64（最近邻采样）
 */
function downscaleSkin(imageData) {
  const srcW = imageData.width;
  const srcH = imageData.height;
  const scale = srcW / 64;
  const data = new Uint8Array(SkinData.TOTAL_BYTES);

  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const srcX = Math.floor(x * scale);
      const srcY = Math.floor(y * (srcH / 64));
      const srcIdx = (srcY * srcW + srcX) * 4;
      const dstIdx = (y * 64 + x) * 4;

      data[dstIdx] = imageData.data[srcIdx];
      data[dstIdx + 1] = imageData.data[srcIdx + 1];
      data[dstIdx + 2] = imageData.data[srcIdx + 2];
      data[dstIdx + 3] = imageData.data[srcIdx + 3];
    }
  }

  return new SkinData(data);
}
