/**
 * ThreeViewport.jsx — 硬编码 UV 映射版
 *
 * 每个身体部位每个面的 UV 坐标完全按用户指定，不做任何计算。
 * UV 数组格式: [左上u,左上v, 右上u,右上v, 右下u,右下v, 左下u,左下v]
 */
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useSkinStore } from '../../store/useSkinStore.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import { PencilTool } from '../../engine/tools/PencilTool.js';
import { BrushTool } from '../../engine/tools/BrushTool.js';
import { EraserTool } from '../../engine/tools/EraserTool.js';
import { FillTool } from '../../engine/tools/FillTool.js';
import { SymmetryManager } from '../../engine/tools/SymmetryManager.js';

const TOOLS = { pencil: new PencilTool(), brush: new BrushTool(), eraser: new EraserTool(), fill: new FillTool() };
const S = 1 / 16;

// ═══════════════════════════════════════════════════════════════
// 硬编码 UV 数据 — 用户手动测量并验证
// 格式: [左上u,左上v, 右上u,右上v, 右下u,右下v, 左下u,左下v]
// ═══════════════════════════════════════════════════════════════

const UV_DATA = {
  head: {
    front:  [0.125,0.0, 0.25,0.0, 0.25,0.125, 0.125,0.125],
    back:   [0.25,0.0, 0.375,0.0, 0.375,0.125, 0.25,0.125],
    left:   [0.0,0.125, 0.125,0.125, 0.125,0.25, 0.0,0.25],
    right:  [0.125,0.125, 0.25,0.125, 0.25,0.25, 0.125,0.25],
    top:    [0.125,0.0, 0.25,0.0, 0.25,0.125, 0.125,0.125],
    bottom: [0.25,0.0, 0.375,0.0, 0.375,0.125, 0.25,0.125],
  },
  body: {
    front:  [0.3125,0.3125, 0.4375,0.3125, 0.4375,0.5, 0.3125,0.5],
    back:   [0.4375,0.3125, 0.5625,0.3125, 0.5625,0.5, 0.4375,0.5],
    left:   [0.25,0.3125, 0.3125,0.3125, 0.3125,0.5, 0.25,0.5],
    right:  [0.375,0.3125, 0.4375,0.3125, 0.4375,0.5, 0.375,0.5],
    top:    [0.3125,0.25, 0.4375,0.25, 0.4375,0.3125, 0.3125,0.3125],
    bottom: [0.4375,0.25, 0.5625,0.25, 0.5625,0.3125, 0.4375,0.3125],
  },
  leftArm: {
    front:  [0.6875,0.3125, 0.75,0.3125, 0.75,0.5, 0.6875,0.5],
    back:   [0.75,0.3125, 0.8125,0.3125, 0.8125,0.5, 0.75,0.5],
    left:   [0.625,0.3125, 0.6875,0.3125, 0.6875,0.5, 0.625,0.5],
    right:  [0.8125,0.3125, 0.875,0.3125, 0.875,0.5, 0.8125,0.5],
    top:    [0.6875,0.25, 0.75,0.25, 0.75,0.3125, 0.6875,0.3125],
    bottom: [0.75,0.25, 0.8125,0.25, 0.8125,0.3125, 0.75,0.3125],
  },
  rightArm: {
    front:  [0.5625,0.8125, 0.625,0.8125, 0.625,1.0, 0.5625,1.0],
    back:   [0.625,0.8125, 0.6875,0.8125, 0.6875,1.0, 0.625,1.0],
    left:   [0.5,0.8125, 0.5625,0.8125, 0.5625,1.0, 0.5,1.0],
    right:  [0.6875,0.8125, 0.75,0.8125, 0.75,1.0, 0.6875,1.0],
    top:    [0.5625,0.75, 0.625,0.75, 0.625,0.8125, 0.5625,0.8125],
    bottom: [0.625,0.75, 0.6875,0.75, 0.6875,0.8125, 0.625,0.8125],
  },
  leftLeg: {
    front:  [0.0625,0.3125, 0.125,0.3125, 0.125,0.5, 0.0625,0.5],
    back:   [0.125,0.3125, 0.1875,0.3125, 0.1875,0.5, 0.125,0.5],
    left:   [0.0,0.3125, 0.0625,0.3125, 0.0625,0.5, 0.0,0.5],
    right:  [0.1875,0.3125, 0.25,0.3125, 0.25,0.5, 0.1875,0.5],
    top:    [0.0625,0.25, 0.125,0.25, 0.125,0.3125, 0.0625,0.3125],
    bottom: [0.125,0.25, 0.1875,0.25, 0.1875,0.3125, 0.125,0.3125],
  },
  rightLeg: {
    front:  [0.3125,0.8125, 0.375,0.8125, 0.375,1.0, 0.3125,1.0],
    back:   [0.375,0.8125, 0.4375,0.8125, 0.4375,1.0, 0.375,1.0],
    left:   [0.25,0.8125, 0.3125,0.8125, 0.3125,1.0, 0.25,1.0],
    right:  [0.4375,0.8125, 0.5,0.8125, 0.5,1.0, 0.4375,1.0],
    top:    [0.3125,0.75, 0.375,0.75, 0.375,0.8125, 0.3125,0.8125],
    bottom: [0.375,0.75, 0.4375,0.75, 0.4375,0.8125, 0.375,0.8125],
  },
};

