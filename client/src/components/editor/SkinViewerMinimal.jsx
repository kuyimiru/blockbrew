/**
 * SkinViewerMinimal.jsx — 交互式 3D 绘画工具
 *
 * 基于 skinview3d，支持：
 * - 左键绘画（集成编辑器工具系统）
 * - Alt+左键旋转视角 / 滚轮缩放 / 中键平移
 * - 灰白画布初始纹理（带网格辅助线）
 * - 3D↔2D 实时双向同步（共享纹理源 textureSource）
 * - 鼠标悬停像素格高亮（金色渐变指示器）
 * - 持续渲染循环确保即时反馈
 */
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { SkinViewer } from 'skinview3d';
import { useSkinStore } from '../../store/useSkinStore.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import { textureSource } from '../../engine/canvas/TextureSource.js';
import { PencilTool } from '../../engine/tools/PencilTool.js';
import { BrushTool } from '../../engine/tools/BrushTool.js';
import { EraserTool } from '../../engine/tools/EraserTool.js';
import { FillTool } from '../../engine/tools/FillTool.js';
import { SymmetryManager } from '../../engine/tools/SymmetryManager.js';
import { hexToHsv } from '../../utils/colors.js';

// ── 工具实例（单例） ──
const TOOLS = {
  pencil: new PencilTool(),
  brush: new BrushTool(),
  eraser: new EraserTool(),
  fill: new FillTool(),
};

const MODEL_MAP = { steve: 'default', alex: 'slim' };
const SKIN_SIZE = 64;

// ═══════════════════════════════════════════════════════════════
// 悬停高亮纹理生成
// ═══════════════════════════════════════════════════════════════

/** 生成径向渐变的高亮指示器纹理（金色中心 → 透明边缘） */
function createHighlightTexture(size = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, half * 0.05, half, half, half);
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.95)');   // 亮金中心
  gradient.addColorStop(0.15, 'rgba(255, 215, 0, 0.8)');
  gradient.addColorStop(0.4, 'rgba(255, 200, 50, 0.45)');
  gradient.addColorStop(0.7, 'rgba(255, 180, 30, 0.12)');
  gradient.addColorStop(1, 'rgba(255, 150, 20, 0)');      // 完全透明边缘

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// ═══════════════════════════════════════════════════════════════
// 射线检测 & 纹理工具
// ═══════════════════════════════════════════════════════════════

