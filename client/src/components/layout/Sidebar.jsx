import React from 'react';
import { ToolBar } from '../toolbar/ToolBar.jsx';
import { ColorPanel } from '../color/ColorPanel.jsx';
import { LayerPanel } from '../layers/LayerPanel.jsx';
import { AdjustmentPanel } from '../adjustments/AdjustmentPanel.jsx';
import { BodyPartToggles } from '../layers/BodyPartToggles.jsx';
import { useUIStore } from '../../store/useUIStore.js';

export function Sidebar() {
  const showColor = useUIStore(s => s.showColorPanel);
  const showLayer = useUIStore(s => s.showLayerPanel);
  const showAdj = useUIStore(s => s.showAdjustmentPanel);
  const toggleColor = useUIStore(s => s.toggleColorPanel);
  const toggleLayer = useUIStore(s => s.toggleLayerPanel);
  const toggleAdj = useUIStore(s => s.toggleAdjustmentPanel);

  return (
    <aside className="app-sidebar">
      <ToolBar />

      <div className="panel">
        <div className="panel-header" onClick={toggleColor}>颜色面板 {showColor ? '▼' : '▶'}</div>
        {showColor && <div className="panel-content"><ColorPanel /></div>}
      </div>

      <div className="panel">
        <div className="panel-header" onClick={toggleLayer}>图层 {showLayer ? '▼' : '▶'}</div>
        {showLayer && <div className="panel-content"><LayerPanel /></div>}
      </div>

      <div className="panel">
        <div className="panel-header">👤 部位控制</div>
        <div className="panel-content"><BodyPartToggles /></div>
      </div>

      <div className="panel">
        <div className="panel-header" onClick={toggleAdj}>图像调整 {showAdj ? '▼' : '▶'}</div>
        {showAdj && <div className="panel-content"><AdjustmentPanel /></div>}
      </div>
    </aside>
  );
}
