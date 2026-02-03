// KLS Logo - Kapil Learning Systems
// Modern minimalist logo with initials

import React from 'react';

export function KLSLogo({ size = 32, showText = false }) {
  const scale = size / 40;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 * scale }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id="klsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="klsGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Main circle background */}
        <circle cx="20" cy="20" r="18" fill="url(#klsGradient)" />

        {/* KLS Letters - stylized and modern */}
        <text
          x="20"
          y="26"
          textAnchor="middle"
          fill="white"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="14"
          fontWeight="700"
          letterSpacing="-0.5"
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

// Compact logo for small spaces
export function KLSLogoCompact({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="klsCompactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#klsCompactGradient)" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fill="white"
        fontFamily="Inter, sans-serif"
        fontSize="9"
        fontWeight="700"
      >
        KLS
      </text>
    </svg>
  );
}

// Sidebar footer branding component
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
          <div style={{ fontWeight: 500 }}>Kapil Learning Systems</div>
          <div style={{ opacity: 0.7, fontSize: 10 }}>Powered by KLS</div>
        </div>
      </div>
    </div>
  );
}

// Footer brand for main app (shaded, subtle)
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
          borderRadius: 20,
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
          Kapil Learning Systems
        </span>
      </div>
    </div>
  );
}

export default KLSLogo;