/** 收集所有可射线检测的身体部位 mesh */
function getPaintableMeshes(viewer) {
  const meshes = [];
  const skin = viewer.playerObject?.skin;
  if (!skin) return meshes;

  const partNames = ['head', 'body', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'];
  for (const name of partNames) {
    const part = skin[name];
    if (!part) continue;
    if (part.innerLayer) meshes.push(part.innerLayer);
    if (part.outerLayer?.visible) meshes.push(part.outerLayer);
  }
  return meshes;
}

/** 获取所有材质纹理引用（用于 needsUpdate） */
function getAllTextures(viewer) {
  const textures = new Set();
  const meshes = getPaintableMeshes(viewer);
  for (const mesh of meshes) {
    if (mesh.material?.map) textures.add(mesh.material.map);
  }
  return [...textures];
}

// ═══════════════════════════════════════════════════════════════
// 组件
// ═══════════════════════════════════════════════════════════════

export function SkinViewerMinimal({ compact }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const hlMeshRef = useRef(null);          // 悬停高亮 mesh
  const paintRef = useRef({
    isPainting: false,
    stroke: false,
    lastX: -1,
    lastY: -1,
    altPressed: false,
    meshes: [],           // 可射线检测的 mesh 缓存
  });
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const lastVerRef = useRef(-1);
  const animFrameRef = useRef(null);
  const statusRef = useRef(null);          // 状态显示回调
  const [error, setError] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // 初始化
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let viewer = null;

    const raf = requestAnimationFrame(() => {
      if (disposed) return;

      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) {
        setError('容器尺寸为 0');
        return;
      }

      // ── 确保共享纹理源已初始化，并与 store 同步 ──
      const store = useSkinStore.getState();
      // 如果 store 中有自定义数据（已绘画/已加载），同步到共享纹理源
      if (store.isDirty || store.skinName !== '未命名皮肤') {
        textureSource.syncFromRawData(store.skinData.getRawData());
      } else {
        // 默认模板 → 用灰白画布替换，并同步到 store
        textureSource.reset();
        const SkinDataClass = store.skinData.constructor;
        const grayRaw = textureSource.toRawData();
        const newSkinData = new SkinDataClass(grayRaw, textureSource.getContext());
        store.loadSkin(newSkinData, '空白画布');
      }

      // 绑定 store 的 SkinData 到共享纹理源上下文
      useSkinStore.getState().skinData.bindContext(textureSource.getContext());

      // ── 创建 SkinViewer（使用共享纹理源 Canvas） ──
      try {
        viewer = new SkinViewer({
          width: w,
          height: h,
          skin: textureSource.canvas,
          model: MODEL_MAP[store.modelType] || 'default',
          background: '#0B0B0B',
          enableControls: true,
        });
      } catch (e) {
        if (!disposed) setError(e.message);
        return;
      }

      viewer.canvas.style.display = 'block';
      viewer.canvas.style.width = '100%';
      viewer.canvas.style.height = '100%';
      viewer.canvas.style.cursor = compact ? 'grab' : 'crosshair';
      container.appendChild(viewer.canvas);

      // ── 控制器配置 ──
      viewer.controls.enableDamping = true;
      viewer.controls.dampingFactor = 0.08;
      viewer.controls.rotateSpeed = 0.6;
      viewer.controls.zoomSpeed = 0.8;
      viewer.controls.panSpeed = 0.5;
      viewer.controls.enableRotate = false;        // 默认禁用旋转
      viewer.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.PAN,
      };

      // ── 应用当前 store 状态 ──
      const latestStore = useSkinStore.getState();
      viewer.playerObject.skin.setOuterLayerVisible(latestStore.showOuterLayer);
      const skin = viewer.playerObject.skin;
      for (const [pid, vis] of Object.entries(latestStore.partVisibility || {})) {
        const part = skin[pid];
        if (part) {
          part.innerLayer.visible = vis;
          if (latestStore.showOuterLayer) part.outerLayer.visible = vis;
        }
      }

      // ── 创建悬停高亮指示器 ──
      const PX = 1 / SKIN_SIZE;
      const hlGeo = new THREE.PlaneGeometry(PX * 1.3, PX * 1.3);
      const hlTex = createHighlightTexture();
      const hlMat = new THREE.MeshBasicMaterial({
        map: hlTex,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
      });
      const hlMesh = new THREE.Mesh(hlGeo, hlMat);
      hlMesh.visible = false;
      hlMesh.renderOrder = 999;
      hlMesh.material.depthTest = true;
      hlMesh.material.depthWrite = false;
      // 添加到 playerObject 下，跟随模型变换
      viewer.playerObject.add(hlMesh);
      hlMeshRef.current = hlMesh;

      // ── 缓存状态 ──
      paintRef.current.meshes = getPaintableMeshes(viewer);
      viewerRef.current = viewer;
      lastVerRef.current = latestStore._textureVersion;

      // ── ResizeObserver ──
      const ro = new ResizeObserver(() => {
        if (!viewerRef.current) return;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        if (cw > 0 && ch > 0) {
          viewerRef.current.setSize(cw, ch);
        }
      });
      ro.observe(container);

      // ── 持续渲染循环（安全网：确保纹理更新和悬停高亮即时呈现） ──
      function animate() {
        if (disposed || !viewerRef.current) return;
        animFrameRef.current = requestAnimationFrame(animate);
        // 主动调用 render 确保 skinview3d 循环始终运行
        viewerRef.current.render();
      }
      animFrameRef.current = requestAnimationFrame(animate);

      // ── 清理 ──
      container._skinViewerCleanup = () => {
        ro.disconnect();
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        // 先将 canvas 从 DOM 移除（避免 React 和 skinview3d 双重移除冲突）
        if (viewer?.canvas && viewer.canvas.parentNode === container) {
          container.removeChild(viewer.canvas);
        }
        try { viewer?.dispose(); } catch {}
        viewerRef.current = null;
        hlMeshRef.current = null;
      };
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      const cleanup = container._skinViewerCleanup;
      if (cleanup) {
        cleanup();
        delete container._skinViewerCleanup;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════
  // 纹理同步：监听 _textureVersion，更新 Three.js 纹理
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    return useSkinStore.subscribe((s) => {
      if (s._textureVersion === lastVerRef.current) return;
      lastVerRef.current = s._textureVersion;

      const viewer = viewerRef.current;
      if (!viewer) return;

      // 从 store 的 SkinData 同步到共享纹理源（处理 undo/redo 等批量操作）
      textureSource.syncFromRawData(s.skinData.getRawData());

      // 将共享纹理源直接绘制到 skinview3d 的内部纹理 Canvas 上
      // skinview3d 从传入的 canvas 创建了内部副本，必须主动同步
      const textures = getAllTextures(viewer);
      for (const tex of textures) {
        const internalCanvas = tex.source?.data || tex.image;
        if (internalCanvas?.getContext) {
          const ictx = internalCanvas.getContext('2d');
          ictx.drawImage(textureSource.canvas, 0, 0);
          tex.needsUpdate = true;
        } else {
          // 回退：如果拿不到内部 canvas，至少标记更新
          tex.needsUpdate = true;
        }
      }
    });
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 键盘事件：Alt 键切换旋转模式
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Alt' && !paintRef.current.altPressed) {
        paintRef.current.altPressed = true;
        if (viewerRef.current) {
          viewerRef.current.controls.enableRotate = true;
          viewerRef.current.canvas.style.cursor = 'grab';
        }
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'Alt') {
        paintRef.current.altPressed = false;
        if (viewerRef.current) {
          viewerRef.current.controls.enableRotate = false;
          viewerRef.current.canvas.style.cursor = compact ? 'grab' : 'crosshair';
        }
      }
    };
    const onBlur = () => {
      paintRef.current.altPressed = false;
      if (viewerRef.current) {
        viewerRef.current.controls.enableRotate = false;
        viewerRef.current.canvas.style.cursor = compact ? 'grab' : 'crosshair';
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

  // ═══════════════════════════════════════════════════════════
  // 绘画 + 悬停高亮事件处理
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // pr 指向 paintRef.current 引用的对象，修改 pr.xxx 即修改 paintRef.current.xxx
    const pr = paintRef.current;

    /** 射线检测：屏幕坐标 → 3D 交点 */
    const getHit = (e) => {
      const viewer = viewerRef.current;
      if (!viewer) return null;

      // 安全网：确保 meshes 已初始化
      if (!pr.meshes || pr.meshes.length === 0) {
        // 首次调用时延迟初始化 meshes
        pr.meshes = getPaintableMeshes(viewer);
        if (pr.meshes.length === 0) return null;
      }

      const canvas = viewer.canvas;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, viewer.camera);
      return raycasterRef.current.intersectObjects(pr.meshes, false)[0] || null;
    };

    /** 更新悬停高亮位置 */
    const updateHighlight = (hit) => {
      const hl = hlMeshRef.current;
      if (!hl) return;

      if (hit?.uv && hit?.face) {
        const px = Math.floor(hit.uv.x * SKIN_SIZE);
        const py = Math.floor((1 - hit.uv.y) * SKIN_SIZE);
        if (px >= 0 && px < SKIN_SIZE && py >= 0 && py < SKIN_SIZE) {
          // 将高亮置于交点位置，沿法线方向略微偏移
          const pt = hit.point.clone();
          const nm = hit.face.normal.clone();
          hl.position.copy(pt.add(nm.multiplyScalar(0.004)));
          // 让高亮平面朝向法线方向
          hl.lookAt(
            hl.position.x + nm.x,
            hl.position.y + nm.y,
            hl.position.z + nm.z
          );
          hl.visible = true;

          // 可选：通过 statusRef 回调通知外部坐标
          if (statusRef.current) {
            statusRef.current(`像素: (${px}, ${py})`);
          }
          return;
        }
      }
      hl.visible = false;
    };

    /** 绘画核心逻辑 */
    const handlePaint = (e, isDown) => {
      const viewer = viewerRef.current;
      if (!viewer) return;

      const hit = getHit(e);
      if (!hit?.uv) return;

      const px = Math.floor(hit.uv.x * SKIN_SIZE);
      const py = Math.floor((1 - hit.uv.y) * SKIN_SIZE);
      if (px < 0 || px >= SKIN_SIZE || py < 0 || py >= SKIN_SIZE) return;

      const ed = useEditorStore.getState();
      const sk = useSkinStore.getState();

      // 吸管工具：取色 + 同步 HSV + 记录位置信息
      if (ed.activeTool === 'eyedropper') {
        const hex = textureSource.getPixelHex(px, py);
        ed.setPrimaryColor(hex);
        ed.setHSV(hexToHsv(hex));
        ed.setEyedropperInfo({ hex, x: px, y: py, source: '3d' });
        return;
      }

      // 所有绘画工具（pencil/brush/eraser/fill）统一通过工具实例执行
      const tool = TOOLS[ed.activeTool];
      if (!tool) return;

      if (!pr.stroke) {
        sk.pushSnapshot();
        pr.stroke = true;
      }

      // 确保 SkinData 绑定到共享纹理源上下文
      // 这样工具内部的 setPixel 调用会直接写入 textureSource.canvas
      sk.skinData.bindContext(textureSource.getContext());

      const sym = new SymmetryManager(ed.symmetryMode);

      if (isDown || pr.lastX < 0) {
        // 首次按下（或笔划中断后恢复）：触发 onPointerDown
        // FillTool.onPointerDown 在此处理 floodFill + 对称
        tool.onPointerDown(px, py, sk.skinData, ed.primaryColor, sym, {
          brushSize: ed.brushSize,
          editOuterLayer: ed.editOuterLayer,
        });
      } else {
        // 拖拽中：触发 onPointerMove（Bresenham 画线等）
        // FillTool.onPointerMove 是空操作（通过 isDrawing 检查）
        tool.onPointerMove(px, py, sk.skinData, ed.primaryColor, sym, {
          brushSize: ed.brushSize,
          editOuterLayer: ed.editOuterLayer,
        });
      }

      pr.lastX = px;
      pr.lastY = py;
      sk.markChanged();
    };

    // ── 鼠标事件 ──

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (compact) return;

      if (e.altKey || pr.altPressed) {
        pr.isPainting = false;
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      pr.isPainting = true;
      pr.stroke = false;
      pr.lastX = -1;
      pr.lastY = -1;
      pr.meshes = getPaintableMeshes(viewerRef.current);
      // 绘画时隐藏高亮
      if (hlMeshRef.current) hlMeshRef.current.visible = false;
      handlePaint(e, true);
    };

    const onMouseMove = (e) => {
      if (pr.isPainting) {
        handlePaint(e, false);
        return;
      }
      // 非绘画状态：更新悬停高亮
      if (!compact) {
        const hit = getHit(e);
        updateHighlight(hit);
      }
    };

    const onMouseUp = (e) => {
      if (e.button !== 0) return;
      if (pr.isPainting) {
        const tool = TOOLS[useEditorStore.getState().activeTool];
        if (tool) tool.onPointerUp();
        pr.isPainting = false;
        pr.lastX = -1;
        pr.lastY = -1;
      }
    };

    const onMouseLeave = () => {
      if (pr.isPainting) {
        const tool = TOOLS[useEditorStore.getState().activeTool];
        if (tool) tool.onPointerUp();
        pr.isPainting = false;
        pr.lastX = -1;
        pr.lastY = -1;
      }
      // 隐藏高亮
      if (hlMeshRef.current) hlMeshRef.current.visible = false;
    };

    // 使用 rAF 轮询绑定事件（viewer 在 rAF 中初始化，确保就绪）
    let bindAttempts = 0;
    const maxAttempts = 50; // ~800ms max
    const tryBindEvents = () => {
      const canvas = viewerRef.current?.canvas;
      if (canvas) {
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mouseleave', onMouseLeave);
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      } else if (bindAttempts++ < maxAttempts) {
        requestAnimationFrame(tryBindEvents);
      }
    };
    requestAnimationFrame(tryBindEvents);

    return () => {
      const canvas = viewerRef.current?.canvas;
      if (canvas) {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, [compact]);

  // ═══════════════════════════════════════════════════════════
  // Store 订阅：模型类型切换
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    return useSkinStore.subscribe((s, p) => {
      if (s.modelType === p.modelType || !viewerRef.current) return;
      viewerRef.current.playerObject.skin.modelType = MODEL_MAP[s.modelType] || 'default';
      paintRef.current.meshes = getPaintableMeshes(viewerRef.current);
    });
  }, []);

  // ═══════════════════════════════════════════════════════════
  // Store 订阅：外层可见性
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    return useSkinStore.subscribe((s, p) => {
      if (s.showOuterLayer === p.showOuterLayer || !viewerRef.current) return;
      viewerRef.current.playerObject.skin.setOuterLayerVisible(s.showOuterLayer);
      paintRef.current.meshes = getPaintableMeshes(viewerRef.current);
    });
  }, []);

  // ═══════════════════════════════════════════════════════════
  // Store 订阅：部位可见性
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    return useSkinStore.subscribe((s, p) => {
      if (s.partVisibility === p.partVisibility || !viewerRef.current) return;
      const skin = viewerRef.current.playerObject.skin;
      const showOuter = s.showOuterLayer;
      for (const [pid, vis] of Object.entries(s.partVisibility || {})) {
        const part = skin[pid];
        if (part) {
          part.innerLayer.visible = vis;
          if (showOuter) part.outerLayer.visible = vis;
        }
      }
      paintRef.current.meshes = getPaintableMeshes(viewerRef.current);
    });
  }, []);

  // ═══════════════════════════════════════════════════════════
  // Store 订阅：纹理尺寸变更
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    return useSkinStore.subscribe((s, p) => {
      if (s.textureSize === p.textureSize || !viewerRef.current) return;
      // 调整共享纹理源尺寸（保持正方形）
      textureSource.resize(s.textureSize, s.textureSize);
      // 从 SkinData 同步像素数据到新尺寸的纹理源
      textureSource.syncFromRawData(s.skinData.getRawData());
      // 重新绑定 SkinData 上下文
      s.skinData.bindContext(textureSource.getContext());
      // 更新 skinview3d 纹理
      const textures = getAllTextures(viewerRef.current);
      for (const tex of textures) {
        const internalCanvas = tex.source?.data || tex.image;
        if (internalCanvas?.getContext) {
          internalCanvas.width = s.textureSize;
          internalCanvas.height = s.textureSize;
          const ictx = internalCanvas.getContext('2d');
          ictx.drawImage(textureSource.canvas, 0, 0);
          tex.needsUpdate = true;
        }
      }
    });
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 暴露状态回调（供父组件显示坐标）
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // 组件挂载时注册，卸载时清除
    return () => { statusRef.current = null; };
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 错误状态
  // ═══════════════════════════════════════════════════════════
  if (error) {
    return (
      <div ref={containerRef} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%', minHeight: 300,
        background: '#0B0B0B', color: '#DC2626',
        flexDirection: 'column', gap: 8,
      }}>
        <span style={{ fontSize: 32 }}>⚠️</span>
        <span style={{ fontSize: 13 }}>3D 引擎加载失败</span>
        <span style={{ fontSize: 11, color: '#6B7280' }}>{error}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: '100%',
        minHeight: compact ? 200 : 300,
        overflow: 'hidden', position: 'relative',
      }}
    >
      {!compact && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, zIndex: 10,
          fontSize: 9, color: 'rgba(255,255,255,0.2)',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          左键绘画 | Alt+左键旋转 | 滚轮缩放 | 悬停查看像素位置
        </div>
      )}
    </div>
  );
}
