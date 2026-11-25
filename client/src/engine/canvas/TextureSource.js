/**
 * TextureSource.js — 共享纹理数据源（单例）
 *
 * 所有视图（3D skinview3d、2D Canvas）共用同一个离屏 Canvas，
 * 确保绘画操作即时反映到所有视图，无需通过 store 中转。
 * 支持动态调整纹理尺寸（64×64 / 128×128 / 256×256）。
 */
const DEFAULT_SIZE = 64;

class TextureSource {
  constructor() {
    /** @type {HTMLCanvasElement} */
    this.canvas = document.createElement('canvas');
    this.canvas.width = DEFAULT_SIZE;
    this.canvas.height = DEFAULT_SIZE;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this._size = DEFAULT_SIZE;
    this._initGrayCanvas();
  }

  /** 当前纹理宽度 */
  get width() { return this.canvas.width; }
  /** 当前纹理高度 */
  get height() { return this.canvas.height; }

  _initGrayCanvas() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.fillStyle = '#C8C8C8';
    ctx.fillRect(0, 0, w, h);

    // 浅色网格线（按 8px 间距适配当前尺寸）
    const gridSpacing = Math.max(8, Math.round(w / 8));
    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  /**
   * 调整纹理尺寸（会保留原有像素数据，缩放适配）
   * @param {number} width - 新宽度
   * @param {number} [height] - 新高度，默认等于宽度（正方形）
   */
  resize(width, height) {
    const h = height ?? width;
    if (this.canvas.width === width && this.canvas.height === h) return;

    // 保存旧数据
    const oldData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // 创建新 canvas
    const newCanvas = document.createElement('canvas');
    newCanvas.width = width;
    newCanvas.height = h;
    const newCtx = newCanvas.getContext('2d', { willReadFrequently: true });

    // 填充底色
    newCtx.fillStyle = '#C8C8C8';
    newCtx.fillRect(0, 0, width, h);

    // 将旧数据绘制到新 canvas（按比例缩放）
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(oldData, 0, 0);

    newCtx.imageSmoothingEnabled = false;
    newCtx.drawImage(tempCanvas, 0, 0, width, h);

    // 替换
    this.canvas = newCanvas;
    this.ctx = newCtx;
    this._size = Math.max(width, h);
  }

  /** 重置为灰白画布 */
  reset() {
    this._initGrayCanvas();
  }

  /** 获取 data URL（用于 skinview3d 的 loadSkin） */
  toDataURL() {
    return this.canvas.toDataURL('image/png');
  }

  /** 获取原始像素数据 */
  getImageData() {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  /** 写入像素数据 */
  putImageData(imageData) {
    this.ctx.putImageData(imageData, 0, 0);
  }

  /** 设置单个像素 */
  setPixel(x, y, r, g, b, a = 255) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    this.ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
    this.ctx.fillRect(x, y, 1, 1);
  }

  /** 获取单个像素的 hex 颜色 */
  getPixelHex(x, y) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (x < 0 || x >= w || y < 0 || y >= h) return '#000000';
    const [r, g, b] = this.ctx.getImageData(x, y, 1, 1).data;
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  /** 从 Uint8Array 同步到 Canvas（用于从 store 恢复数据） */
  syncFromRawData(rawData) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!rawData || rawData.length < w * h * 4) return;
    const imgData = new ImageData(new Uint8ClampedArray(rawData), w, h);
    this.ctx.putImageData(imgData, 0, 0);
  }

  /** 获取 Uint8Array 副本（用于同步到 store） */
  toRawData() {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    return new Uint8Array(imgData.data);
  }

  /** 获取 canvas 上下文（用于 SkinData.bindContext） */
  getContext() {
    return this.ctx;
  }
}

/** 全局单例 — 整个编辑器共享同一个纹理源 */
export const textureSource = new TextureSource();
