'use client';

import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'var(--brand-primary)' }) {
  return (
    <div
      className="glass-card glass-card-interactive"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '94px',
        padding: '12px 15px',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Subtle corner aura */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: color,
          opacity: 0.12,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px', position: 'relative', zIndex: 1 }}>
        <div>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {title}
          </span>
          <div
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              marginTop: '3px',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </div>
        </div>

        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Icon size={17} strokeWidth={2.2} />
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.73rem',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '6px',
          marginTop: '4px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>{subtitle}</span>
        {trend ? (
          <span
            style={{
              color: trend.isPositive ? '#34d399' : '#fb7185',
              fontWeight: 700,
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {trend.text}
          </span>
        ) : (
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Updated live</span>
        )}
      </div>
    </div>
  );
}
