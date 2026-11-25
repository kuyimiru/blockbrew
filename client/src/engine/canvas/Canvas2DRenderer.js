/**
 * Canvas2DRenderer.js — 2D UV 纹理视图渲染器
 *
 * 支持：像素网格、部位轮廓、外层区域高亮、隐藏部位遮罩、DPI 缩放适配
 * 自动根据皮肤纹理的实际宽高比调整画布和渲染尺寸。
 */
import { BODY_PARTS, FACE_ORDER, UV_INNER, UV_OUTER } from '../skin/UVMap.js';
import { generateBodyPartOverlay } from './BodyPartHighlighter.js';

const DEFAULT_SIZE = 64, CHK = 8;

export class Canvas2DRenderer {
  constructor(canvas, { skinWidth = DEFAULT_SIZE, skinHeight = DEFAULT_SIZE } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.zoom = 4; this.panX = 0; this.panY = 0;
    this.showGrid = true; this.showOutlines = true;

    /** 皮肤纹理的像素宽度 */
    this._skinWidth = skinWidth;
    /** 皮肤纹理的像素高度 */
    this._skinHeight = skinHeight;

    // 离屏 canvas 尺寸与皮肤纹理一致
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = skinWidth;
    this.offscreen.height = skinHeight;
    this.offCtx = this.offscreen.getContext('2d');

    this.checker = this._mkChecker();
    this.resize();
  }

  _mkChecker() {
    const c = document.createElement('canvas'); c.width = c.height = CHK * 2;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2C2C2C'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#1E1E1E'; ctx.fillRect(0, 0, CHK, CHK); ctx.fillRect(CHK, CHK, CHK, CHK);
    return c;
  }

  /**
   * 根据父容器尺寸和皮肤纹理宽高比调整显示 canvas 的像素尺寸
   * 保持纹理原始比例，取最长边填满可用空间后等比例缩放
   */
  resize() {
    const p = this.canvas.parentElement;
    if (!p) return;
    const pw = p.clientWidth || 200;
    const ph = p.clientHeight || 200;

    // 安全宽高比（防止除零）
    const skinRatio = this._skinHeight > 0
      ? this._skinWidth / this._skinHeight
      : 1.0;
    const containerRatio = ph > 0 ? pw / ph : 1.0;

    if (containerRatio > skinRatio) {
      // 容器比皮肤更宽 → 高度是限制维度
      this.canvas.height = ph;
      this.canvas.width = Math.round(ph * skinRatio);
    } else {
      // 容器比皮肤更高（或相等） → 宽度是限制维度
      this.canvas.width = pw;
      this.canvas.height = Math.round(pw / skinRatio);
    }
  }

  setZoom(z) { this.zoom = Math.max(1, Math.min(32, z)); }

  /**
   * 设置皮肤纹理尺寸（同时更新离屏 canvas）
   * @param {number} w - 像素宽度
   * @param {number} [h] - 像素高度，默认等于宽度（正方形）
   */
  setSkinSize(w, h) {
    const hh = h ?? w;
    if (this._skinWidth === w && this._skinHeight === hh) return;
    this._skinWidth = w;
    this._skinHeight = hh;
    // 更新离屏 canvas 尺寸
    this.offscreen.width = w;
    this.offscreen.height = hh;
    this.resize();
  }

  /** 兼容旧接口 */
  get _skinSize() { return Math.max(this._skinWidth, this._skinHeight); }
  set _skinSize(v) { this.setSkinSize(v, v); }

  setPan(x, y) { this.panX = x; this.panY = y; }

  /**
   * 渲染（从原始像素数组）
   * @param {Uint8Array} texData - RGBA 像素数据
   * @param {{ highlightOuter?: boolean, hiddenParts?: Record<string,boolean>, editOuter?: boolean }} opts
   */
  render(texData, opts = {}) {
    const w = this._skinWidth, h = this._skinHeight;
    const img = this.offCtx.createImageData(w, h);
    img.data.set(texData.subarray(0, w * h * 4));
    this.offCtx.putImageData(img, 0, 0);
    this._drawOverlays(opts);
  }

  /**
   * 渲染（直接从 Canvas 纹理源，零拷贝）
   * @param {HTMLCanvasElement} sourceCanvas - 纹理源 Canvas（如 textureSource.canvas）
   * @param {{ highlightOuter?: boolean, hiddenParts?: Record<string,boolean>, editOuter?: boolean }} opts
   */
  renderFromCanvas(sourceCanvas, opts = {}) {
    // 自动检测源 canvas 尺寸并更新离屏/皮肤尺寸
    const sw = sourceCanvas.width;
    const sh = sourceCanvas.height;
    if (sw !== this._skinWidth || sh !== this._skinHeight) {
      this.setSkinSize(sw, sh);
    }

    this.offCtx.clearRect(0, 0, this._skinWidth, this._skinHeight);
    this.offCtx.drawImage(sourceCanvas, 0, 0);
    this._drawOverlays(opts);
  }

  /**
   * 绘制覆盖层（网格、轮廓、高亮、遮罩）
   * 所有元素基于皮肤纹理的实际宽高比渲染
   */
  _drawOverlays(opts = {}) {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const sw = this._skinWidth;
    const sh = this._skinHeight;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#0B0B0B'; ctx.fillRect(0, 0, cw, ch);

    // 计算缩放后的纹理显示尺寸（取最长边适配画布）
    const maxDim = Math.max(sw, sh);
    const scaledMax = maxDim * this.zoom;
    // 等比例：宽和高使用同一个 zoom 倍率
    const scaledW = sw * this.zoom;
    const scaledH = sh * this.zoom;

    // 居中放置
    const ox = (cw - scaledW) / 2 + this.panX;
    const oy = (ch - scaledH) / 2 + this.panY;

    // 棋盘格背景（覆盖纹理区域）
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, scaledW, scaledH);
    ctx.clip();
    const p = ctx.createPattern(this.checker, 'repeat');
    if (p) { ctx.fillStyle = p; ctx.fillRect(ox, oy, scaledW, scaledH); }
    ctx.restore();

