import React, { useCallback } from 'react';
import { useEditorStore } from '../../store/useEditorStore.js';
import { useSkinStore } from '../../store/useSkinStore.js';
import * as adj from '../../engine/adjustments/index.js';

const SLIDERS = [
  { key: 'hue', label: '色相 (Hue)', min: -180, max: 180, unit: '°', def: 0 },
  { key: 'saturation', label: '饱和度 (Saturation)', min: 0, max: 200, unit: '%', def: 100 },
  { key: 'brightness', label: '亮度 (Brightness)', min: 0, max: 200, unit: '%', def: 100 },
  { key: 'temperature', label: '色温 (Temperature)', min: -100, max: 100, unit: '', def: 0 },
];

export function AdjustmentPanel() {
  const adjValues = useEditorStore(s => s.adjustments);
  const setAdj = useEditorStore(s => s.setAdjustment);
  const resetAdj = useEditorStore(s => s.resetAdjustments);
  const previewing = useEditorStore(s => s.adjustmentPreview);
  const startPrev = useEditorStore(s => s.startAdjustmentPreview);
  const cancelPrev = useEditorStore(s => s.cancelAdjustmentPreview);
  const snapshot = useEditorStore(s => s.adjustmentSnapshot);
  const skinData = useSkinStore(s => s.skinData);
  const pushSnap = useSkinStore(s => s.pushSnapshot);
  const notify = useSkinStore(s => s.notifyChange);

  const apply = useCallback((key, val) => {
    setAdj(key, val);
    const snap = previewing ? snapshot : skinData.snapshot();
    if (!previewing) startPrev(snap);

    let data = new Uint8Array(snap);
    const cur = { ...adjValues, [key]: val };
    if (cur.hue !== 0) data = adj.shiftHue(data, cur.hue);
    if (cur.saturation !== 100) data = adj.adjustSaturation(data, cur.saturation);
    if (cur.brightness !== 100) data = adj.adjustBrightness(data, cur.brightness);
    if (cur.temperature !== 0) data = adj.adjustTemperature(data, cur.temperature);
    skinData.restore(data);
    notify();
  }, [adjValues, previewing, snapshot, skinData, startPrev, setAdj, notify]);

  const handleApply = () => { pushSnap(); resetAdj(); cancelPrev(); };
  const handleCancel = () => {
    if (snapshot) { skinData.restore(snapshot); notify(); }
    cancelPrev();
    setAdj('hue', 0); setAdj('saturation', 100); setAdj('brightness', 100); setAdj('temperature', 0);
  };

  const changed = adjValues.hue !== 0 || adjValues.saturation !== 100 || adjValues.brightness !== 100 || adjValues.temperature !== 0;

  return (
    <div>
      {SLIDERS.map(s => (
        <div key={s.key} className="adjustment-slider">
          <label><span>{s.label}</span><span>{adjValues[s.key]}{s.unit}</span></label>
          <input type="range" min={s.min} max={s.max} value={adjValues[s.key]} onChange={e => apply(s.key, Number(e.target.value))} />
        </div>
      ))}

      <div className="adjustment-slider">
        <label><span>透明度 (Opacity)</span><span>{adjValues.opacity}%</span></label>
        <input type="range" min={0} max={100} value={adjValues.opacity}
          onChange={e => { const v = Number(e.target.value); setAdj('opacity', v); notify(); }} />
      </div>

      {changed && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={handleApply}>应用</button>
          <button className="btn btn-secondary btn-sm" onClick={handleCancel}>取消</button>
        </div>
      )}
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 4, width: '100%', fontSize: 11 }} onClick={handleCancel}>重置全部</button>
    </div>
  );
}
