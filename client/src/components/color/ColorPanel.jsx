import React from 'react';
import { useEditorStore } from '../../store/useEditorStore.js';
import { ColorWheel } from './ColorWheel.jsx';
import { ColorSwatches } from './ColorSwatches.jsx';

export function ColorPanel() {
  const eyedropperInfo = useEditorStore(s => s.eyedropperInfo);

  return (
    <div>
      <ColorWheel />
      <div style={{ marginTop: 8 }}>
        <ColorSwatches />
      </div>

      {/* 取色器信息：显示最后拾取的位置和颜色 */}
      {eyedropperInfo && (
        <div style={{
          marginTop: 8,
          padding: '6px 8px',
          background: 'var(--bg-panel)',
          borderRadius: 6,
          border: '1px solid var(--border-color)',
          fontSize: 11,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--text-secondary)',
          }}>
            <span>取色器</span>
            <span style={{
              display: 'inline-block',
              width: 14, height: 14,
              borderRadius: 3,
              background: eyedropperInfo.hex,
              border: '1px solid rgba(255,255,255,0.3)',
              flexShrink: 0,
            }} />
            <code style={{
              fontSize: 12, fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              {eyedropperInfo.hex.toUpperCase()}
            </code>
          </div>
          <div style={{
            marginTop: 3,
            color: 'var(--text-muted)',
            fontSize: 10,
            display: 'flex', gap: 12,
          }}>
            <span>坐标 ({eyedropperInfo.x}, {eyedropperInfo.y})</span>
            <span>{eyedropperInfo.source === '3d' ? '3D 模型' : '2D 纹理'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
