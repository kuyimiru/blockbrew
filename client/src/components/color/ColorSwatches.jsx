import React from 'react';
import { useEditorStore } from '../../store/useEditorStore.js';
import { MINECRAFT_COLORS, SKIN_TONES, hexToHsv } from '../../utils/colors.js';

export function ColorSwatches() {
  const primaryColor = useEditorStore(s => s.primaryColor);
  const setPrimaryColor = useEditorStore(s => s.setPrimaryColor);
  const setHSV = useEditorStore(s => s.setHSV);

  const handleSelect = (hex) => {
    setPrimaryColor(hex);
    setHSV(hexToHsv(hex));
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
        Minecraft 经典色
      </div>
      <div className="color-swatches">
        {MINECRAFT_COLORS.map(c => (
          <div
            key={c.hex}
            className={`color-swatch ${primaryColor === c.hex ? 'selected' : ''}`}
            style={{ background: c.hex }}
            onClick={() => handleSelect(c.hex)}
            title={c.name}
          />
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '8px 0 4px' }}>
        肤色/常用色
      </div>
      <div className="color-swatches">
        {SKIN_TONES.map((c, i) => (
          <div
            key={i}
            className={`color-swatch ${primaryColor === c.hex ? 'selected' : ''}`}
            style={{ background: c.hex }}
            onClick={() => handleSelect(c.hex)}
            title={c.name}
          />
        ))}
      </div>
    </div>
  );
}
