/**
 * useEditorStore.js - 编辑器工具状态管理（Zustand）
 *
 * 管理当前选中的工具、笔刷大小、颜色、对称模式等编辑器 UI 状态。
 */

import { create } from 'zustand';

export const useEditorStore = create((set, get) => ({
  // 当前工具: 'pencil' | 'brush' | 'eraser' | 'eyedropper' | 'fill'
  activeTool: 'pencil',

  // 笔刷大小: 1, 2, 3, 5
  brushSize: 1,

  // 颜色
  primaryColor: '#DC2626',     // 当前主颜色（品牌红默认）
  secondaryColor: '#FFFFFF',   // 上一个颜色

  // 对称模式: 'none' | 'horizontal' | 'vertical' | 'both'
  symmetryMode: 'none',

  // 编辑目标图层: false=内层, true=外层
  editOuterLayer: false,

  // 主视图模式: '3d' | '2d'
  mainView: '3d',

  // HSV 值（用于颜色面板）
  hsv: { h: 0, s: 100, v: 87 },

  // 图像调整
  adjustments: {
    hue: 0,           // -180 ~ 180
    saturation: 100,  // 0 ~ 200
    brightness: 100,  // 0 ~ 200
    temperature: 0,   // -100 ~ 100
    opacity: 100,     // 0 ~ 100 (仅影响当前图层)
  },

  // 调整预览（是否正在预览调整效果）
  adjustmentPreview: false,
  adjustmentSnapshot: null,  // 调整前的数据快照

  /**
   * 设置活动工具
   */
  setActiveTool: (tool) => set({ activeTool: tool }),

  /**
   * 设置笔刷大小
   */
  setBrushSize: (size) => set({ brushSize: size }),

  /**
   * 设置主颜色
   */
  setPrimaryColor: (color) => set(s => ({
    primaryColor: color,
    secondaryColor: s.primaryColor,
  })),

  /**
   * 切换主次颜色
   */
  swapColors: () => set(s => ({
    primaryColor: s.secondaryColor,
    secondaryColor: s.primaryColor,
  })),

  /** 取色器最后拾取的颜色信息 */
  eyedropperInfo: null,  // { hex: string, x: number, y: number, source: '2d'|'3d' } | null
  setEyedropperInfo: (info) => set({ eyedropperInfo: info }),

  /** 身体部位高亮覆盖层开关 */
  showBodyPartHighlight: false,
  toggleBodyPartHighlight: () => set(s => ({ showBodyPartHighlight: !s.showBodyPartHighlight })),

  /**
   * 设置对称模式
   */
  setSymmetryMode: (mode) => set({ symmetryMode: mode }),
  setEditOuterLayer: (v) => set({ editOuterLayer: v }),
  toggleEditLayer: () => set(s => ({ editOuterLayer: !s.editOuterLayer })),
  setMainView: (v) => set({ mainView: v }),

  /**
   * 设置 HSV
   */
  setHSV: (hsv) => set({ hsv }),

  /**
   * 设置调整值
   */
  setAdjustment: (key, value) => set(s => ({
    adjustments: { ...s.adjustments, [key]: value },
  })),

  /**
   * 重置所有调整值
   */
  resetAdjustments: () => set({
    adjustments: {
      hue: 0,
      saturation: 100,
      brightness: 100,
      temperature: 0,
      opacity: 100,
    },
    adjustmentPreview: false,
    adjustmentSnapshot: null,
  }),

  /**
   * 开始调整预览
   */
  startAdjustmentPreview: (snapshot) => set({
    adjustmentPreview: true,
    adjustmentSnapshot: snapshot,
  }),

  /**
   * 取消调整预览
   */
  cancelAdjustmentPreview: () => set({
    adjustmentPreview: false,
    adjustmentSnapshot: null,
  }),
}));
