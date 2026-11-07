'use client';

import React, { useState, useEffect } from 'react';

/**
 * FeeOrbit Enterprise Loading Screen & Motion System
 * Features:
 * - Bespoke FeeOrbit vector brand mark with diamond nucleus & hyper-orbit ribbons
 * - Dual counter-rotating kinetic particle rings with glowing satellite nodes
 * - Breathing energy core aura with ambient obsidian lighting
 * - Laser-sweeping quantum progress track
 * - Dynamic reassuring telemetry status cycling
 */
export default function FeeOrbitLoadingScreen({
  message = 'Verifying secure workspace session...',
  subtext,
  variant = 'fullscreen', // 'fullscreen' | 'inline'
}) {
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);

  const statusMessages = [
    message,
    'Calibrating multi-tenant cloud workspace...',
    'Establishing encrypted real-time sync...',
    'FeeOrbit OS engine online.',
  ];

  useEffect(() => {
    // Only cycle messages if caller used default message
    if (message === 'Verifying secure workspace session...') {
      const interval = setInterval(() => {
        setActiveMessageIndex((prev) => (prev + 1) % statusMessages.length);
      }, 2200);
      return () => clearInterval(interval);
    }
  }, [message]);

  const currentMessage =
    message !== 'Verifying secure workspace session...'
      ? message
      : statusMessages[activeMessageIndex];

  const isFullscreen = variant === 'fullscreen';

  return (
    <div
      role="status"
      aria-label="Loading FeeOrbit"
      style={{
        minHeight: isFullscreen ? '100vh' : '360px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isFullscreen ? '#07090e' : 'transparent',
        position: isFullscreen ? 'relative' : 'static',
        overflow: 'hidden',
        padding: '32px 16px',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes fo-spin-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fo-spin-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes fo-pulse-aura {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.55;
            filter: blur(24px);
          }
          50% {
            transform: scale(1.12);
            opacity: 0.95;
            filter: blur(34px);
          }
        }
        @keyframes fo-laser-beam {
          0% {
            transform: translateX(-120%);
          }
          50% {
            transform: translateX(120%);
          }
          100% {
            transform: translateX(120%);
          }
        }
        @keyframes fo-shimmer-text {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fo-pulse-led {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
            box-shadow: 0 0 8px #10b981;
          }
          50% {
            transform: scale(1.35);
            opacity: 0.6;
            box-shadow: 0 0 14px #10b981;
          }
        }
      `}</style>

      {/* Ambient Atmospheric Backdrop Orbs (Fullscreen only) */}
      {isFullscreen && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '450px',
              height: '450px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, rgba(56, 189, 248, 0.06) 45%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '600px',
              height: '240px',
              background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.04) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </>
      )}

      {/* Main Kinetic Chamber */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Orbital Motion Rig Container */}
        <div
          style={{
            position: 'relative',
            width: '136px',
            height: '136px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '22px',
          }}
        >
          {/* Deep Core Radiant Glow Aura */}
          <div
            style={{
              position: 'absolute',
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #6366f1 0%, #38bdf8 55%, transparent 75%)',
              animation: 'fo-pulse-aura 2.6s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />

          {/* Outer Constellation Orbit Ring (Clockwise) */}
          <svg
            width="132"
            height="132"
            viewBox="0 0 132 132"
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              animation: 'fo-spin-cw 8s linear infinite',
              pointerEvents: 'none',
            }}
          >
            <defs>
              <linearGradient id="fo-outer-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <circle
              cx="66"
              cy="66"
              r="62"
              fill="none"
              stroke="url(#fo-outer-ring-grad)"
              strokeWidth="1.5"
              strokeDasharray="42 22 18 16"
              strokeLinecap="round"
            />
            {/* Satellite Node Alpha */}
            <circle cx="66" cy="4" r="3.2" fill="#38bdf8" />
            <circle cx="66" cy="4" r="5.5" fill="none" stroke="#38bdf8" strokeOpacity="0.4" strokeWidth="1" />
            {/* Satellite Node Beta */}
            <circle cx="128" cy="66" r="2.4" fill="#a855f7" />
          </svg>

          {/* Inner Counter Orbit Ring (Counter-Clockwise) */}
          <svg
            width="104"
            height="104"
            viewBox="0 0 104 104"
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              animation: 'fo-spin-ccw 5s linear infinite',
              pointerEvents: 'none',
            }}
          >
            <defs>
              <linearGradient id="fo-inner-ring-grad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <circle
              cx="52"
              cy="52"
              r="48"
              fill="none"
              stroke="url(#fo-inner-ring-grad)"
              strokeWidth="1.4"
              strokeDasharray="24 16 32 18"
              strokeLinecap="round"
            />
            {/* Satellite Node Gamma */}
            <circle cx="52" cy="4" r="2.8" fill="#10b981" />
            <circle cx="4" cy="52" r="2" fill="#818cf8" />
          </svg>

          {/* Central Handcrafted FeeOrbit Architectural Mark */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '62px',
              height: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 22, 38, 0.95), rgba(7, 10, 18, 0.98))',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 24px rgba(99, 102, 241, 0.35)',
            }}
          >
            <svg
              viewBox="0 0 48 48"
              width="46"
              height="46"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.55))',
              }}
            >
              <defs>
                <linearGradient id="fo-screen-primary" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="fo-screen-secondary" x1="42" y1="8" x2="8" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#818cf8" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Ambient Track */}
              <ellipse
                cx="24"
                cy="24"
                rx="18.5"
                ry="9.5"
                transform="rotate(-30 24 24)"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
              />

              {/* Counter Orbit Ribbon (Ascending) */}
              <ellipse
                cx="24"
                cy="24"
                rx="16.5"
                ry="7.5"
                transform="rotate(38 24 24)"
                stroke="url(#fo-screen-secondary)"
                strokeWidth="2.4"
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
                stroke="url(#fo-screen-primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="80 28"
              />

              {/* Kinetic Satellite Nodes */}
              <circle cx="37.5" cy="16.5" r="2.8" fill="#38bdf8" />
              <circle cx="37.5" cy="16.5" r="5" stroke="#38bdf8" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="10.5" cy="31.5" r="2" fill="#818cf8" />

              {/* Central Diamond Nexus */}
              <path d="M24 16.5L28.5 24L24 31.5L19.5 24Z" fill="url(#fo-screen-primary)" />

              {/* Core Specular Dot */}
              <circle cx="24" cy="24" r="2.4" fill="#ffffff" />
            </svg>
          </div>
        </div>

        {/* Brand Wordmark & OS Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading, "Plus Jakarta Sans", "Inter", sans-serif)',
              fontWeight: 800,
              fontSize: '1.45rem',
              letterSpacing: '-0.035em',
              lineHeight: 1,
              color: '#ffffff',
            }}
          >
            Fee
            <span
              style={{
                background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 40%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Orbit
            </span>
          </span>

          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
              padding: '2px 7px',
              borderRadius: '6px',
              lineHeight: 1.2,
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)',
            }}
          >
            OS
          </span>
        </div>

        {/* High-Tech Laser Progress Track */}
        <div
          style={{
            width: '180px',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '99px',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '16px',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '55%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #6366f1, #38bdf8, transparent)',
              borderRadius: '99px',
              animation: 'fo-laser-beam 1.7s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              filter: 'drop-shadow(0 0 6px #38bdf8)',
            }}
          />
        </div>

        {/* Dynamic Telemetry Status Message */}
        <div
          key={currentMessage}
          style={{
            fontSize: '0.8rem',
            color: '#cbd5e1',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            minHeight: '20px',
            transition: 'opacity 0.25s ease',
          }}
        >
          {currentMessage}
        </div>

        {subtext ? (
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
            {subtext}
          </div>
        ) : (
          /* Multi-Tenant Cloud Synchronized Pill */
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '20px',
              padding: '3px 10px',
              marginTop: '12px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'fo-pulse-led 1.6s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: '#94a3b8',
                textTransform: 'uppercase',
              }}
            >
              Enterprise Multi-Tenant Cloud
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
