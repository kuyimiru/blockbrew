/**
 * useKeyboard.js - 键盘快捷键 Hook
 *
 * Ctrl+Z: 撤销
 * Ctrl+Y / Ctrl+Shift+Z: 重做
 * B: 铅笔
 * N: 笔刷
 * E: 橡皮擦
 * I: 取色器
 * G: 油漆桶
 * [ / ]: 调整笔刷大小
 */

import { useEffect } from 'react';
import { useSkinStore } from '../store/useSkinStore.js';
import { useEditorStore } from '../store/useEditorStore.js';

export function useKeyboard() {
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl+Z: 撤销
      if (ctrl && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useSkinStore.getState().undo();
        return;
      }

      // Ctrl+Y / Ctrl+Shift+Z: 重做
      if ((ctrl && key === 'y') || (ctrl && key === 'z' && e.shiftKey)) {
        e.preventDefault();
        useSkinStore.getState().redo();
        return;
      }

      // 工具快捷键（不在输入框中时生效）
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (key) {
        case 'b': useEditorStore.getState().setActiveTool('pencil'); break;
        case 'n': useEditorStore.getState().setActiveTool('brush'); break;
        case 'e': useEditorStore.getState().setActiveTool('eraser'); break;
        case 'i': useEditorStore.getState().setActiveTool('eyedropper'); break;
        case 'g': useEditorStore.getState().setActiveTool('fill'); break;
        case '[':
          e.preventDefault();
          useEditorStore.getState().setBrushSize(Math.max(1, useEditorStore.getState().brushSize - 1));
          break;
        case ']':
          e.preventDefault();
          useEditorStore.getState().setBrushSize(Math.min(5, useEditorStore.getState().brushSize + 1));
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
