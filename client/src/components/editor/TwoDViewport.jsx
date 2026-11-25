import React, { useRef, useEffect, useCallback } from 'react';
import { useSkinStore } from '../../store/useSkinStore.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { Canvas2DRenderer } from '../../engine/canvas/Canvas2DRenderer.js';
import { textureSource } from '../../engine/canvas/TextureSource.js';
import { PencilTool } from '../../engine/tools/PencilTool.js';
import { BrushTool } from '../../engine/tools/BrushTool.js';
import { EraserTool } from '../../engine/tools/EraserTool.js';
import { FillTool } from '../../engine/tools/FillTool.js';
import { SymmetryManager } from '../../engine/tools/SymmetryManager.js';
import { PIXEL_MAP } from '../../engine/skin/UVMap.js';
import { hexToHsv } from '../../utils/colors.js';

const TOOLS = { pencil: new PencilTool(), brush: new BrushTool(), eraser: new EraserTool(), fill: new FillTool() };

/**
 * TwoDViewport — 2D UV 纹理视图
 *
 * 支持：
 * - 左键绘画（集成工具系统）
 * - Alt+左键拖拽平移视图
 * - 滚轮缩放
 * - 身体部位高亮覆盖层
 *
 * @param {{ compact?: boolean, fullSize?: boolean }} props
 */
