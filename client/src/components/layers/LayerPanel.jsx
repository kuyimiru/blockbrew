import React from 'react';
import { useSkinStore } from '../../store/useSkinStore.js';
import { useEditorStore } from '../../store/useEditorStore.js';

export function LayerPanel() {
  const showOuter = useSkinStore(s => s.showOuterLayer);
  const toggleOuter = useSkinStore(s => s.toggleOuterLayer);
  const editOuter = useEditorStore(s => s.editOuterLayer);
  const toggleEdit = useEditorStore(s => s.toggleEditLayer);
  const setEditOuter = useEditorStore(s => s.setEditOuterLayer);

  return (
    <div>
      {/* 编辑目标图层选择 */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          当前编辑图层
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setEditOuter(false)}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid',
              borderColor: !editOuter ? 'var(--accent-red)' : 'var(--border-color)',
              background: !editOuter ? 'rgba(220,38,38,0.12)' : 'transparent',
              color: !editOuter ? 'var(--accent-red)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.12s',
            }}>
            🧱 内层
          </button>
          <button
            onClick={() => setEditOuter(true)}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid',
              borderColor: editOuter ? 'var(--accent-red)' : 'var(--border-color)',
              background: editOuter ? 'rgba(220,38,38,0.12)' : 'transparent',
              color: editOuter ? 'var(--accent-red)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.12s',
            }}>
            🧥 外套层
          </button>
        </div>

        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
          {editOuter
            ? '外套层：帽子、外套、袖子、裤腿覆盖层区域'
            : '内层：头、身体、手臂、腿的底层纹理'}
        </div>
      </div>

      {/* 3D 外套层显示开关 */}
      <label className="toggle" onClick={toggleOuter}>
        <div className={`toggle-switch ${showOuter ? 'active' : ''}`} />
        <span style={{ fontSize: 12 }}>3D 外套层显示</span>
      </label>

      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
        💡 选「内层」编辑基础皮肤纹理区域，选「外套层」编辑覆盖层区域。<br />
        关闭 3D 外套层显示可隐藏模型上的外套网格。
      </div>
    </div>
  );
}
