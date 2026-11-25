import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore.js';
import { useUIStore } from '../../store/useUIStore.js';

export function RegisterForm({ onSwitch }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const register = useUserStore(s => s.register);
  const loading = useUserStore(s => s.loading);
  const error = useUserStore(s => s.error);
  const navigate = useNavigate();
  const addToast = useUIStore(s => s.addToast);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('两次密码输入不一致');
      return;
    }
    if (password.length < 6) {
      setLocalError('密码长度不能少于6位');
      return;
    }
    if (username.length < 2) {
      setLocalError('用户名长度不能少于2位');
      return;
    }

    const success = await register(username, email, password);
    if (success) {
      addToast('注册成功！欢迎加入 BlockBrew 🧊', 'success');
      navigate('/');
    }
  };

  return (
    <div className="auth-card">
      <h1>注册 BlockBrew</h1>
      <p className="subtitle">创建账号，保存你的皮肤到云端</p>

      {(error || localError) && (
        <div className="form-error" style={{ marginBottom: 12 }}>{localError || error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>用户名</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="选择一个用户名"
            required
          />
        </div>
        <div className="form-group">
          <label>邮箱</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="输入邮箱地址"
            required
          />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="至少6位密码"
            required
          />
        </div>
        <div className="form-group">
          <label>确认密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="再次输入密码"
            required
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
        已有账号？{' '}
        <span className="auth-link" onClick={onSwitch}>去登录</span>
      </p>
    </div>
  );
}
