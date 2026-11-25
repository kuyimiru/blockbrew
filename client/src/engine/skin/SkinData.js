/**
 * SkinData.js — 皮肤像素数据（单一数据源架构）
 *
 * 直接操作 TextureManager 的主 Canvas 的 ImageData。
 * 不存在独立副本 — 修改即反映到 3D 纹理和 2D 画布。
 */
const SZ = 64, TOTAL = SZ * SZ * 4;

export class SkinData {
  /**
   * @param {Uint8Array} [data] — 初始 RGBA 数据
   * @param {CanvasRenderingContext2D} [ctx] — 主 Canvas 上下文（由 TextureManager 提供）
   */
  constructor(data, ctx) {
    this._ctx = ctx || null;
    if (data && data.length === TOTAL) {
      this.data = new Uint8Array(data);
    } else {
      this.data = SkinData.createTemplateSkin();
    }
  }

  /** 绑定到主 Canvas 上下文（由 TextureManager 调用） */
  bindContext(ctx) { this._ctx = ctx; }

  static createTemplateSkin() {
    const d = new Uint8Array(TOTAL);
    for (let i = 0; i < TOTAL; i += 4) { d[i]=255; d[i+1]=255; d[i+2]=255; d[i+3]=255; }
    // 填充可见特征
    const fill = (x, y, w, h, r, g, b) => {
      for (let row = y; row < y + h && row < SZ; row++)
        for (let col = x; col < x + w && col < SZ; col++) {
          const i = (row * SZ + col) * 4;
          d[i] = r; d[i+1] = g; d[i+2] = b; d[i+3] = 255;
        }
    };
    fill(0, 0, 32, 16, 0xE0, 0xB8, 0x94);     // 头部-肤色
    fill(8, 8, 2, 2, 0x3B, 0x5C, 0x8C);        // 左眼
    fill(14, 8, 2, 2, 0x3B, 0x5C, 0x8C);       // 右眼
    fill(9, 12, 6, 1, 0x8B, 0x5A, 0x3C);       // 嘴
    fill(16, 16, 16, 16, 0x16, 0x9C, 0x9C);    // 身体-青色
    fill(20, 20, 8, 12, 0x16, 0x9C, 0x9C);
    fill(40, 16, 16, 16, 0x16, 0x9C, 0x9C);    // 右臂
    fill(44, 20, 4, 12, 0x16, 0x9C, 0x9C);
    fill(0, 16, 16, 16, 0x3C, 0x44, 0xAA);     // 右腿-蓝色
    fill(4, 20, 4, 12, 0x3C, 0x44, 0xAA);
    fill(32, 48, 16, 16, 0x16, 0x9C, 0x9C);    // 左臂
    fill(36, 52, 4, 12, 0x16, 0x9C, 0x9C);
    fill(16, 48, 16, 16, 0x3C, 0x44, 0xAA);    // 左腿
    fill(20, 52, 4, 12, 0x3C, 0x44, 0xAA);
    // 帽子层（红色半透明）
    for (let row = 0; row < 16; row++)
      for (let col = 32; col < 64; col++) {
        const i = (row * SZ + col) * 4;
        d[i] = 0xDC; d[i+1] = 0x26; d[i+2] = 0x26; d[i+3] = 128;
      }
    return d;
  }

  getPixel(x, y) {
    if (x < 0 || x >= SZ || y < 0 || y >= SZ) return [0,0,0,0];
    const i = (y * SZ + x) * 4;
    return [this.data[i], this.data[i+1], this.data[i+2], this.data[i+3]];
  }
  getPixelHex(x, y) {
    const [r,g,b] = this.getPixel(x, y);
    return '#' + [r,g,b].map(c => c.toString(16).padStart(2,'0')).join('');
  }

  /**
   * 设置像素 — 同时更新主 Canvas（如果已绑定）
   */
  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= SZ || y < 0 || y >= SZ) return;
    const i = (y * SZ + x) * 4;
    this.data[i] = r; this.data[i+1] = g; this.data[i+2] = b; this.data[i+3] = a;

    // 直接写入主 Canvas — 实现即时同步
    if (this._ctx) {
      this._ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
      this._ctx.fillRect(x, y, 1, 1);
    }
  }

  setPixelHex(x, y, hex, alpha = 255) {
    const h = hex.replace('#','');
    this.setPixel(x, y, parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16), alpha);
  }

  /** 批量同步到主 Canvas（在撤销/重做等大操作后调用） */
  syncToCanvas() {
    if (!this._ctx) return;
    const img = new ImageData(new Uint8ClampedArray(this.data), SZ, SZ);
    this._ctx.putImageData(img, 0, 0);
  }

  getRawData() { return this.data; }
  clone() { return new SkinData(new Uint8Array(this.data), this._ctx); }
  snapshot() { return new Uint8Array(this.data); }
  restore(snap) {
    if (snap?.length === TOTAL) {
      this.data = new Uint8Array(snap);
      this.syncToCanvas();
    }
  }

  floodFill(sx, sy, fillHex) {
    const th = this.getPixelHex(sx, sy); if (fillHex === th) return 0;
    const h = fillHex.replace('#','');
    const fr = parseInt(h.substring(0,2),16), fg = parseInt(h.substring(2,4),16), fb = parseInt(h.substring(4,6),16);
    const vis = new Uint8Array(SZ*SZ), q = [sy*SZ+sx]; vis[sy*SZ+sx] = 1; let n = 0;
    while (q.length) {
      const idx = q.shift(), x = idx % SZ, y = Math.floor(idx / SZ);
      this.setPixel(x, y, fr, fg, fb, 255); n++;
      for (const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
        if (nx<0||nx>=SZ||ny<0||ny>=SZ) continue;
        const ni = ny*SZ+nx; if (vis[ni]) continue;
        if (this.getPixelHex(nx, ny) !== th) continue;
        vis[ni] = 1; q.push(ni);
      }
    }
    return n;
  }

  clear() { for (let i=0;i<TOTAL;i+=4){this.data[i]=255;this.data[i+1]=255;this.data[i+2]=255;this.data[i+3]=255;} this.syncToCanvas(); }
  getStats() {
    const cs = new Set(); let u = 0;
    for (let i=0;i<TOTAL;i+=4){if(this.data[i+3]>0){u++;cs.add(`${this.data[i]},${this.data[i+1]},${this.data[i+2]}`);}}
    return { totalPixels: SZ*SZ, usedPixels: u, colorCount: cs.size };
  }
  toImageData() { return new ImageData(new Uint8ClampedArray(this.data), SZ, SZ); }
  static get SKIN_SIZE() { return SZ; }
  static get TOTAL_BYTES() { return TOTAL; }
}
