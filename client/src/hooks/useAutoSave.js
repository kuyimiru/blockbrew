/**
 * useAutoSave.js — 自动保存到 localStorage（每 10 秒）
 */
import { useEffect } from 'react';
import { useSkinStore } from '../store/useSkinStore.js';
import { useEditorStore } from '../store/useEditorStore.js';
import { useUIStore } from '../store/useUIStore.js';

const KEY = 'blockbrew_autosave';
const INTERVAL = 10000;

export function useAutoSave() {
  const loadedRef = useEffect(() => { loadedRef.current = true; }, []) || { current: false };

  // 首次加载恢复
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (!data.raw || data.ts < Date.now() - 7 * 86400000) return;

      const bytes = Uint8Array.from(atob(data.raw), c => c.charCodeAt(0));
      if (bytes.length !== 16384) return;

      useSkinStore.getState().skinData.restore(bytes);
      if (data.modelType) useSkinStore.getState().setModelType(data.modelType);
      useUIStore.getState().addToast('已恢复上次编辑进度', 'info', 2000);
    } catch { /* ignore */ }
  }, []);

  // 定期保存
  useEffect(() => {
    const timer = setInterval(() => {
      const state = useSkinStore.getState();
      if (!state.isDirty) return;
      try {
        const raw = btoa(String.fromCharCode(...state.skinData.getRawData()));
        localStorage.setItem(KEY, JSON.stringify({
          raw, modelType: state.modelType,
          color: useEditorStore.getState().primaryColor,
          ts: Date.now(),
        }));
      } catch { /* storage full */ }
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);
}