/**
 * 将用户 UV 数组写入 BoxGeometry 的一个面。
 *
 * 用户 UV 顺序: [左上, 右上, 右下, 左下]
 *
 * BoxGeometry 面顺序 (0-5): right(+X), left(-X), top(+Y), bottom(-Y), front(+Z), back(-Z)
 *
 * 每面 4 顶点在 BoxGeometry 中的顺序和它们对应的用户 UV 索引:
 *   面0 right:  v0=左下[3] v1=右下[2] v2=左上[0] v3=右上[1]
 *   面1 left:   v0=右下[2] v1=左下[3] v2=右上[1] v3=左上[0]
 *   面2 top:    v0=左下[3] v1=左上[0] v2=右下[2] v3=右上[1]
 *   面3 bottom: v0=左下[3] v1=左上[0] v2=右下[2] v3=右上[1]
 *   面4 front:  v0=左下[3] v1=右下[2] v2=左上[0] v3=右上[1]
 *   面5 back:   v0=右下[2] v1=左下[3] v2=右上[1] v3=左上[0]
 */
const FACE_REMAP = [
  [3,2,0,1], // 0: right → v0=user[3],v1=user[2],v2=user[0],v3=user[1]
  [2,3,1,0], // 1: left → v0=user[2],v1=user[3],v2=user[1],v3=user[0]
  [3,0,2,1], // 2: top → v0=user[3],v1=user[0],v2=user[2],v3=user[1]
  [3,0,2,1], // 3: bottom → v0=user[3],v1=user[0],v2=user[2],v3=user[1]
  [3,2,0,1], // 4: front → v0=user[3],v1=user[2],v2=user[0],v3=user[1]
  [2,3,1,0], // 5: back → v0=user[2],v1=user[3],v2=user[1],v3=user[0]
];

// BoxGeometry 面索引 → UV 数据中的面名
const FACE_NAMES = ['right', 'left', 'top', 'bottom', 'front', 'back'];

/**
 * 将硬编码 UV 数据写入 BoxGeometry
 */
function applyUVs(geo, uvFaces) {
  const arr = geo.attributes.uv.array;
  for (let fi = 0; fi < 6; fi++) {
    const faceName = FACE_NAMES[fi];
    const uv = uvFaces[faceName];
    if (!uv) continue;
    const remap = FACE_REMAP[fi];
    const base = fi * 8; // 4 vertices × 2 components
    for (let vi = 0; vi < 4; vi++) {
      const ui = remap[vi] * 2;     // user UV index → u offset
      arr[base + vi * 2] = uv[ui];
      arr[base + vi * 2 + 1] = uv[ui + 1];
    }
  }
  geo.attributes.uv.needsUpdate = true;
  geo.computeVertexNormals();
}

