import React from 'react';
import { useEditorStore } from '../../store/useEditorStore.js';
import { Icon } from '../common/Icon.jsx';

/** 身体部位高亮切换按钮 */
function BodyPartHighlightToggle() {
  const showHighlight = useEditorStore(s => s.showBodyPartHighlight);
  const toggle = useEditorStore(s => s.toggleBodyPartHighlight);

  return (
    <button
      className={`tool-btn ${showHighlight ? 'active' : ''}`}
      onClick={toggle}
      style={{ width: '100%' }}
    >
      <span className="tool-icon"><Icon name="eyedropper" size={14} /></span>
      <span className="tool-label">部位高亮</span>
      <span style={{
        display: 'inline-block', width: 10, height: 10, borderRadius: 3,
        background: showHighlight
          ? 'conic-gradient(red, orange, yellow, green, blue, purple, red)'
          : 'var(--text-muted)',
        marginLeft: 'auto',
        flexShrink: 0,
      }} />
    </button>
  );
}

const TOOL_LIST = [
  { id: 'pencil', label: '铅笔', icon: 'pencil', shortcut: 'B' },
  { id: 'brush', label: '笔刷', icon: 'brush', shortcut: 'N' },
  { id: 'eraser', label: '橡皮擦', icon: 'eraser', shortcut: 'E' },
  { id: 'eyedropper', label: '取色器', icon: 'eyedropper', shortcut: 'I' },
  { id: 'fill', label: '油漆桶', icon: 'fill', shortcut: 'G' },
];

const BRUSH_SIZES = [1, 2, 3, 5];

export function ToolBar() {
  const activeTool = useEditorStore(s => s.activeTool);
  const setActiveTool = useEditorStore(s => s.setActiveTool);
  const brushSize = useEditorStore(s => s.brushSize);
  const setBrushSize = useEditorStore(s => s.setBrushSize);
  const symmetryMode = useEditorStore(s => s.symmetryMode);
  const setSymmetryMode = useEditorStore(s => s.setSymmetryMode);

  return (
    <div className="toolbar">
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        工具
      </div>
      {TOOL_LIST.map(tool => (
        <button
          key={tool.id}
          className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => setActiveTool(tool.id)}
        >
          <span className="tool-icon"><Icon name={tool.icon} size={16} /></span>
          <span className="tool-label">{tool.label}</span>
          <span className="tool-shortcut">{tool.shortcut}</span>
        </button>
      ))}

      {/* 笔刷大小选择器 */}
      {activeTool === 'brush' || activeTool === 'eraser' ? (
        <div style={{ padding: '8px 4px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
            笔刷大小
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {BRUSH_SIZES.map(size => (
              <button
                key={size}
                className={`btn-sm ${brushSize === size ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setBrushSize(size)}
                style={{ minWidth: 32 }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 身体部位高亮 */}
      <div style={{ padding: '8px 4px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
          显示选项
        </div>
        <BodyPartHighlightToggle />
      </div>

      {/* 对称模式 */}
      <div style={{ padding: '8px 4px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
          对称模式
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          {[
            { id: 'none', label: '关闭' },
            { id: 'horizontal', label: '水平' },
            { id: 'vertical', label: '垂直' },
            { id: 'both', label: '双轴' },
          ].map(mode => (
            <button
              key={mode.id}
              className={`btn-sm ${symmetryMode === mode.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSymmetryMode(mode.id)}
              style={{ fontSize: 11 }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
