/**
 * useSkinStore.js — 皮肤数据状态管理
 *
 * 新增：部位可见性控制、纹理尺寸切换
 */
import { create } from 'zustand';
import { SkinData } from '../engine/skin/SkinData.js';

const MAX_HISTORY = 30;

export const useSkinStore = create((set, get) => ({
  skinData: new SkinData(),
  modelType: 'steve',
  showOuterLayer: true,
  textureSize: 64,           // 64 | 128 | 256
  skinName: '未命名皮肤',
  skinId: null,
  isDirty: false,
  _textureVersion: 0,

  // 部位可见性 (全部默认可见)
  partVisibility: {
    head: true, body: true,
    rightArm: true, leftArm: true,
    rightLeg: true, leftLeg: true,
  },

  undoStack: [],
  redoStack: [],

  pushSnapshot: () => {
    const { skinData, undoStack, redoStack } = get();
    const u = [...undoStack, skinData.snapshot()];
    if (u.length > MAX_HISTORY) u.shift();
    set({ undoStack: u, redoStack: [], isDirty: true });
  },

  undo: () => {
    const { skinData, undoStack, redoStack } = get();
    if (!undoStack.length) return;
    const r = [...redoStack, skinData.snapshot()];
    if (r.length > MAX_HISTORY) r.shift();
    skinData.restore(undoStack[undoStack.length - 1]);
    set({ undoStack: undoStack.slice(0, -1), redoStack: r, isDirty: true, _textureVersion: get()._textureVersion + 1 });
  },

  redo: () => {
    const { skinData, undoStack, redoStack } = get();
    if (!redoStack.length) return;
    const u = [...undoStack, skinData.snapshot()];
    if (u.length > MAX_HISTORY) u.shift();
    skinData.restore(redoStack[redoStack.length - 1]);
    set({ undoStack: u, redoStack: redoStack.slice(0, -1), isDirty: true, _textureVersion: get()._textureVersion + 1 });
  },

  markChanged: () => set(s => ({ isDirty: true, _textureVersion: s._textureVersion + 1 })),

  setPixel: (x, y, r, g, b, a) => get().skinData.setPixel(x, y, r, g, b, a),
  setPixelBatch: (px) => { const d = get().skinData; for (const p of px) d.setPixel(p.x, p.y, p.r, p.g, p.b, p.a); },

  /** 切换部位可见性 */
  togglePart: (partId) => set(s => ({
    partVisibility: { ...s.partVisibility, [partId]: !s.partVisibility[partId] },
  })),
  showAllParts: () => set({
    partVisibility: { head: true, body: true, rightArm: true, leftArm: true, rightLeg: true, leftLeg: true },
  }),
  hideAllParts: () => set({
    partVisibility: { head: false, body: false, rightArm: false, leftArm: false, rightLeg: false, leftLeg: false },
  }),
  /** 检查某部位是否可绘制 */
  isPartVisible: (partId) => get().partVisibility[partId] !== false,

  /** 切换纹理尺寸 */
  setTextureSize: (size) => set({ textureSize: size }),

  setModelType: (t) => set({ modelType: t }),
  toggleOuterLayer: () => set(s => ({ showOuterLayer: !s.showOuterLayer })),

  loadSkin: (sd, name, id) => set({
    skinData: sd, skinName: name || '未命名皮肤', skinId: id || null,
    undoStack: [], redoStack: [], isDirty: false, _textureVersion: get()._textureVersion + 1,
  }),
  newSkin: (mt) => set({
    skinData: new SkinData(), modelType: mt || 'steve',
    skinName: '未命名皮肤', skinId: null, undoStack: [], redoStack: [], isDirty: false,
    _textureVersion: get()._textureVersion + 1,
  }),
  resetSkin: () => {
    get().pushSnapshot();
    set({ skinData: new SkinData(), undoStack: [], redoStack: [], isDirty: false, _textureVersion: get()._textureVersion + 1 });
  },
  markSaved: (id) => set({ isDirty: false, skinId: id || get().skinId }),
  getStats: () => get().skinData.getStats(),
}));
