/**
 * useTouchDrawing.js - 触摸绘制 Hook
 *
 * 为移动设备提供触摸绘画支持：
 * - 单指绘画
 * - 双指缩放
 * - 双击重置视图
 */

import { useEffect, useRef, useCallback } from 'react';

export function useTouchDrawing(canvasRef, options = {}) {
  const { onDraw, onZoom, onReset } = options;
  const lastTouchRef = useRef(null);
  const lastDistanceRef = useRef(0);
  const lastTapRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        // 单指绘画
        const touch = e.touches[0];
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };

        // 双击检测
        const now = Date.now();
        if (now - lastTapRef.current < 300 && onReset) {
          onReset();
        }
        lastTapRef.current = now;
      } else if (e.touches.length === 2) {
        // 双指缩放
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && onDraw) {
        const touch = e.touches[0];
        onDraw(touch.clientX, touch.clientY);
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      } else if (e.touches.length === 2 && onZoom) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delta = dist - lastDistanceRef.current;
        if (Math.abs(delta) > 5) {
          onZoom(delta > 0 ? 1 : -1);
          lastDistanceRef.current = dist;
        }
      }
    };

    const handleTouchEnd = () => {
      lastTouchRef.current = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canvasRef, onDraw, onZoom, onReset]);
}
