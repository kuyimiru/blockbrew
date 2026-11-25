import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../common/Icon.jsx';
import { FileMenu } from '../file/FileMenu.jsx';
import { UserMenu } from '../auth/UserMenu.jsx';
import { useSkinStore } from '../../store/useSkinStore.js';
import { useUserStore } from '../../store/useUserStore.js';

export function Header() {
  const navigate = useNavigate();
  const modelType = useSkinStore(s => s.modelType);
  const setModelType = useSkinStore(s => s.setModelType);
  const isGuest = useUserStore(s => s.isGuest);
  const isAuth = useUserStore(s => s.isAuthenticated);

  return (
    <header className="app-header">
      <div className="header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <span className="logo-icon">🧊</span>
        <span>BlockBrew</span>
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* 试用模式徽章 */}
        {isGuest && (
          <span style={{
            background: '#D4A843', color: '#0B0B0B', padding: '2px 12px',
            borderRadius: 12, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
          }}>🎮 试用模式 · 128×128</span>
        )}

        <FileMenu />

        {/* 模型切换 */}
        <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <button className={`btn-sm ${modelType === 'steve' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setModelType('steve')} style={{ borderRadius: 0 }}>Steve</button>
          <button className={`btn-sm ${modelType === 'alex' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setModelType('alex')} style={{ borderRadius: 0 }}>Alex</button>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