export function ThreeViewport({ compact }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [fps, setFps] = useState(60);
  const ctxRef = useRef({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const W = container.clientWidth || 600, H = container.clientHeight || 400;
    if (W === 0 || H === 0) { setError('容器尺寸为0'); return; }

    let isMounted = true;
    const ctx = ctxRef.current;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0B0B0B');
      ctx.scene = scene;

      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
      camera.position.set(3, 3, 6); camera.lookAt(0, 1.2, 0);
      ctx.camera = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);
      ctx.renderer = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.6; controls.zoomSpeed = 0.8; controls.panSpeed = 0.5;
      controls.target.set(0, 1.2, 0);
      controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
      controls.update();
      ctx.controls = controls;

      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(5, 12, 8); scene.add(key);
      const fill = new THREE.DirectionalLight(0x8899cc, 0.3); fill.position.set(-3, 3, -4); scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffffff, 0.2); rim.position.set(0, 2, -6); scene.add(rim);

      const grid = new THREE.GridHelper(4, 16, 0x444444, 0x222222);
      grid.position.y = -0.01; scene.add(grid);

      // 纹理
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 64; texCanvas.height = 64;
      const texCtx = texCanvas.getContext('2d');
      ctx.texCanvas = texCanvas; ctx.texCtx = texCtx;

      const store = useSkinStore.getState();
      texCtx.putImageData(new ImageData(new Uint8ClampedArray(store.skinData.getRawData()), 64, 64), 0, 0);

      const texture = new THREE.CanvasTexture(texCanvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = true;
      ctx.texture = texture;

      store.skinData.bindContext(texCtx);

      // 模型
      const modelGroup = new THREE.Group();
      const bodyParts = {};
      const allMeshes = [];

      const parts = [
        { id: 'head',     w: 8,  h: 8,  d: 8,  cx: 0,  cy: 28, cz: 0 },
        { id: 'body',     w: 8,  h: 12, d: 4,  cx: 0,  cy: 18, cz: 0 },
        { id: 'rightArm', w: 4,  h: 12, d: 4,  cx: -6, cy: 18, cz: 0 },
        { id: 'leftArm',  w: 4,  h: 12, d: 4,  cx: 6,  cy: 18, cz: 0 },
        { id: 'rightLeg', w: 4,  h: 12, d: 4,  cx: -2, cy: 6,  cz: 0 },
        { id: 'leftLeg',  w: 4,  h: 12, d: 4,  cx: 2,  cy: 6,  cz: 0 },
      ];

      for (const p of parts) {
        const uvFaces = UV_DATA[p.id];
        if (!uvFaces) continue;

        const geo = new THREE.BoxGeometry(p.w * S, p.h * S, p.d * S);
        applyUVs(geo, uvFaces);

        const mat = new THREE.MeshStandardMaterial({
          map: texture, roughness: 0.55, metalness: 0.02, side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(p.cx * S, p.cy * S, p.cz * S);
        mesh.userData = { bodyPart: p.id };
        mesh.castShadow = true; mesh.receiveShadow = true;

        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.3 })
        );
        mesh.add(edges);
        modelGroup.add(mesh);
        bodyParts[p.id] = mesh;
        allMeshes.push(mesh);
      }
      scene.add(modelGroup);
      ctx.modelGroup = modelGroup;
      ctx.bodyParts = bodyParts;
      ctx.allMeshes = allMeshes;

      // 外层线框 (wireframe overlay, 略大 1/64)
      const wireGroup = new THREE.Group();
      const PX = 1 / 64;
      for (const p of parts) {
        const uvFaces = UV_DATA[p.id];
        if (!uvFaces) continue;
        const wGeo = new THREE.BoxGeometry(p.w * S + PX * 2, p.h * S + PX * 2, p.d * S + PX * 2);
        applyUVs(wGeo, uvFaces);
        const wMat = new THREE.MeshBasicMaterial({
          map: texture, wireframe: true, color: 0x888888,
          transparent: true, opacity: 0.2, depthTest: true, depthWrite: false,
        });
        const wMesh = new THREE.Mesh(wGeo, wMat);
        wMesh.position.set(p.cx * S, p.cy * S, p.cz * S);
        wMesh.userData = { bodyPart: p.id, wireframe: true };
        wireGroup.add(wMesh);
      }
      wireGroup.visible = true;
      scene.add(wireGroup);
      ctx.wireGroup = wireGroup;

      // 悬停高亮
      const hl = new THREE.Mesh(
        new THREE.PlaneGeometry(0.04, 0.04),
        new THREE.MeshBasicMaterial({ color: 0xD4A843, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthTest: true, depthWrite: false })
      );
      hl.visible = false; hl.renderOrder = 999; scene.add(hl);
      ctx.hl = hl;

      // Raycaster 绘画
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const ds = { drawing: false, lx: -1, ly: -1, stroke: false };

      const getHit = (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        return raycaster.intersectObjects(allMeshes, false)[0] || null;
      };

      const handleDraw = (e) => {
        const hit = getHit(e);
        if (!hit?.uv) return;
        const px = Math.floor(hit.uv.x * 64);
        const py = Math.floor((1 - hit.uv.y) * 64);
        if (px < 0 || px >= 64 || py < 0 || py >= 64) return;
        const ed = useEditorStore.getState(), sk = useSkinStore.getState();
        if (ed.activeTool === 'eyedropper') { ed.setPrimaryColor(sk.skinData.getPixelHex(px, py)); return; }
        const tool = TOOLS[ed.activeTool]; if (!tool) return;
        if (!ds.stroke) { sk.pushSnapshot(); ds.stroke = true; }
        const sym = new SymmetryManager(ed.symmetryMode);
        if (ds.lx < 0) tool.onPointerDown(px, py, sk.skinData, ed.primaryColor, sym, { brushSize: ed.brushSize });
        tool.onPointerMove(px, py, sk.skinData, ed.primaryColor, sym, { brushSize: ed.brushSize });
        ds.lx = px; ds.ly = py; sk.markChanged();
      };

      const cv = renderer.domElement;
      cv.addEventListener('pointerdown', (e) => { if (compact) return; e.preventDefault(); const hit = getHit(e); if (hit?.uv && e.button === 0) { ds.drawing = true; ds.stroke = false; ds.lx = -1; ds.ly = -1; handleDraw(e); } });
      cv.addEventListener('pointermove', (e) => {
        if (ds.drawing) { handleDraw(e); return; }
        const hit = getHit(e);
        if (hit?.uv) { const pt = hit.point.clone(), nm = hit.face.normal.clone(); hl.position.copy(pt.add(nm.multiplyScalar(0.003))); hl.lookAt(hl.position.x + nm.x, hl.position.y + nm.y, hl.position.z + nm.z); hl.visible = true; }
        else hl.visible = false;
      });
      cv.addEventListener('pointerup', () => { if (ds.drawing) { ds.drawing = false; ds.lx = -1; ds.ly = -1; TOOLS[useEditorStore.getState().activeTool]?.onPointerUp(); } });
      cv.addEventListener('pointerleave', () => { if (ds.drawing) { ds.drawing = false; ds.lx = -1; ds.ly = -1; } });
      cv.addEventListener('contextmenu', e => e.preventDefault());

      const ro = new ResizeObserver(() => {
        if (!isMounted) return;
        const w = container.clientWidth, h = container.clientHeight;
        if (w > 0 && h > 0) { renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
      });
      ro.observe(container);

      let lastVer = -1, fc = 0, lt = performance.now();
      function animate() {
        if (!isMounted) return;
        requestAnimationFrame(animate);
        controls.update();
        const curVer = useSkinStore.getState()._textureVersion;
        if (curVer !== lastVer) {
          texCtx.putImageData(new ImageData(new Uint8ClampedArray(useSkinStore.getState().skinData.getRawData()), 64, 64), 0, 0);
          texture.needsUpdate = true;
          lastVer = curVer;
        }
        renderer.render(scene, camera);
        fc++; const now = performance.now();
        if (now - lt >= 1000) { setFps(Math.round(fc / ((now - lt) / 1000))); fc = 0; lt = now; }
      }
      requestAnimationFrame(animate);

    } catch (err) {
      console.error('[ThreeViewport]', err.message);
      if (isMounted) setError(err.message);
    }

    return () => {
      isMounted = false;
      try { ctx.renderer?.dispose(); if (ctx.renderer?.domElement?.parentNode === container) container.removeChild(ctx.renderer.domElement); ctx.controls?.dispose(); ctx.texture?.dispose(); } catch {}
      Object.keys(ctx).forEach(k => ctx[k] = null);
    };
  }, [compact]);

  useEffect(() => useSkinStore.subscribe((s, p) => {
    if (s.modelType === p.modelType || !ctxRef.current.bodyParts) return;
    const armW = s.modelType === 'alex' ? 3 : 4;
    for (const name of ['rightArm', 'leftArm']) {
      const mesh = ctxRef.current.bodyParts[name];
      if (!mesh) continue;
      const uvFaces = UV_DATA[name];
      if (!uvFaces) continue;
      mesh.geometry.dispose();
      mesh.geometry = new THREE.BoxGeometry(armW * S, 12 * S, 4 * S);
      applyUVs(mesh.geometry, uvFaces);
    }
  }), []);

  useEffect(() => useSkinStore.subscribe((s, p) => {
    if (s.partVisibility === p.partVisibility) return;
    for (const [pid, vis] of Object.entries(s.partVisibility || {})) {
      const m = ctxRef.current.bodyParts?.[pid];
      if (m) m.visible = vis;
    }
  }), []);

  if (error) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',minHeight:300,background:'#0B0B0B',color:'#DC2626',flexDirection:'column',gap:8 }}><span style={{fontSize:32}}>⚠️</span><span style={{fontSize:13}}>3D 视图加载失败</span><span style={{fontSize:11,color:'#6B7280'}}>{error}</span></div>;

  return (
    <div ref={containerRef} style={{ position:'relative',width:'100%',height:'100%',minHeight:300,overflow:'hidden' }}>
      <div className="viewport-label" style={{ zIndex:10 }}>3D · {fps}FPS</div>
      {!compact && <div style={{ position:'absolute',bottom:8,left:8,fontSize:9,color:'rgba(255,255,255,0.15)',zIndex:10 }}>左键旋转 | 中键平移 | 滚轮缩放 | 左键模型上绘画</div>}
    </div>
  );
}
