'use client';

import React from 'react';

/**
 * FeeOrbit Bespoke Vector Logo System
 * Handcrafted architectural brand mark combining financial velocity (diamond nucleus)
 * with continuous orbital momentum (dual hyper-elliptical vector ribbons).
 *
 * @param {'sm' | 'md' | 'lg' | 'xl'} size - Overall dimension sizing
 * @param {'full' | 'mark'} variant - 'full' includes wordmark + OS badge, 'mark' is standalone icon
 * @param {boolean} showBadge - Whether to display the 'OS' micro-badge in full variant
 * @param {string} badgeText - Custom text for the micro-badge (default: 'OS')
 * @param {boolean} animated - Adds subtle ambient energy breathing
 */
export default function FeeOrbitLogo({
  size = 'md',
  variant = 'full',
  showBadge = true,
  badgeText = 'OS',
  animated = false,
  className = '',
  style = {},
}) {
  // Dimensions mapping
  const sizeMap = {
    sm: { icon: 24, font: '0.92rem', gap: '8px', badge: '0.52rem' },
    md: { icon: 32, font: '1.08rem', gap: '10px', badge: '0.56rem' },
    lg: { icon: 42, font: '1.38rem', gap: '12px', badge: '0.62rem' },
    xl: { icon: 48, font: '1.5rem', gap: '14px', badge: '0.68rem' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`feeorbit-brand-mark ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: currentSize.gap,
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Precision Handcrafted Vector Mark */}
      <div
        style={{
          width: `${currentSize.icon}px`,
          height: `${currentSize.icon}px`,
          position: 'relative',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 48 48"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: animated ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.45))' : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4))',
            transition: 'filter 0.3s ease',
          }}
        >
          <defs>
            {/* Primary Orbital Gradient */}
            <linearGradient id="fo-grad-primary" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            {/* Counter Intersecting Orbit Ribbon */}
            <linearGradient id="fo-grad-secondary" x1="42" y1="8" x2="8" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.2" />
            </linearGradient>

            {/* Radial Core Glow */}
            <radialGradient id="fo-core-glow" cx="24" cy="24" r="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.65" />
              <stop offset="45%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>

            {/* Backplate subtle glass surface */}
            <linearGradient id="fo-plate" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
            </linearGradient>
          </defs>

          {/* Ambient Radial Core Light */}
          <circle cx="24" cy="24" r="14" fill="url(#fo-core-glow)" />

          {/* Outer Track Hairline Guide */}
          <ellipse
            cx="24"
            cy="24"
            rx="18.5"
            ry="9.5"
            transform="rotate(-30 24 24)"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="1"
          />

          {/* Counter Orbit Ribbon (Ascending) */}
          <ellipse
            cx="24"
            cy="24"
            rx="16.5"
            ry="7.5"
            transform="rotate(38 24 24)"
            stroke="url(#fo-grad-secondary)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="64 36"
          />

          {/* Primary Hyper-Orbit Ribbon (Descending Velocity) */}
          <ellipse
            cx="24"
            cy="24"
            rx="17.5"
            ry="8"
            transform="rotate(-28 24 24)"
            stroke="url(#fo-grad-primary)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeDasharray="80 28"
          />

          {/* Kinetic Orbit Satellite Node with Aura */}
          <circle cx="37.5" cy="16.5" r="2.5" fill="#38bdf8" />
          <circle cx="37.5" cy="16.5" r="4.5" stroke="#38bdf8" strokeOpacity="0.3" strokeWidth="1" />

          {/* Secondary Counter Node */}
          <circle cx="10.5" cy="31.5" r="1.8" fill="#818cf8" />

          {/* Central Precision Diamond Nexus */}
          <path d="M24 16.5L28.5 24L24 31.5L19.5 24Z" fill="url(#fo-grad-primary)" />
          
          {/* Radiant Core Specular Dot */}
          <circle cx="24" cy="24" r="2.2" fill="#ffffff" />
        </svg>
      </div>

      {/* Typography Wordmark (Full Variant Only) */}
      {variant === 'full' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-heading, "Inter", -apple-system, sans-serif)',
              fontWeight: 800,
              fontSize: currentSize.font,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: '#f8fafc',
              whiteSpace: 'nowrap',
            }}
          >
            Fee
            <span
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Orbit
            </span>
          </div>

          {showBadge && (
            <span
              style={{
                fontSize: currentSize.badge,
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#cbd5e1',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '2.5px 8px',
                borderRadius: '9999px',
                lineHeight: 1.1,
                marginLeft: '3px',
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
