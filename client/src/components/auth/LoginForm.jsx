import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore.js';
import { useUIStore } from '../../store/useUIStore.js';

export function LoginForm({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useUserStore(s => s.login);
  const loading = useUserStore(s => s.loading);
  const error = useUserStore(s => s.error);
  const navigate = useNavigate();
  const addToast = useUIStore(s => s.addToast);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      addToast('登录成功！', 'success');
      navigate('/');
    }
  };

  return (
    <div className="auth-card">
      <h1>登录 BlockBrew</h1>
      <p className="subtitle">欢迎回来，继续编辑你的 Minecraft 皮肤</p>

      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>邮箱或用户名</label>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="输入邮箱或用户名"
            required
          />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="输入密码"
            required
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
        还没有账号？{' '}
        <span className="auth-link" onClick={onSwitch}>立即注册</span>
      </p>
    </div>
  );
}
