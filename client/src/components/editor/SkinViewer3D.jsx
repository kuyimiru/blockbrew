/**
 * SkinViewer3D.jsx — skinview3d 集成 (修复版)
 *
 * 修复: 使用 rAF 延迟初始化确保 DOM 布局完成，确保 canvas 有正确像素尺寸。
 */
import React, { useRef, useEffect, useState } from 'react';
import { SkinViewer } from 'skinview3d';
import { useSkinStore } from '../../store/useSkinStore.js';

function skinToImage(skinData) {
  if (!skinData) return null;
  const raw = skinData.getRawData();
  if (!raw || raw.length < 64 * 64 * 4) return null;
  return new ImageData(new Uint8ClampedArray(raw), 64, 64);
}

export function SkinViewer3D({ compact }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  // ── 初始化 (rAF 延迟确保 DOM 布局完成) ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanup = null; // 由 rAF 回调设置的清理函数
    let cancelled = false;

    // 延迟到下一帧 — 确保 flex 布局已完成
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      console.log('[SkinViewer3D] 容器尺寸:', w, h);

      if (w === 0 || h === 0) {
        setError('容器尺寸为0'); return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.style.display = 'block';
      canvas.style.width = '100%'; canvas.style.height = '100%';
      container.appendChild(canvas);

      const img = skinToImage(useSkinStore.getState().skinData);
      console.log('[SkinViewer3D] 纹理:', { isImageData: img instanceof ImageData, w: img?.width, h: img?.height, len: img?.data?.length });
      if (!img) { setError('纹理数据无效'); return; }

      let viewer;
      try {
        viewer = new SkinViewer({ canvas, width: w, height: h, skin: img,
          model: useSkinStore.getState().modelType === 'alex' ? 'alex' : 'steve' });
      } catch (e) { setError(e.message); return; }

      if (viewer.playerObject?.skin?.outerLayer) {
        viewer.playerObject.skin.outerLayer.visible = useSkinStore.getState().showOuterLayer;
      }
      if (viewer.controls) {
        viewer.controls.enableDamping = true;
        viewer.controls.rotateSpeed = 0.6; viewer.controls.zoomSpeed = 0.8; viewer.controls.panSpeed = 0.5;
      }

      viewerRef.current = viewer;
      setReady(true);

      const ro = new ResizeObserver(() => {
        if (!viewerRef.current) return;
        const cw = container.clientWidth, ch = container.clientHeight;
        if (cw > 0 && ch > 0) viewerRef.current.setSize(cw, ch);
      });
      ro.observe(container);

      cleanup = () => {
        ro.disconnect();
        try { viewer?.dispose(); } catch {}
        if (canvas.parentNode === container) container.removeChild(canvas);
        viewerRef.current = null;
      };
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (cleanup) cleanup();
    };
  }, []);

  // ── 纹理同步 (仅版本号变化时) ──
  useEffect(() => {
    let lastV = -1;
    return useSkinStore.subscribe((s) => {
      if (s._textureVersion === lastV) return;
      lastV = s._textureVersion;
      const viewer = viewerRef.current;
      if (!viewer) return;
      const img = skinToImage(s.skinData);
      if (!img) return;
      try {
        viewer.loadSkin(img, { model: s.modelType === 'alex' ? 'alex' : 'steve' });
      } catch (e) { console.warn('[SkinViewer3D] loadSkin:', e.message); }
    });
  }, []);

  // ── 模型切换 ──
  useEffect(() => useSkinStore.subscribe((s, p) => {
    if (s.modelType === p.modelType || !viewerRef.current) return;
    const img = skinToImage(s.skinData);
    if (img) viewerRef.current.loadSkin(img, { model: s.modelType === 'alex' ? 'alex' : 'steve' });
  }), []);

  // ── 外层可见性 ──
  useEffect(() => useSkinStore.subscribe((s, p) => {
    if (s.showOuterLayer === p.showOuterLayer) return;
    const skin = viewerRef.current?.playerObject?.skin;
    if (skin?.outerLayer) skin.outerLayer.visible = s.showOuterLayer;
  }), []);

  // ── 部位可见性 ──
  useEffect(() => useSkinStore.subscribe((s, p) => {
    if (s.partVisibility === p.partVisibility || !viewerRef.current?.playerObject) return;
    const po = viewerRef.current.playerObject;
    const map = { head:'head',body:'body',rightArm:'rightArm',leftArm:'leftArm',rightLeg:'rightLeg',leftLeg:'leftLeg' };
    for (const [pid, vis] of Object.entries(s.partVisibility || {})) {
      const part = po[map[pid]];
      if (part) part.visible = vis;
    }
  }), []);

  if (error) {
    return (
      <div ref={containerRef} style={{ display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',minHeight:300,background:'#0B0B0B',color:'#DC2626',flexDirection:'column',gap:8 }}>
        <span style={{fontSize:32}}>⚠️</span>
        <span style={{fontSize:13}}>3D 引擎加载失败</span>
        <span style={{fontSize:11,color:'#6B7280'}}>{error}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width:'100%',height:'100%',minHeight:300,overflow:'hidden' }}>
      {!ready && (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#9CA3AF',fontSize:13 }}>
          3D 引擎加载中...
        </div>
      )}
    </div>
  );
}
