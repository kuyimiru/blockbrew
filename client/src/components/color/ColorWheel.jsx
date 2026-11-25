import React, { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../store/useEditorStore.js';
import { drawColorWheel, drawSVTriangle, hsvToHex, hexToRgb, rgbToHsv } from '../../utils/colors.js';

export function ColorWheel() {
  const wheelRef = useRef(null);
  const triRef = useRef(null);
  const hsv = useEditorStore(s => s.hsv);
  const setHSV = useEditorStore(s => s.setHSV);
  const setPrimaryColor = useEditorStore(s => s.setPrimaryColor);
  const primaryColor = useEditorStore(s => s.primaryColor);
  const secondaryColor = useEditorStore(s => s.secondaryColor);
  const setSecondaryColor = useEditorStore(s => s.setSecondaryColor);
  const swapColors = useEditorStore(s => s.swapColors);

  // 绘制色相环
  useEffect(() => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    drawColorWheel(ctx, size / 2, size / 2, size / 2 - 2);
  }, []);

  // 绘制饱和度/亮度三角形
  useEffect(() => {
    const canvas = triRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawSVTriangle(ctx, hsv.h, 0, 0, canvas.width);
  }, [hsv.h]);

  // 色相环点击
  const handleWheelClick = useCallback((e) => {
    const canvas = wheelRef.current;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left - canvas.width / 2;
    const cy = e.clientY - rect.top - canvas.height / 2;
    const dist = Math.sqrt(cx * cx + cy * cy);
    const radius = canvas.width / 2 - 2;

    if (dist <= radius) {
      const angle = Math.atan2(cy, cx) * (180 / Math.PI);
      const hue = ((angle + 360) % 360);
      const saturation = Math.min(100, (dist / radius) * 100);
      setHSV({ h: Math.round(hue), s: Math.round(saturation), v: hsv.v });
      setPrimaryColor(hsvToHex(Math.round(hue), Math.round(saturation), hsv.v));
    }
  }, [hsv, setHSV, setPrimaryColor]);

  // 饱和度/亮度三角点击
  const handleTriClick = useCallback((e) => {
    const canvas = triRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = canvas.width;

    const s = Math.min(100, Math.max(0, (x / size) * 100));
    const v = Math.min(100, Math.max(0, 100 - (y / size) * 100));
    setHSV({ h: hsv.h, s: Math.round(s), v: Math.round(v) });
    setPrimaryColor(hsvToHex(hsv.h, Math.round(s), Math.round(v)));
  }, [hsv, setHSV, setPrimaryColor]);

  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);

  return (
    <div className="color-panel">
      {/* 色相环 */}
      <div className="color-wheel-container">
        <canvas
          ref={wheelRef}
          width={180}
          height={180}
          onClick={handleWheelClick}
        />
        {/* 选中的色相指示 */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 8, height: 8,
          borderRadius: '50%',
          background: currentHex,
          border: '2px solid #fff',
          transform: `translate(-50%, -50%) rotate(${hsv.h}deg) translateY(-${(Math.min(100, hsv.s) / 100) * 87}px)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* 饱和度/亮度三角 */}
      <div className="sv-triangle-container">
        <canvas
          ref={triRef}
          width={140}
          height={120}
          onClick={handleTriClick}
        />
      </div>

      {/* 当前/上一个颜色 + Hex 输入 */}
      <div className="color-preview-row">
        <div
          className="color-preview-current"
          style={{ background: primaryColor }}
          title="当前颜色"
        />
        <div
          className="color-preview-prev"
          style={{ background: secondaryColor }}
          onClick={() => {
            setPrimaryColor(secondaryColor);
            const [r, g, b] = hexToRgb(secondaryColor);
            setHSV(rgbToHsv(r, g, b));
          }}
          title="上一个颜色（点击切换）"
        />
        <input
          className="color-hex-input"
          value={primaryColor.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
              setPrimaryColor(v);
            }
          }}
          maxLength={7}
        />
        <button className="btn-icon btn-ghost" onClick={swapColors} title="切换颜色">
          ⇄
        </button>
      </div>
    </div>
  );
}
