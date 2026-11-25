import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore.js';

export function UserMenu() {
  const [show, setShow] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const isAuth = useUserStore(s => s.isAuthenticated);
  const isGuest = useUserStore(s => s.isGuest);
  const user = useUserStore(s => s.user);
  const logout = useUserStore(s => s.logout);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => {
    logout();
    setShow(false);
    navigate('/');
  };

  // 未登录且非试用 → 显示登录/注册按钮
  if (!isAuth && !isGuest) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>登录</button>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>注册</button>
      </div>
    );
  }

  // 试用模式 → 显示访客信息
  if (isGuest) {
    return (
      <div className="user-menu" ref={menuRef}>
        <button className="user-menu-btn" onClick={() => setShow(!show)}>
          <div className="user-avatar" style={{ background: '#D4A843' }}>🎮</div>
          <span style={{ fontSize: 13 }}>试用访客</span>
        </button>
        {show && (
          <div className="user-dropdown">
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>🎮 试用模式</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>128×128 · 不可导出</div>
            </div>
            <button className="user-dropdown-item" onClick={() => { navigate('/'); setShow(false); }}>
              🔑 登录/注册
            </button>
            <div className="user-dropdown-divider" />
            <button className="user-dropdown-item" onClick={handleLogout}>🚪 退出</button>
          </div>
        )}
      </div>
    );
  }

  // 已登录
  const initial = user?.username?.[0]?.toUpperCase() || '?';
  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-menu-btn" onClick={() => setShow(!show)}>
        <div className="user-avatar">{initial}</div>
        <span style={{ fontSize: 13 }}>{user?.username}</span>
      </button>
      {show && (
        <div className="user-dropdown">
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.username}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{user?.email}</div>
          </div>
          <button className="user-dropdown-item" onClick={() => { navigate('/my-skins'); setShow(false); }}>📁 我的作品</button>
          <div className="user-dropdown-divider" />
          <button className="user-dropdown-item" onClick={handleLogout}>🚪 退出登录</button>
        </div>
      )}
    </div>
  );
}
