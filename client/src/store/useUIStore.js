/**
 * useUIStore.js - UI 状态管理（Zustand）
 *
 * 管理面板开关、弹窗、缩放级别、Toast 通知等 UI 状态。
 */

import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // 面板状态
  showColorPanel: true,
  showLayerPanel: true,
  showAdjustmentPanel: false,

  // 弹窗
  modal: null,              // 'login' | 'register' | 'export' | 'reset' | null
  modalData: null,

  // Toast 通知
  toasts: [],

  // 2D 视图缩放
  zoom2D: 4,               // 2D 视图缩放倍数（默认 4x，即 256x256 显示）
  pan2D: { x: 0, y: 0 },   // 2D 视图平移

  // 2D 视图显示选项
  showGrid: true,           // 显示像素网格

  // 语言
  language: 'zh-CN',

  /**
   * 切换面板
   */
  toggleColorPanel: () => set(s => ({ showColorPanel: !s.showColorPanel })),
  toggleLayerPanel: () => set(s => ({ showLayerPanel: !s.showLayerPanel })),
  toggleAdjustmentPanel: () => set(s => ({ showAdjustmentPanel: !s.showAdjustmentPanel })),

  /**
   * 打开弹窗
   */
  openModal: (modal, data) => set({ modal, modalData: data || null }),
  closeModal: () => set({ modal: null, modalData: null }),

  /**
   * Toast 通知
   */
  addToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    set(s => ({ toasts: [...s.toasts, { id, message, type, duration }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  /**
   * 设置 2D 视图缩放
   */
  setZoom2D: (zoom) => set({ zoom2D: Math.max(1, Math.min(32, zoom)) }),
  zoomIn2D: () => set(s => ({ zoom2D: Math.min(32, s.zoom2D + 1) })),
  zoomOut2D: () => set(s => ({ zoom2D: Math.max(1, s.zoom2D - 1) })),

  /**
   * 2D 视图平移
   */
  setPan2D: (pan) => set({ pan2D: pan }),
  resetPan2D: () => set({ pan2D: { x: 0, y: 0 } }),

  /**
   * 切换像素网格显示
   */
  toggleGrid: () => set(s => ({ showGrid: !s.showGrid })),

  /**
   * 设置语言
   */
  setLanguage: (lang) => set({ language: lang }),
}));
