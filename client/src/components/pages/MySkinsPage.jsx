import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore.js';
import { useSkinStore } from '../../store/useSkinStore.js';
import { SkinData } from '../../engine/skin/SkinData.js';
import { useUIStore } from '../../store/useUIStore.js';
import { Header } from '../layout/Header.jsx';

export function MySkinsPage() {
  const [skins, setSkins] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAuth = useUserStore(s => s.isAuthenticated);
  const getAuthHeaders = useUserStore(s => s.getAuthHeaders);
  const navigate = useNavigate();
  const loadSkin = useSkinStore(s => s.loadSkin);
  const setModelType = useSkinStore(s => s.setModelType);
  const addToast = useUIStore(s => s.addToast);

  useEffect(() => { if (!isAuth) { navigate('/login'); return; } fetchSkins(); }, [isAuth]);

  const fetchSkins = async () => {
    try {
      const res = await fetch('/api/skins', { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setSkins(data.skins || []);
    } catch { addToast('加载作品列表失败', 'error'); }
    finally { setLoading(false); }
  };

  const handleLoad = async (skin) => {
    try {
      const res = await fetch(`/api/skins/${skin.id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // innerData 现在存储完整 64×64 数据
      const bytes = Uint8Array.from(atob(data.skin.innerData || ''), c => c.charCodeAt(0));
      if (bytes.length === 16384) {
        loadSkin(new SkinData(bytes), data.skin.name, data.skin.id);
        setModelType(data.skin.modelType || 'steve');
      }
      addToast(`已加载：${data.skin.name}`, 'success');
      navigate('/');
    } catch (err) { addToast('加载皮肤失败: ' + err.message, 'error'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`确定删除 "${name}" 吗？`)) return;
    try {
      const res = await fetch(`/api/skins/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) { setSkins(s => s.filter(sk => sk.id !== id)); addToast('删除成功', 'success'); }
    } catch { addToast('删除失败', 'error'); }
  };

  const getPreview = (skin) => {
    try {
      if (!skin.innerData) return null;
      const bytes = Uint8Array.from(atob(skin.innerData), c => c.charCodeAt(0));
      if (bytes.length < 4096) return null;
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(64, 64);
      for (let i = 0; i < Math.min(bytes.length, 16384); i++) img.data[i] = bytes[i];
      ctx.putImageData(img, 0, 0);
      return c.toDataURL();
    } catch { return null; }
  };

  return (
    <div className="app-shell">
      <Header />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>📁 我的作品</h2>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>← 返回编辑器</button>
          </div>
          {loading ? <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
          : skins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>🧊</p>
              <p>还没有保存的作品</p>
            </div>
          ) : (
            <div className="skins-grid">
              {skins.map(s => (
                <div key={s.id} className="skin-card" onClick={() => handleLoad(s)}>
                  <img src={getPreview(s) || ''} alt={s.name} style={{ imageRendering: 'pixelated' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                  <div className="skin-card-info">
                    <div className="skin-card-name">{s.name}</div>
                    <div className="skin-card-date">{new Date(s.updatedAt).toLocaleDateString('zh-CN')} · {s.modelType}</div>
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 4, fontSize: 10, color: 'var(--accent-red)' }}
                      onClick={e => { e.stopPropagation(); handleDelete(s.id, s.name); }}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