    // 像素纹理（保持原始宽高比）
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.offscreen, ox, oy, scaledW, scaledH);

    // 像素网格（覆盖整个纹理区域）
    if (this.showGrid && this.zoom >= 4) {
      ctx.strokeStyle = 'rgba(44,44,44,0.22)'; ctx.lineWidth = 0.5;
      // 垂直网格线
      for (let i = 0; i <= sw; i++) {
        const pos = ox + i * this.zoom;
        ctx.beginPath(); ctx.moveTo(pos, oy); ctx.lineTo(pos, oy + scaledH); ctx.stroke();
      }
      // 水平网格线
      for (let i = 0; i <= sh; i++) {
        const pos = oy + i * this.zoom;
        ctx.beginPath(); ctx.moveTo(ox, pos); ctx.lineTo(ox + scaledW, pos); ctx.stroke();
      }
    }

    // 部位轮廓（使用原始 UV 坐标 × zoom 定位）
    if (this.showOutlines && this.zoom >= 2) {
      const drawn = new Set();
      for (const part of BODY_PARTS) {
        for (const face of FACE_ORDER) {
          const r = UV_INNER[part].faces[face]; if (!r) continue;
          const k = `${r.x},${r.y}`; if (drawn.has(k)) continue; drawn.add(k);
          ctx.strokeStyle = 'rgba(220,38,38,0.25)'; ctx.lineWidth = 1;
          ctx.strokeRect(ox + r.x * this.zoom, oy + r.y * this.zoom, r.w * this.zoom, r.h * this.zoom);
          if (this.zoom >= 6) {
            ctx.fillStyle = 'rgba(220,38,38,0.5)';
            ctx.font = `${Math.max(8, this.zoom * 1.6)}px system-ui`;
            ctx.fillText(part, ox + r.x * this.zoom + 2, oy + r.y * this.zoom + this.zoom * 1.6 + 2);
          }
        }
      }
    }

    // 外层区域高亮
    if (opts.highlightOuter) {
      ctx.fillStyle = 'rgba(212,168,67,0.08)';
      const outerDrawn = new Set();
      for (const part of BODY_PARTS) {
        for (const face of FACE_ORDER) {
          const r = UV_OUTER[part].faces[face]; if (!r) continue;
          const k = `${r.x},${r.y}`; if (outerDrawn.has(k)) continue; outerDrawn.add(k);
          ctx.fillRect(ox + r.x * this.zoom, oy + r.y * this.zoom, r.w * this.zoom, r.h * this.zoom);
        }
      }
    }

    // 当前编辑图层提示
    if (opts.editOuter) {
      ctx.fillStyle = 'rgba(212,168,67,0.15)';
      ctx.strokeStyle = 'rgba(212,168,67,0.5)'; ctx.lineWidth = 2;
      const outerDrawn = new Set();
      for (const part of BODY_PARTS) {
        for (const face of FACE_ORDER) {
          const r = UV_OUTER[part].faces[face]; if (!r) continue;
          const k = `${r.x},${r.y}`; if (outerDrawn.has(k)) continue; outerDrawn.add(k);
          ctx.strokeRect(ox + r.x * this.zoom + 1, oy + r.y * this.zoom + 1, r.w * this.zoom - 2, r.h * this.zoom - 2);
        }
      }
    }

    // 隐藏部位遮罩
    if (opts.hiddenParts) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      const maskDrawn = new Set();
      for (const [partId, visible] of Object.entries(opts.hiddenParts)) {
        if (visible) continue;
        const uv = UV_INNER[partId]; if (!uv) continue;
        for (const face of FACE_ORDER) {
          const r = uv.faces[face]; if (!r) continue;
          const k = `${r.x},${r.y}`; if (maskDrawn.has(k)) continue; maskDrawn.add(k);
          ctx.fillRect(ox + r.x * this.zoom, oy + r.y * this.zoom, r.w * this.zoom, r.h * this.zoom);
        }
      }
    }

    // 身体部位高亮覆盖层（半透明彩色区分各部位）
    if (opts.bodyPartHighlight) {
      const overlay = generateBodyPartOverlay(sw);
      ctx.globalAlpha = 1.0;
      ctx.drawImage(overlay.canvas, ox, oy, scaledW, scaledH);
    }
  }

  /**
   * Canvas CSS 坐标 → 纹理像素坐标（DPI 修正）
   */
  canvasToPixel(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / rect.width;
    const sy = this.canvas.height / rect.height;
    const cx = (clientX - rect.left) * sx;
    const cy = (clientY - rect.top) * sy;

    const sw = this._skinWidth;
    const sh = this._skinHeight;
    const scaledW = sw * this.zoom;
    const scaledH = sh * this.zoom;
    const ox = (this.canvas.width - scaledW) / 2 + this.panX;
    const oy = (this.canvas.height - scaledH) / 2 + this.panY;

    const px = Math.floor((cx - ox) / this.zoom);
    const py = Math.floor((cy - oy) / this.zoom);
    if (px < 0 || px >= sw || py < 0 || py >= sh) return null;
    return { x: px, y: py };
  }

  destroy() {}
}
