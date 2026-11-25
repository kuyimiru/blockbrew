/**
 * UVMap.js - Minecraft 皮肤 64x64 纹理的完整 UV 映射表
 *
 * 包含所有 6 个身体部位 × 6 个面 × 2 层（内层/外层）的 UV 坐标定义。
 * Steve 和 Alex 模型的区别仅在于手臂宽度（4px vs 3px）。
 *
 * UV 坐标格式: { x, y, w, h } — 像素坐标，原点在纹理左上角。
 * 完整 64x64 纹理布局见 Minecraft Wiki: https://minecraft.wiki/w/Skin
 */

/** @typedef {{ x: number, y: number, w: number, h: number }} UVRect */
/** @typedef {'head'|'body'|'rightArm'|'leftArm'|'rightLeg'|'leftLeg'} BodyPartId */
/** @typedef {'top'|'bottom'|'right'|'front'|'left'|'back'} FaceId */
/** @typedef {'steve'|'alex'} ModelType */

/**
 * 内层（底层皮肤）UV 映射
 * 位于纹理的上半部分（行 0-31 及下半部分的对应区域）
 */
export const UV_INNER = {
  head: {
    size: { width: 8, height: 8, depth: 8 },
    faces: {
      top:    { x: 8,  y: 0, w: 8, h: 8 },
      bottom: { x: 16, y: 0, w: 8, h: 8 },
      right:  { x: 0,  y: 8, w: 8, h: 8 },
      front:  { x: 8,  y: 8, w: 8, h: 8 },
      left:   { x: 16, y: 8, w: 8, h: 8 },
      back:   { x: 24, y: 8, w: 8, h: 8 },
    },
  },
  body: {
    size: { width: 8, height: 12, depth: 4 },
    faces: {
      top:    { x: 20, y: 16, w: 8, h: 4 },
      bottom: { x: 28, y: 16, w: 8, h: 4 },
      right:  { x: 16, y: 20, w: 4, h: 12 },
      front:  { x: 20, y: 20, w: 8, h: 12 },
      left:   { x: 24, y: 20, w: 4, h: 12 },
      back:   { x: 28, y: 20, w: 8, h: 12 },
    },
  },
  rightArm: {
    // Steve 粗手臂: 宽度 4px, Alex 细手臂: 宽度 3px
    size: { width: 4, height: 12, depth: 4 },
    faces: {
      top:    { x: 44, y: 16, w: 4, h: 4 },
      bottom: { x: 48, y: 16, w: 4, h: 4 },
      right:  { x: 40, y: 20, w: 4, h: 12 },
      front:  { x: 44, y: 20, w: 4, h: 12 },
      left:   { x: 48, y: 20, w: 4, h: 12 },
      back:   { x: 52, y: 20, w: 4, h: 12 },
    },
  },
  rightLeg: {
    size: { width: 4, height: 12, depth: 4 },
    faces: {
      top:    { x: 4,  y: 16, w: 4, h: 4 },
      bottom: { x: 8,  y: 16, w: 4, h: 4 },
      right:  { x: 0,  y: 20, w: 4, h: 12 },
      front:  { x: 4,  y: 20, w: 4, h: 12 },
      left:   { x: 8,  y: 20, w: 4, h: 12 },
      back:   { x: 12, y: 20, w: 4, h: 12 },
    },
  },
  leftArm: {
    size: { width: 4, height: 12, depth: 4 },
    faces: {
      top:    { x: 36, y: 48, w: 4, h: 4 },
      bottom: { x: 40, y: 48, w: 4, h: 4 },
      right:  { x: 32, y: 52, w: 4, h: 12 },
      front:  { x: 36, y: 52, w: 4, h: 12 },
      left:   { x: 40, y: 52, w: 4, h: 12 },
      back:   { x: 44, y: 52, w: 4, h: 12 },
    },
  },
  leftLeg: {
    size: { width: 4, height: 12, depth: 4 },
    faces: {
      top:    { x: 20, y: 48, w: 4, h: 4 },
      bottom: { x: 24, y: 48, w: 4, h: 4 },
      right:  { x: 16, y: 52, w: 4, h: 12 },
      front:  { x: 20, y: 52, w: 4, h: 12 },
      left:   { x: 24, y: 52, w: 4, h: 12 },
      back:   { x: 28, y: 52, w: 4, h: 12 },
    },
  },
};

