import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore.js';
import { useSkinStore } from '../../store/useSkinStore.js';
import { PixelAvatar } from '../auth/PixelAvatar.jsx';

/**
 * WelcomePage — 登录/注册/试用入口
 *
 * 页面加载时自动检查 token 有效性。
 * 如果已有有效 token，直接跳转编辑器。
 */
export function WelcomePage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  const navigate = useNavigate();
  const login = useUserStore(s => s.login);
  const register = useUserStore(s => s.register);
  const enterGuest = useUserStore(s => s.enterGuest);
  const isAuth = useUserStore(s => s.isAuthenticated);
  const isGuest = useUserStore(s => s.isGuest);
  const loading = useUserStore(s => s.loading);

  // 页面加载时检查已有 token
  useEffect(() => {
    const token = localStorage.getItem('blockbrew_token');
    if (token) {
      // 尝试验证 token
      fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.user) {
            useUserStore.setState({
              token, user: data.user, isAuthenticated: true, isGuest: false,
            });
            navigate('/editor');
          } else {
            localStorage.removeItem('blockbrew_token');
            setChecking(false);
          }
        })
        .catch(() => { localStorage.removeItem('blockbrew_token'); setChecking(false); });
    } else {
      setChecking(false);
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (success) {
      navigate('/editor');
    } else {
      setError(useUserStore.getState().error || '登录失败，请检查用户名和密码');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !email.trim() || !password) {
      setError('请填写所有字段'); return;
    }
    if (password !== confirmPw) {
      setError('两次密码输入不一致'); return;
    }
    if (password.length < 6) {
      setError('密码长度不能少于6位'); return;
    }
    const success = await register(username, email, password);
    if (success) {
      useSkinStore.getState().newSkin('steve');
      navigate('/editor');
    } else {
      setError(useUserStore.getState().error || '注册失败');
    }
  };

  const handleGuest = () => {
    enterGuest();
    useSkinStore.getState().newSkin('steve');
    useSkinStore.getState().setTextureSize(128);
    navigate('/editor');
  };

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0B0B0B', color: '#F1F1F1', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⛏️</div>
        <div style={{ fontSize: 18 }}>验证登录状态...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0B0B0B',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', padding: 20,
    }}>
      <div style={{
        maxWidth: 520, width: '100%', padding: '36px 32px',
        background: '#161616', borderRadius: 16,
        border: '1px solid #2C2C2C',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F1F1F1' }}>
            ⛏️ BlockBrew
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
            3D/2D 立体 Minecraft 皮肤编辑器
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            用像素创造你的世界
          </div>
        </div>

        {/* 像素头像展示 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 28 }}>
          <PixelAvatar type="steve" />
          <PixelAvatar type="alex" />
          <PixelAvatar type="magic" />
          <PixelAvatar type="dark" />
        </div>

        {/* ── 登录表单 ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: '#F1F1F1', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                用户名 / 邮箱
              </label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="输入用户名或邮箱" required
                style={inputStyle} />
            </div>
            <div style={{ marginBottom: 6 }}>
              <label style={{ display: 'block', color: '#F1F1F1', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                密码
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="输入密码" required
                style={inputStyle} />
            </div>

            {error && (
              <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4, marginBottom: 4, padding: '6px 10px', background: 'rgba(220,38,38,0.1)', borderRadius: 4 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: 12, background: '#DC2626', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: 16,
                transition: 'background 0.2s', opacity: loading ? 0.6 : 1,
              }}>
              {loading ? '登录中...' : '登录'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13 }}>
              <span style={{ color: '#9CA3AF' }}>
                还没有账号？{' '}
                <span onClick={() => { setMode('register'); setError(''); }}
                  style={{ color: '#DC2626', cursor: 'pointer', fontWeight: 500 }}>注册</span>
              </span>
            </div>
          </form>
        )}

        {/* ── 注册表单 ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>用户名</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="选择一个用户名" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>邮箱</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="输入邮箱地址" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>密码 (至少6位)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="输入密码" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 6 }}>
              <label style={labelStyle}>确认密码</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="再次输入密码" required style={inputStyle} />
            </div>

            {error && (
              <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4, padding: '6px 10px', background: 'rgba(220,38,38,0.1)', borderRadius: 4 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: 12, background: '#DC2626', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: 14,
                transition: 'background 0.2s', opacity: loading ? 0.6 : 1,
              }}>
              {loading ? '注册中...' : '注册'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13 }}>
              <span style={{ color: '#9CA3AF' }}>
                已有账号？{' '}
                <span onClick={() => { setMode('login'); setError(''); }}
                  style={{ color: '#DC2626', cursor: 'pointer', fontWeight: 500 }}>去登录</span>
              </span>
            </div>
          </form>
        )}

        {/* 分割线 + 试用 */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#2C2C2C' }} />
          <span style={{ padding: '0 16px', color: '#6B7280', fontSize: 13 }}>或</span>
          <div style={{ flex: 1, height: 1, background: '#2C2C2C' }} />
        </div>

        <button onClick={handleGuest}
          style={{
            width: '100%', padding: 12, background: 'transparent',
            border: '1px solid #D4A843', borderRadius: 6,
            color: '#D4A843', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(212,168,67,0.1)'; }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; }}>
          🎮 试用体验
        </button>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
          试用模式限制 128×128 画布，不可导出作品<br />
          <span style={{ color: '#D4A843' }}>登录后解锁 256×256 高清画布和导出功能</span>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 14px', background: '#0B0B0B',
  border: '1px solid #2C2C2C', borderRadius: 6, color: '#F1F1F1',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  display: 'block', color: '#F1F1F1', fontSize: 13, marginBottom: 4, fontWeight: 500,
};
