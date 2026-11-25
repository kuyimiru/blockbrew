import React, { useRef, useState } from 'react';
import { useSkinStore } from '../../store/useSkinStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { useUserStore } from '../../store/useUserStore.js';
import { importSkin } from '../../engine/skin/SkinImporter.js';
import { exportSkin, downloadSkin } from '../../engine/skin/SkinExporter.js';
import { Icon } from '../common/Icon.jsx';
import { Modal } from '../common/Modal.jsx';

/** 统一的登录检查 */
function needLogin(isAuth, addToast, onLogin) {
  if (!isAuth) { addToast('此功能需要登录后才能使用，请先登录', 'warning'); onLogin(); return false; }
  return true;
}

export function FileMenu() {
  const [show, setShow] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [exportSize, setExportSize] = useState(64);
  const fileRef = useRef(null);

  const skinData = useSkinStore(s => s.skinData);
  const skinName = useSkinStore(s => s.skinName);
  const skinId = useSkinStore(s => s.skinId);
  const modelType = useSkinStore(s => s.modelType);
  const textureSize = useSkinStore(s => s.textureSize);
  const newSkin = useSkinStore(s => s.newSkin);
  const loadSkin = useSkinStore(s => s.loadSkin);
  const resetSkin = useSkinStore(s => s.resetSkin);
  const markSaved = useSkinStore(s => s.markSaved);
  const addToast = useUIStore(s => s.addToast);
  const openModal = useUIStore(s => s.openModal);
  const isAuth = useUserStore(s => s.isAuthenticated);
  const getAuthHeaders = useUserStore(s => s.getAuthHeaders);

  const goLogin = () => { setShowLogin(true); setShow(false); };
  const closeLogin = () => setShowLogin(false);

  const handleImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const res = await importSkin(file);
    if (res.error) { addToast(res.error, 'error'); } else { loadSkin(res.skinData, file.name.replace(/\.png$/i, ''), null); addToast(`导入成功 (${res.size})`, 'success'); }
    e.target.value = '';
  };

  const handleExport = async () => {
    if (!needLogin(isAuth, addToast, goLogin)) return;
    const blob = await exportSkin(skinData, exportSize);
    downloadSkin(blob, `${skinName}.png`);
    addToast(`导出成功 (${exportSize}×${exportSize})`, 'success');
    setShowExport(false); setShow(false);
  };

  const handleNew = (type) => { newSkin(type); addToast(`新建 (${type === 'alex' ? 'Alex' : 'Steve'})`, 'success'); setShowNew(false); setShow(false); };
  const handleReset = () => { resetSkin(); addToast('已重置', 'success'); setShowReset(false); setShow(false); };

  const handleSave = async () => {
    if (!needLogin(isAuth, addToast, goLogin)) return;
    try {
      const raw = skinData.getRawData();
      const base64 = btoa(String.fromCharCode(...raw));
      const url = skinId ? `/api/skins/${skinId}` : '/api/skins', method = skinId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify({ name: skinName, modelType, innerData: base64, outerData: '' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');
      markSaved(data.skin?.id); addToast('保存成功！', 'success');
    } catch (err) { addToast(err.message, 'error'); }
    setShow(false);
  };

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setShow(!show)}>文件 ▾</button>
        {show && (
          <div className="user-dropdown" style={{ top: '100%', left: 0, marginTop: 4 }} onClick={() => setShow(false)}>
            <button className="user-dropdown-item" onClick={() => setShowNew(true)}><Icon name="new" size={14} /> 新建</button>
            <button className="user-dropdown-item" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> 导入 PNG</button>
            <button className="user-dropdown-item" onClick={() => setShowExport(true)}>
              <Icon name="download" size={14} /> 导出 PNG {!isAuth && '🔒'}
            </button>
            <div className="user-dropdown-divider" />
            <button className="user-dropdown-item" onClick={handleSave}><Icon name="upload" size={14} /> 保存到云端</button>
            <div className="user-dropdown-divider" />
            <button className="user-dropdown-item" onClick={() => { setShowReset(true); setShow(false); }}><Icon name="trash" size={14} /> 重置皮肤</button>
          </div>
        )}
        <input ref={fileRef} type="file" accept=".png" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      {showNew && (
        <Modal title="新建皮肤" onClose={() => setShowNew(false)} footer={<button className="btn btn-secondary" onClick={() => setShowNew(false)}>取消</button>}>
          <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-primary" onClick={() => handleNew('steve')} style={{ flex: 1 }}>🧔 Steve</button><button className="btn btn-secondary" onClick={() => handleNew('alex')} style={{ flex: 1 }}>👩 Alex</button></div>
        </Modal>
      )}
      {showReset && (
        <Modal title="确认重置" onClose={() => setShowReset(false)} footer={<><button className="btn btn-secondary" onClick={() => setShowReset(false)}>取消</button><button className="btn btn-primary" onClick={handleReset}>确认重置</button></>}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>将清除所有编辑内容，不可撤销。</p>
        </Modal>
      )}
      {showExport && (
        <Modal title="导出皮肤" onClose={() => setShowExport(false)} footer={<><button className="btn btn-secondary" onClick={() => setShowExport(false)}>取消</button><button className="btn btn-primary" onClick={handleExport}>导出 {exportSize}×{exportSize}</button></>}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13 }}>尺寸：</span>
            {[64, 128, 256].map(s => (
              <button key={s} className={`btn-sm ${exportSize === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setExportSize(s)}>
                {s}×{s} {s === 256 && '👑'}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>256×256 需要登录后使用</p>
        </Modal>
      )}
      {showLogin && (
        <Modal title="请先登录" onClose={closeLogin} footer={<button className="btn btn-primary" onClick={closeLogin}>确定</button>}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>导出 PNG 和 256×256 画布功能需要登录账号后才能使用。请先登录或注册。</p>
        </Modal>
      )}
    </>
  );
}
