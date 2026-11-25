import React from 'react';
import { useSkinStore } from '../../store/useSkinStore.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import { useUIStore } from '../../store/useUIStore.js';

export function StatusBar() {
  const stats = useSkinStore(s => s.getStats());
  const modelType = useSkinStore(s => s.modelType);
  const undoStack = useSkinStore(s => s.undoStack);
  const activeTool = useEditorStore(s => s.activeTool);
  const zoom2D = useUIStore(s => s.zoom2D);
  const skinName = useSkinStore(s => s.skinName);
  const isDirty = useSkinStore(s => s.isDirty);

  const toolNames = {
    pencil: '铅笔', brush: '笔刷', eraser: '橡皮',
    eyedropper: '取色器', fill: '油漆桶',
  };

  return (
    <footer className="app-statusbar">
      <span>👤 {modelType === 'steve' ? 'Steve' : 'Alex'}</span>
      <span>📐 64×64</span>
      <span>🎨 {stats.colorCount} 色</span>
      <span>📝 {stats.usedPixels}/{stats.totalPixels} 像素</span>
      <span>↩ 撤销 {undoStack.length}/30</span>
      <span>🔍 {zoom2D}x</span>
      <span>🛠 {toolNames[activeTool] || activeTool}</span>
      <span style={{ marginLeft: 'auto' }}>{skinName}{isDirty ? ' *' : ''}</span>
    </footer>
  );
}