/**
 * 外层（帽子/外套/袖子/裤腿覆盖层）UV 映射
 * 外层纹理位于与内层不同的坐标区域。
 */
export const UV_OUTER = {
  head: {
    size: { width: 8, height: 8, depth: 8 },
    faces: {
      top:    { x: 40, y: 0,  w: 8, h: 8 },
      bottom: { x: 48, y: 0,  w: 8, h: 8 },
      right:  { x: 32, y: 8,  w: 8, h: 8 },
      front:  { x: 40, y: 8,  w: 8, h: 8 },
      left:   { x: 48, y: 8,  w: 8, h: 8 },
      back:   { x: 56, y: 8,  w: 8, h: 8 },
    },
  },
  body: {
    size: { width: 8, height: 12, depth: 4 },
    faces: {
      top:    { x: 20, y: 32, w: 8, h: 4 },
      bottom: { x: 28, y: 32, w: 8, h: 4 },
      right:  { x: 16, y: 36, w: 4, h: 12 },
      front:  { x: 20, y: 36, w: 8, h: 12 },
      left:   { x: 24, y: 36, w: 4, h: 12 },
      back:   { x: 28, y: 36, w: 8, h: 12 },
    },
  },
  rightArm: {
    size: { width: 4, height: 12, depth: 4 },
    faces: {
      top:    { x: 44, y: 32, w: 4, h: 4 },
      bottom: { x: 48, y: 32, w: 4, h: 4 },
      right:  { x: 40, y: 36, w: 4, h: 12 },
      front:  { x: 44, y: 36, w: 4, h: 12 },
      left:   { x: 48, y: 36, w: 4, h: 12 },
      back:   { x: 52, y: 36, w: 4, h: 12 },
    },
  },
  rightLeg: {
    size: { width: 4, height: 12, depth: 4 },
    faces: {
      top:    { x: 4,  y: 32, w: 4, h: 4 },
      bottom: { x: 8,  y: 32, w: 4, h: 4 },
      right:  { x: 0,  y: 36, w: 4, h: 12 },
      front:  { x: 4,  y: 36, w: 4, h: 12 },
      left:   { x: 8,  y: 36, w: 4, h: 12 },
      back:   { x: 12, y: 36, w: 4, h: 12 },
    },
  },
  leftArm: {
    size: { width: 4, height: 12, depth: 4 },
    faces: {
      top:    { x: 52, y: 48, w: 4, h: 4 },
      bottom: { x: 56, y: 48, w: 4, h: 4 },
      right:  { x: 48, y: 52, w: 4, h: 12 },
      front:  { x: 52, y: 52, w: 4, h: 12 },
      left:   { x: 56, y: 52, w: 4, h: 12 },
      back:   { x: 60, y: 52, w: 4, h: 12 },
    },
  },
  leftLeg: {
    size: { width: 4, height: 12, depth: 4 },
    faces: {
      top:    { x: 4,  y: 48, w: 4, h: 4 },
      bottom: { x: 8,  y: 48, w: 4, h: 4 },
      right:  { x: 0,  y: 52, w: 4, h: 12 },
      front:  { x: 4,  y: 52, w: 4, h: 12 },
      left:   { x: 8,  y: 52, w: 4, h: 12 },
      back:   { x: 12, y: 52, w: 4, h: 12 },
    },
  },
};

