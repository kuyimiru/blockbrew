/**
 * SkinViewerIframe.jsx — 通过 iframe 隔离运行 skinview3d
 *
 * 将纹理数据转为 data URL，通过 postMessage 发送给独立 HTML 页面。
 * 避免了 Three.js 多实例冲突问题。
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { useSkinStore } from '../../store/useSkinStore.js';

function skinToDataUrl(skinData) {
  if (!skinData) return null;
  const raw = skinData.getRawData();
  if (!raw || raw.length < 64 * 64 * 4) return null;

  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  canvas.getContext('2d').putImageData(
    new ImageData(new Uint8ClampedArray(raw), 64, 64), 0, 0
  );
  return canvas.toDataURL('image/png');
}

export function SkinViewerIframe({ compact }) {
  const iframeRef = useRef(null);
  const readyRef = useRef(false);
  const lastVerRef = useRef(-1);

  // listener for viewer-ready message
  useEffect(() => {
    const h = (e) => { if (e.data?.type === 'viewer-ready') readyRef.current = true; };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, []);

  // send message helper (retries until ready)
  const post = useCallback((msg) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    if (readyRef.current) {
      iframe.contentWindow.postMessage(msg, '*');
    } else {
      // retry after short delay
      const timer = setTimeout(() => {
        if (readyRef.current && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(msg, '*');
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // ── Initial skin load + version-based updates ──
  useEffect(() => {
    const store = useSkinStore.getState();
    const url = skinToDataUrl(store.skinData);
    if (url && readyRef.current) {
      post({ type: 'load-skin', data: url });
      lastVerRef.current = store._textureVersion;
    }

    return useSkinStore.subscribe((s) => {
      if (s._textureVersion === lastVerRef.current) return;
      lastVerRef.current = s._textureVersion;
      const url = skinToDataUrl(s.skinData);
      if (url) post({ type: 'load-skin', data: url });
    });
  }, [post]);

  // ── Model type ──
  useEffect(() => useSkinStore.subscribe((s, p) => {
    if (s.modelType !== p.modelType) post({ type: 'set-model', data: s.modelType === 'alex' ? 'alex' : 'steve' });
  }), [post]);

  // ── Outer layer visibility ──
  useEffect(() => useSkinStore.subscribe((s, p) => {
    if (s.showOuterLayer !== p.showOuterLayer) post({ type: 'set-outer-layer', data: s.showOuterLayer });
  }), [post]);

  // ── Part visibility ──
  useEffect(() => useSkinStore.subscribe((s, p) => {
    if (s.partVisibility !== p.partVisibility) post({ type: 'set-part-visibility', data: s.partVisibility });
  }), [post]);

  return (
    <iframe
      ref={iframeRef}
      src="/skin-viewer.html"
      style={{
        width: '100%', height: '100%', minHeight: 300,
        border: 'none', background: '#0B0B0B', display: 'block',
      }}
      title="3D Skin Viewer"
    />
  );
}
