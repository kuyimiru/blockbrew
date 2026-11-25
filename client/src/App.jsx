import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { EditorPage } from './components/pages/EditorPage.jsx';
import { WelcomePage } from './components/pages/WelcomePage.jsx';
import { MySkinsPage } from './components/pages/MySkinsPage.jsx';
import { ToastContainer } from './components/common/Toast.jsx';

/**
 * App 根组件 — 错误边界 + 路由
 * 默认路由 / 检查登录状态后决定显示欢迎页还是编辑器
 */
export default function App({ onReady }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 延迟一帧确保 DOM 加载指示器被替换
    const frame = requestAnimationFrame(() => {
      setReady(true);
      if (onReady) onReady();
      // 隐藏静态加载指示器（如果还存在）
      const loading = document.getElementById('app-loading');
      if (loading) loading.style.display = 'none';
    });
    return () => cancelAnimationFrame(frame);
  }, [onReady]);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/editor" element={
          <ErrorBoundary key="editor">
            <EditorPage />
          </ErrorBoundary>
        } />
        <Route path="/my-skins" element={<MySkinsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </ErrorBoundary>
  );
}