export function TwoDViewport({ compact, fullSize }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const rafRef = useRef(null);
  const lastVerRef = useRef(-1);

  // 绘画/平移状态
  const inputRef = useRef({
    isPainting: false,
    isPanning: false,
    altPressed: false,
    panStartX: 0,
    panStartY: 0,
    panOrigX: 0,
    panOrigY: 0,
  });

  // 初始化
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const skinStore = useSkinStore.getState();
    const sz = skinStore.textureSize || 64;
    const renderer = new Canvas2DRenderer(canvas, { skinWidth: sz, skinHeight: sz });
    rendererRef.current = renderer;

    renderer.renderFromCanvas(textureSource.canvas);

    const ro = new ResizeObserver(() => renderer.resize());
    ro.observe(canvas.parentElement);
    return () => { ro.disconnect(); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // 纹理尺寸变更
  useEffect(() => {
    return useSkinStore.subscribe((s, p) => {
      if (s.textureSize === p.textureSize || !rendererRef.current) return;
      rendererRef.current.setSkinSize(s.textureSize, s.textureSize);
      doRender();
    });
  }, []);

  /** 获取当前渲染选项 */
  const getRenderOpts = useCallback(() => {
    const state = useSkinStore.getState();
    return {
      highlightOuter: state.showOuterLayer,
      hiddenParts: state.partVisibility,
      editOuter: useEditorStore.getState().editOuterLayer,
      bodyPartHighlight: useEditorStore.getState().showBodyPartHighlight,
    };
  }, []);

  const doRender = useCallback(() => {
    if (!rendererRef.current) return;
    rendererRef.current.renderFromCanvas(textureSource.canvas, getRenderOpts());
  }, [getRenderOpts]);

  // 渲染循环
  useEffect(() => {
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const ver = useSkinStore.getState()._textureVersion;
      if (ver !== lastVerRef.current && rendererRef.current) {
        doRender();
        lastVerRef.current = ver;
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [doRender]);

  // 缩放
  useEffect(() => useUIStore.subscribe((s, p) => {
    if (s.zoom2D !== p.zoom2D && rendererRef.current) rendererRef.current.setZoom(s.zoom2D);
  }), []);

  // 身体部位高亮开关 → 触发重渲染（不改变纹理数据，不触发 _textureVersion 变更）
  useEffect(() => {
    return useEditorStore.subscribe((s, p) => {
      if (s.showBodyPartHighlight !== p.showBodyPartHighlight && rendererRef.current) {
        doRender();
      }
    });
  }, [doRender]);

  // ═══════════════════════════════════════════════════════════
  // 键盘事件：Alt 键切换平移模式
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const ir = inputRef;

    const onKeyDown = (e) => {
      if (e.key === 'Alt' && !ir.current.altPressed) {
        ir.current.altPressed = true;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab';
        }
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'Alt') {
        ir.current.altPressed = false;
        ir.current.isPanning = false;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = compact ? 'default' : 'crosshair';
        }
      }
    };
    const onBlur = () => {
      ir.current.altPressed = false;
      ir.current.isPanning = false;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = compact ? 'default' : 'crosshair';
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [compact]);

  // 像素定位
  const getPixel = useCallback((e) => {
    const r = rendererRef.current; if (!r) return null;
    return r.canvasToPixel(e.clientX, e.clientY);
  }, []);

  // 图层和可见性检查
  const isPixelInEditLayer = useCallback((x, y) => {
    const sz = useSkinStore.getState().textureSize || 64;
    const scale = sz / 64;
    const mx = Math.floor(x / scale);
    const my = Math.floor(y / scale);
    const idx = my * 64 + mx;
    const info = (idx >= 0 && idx < PIXEL_MAP.length) ? PIXEL_MAP[idx] : null;
    if (!info) return true;
    return info.layer === (useEditorStore.getState().editOuterLayer ? 'outer' : 'inner');
  }, []);

  const isPixelHidden = useCallback((x, y) => {
    const sz = useSkinStore.getState().textureSize || 64;
    const scale = sz / 64;
    const mx = Math.floor(x / scale);
    const my = Math.floor(y / scale);
    const idx = my * 64 + mx;
    const info = (idx >= 0 && idx < PIXEL_MAP.length) ? PIXEL_MAP[idx] : null;
    if (!info) return false;
    return !useSkinStore.getState().partVisibility[info.part];
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 鼠标事件
  // ═══════════════════════════════════════════════════════════

  const handleDown = useCallback((e) => {
    if (e.button !== 0) return; // 只响应左键
    const ir = inputRef.current;

    // Alt+左键 → 平移模式
    if (e.altKey || ir.altPressed) {
      ir.isPanning = true;
      ir.isPainting = false;
      ir.panStartX = e.clientX;
      ir.panStartY = e.clientY;
      ir.panOrigX = rendererRef.current?.panX || 0;
      ir.panOrigY = rendererRef.current?.panY || 0;
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
      e.preventDefault();
      return;
    }

    if (compact) return; // 紧凑模式不绘画

    // 左键绘画
    const pixel = getPixel(e);
    if (!pixel) return;

    const editor = useEditorStore.getState(), skin = useSkinStore.getState();

    if (editor.activeTool === 'eyedropper') {
      const hex = textureSource.getPixelHex(pixel.x, pixel.y);
      editor.setPrimaryColor(hex);
      editor.setHSV(hexToHsv(hex));
      editor.setEyedropperInfo({ hex, x: pixel.x, y: pixel.y, source: '2d' });
      return;
    }

    if (isPixelHidden(pixel.x, pixel.y)) return;
    if (!isPixelInEditLayer(pixel.x, pixel.y)) return;

    const tool = TOOLS[editor.activeTool]; if (!tool) return;
    skin.pushSnapshot();
    skin.skinData.bindContext(textureSource.getContext());

    ir.isPainting = true;
    tool.onPointerDown(pixel.x, pixel.y, skin.skinData, editor.primaryColor, new SymmetryManager(editor.symmetryMode), {
      brushSize: editor.brushSize,
      editOuterLayer: editor.editOuterLayer,
    });
    skin.markChanged();
  }, [compact, getPixel, isPixelHidden, isPixelInEditLayer]);

  const handleMove = useCallback((e) => {
    const ir = inputRef.current;

    // 平移中
    if (ir.isPanning && rendererRef.current) {
      const dx = e.clientX - ir.panStartX;
      const dy = e.clientY - ir.panStartY;
      rendererRef.current.setPan(ir.panOrigX + dx, ir.panOrigY + dy);
      doRender();
      return;
    }

    // 绘画中
    if (!ir.isPainting) return;
    const pixel = getPixel(e);
    if (!pixel) return;
    if (isPixelHidden(pixel.x, pixel.y)) return;
    if (!isPixelInEditLayer(pixel.x, pixel.y)) return;

    const editor = useEditorStore.getState(), skin = useSkinStore.getState();
    const tool = TOOLS[editor.activeTool]; if (!tool) return;
    tool.onPointerMove(pixel.x, pixel.y, skin.skinData, editor.primaryColor, new SymmetryManager(editor.symmetryMode), {
      brushSize: editor.brushSize,
      editOuterLayer: editor.editOuterLayer,
    });
    skin.markChanged();
  }, [getPixel, isPixelHidden, isPixelInEditLayer, doRender]);

  const handleUp = useCallback(() => {
    const ir = inputRef.current;
    if (ir.isPanning) {
      ir.isPanning = false;
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
      return;
    }
    if (!ir.isPainting) return;
    ir.isPainting = false;
    TOOLS[useEditorStore.getState().activeTool]?.onPointerUp();
  }, []);

  const handleLeave = useCallback(() => {
    const ir = inputRef.current;
    if (ir.isPanning) {
      ir.isPanning = false;
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
    }
    if (ir.isPainting) {
      ir.isPainting = false;
      TOOLS[useEditorStore.getState().activeTool]?.onPointerUp();
    }
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const ui = useUIStore.getState();
    e.deltaY < 0 ? ui.zoomIn2D() : ui.zoomOut2D();
  }, []);

  return (
    <div className="viewport-2d" style={compact ? { width: '100%', height: '100%', borderLeft: 'none' } : {}}>
      {!compact && (
        <div className="viewport-label">2D 纹理 (UV)</div>
      )}
      <canvas ref={canvasRef}
        style={{
          maxWidth: '100%', maxHeight: '100%',
          display: 'block', margin: 'auto',
          cursor: compact ? 'default' : 'crosshair',
          objectFit: 'contain',
        }}
        onMouseDown={handleDown} onMouseMove={handleMove}
        onMouseUp={handleUp} onMouseLeave={handleLeave}
        onWheel={handleWheel} />
      {!compact && (
        <div style={{
          position: 'absolute', bottom: 4, left: 6, zIndex: 10,
          fontSize: 8, color: 'rgba(255,255,255,0.2)',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          左键绘画 | Alt+拖拽平移 | 滚轮缩放
        </div>
      )}
    </div>
  );
}
