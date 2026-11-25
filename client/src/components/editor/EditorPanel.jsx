import React, { useCallback } from 'react';
import { SkinViewerIframe } from './SkinViewerIframe.jsx';
import { SkinViewerMinimal } from './SkinViewerMinimal.jsx';
import { TwoDViewport } from './TwoDViewport.jsx';
import { useSkinStore } from '../../store/useSkinStore.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import { useUserStore } from '../../store/useUserStore.js';
import { useUIStore } from '../../store/useUIStore.js';

/**
 * EditorPanel — 主编辑器布局
 *
 * 3D 模式布局：
 * ┌──────────────────────────┬────────────┐
 * │  3D 绘画视口 (可交互)      │  2D 预览   │
 * │  [═══ 滑动切换 ═══]      │  (小尺寸)   │
 * └──────────────────────────┴────────────┘
 *
 * 2D 模式布局：
 * ┌────────┬──────────────────┬────────────┐
 * │ 2D 总览 │  工作区 (可缩放)   │  3D 预览   │
 * │ (小)   │  Alt+拖拽平移     │  (小尺寸)   │
 * └────────┴──────────────────┴────────────┘
 */
export function EditorPanel() {
  const mainView = useEditorStore(s => s.mainView);
  const setMainView = useEditorStore(s => s.setMainView);
  const textureSize = useSkinStore(s => s.textureSize);
  const setTextureSize = useSkinStore(s => s.setTextureSize);
  const isAuth = useUserStore(s => s.isAuthenticated);
  const addToast = useUIStore(s => s.addToast);

  const handleSizeChange = useCallback((size) => {
    if (size === 256 && !isAuth) {
      addToast('256×256 画布需要登录后才能使用，请先登录', 'warning'); return;
    }
    setTextureSize(size);
    addToast(`画布尺寸: ${size}×${size}`, 'info', 1200);
  }, [isAuth, setTextureSize, addToast]);

  const is3D = mainView === '3d';

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 2, background: 'var(--border-color)' }}>

      {/* ═══ 2D 模式专属：左侧总览面板 ═══ */}
      {!is3D && (
        <div style={{
          width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)',
        }}>
          <div style={{
            padding: '4px 8px', fontSize: 10, color: 'var(--text-secondary)',
            borderBottom: '1px solid var(--border-color)', textAlign: 'center',
            background: 'var(--bg-panel)',
          }}>
            2D 纹理总览
          </div>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', opacity: 0.9 }}>
            <TwoDViewport compact />
          </div>
          <div style={{
            padding: '2px 6px', fontSize: 8, color: 'rgba(255,255,255,0.15)',
            textAlign: 'center', background: 'var(--bg-panel)',
            borderTop: '1px solid var(--border-color)',
          }}>
            部位高亮：工具栏→显示选项
          </div>
        </div>
      )}

      {/* ═══ 主工作区 ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>
        {/* 顶部控制栏 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '5px 12px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
          flexShrink: 0, zIndex: 10,
        }}>
          {/* 3D/2D 滑动切换 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-panel)', borderRadius: 20, padding: 3,
            border: '1px solid var(--border-color)',
          }}>
            <button
              onClick={() => setMainView('3d')}
              style={{
                padding: '4px 16px', borderRadius: 17, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: is3D ? 'var(--accent-red)' : 'transparent',
                color: is3D ? '#fff' : 'var(--text-secondary)',
              }}>🧊 3D 模型</button>
            <button
              onClick={() => setMainView('2d')}
              style={{
                padding: '4px 16px', borderRadius: 17, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: !is3D ? 'var(--accent-red)' : 'transparent',
                color: !is3D ? '#fff' : 'var(--text-secondary)',
              }}>📐 2D 展开图</button>
          </div>

          {/* 画布尺寸 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>画布:</span>
            {[64, 128, 256].map(s => (
              <button key={s} className={`btn-sm ${textureSize === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 10, padding: '2px 7px', opacity: s === 256 && !isAuth ? 0.5 : 1 }}
                onClick={() => handleSizeChange(s)}>
                {s}{s === 256 ? (isAuth ? '👑' : '🔒') : ''}
              </button>
            ))}
          </div>
        </div>

        {/* 主视图 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {is3D ? <SkinViewerMinimal /> : <TwoDViewport fullSize />}
        </div>
      </div>

      {/* ═══ 右侧预览面板 ═══ */}
      <div style={{
        width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)',
      }}>
        <div style={{
          padding: '4px 8px', fontSize: 10, color: 'var(--text-secondary)',
          borderBottom: '1px solid var(--border-color)', textAlign: 'center',
          background: 'var(--bg-panel)',
        }}>
          {is3D ? '📐 2D 纹理预览' : '🧊 3D 模型预览'}
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', opacity: 0.9 }}>
          {is3D ? <TwoDViewport compact /> : <SkinViewerMinimal compact />}
        </div>
      </div>
    </div>
  );
}
