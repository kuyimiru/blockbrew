import React from 'react';
import { useSkinStore } from '../../store/useSkinStore.js';

const PARTS = [
  { id: 'head', label: '头部', icon: '🧠' },
  { id: 'body', label: '身体', icon: '👤' },
  { id: 'leftArm', label: '左臂', icon: '💪' },
  { id: 'rightArm', label: '右臂', icon: '💪' },
  { id: 'leftLeg', label: '左腿', icon: '🦵' },
  { id: 'rightLeg', label: '右腿', icon: '🦵' },
];

export function BodyPartToggles() {
  const visibility = useSkinStore(s => s.partVisibility);
  const togglePart = useSkinStore(s => s.togglePart);
  const showAll = useSkinStore(s => s.showAllParts);
  const hideAll = useSkinStore(s => s.hideAllParts);

  return (
    <div>
      {PARTS.map(p => (
        <div
          key={p.id}
          className={`layer-item ${visibility[p.id] ? '' : 'dimmed'}`}
          onClick={() => togglePart(p.id)}
          style={visibility[p.id] ? {} : { opacity: 0.4 }}
        >
          <span style={{ fontSize: 16 }}>{p.icon}</span>
          <span style={{ flex: 1, fontSize: 13 }}>{p.label}</span>
          <span style={{ fontSize: 14, color: visibility[p.id] ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
            {visibility[p.id] ? '👁' : '—'}
          </span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: 11 }} onClick={showAll}>全部显示</button>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: 11 }} onClick={hideAll}>全部隐藏</button>
      </div>
    </div>
  );
}
