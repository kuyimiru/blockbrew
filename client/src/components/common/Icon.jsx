import React from 'react';

/**
 * 简易 SVG 图标组件 — 线性图标，1.5px 描边
 */
const icons = {
  pencil: 'M15 2l7 7L7 24H0v-7L15 2z M23 4l4 4-3 3-4-4 3-3z',
  brush: 'M21 1C13 1 8 8 8 14v2H4v4c0 2 2 4 4 4s4-2 4-4v-2h4v2c0 2 2 4 4 4s4-2 4-4v-2h-4v-2c0-6-5-13-13-13z',
  eraser: 'M20 21H7L0 14l14-14 10 10-4 11z M7 14h14',
  eyedropper: 'M22 0l2 2-4 4 2 2-2 2-2-2-8 8H8v-2l8-8-4-4 2-2 2 2 4-4z',
  fill: 'M21 12l-9 9H4v-8l9-9 8 8z M4 21h16',
  symmetry: 'M12 0v24 M0 12h24 M3 3l18 18 M21 3L3 21',
  undo: 'M8 4H1v7 M1 4l6 6 M1 4c4-4 16-3 20 4s-2 15-7 16',
  redo: 'M16 4h7v7 M23 4l-6 6 M23 4c-4-4-16-3-20 4s2 15 7 16',
  plus: 'M12 0v24 M0 12h24',
  minus: 'M0 12h24',
  download: 'M12 16V0 M6 10l6 6 6-6 M0 22h24',
  upload: 'M12 8v16 M6 14l6-6 6 6 M0 2h24',
  folder: 'M0 4h10l3 3h11v14H0V4z',
  user: 'M12 12c3 0 6-2 6-6s-3-6-6-6S6 2 6 6s3 6 6 6z M2 24c0-5 4-8 10-8s10 3 10 8',
  lock: 'M7 10V7c0-3 2-5 5-5s5 2 5 5v3 M4 10h16v14H4V10z M12 16v3',
  mail: 'M0 4l12 10L24 4 M0 4v16h24V4',
  eye: 'M1 12c3-6 8-9 11-9s8 3 11 9 M1 12c3 6 8 9 11 9s8-3 11-9 M12 15c2 0 3-1 3-3s-1-3-3-3-3 1-3 3 1 3 3 3z',
  eyeOff: 'M5 5L19 19 M8 8c-2 1-4 3-6 4 M16 16c2-1 4-3 6-4 M1 1l22 22',
  grid: 'M0 8h24 M0 16h24 M8 0v24 M16 0v24',
  zoomIn: 'M10 16c4 0 7-3 7-7s-3-7-7-7-7 3-7 7 3 7 7 7z M23 23l-6-6 M10 7v6 M7 10h6',
  zoomOut: 'M10 16c4 0 7-3 7-7s-3-7-7-7-7 3-7 7 3 7 7 7z M23 23l-6-6 M7 10h6',
  layers: 'M12 2L2 8l10 6 10-6-10-6z M2 14l10 6 10-6 M2 20l10 6 10-6',
  settings: 'M12 17c3 0 5-2 5-5s-2-5-5-5-5 2-5 5 2 5 5 5z M3 9V5l-1-2 2-1 3 2h10l3-2 2 1-1 2v4l1 2-2 1-3-2H7L4 14l-2-1 1-2V9z',
  logout: 'M9 21H5c-1 0-2-1-2-2V5c0-1 1-2 2-2h4 M16 17l5-5-5-5 M21 12H9',
  trash: 'M3 7h18 M8 7V4h8v3 M5 7l1 14h12l1-14 M10 11v6 M14 11v6',
  new: 'M14 2v20 M4 12h20',
  sun: 'M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4 4l1 1 M19 4l-1 1 M4 20l1-1 M19 20l-1-1 M12 8c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z',
  arrowLeft: 'M19 12H5 M10 5l-7 7 7 7',
  check: 'M2 12l7 7L22 4',
  x: 'M18 6L6 18 M6 6l12 12',
};

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  const path = icons[name];
  if (!path) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {path.split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : 'M' + d} />
      ))}
    </svg>
  );
}