/** 所有身体部位 ID 列表 */
export const BODY_PARTS = ['head', 'body', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'];

/** 所有面 ID 列表（Three.js BoxGeometry 面顺序） */
export const FACE_ORDER = ['right', 'left', 'top', 'bottom', 'front', 'back'];

/**
 * 获取指定模型类型和部位的面 UV 坐标
 * @param {BodyPartId} part - 身体部位
 * @param {'inner'|'outer'} layer - 图层
 * @param {ModelType} modelType - 模型类型
 * @param {FaceId} face - 面
 * @returns {UVRect}
 */
export function getUVRect(part, layer, modelType, face) {
  const uvMap = layer === 'inner' ? UV_INNER : UV_OUTER;
  const rect = uvMap[part].faces[face];
  // Alex 细手臂：宽度减少 1px
  if (modelType === 'alex' && (part === 'rightArm' || part === 'leftArm')) {
    if (face === 'right' || face === 'left') {
      return { ...rect, w: 3 };
    }
    if (face === 'top' || face === 'bottom') {
      return { ...rect, w: 3 };
    }
    // front/back: 宽度也减少 1px
    return { ...rect, w: 3 };
  }
  return rect;
}

/**
 * 获取身体部位的几何体尺寸（Three.js 单位）
 * 1 像素 = 1/16 单位（Minecraft 标准：1 格 = 16 像素）
 * @param {BodyPartId} part
 * @param {ModelType} modelType
 * @returns {{ width: number, height: number, depth: number }}
 */
export function getPartSize(part, modelType) {
  const SCALE = 1 / 16;
  const base = UV_INNER[part].size;
  if (modelType === 'alex' && (part === 'rightArm' || part === 'leftArm')) {
    return {
      width: 3 * SCALE,
      height: base.height * SCALE,
      depth: base.depth * SCALE,
    };
  }
  return {
    width: base.width * SCALE,
    height: base.height * SCALE,
    depth: base.depth * SCALE,
  };
}

/**
 * 获取部位在模型空间中的位置（相对坐标，以模型脚底为原点）
 * @param {BodyPartId} part
 * @returns {{ x: number, y: number, z: number }}
 */
export function getPartPosition(part) {
  const SCALE = 1 / 16;
  const positions = {
    head:     { x: 0, y: 24 * SCALE, z: 0 },
    body:     { x: 0, y: 12 * SCALE, z: 0 },
    rightArm: { x: -6 * SCALE, y: 12 * SCALE, z: 0 },
    leftArm:  { x: 6 * SCALE, y: 12 * SCALE, z: 0 },
    rightLeg: { x: -2 * SCALE, y: 0, z: 0 },
    leftLeg:  { x: 2 * SCALE, y: 0, z: 0 },
  };
  return positions[part];
}

/**
 * 给定的 UV 坐标 (0-1) 和身体部位，映射到 64x64 纹理像素坐标
 * @param {number} u - 面上的 U 坐标 (0-1)
 * @param {number} v - 面上的 V 坐标 (0-1)
 * @param {BodyPartId} part - 身体部位
 * @param {FaceId} face - 面
 * @param {'inner'|'outer'} layer - 图层
 * @param {ModelType} modelType - 模型类型
 * @returns {{ x: number, y: number }} 像素坐标
 */
export function uvToPixel(u, v, part, face, layer, modelType) {
  const rect = getUVRect(part, layer, modelType, face);
  // u,v 映射到 rect 内的像素
  const px = Math.floor(rect.x + u * rect.w);
  const py = Math.floor(rect.y + (1 - v) * rect.h); // V 轴翻转
  return {
    x: Math.max(0, Math.min(63, px)),
    y: Math.max(0, Math.min(63, py)),
  };
}

/**
 * 遍历 64x64 纹理中的所有像素，为每个像素找到它所属的身体部位和面
 * 构建反向查找表：pixelIndex → { part, face, layer }
 * @returns {Array<{part: BodyPartId, face: FaceId, layer: 'inner'|'outer'}|null>}
 */
export function buildPixelMap() {
  const map = new Array(64 * 64).fill(null);

  for (const layer of ['inner', 'outer']) {
    const uvMap = layer === 'inner' ? UV_INNER : UV_OUTER;
    for (const part of BODY_PARTS) {
      for (const face of FACE_ORDER) {
        const rect = uvMap[part].faces[face];
        for (let dy = 0; dy < rect.h; dy++) {
          for (let dx = 0; dx < rect.w; dx++) {
            const px = rect.x + dx;
            const py = rect.y + dy;
            const idx = py * 64 + px;
            if (idx >= 0 && idx < 64 * 64 && !map[idx]) {
              map[idx] = { part, face, layer };
            }
          }
        }
      }
    }
  }
  return map;
}

// 预计算像素映射表（在模块加载时执行一次）
export const PIXEL_MAP = buildPixelMap();

/**
 * 给定纹理像素坐标，返回对应的身体部位和面信息
 * @param {number} x - 像素 X (0-63)
 * @param {number} y - 像素 Y (0-63)
 * @returns {{part: BodyPartId, face: FaceId, layer: 'inner'|'outer'}|null}
 */
export function pixelToBodyPart(x, y) {
  const idx = y * 64 + x;
  return PIXEL_MAP[idx] || null;
}
