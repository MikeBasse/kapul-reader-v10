// KLS Logo - Kapul Learning Systems
// Simple, clean, professional

import React from 'react';

export function KLSLogo({ size = 32, showText = false }) {
  const scale = size / 40;
  const width = size;
  const height = size * 0.7;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 * scale }}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 40 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="0.5"
          y="0.5"
          width="39"
          height="27"
          rx="4"
          fill="white"
          stroke="#e5e5e5"
        />
        <text
          x="20"
          y="19"
          textAnchor="middle"
          fill="#000000"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="14"
          fontWeight="700"
          letterSpacing="1"
        >
          KLS
        </text>
      </svg>

      {showText && (
        <span
          style={{
            fontWeight: 600,
            fontSize: 15 * scale,
            color: 'var(--text)',
            letterSpacing: '-0.02em'
          }}
        >
          Kapul Reader
        </span>
      )}
    </div>
  );
}

export function KLSLogoCompact({ size = 24 }) {
  const width = size;
  const height = size * 0.7;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="16"
        rx="3"
        fill="white"
        stroke="#e5e5e5"
      />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        fill="#000000"
        fontFamily="Inter, sans-serif"
        fontSize="8"
        fontWeight="700"
        letterSpacing="0.5"
      >
        KLS
      </text>
    </svg>
  );
}

export function KLSSidebarBrand() {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        marginTop: 'auto'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          opacity: 0.7
        }}
      >
        <KLSLogoCompact size={20} />
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: 500 }}>Kapul Learning Systems</div>
          <div style={{ opacity: 0.7, fontSize: 10 }}>Powered by KLS</div>
        </div>
      </div>
    </div>
  );
}

export function KLSFooterBrand() {
  return (
    <div
      className="kls-footer-brand"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px',
        background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 50
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          opacity: 0.4,
          padding: '6px 12px',
          borderRadius: 4,
          background: 'var(--bg-secondary)'
        }}
      >
        <KLSLogoCompact size={16} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            letterSpacing: '0.02em'
          }}
        >
          Kapul Learning Systems
        </span>
      </div>
    </div>
  );
}

export default KLSLogo;
