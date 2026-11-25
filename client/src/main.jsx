/**
 * BlockBrew 入口 — 全局错误捕获 + 错误回退界面
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './App.css';

// ── 全局错误捕获（渲染前注册） ──
window.addEventListener('error', (e) => {
  console.error('[BlockBrew] 全局错误:', e.message, e.filename, e.lineno, e.colno);
  const root = document.getElementById('root');
  if (root && !root.querySelector('.crash-screen')) {
    root.innerHTML = `
      <div class="crash-screen" style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0B0B0B;color:#F1F1F1;flex-direction:column;font-family:system-ui,sans-serif;padding:20px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <h1 style="color:#DC2626;font-size:22px;margin-bottom:8px;">页面加载失败</h1>
        <p style="color:#9CA3AF;font-size:14px;max-width:400px;line-height:1.6;">${e.message || '未知错误'}</p>
        <p style="color:#6B7280;font-size:12px;margin-top:8px;">请按 F12 查看控制台详细信息</p>
        <button onclick="location.reload()" style="margin-top:20px;background:#DC2626;color:#fff;border:none;padding:10px 30px;border-radius:6px;cursor:pointer;font-size:14px;">重新加载</button>
      </div>`;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[BlockBrew] 未处理的 Promise:', e.reason);
  // 不覆盖页面 — 已由 ErrorBoundary 处理
});

// ── 检查 WebGL 可用性 ──
function checkWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

// ── 渲染 ──
const rootEl = document.getElementById('root');

if (!checkWebGL()) {
  rootEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0B0B0B;color:#F1F1F1;flex-direction:column;font-family:system-ui,sans-serif;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">🎮</div>
      <h1 style="color:#DC2626;font-size:20px;">WebGL 不可用</h1>
      <p style="color:#9CA3AF;font-size:14px;">您的浏览器不支持 WebGL，无法运行 3D 编辑器。<br>请使用 Chrome、Edge 或 Firefox 最新版。</p>
    </div>`;
} else {
  // 显示加载指示器
  rootEl.innerHTML = `
    <div id="app-loading" style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0B0B0B;color:#F1F1F1;flex-direction:column;font-family:system-ui,sans-serif;">
      <div style="font-size:48px;margin-bottom:16px;">⛏️</div>
      <div style="font-size:18px;font-weight:600;">BlockBrew 加载中...</div>
      <div style="font-size:13px;color:#9CA3AF;margin-top:8px;">准备 3D 引擎和编辑器</div>
    </div>`;

  // 5 秒超时回退
  const timeout = setTimeout(() => {
    const loading = document.getElementById('app-loading');
    if (loading) {
      loading.innerHTML = `
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <div style="font-size:18px;color:#DC2626;">加载超时</div>
        <div style="font-size:13px;color:#9CA3AF;margin-top:8px;">请刷新页面重试</div>
        <button onclick="location.reload()" style="margin-top:16px;background:#DC2626;color:#fff;border:none;padding:8px 24px;border-radius:6px;cursor:pointer;">刷新</button>`;
    }
  }, 8000);

  // 渲染 React 应用
  ReactDOM.createRoot(rootEl).render(
    <BrowserRouter>
      <App onReady={() => clearTimeout(timeout)} />
    </BrowserRouter>
  );
}
