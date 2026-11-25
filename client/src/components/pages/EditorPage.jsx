import React, { useEffect } from 'react';
import { Header } from '../layout/Header.jsx';
import { Sidebar } from '../layout/Sidebar.jsx';
import { StatusBar } from '../layout/StatusBar.jsx';
import { EditorPanel } from '../editor/EditorPanel.jsx';
import { useKeyboard } from '../../hooks/useKeyboard.js';
import { useAutoSave } from '../../hooks/useAutoSave.js';

export function EditorPage() {
  // 启用键盘快捷键
  useKeyboard();
  // 启用本地自动保存
  useAutoSave();

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          <EditorPanel />
          <StatusBar />
        </main>
      </div>
    </div>
  );
}
