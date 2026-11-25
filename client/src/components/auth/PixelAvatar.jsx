import React from 'react';

/**
 * PixelAvatar — CSS box-shadow 像素头像
 *
 * 用 box-shadow 在 8×8 网格上绘制像素风格 Minecraft 头像。
 * 每个"像素"是 10px×10px 的 box-shadow 偏移。
 */
const SIZE = 9;  // px per pixel
const GAP = 1;    // gap between pixels

// 预设头像像素数据（8×8, 颜色索引）
// 0=透明, 1=肤色, 2=发色, 3=眼白, 4=瞳孔, 5=嘴, 6=衣服
const PALETTES = {
  steve: ['transparent', '#D4A574', '#4A3728', '#F5F5F5', '#3B5C8C', '#8B5A3C', '#5B8CBF'],
  alex:  ['transparent', '#E8B88A', '#8B4513', '#F5F5F5', '#5B8C3C', '#A0522D', '#8CC63F'],
  magic: ['transparent', '#FFDDBB', '#FFD700', '#F5F5F5', '#8B008B', '#CC6699', '#663399'],
  dark:  ['transparent', '#C8A882', '#1A1A1A', '#F5F5F5', '#8B0000', '#5C4033', '#2F1F3D'],
};

// 8×8 像素数据: row-major, 每行8个颜色索引
const PIXEL_MAP = {
  steve: [
    0,0,2,2,2,2,0,0,
    0,2,2,2,2,2,2,0,
    0,1,1,3,4,1,1,0,
    0,1,1,3,4,1,1,0,
    0,1,1,1,5,1,1,0,
    0,1,6,6,6,6,1,0,
    0,1,6,6,6,6,1,0,
    0,0,1,1,1,1,0,0,
  ],
  alex: [
    0,0,2,2,2,2,0,0,
    0,2,2,2,2,2,2,0,
    0,1,1,3,4,1,1,0,
    0,1,1,3,4,1,1,0,
    0,1,1,1,5,1,1,0,
    0,1,6,6,6,6,1,0,
    0,1,6,6,6,6,1,0,
    0,0,1,1,1,1,0,0,
  ],
  magic: [
    0,0,2,2,2,2,0,0,
    0,2,2,2,2,2,2,0,
    0,1,1,3,4,1,1,0,
    0,1,1,3,4,1,1,0,
    0,1,1,1,5,1,1,0,
    0,1,6,6,6,6,1,0,
    0,1,6,6,6,6,1,0,
    0,0,1,1,1,1,0,0,
  ],
  dark: [
    0,0,2,2,2,2,0,0,
    0,2,2,2,2,2,2,0,
    0,1,1,3,4,1,1,0,
    0,1,1,3,4,1,1,0,
    0,1,1,1,5,1,1,0,
    0,1,6,6,6,6,1,0,
    0,1,6,6,6,6,1,0,
    0,0,1,1,1,1,0,0,
  ],
};

export function PixelAvatar({ type = 'steve', size = 64 }) {
  const pixels = PIXEL_MAP[type] || PIXEL_MAP.steve;
  const palette = PALETTES[type] || PALETTES.steve;

  // 构建 box-shadow 字符串
  const shadows = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const idx = pixels[row * 8 + col];
      if (idx === 0) continue; // 透明跳过
      const color = palette[idx];
      const x = col * (SIZE + GAP);
      const y = row * (SIZE + GAP);
      shadows.push(`${x}px ${y}px 0 ${color}`);
    }
  }

  const totalSize = 8 * (SIZE + GAP) - GAP;
  const scale = size / totalSize;

  return (
    <div style={{
      width: size, height: size, borderRadius: 4,
      border: '2px solid #2C2C2C', background: '#1a1a1a',
      overflow: 'hidden', display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: SIZE, height: SIZE,
        boxShadow: shadows.join(','),
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }} />
    </div>
  );
}
