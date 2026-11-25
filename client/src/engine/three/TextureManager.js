/**
 * TextureManager.js — Three.js 纹理管理器
 *
 * 拥有主 Canvas (64×64)，作为整个应用的唯一纹理数据源。
 * SkinData 通过 bindContext() 绑定到此 Canvas，所有像素修改直接写入。
 */
import * as THREE from 'three';

const SZ = 64;

export class TextureManager {
  constructor() {
    // 主 Canvas — 唯一数据源
    this.canvas = document.createElement('canvas');
    this.canvas.width = SZ;
    this.canvas.height = SZ;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // 初始填充肤色
    this.ctx.fillStyle = '#E0B894';
    this.ctx.fillRect(0, 0, SZ, SZ);

    // Three.js CanvasTexture
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.flipY = true; // 默认值, Three.js 自动翻转 Canvas 使 V 轴对齐 OpenGL
    this.texture.needsUpdate = true;
  }

  /** 将 SkinData 绑定到此 Canvas — 之后所有像素操作直接反映到纹理 */
  bindSkinData(skinData) {
    if (skinData && skinData.bindContext) {
      skinData.bindContext(this.ctx);
      skinData.syncToCanvas();
      this.texture.needsUpdate = true;
    }
  }

  /** 标记纹理需要 GPU 更新（在批量操作后调用） */
  markDirty() {
    this.texture.needsUpdate = true;
  }

  getTexture() { return this.texture; }
  getCanvas() { return this.canvas; }
  getContext() { return this.ctx; }

  dispose() { this.texture.dispose(); }
}
