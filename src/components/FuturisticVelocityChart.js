'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  RefreshCw,
  TrendingUp,
  Activity,
  Flame,
  Clock,
  Users,
  ChevronRight,
  Zap,
  Sparkles,
  BarChart2,
  Sliders,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Generates smooth SVG cubic bezier path string from coordinate points.
 * Monotone cubic interpolation creates beautiful silky curved waves.
 */
function createSmoothPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return d;
}

export default function FuturisticVelocityChart({
  data = [],
  currentlyInGym = 0,
  todayCheckinsCount = 0,
  maxCapacity = 100,
  onSync,
  refreshing = false,
  t = (k, fallback) => fallback,
  title,
  subtitle,
  badgeLabel = 'Live Matrix',
  linkLabel,
  linkHref = '/kiosk',
}) {
  const [viewMode, setViewMode] = useState('spline'); // 'spline' | 'pillars' | 'radar'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const displayTitle = title || t('dash_weekly_attendance', 'Weekly Attendance Velocity');
  const displaySubtitle = subtitle || t('dash_attendance_subtitle', 'Daily check-in distribution over the past 7 days');
  const displayLinkLabel = linkLabel || t('dash_launch_kiosk', 'Launch Kiosk Desk');

  // Normalize 7-day data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      const days = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
      return days.map((d, i) => ({
        day: d,
        checkIns: 0,
        date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      }));
    }
    return data;
  }, [data]);

  // Aggregate telemetry
  const totalWeeklyCheckins = useMemo(
    () => chartData.reduce((acc, curr) => acc + Number(curr.checkIns || 0), 0),
    [chartData]
  );

  const dailyAvg = useMemo(
    () => (totalWeeklyCheckins > 0 ? (totalWeeklyCheckins / chartData.length).toFixed(1) : '0'),
    [totalWeeklyCheckins, chartData]
  );

  const maxCheckIns = useMemo(
    () => Math.max(5, ...chartData.map((d) => Number(d.checkIns || 0))),
    [chartData]
  );

  const peakDay = useMemo(() => {
    let best = chartData[0];
    for (const d of chartData) {
      if (Number(d.checkIns || 0) > Number(best?.checkIns || 0)) {
        best = d;
      }
    }
    return best && best.checkIns > 0 ? best : null;
  }, [chartData]);

  // SVG dimensions
  const svgWidth = 560;
  const svgHeight = 150;
  const paddingX = 35;
  const paddingTop = 25;
  const paddingBottom = 30;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Calculate coordinates for each point
  const points = useMemo(() => {
    const count = chartData.length;
    return chartData.map((item, idx) => {
      const x = paddingX + (idx / Math.max(1, count - 1)) * plotWidth;
      const val = Number(item.checkIns || 0);
      // Give a tiny offset (4px) even if zero so spline line is visible above baseline
      const normalizedRatio = val / maxCheckIns;
      const y = paddingTop + plotHeight - normalizedRatio * plotHeight;
      return { x, y, val, ...item, idx };
    });
  }, [chartData, maxCheckIns, plotWidth, plotHeight, paddingX, paddingTop]);

  // SVG Paths
  const linePath = useMemo(() => createSmoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (!points || points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const baselineY = paddingTop + plotHeight;
    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [linePath, points, paddingTop, plotHeight]);

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  // Floor occupancy percentage
  const occupancyPercent = Math.min(100, Math.round((currentlyInGym / maxCapacity) * 100));

  return (
    <div
      className="futuristic-velocity-card"
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '16px 18px',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Top Ambient Cyber Glow Aura */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--brand-primary, #6366f1) 0%, transparent 70%)',
          opacity: 0.12,
          pointerEvents: 'none',
          filter: 'blur(30px)',
        }}
      />

      {/* HEADER ROW */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '14px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary, #6366f1)',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
            }}
          >
            <Zap size={18} strokeWidth={2.4} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3
                style={{
                  fontSize: '0.96rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                {displayTitle}
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 6px #10b981',
                  }}
                />
                {badgeLabel}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {displaySubtitle}
            </div>
          </div>
        </div>

        {/* View Switcher & Sync */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '2px',
              gap: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('spline')}
              title="Neon Wave Spline"
              style={{
                background: viewMode === 'spline' ? 'var(--brand-primary, #6366f1)' : 'transparent',
                color: viewMode === 'spline' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <Activity size={12} />
              <span className="d-none-sm">Wave</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('pillars')}
              title="Cyber Pillars Matrix"
              style={{
                background: viewMode === 'pillars' ? 'var(--brand-primary, #6366f1)' : 'transparent',
                color: viewMode === 'pillars' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <BarChart2 size={12} />
              <span className="d-none-sm">Pillars</span>
            </button>
          </div>

          {onSync && (
            <button
              type="button"
              onClick={onSync}
              title="Sync live check-in telemetry"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--bg-card-solid)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              <span>{t('btn_sync', 'Sync')}</span>
            </button>
          )}
        </div>
      </div>

      {/* TELEMETRY HUD MINI-CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '14px',
          padding: '8px 10px',
          borderRadius: '10px',
          background: 'var(--bg-card-solid)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            7-Day Inflow
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
            {totalWeeklyCheckins} <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 600 }}>scans</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Daily Velocity
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
            {dailyAvg} <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 600 }}>/day</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Busiest Day
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: peakDay ? '#f59e0b' : 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
            {peakDay ? `${peakDay.day} (${peakDay.checkIns})` : 'Even'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Floor Status
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: currentlyInGym > 0 ? '#10b981' : 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {currentlyInGym > 0 ? (
              <>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <span>{currentlyInGym} Inside</span>
              </>
            ) : (
              'Standby'
            )}
          </div>
        </div>
      </div>

      {/* GRAPH CANVAS WRAPPER */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '170px',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, var(--bg-card-solid) 0%, var(--bg-card) 100%)',
          border: '1px solid var(--border-subtle)',
          padding: '10px 10px 4px 10px',
        }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Subtle Cyber Grid Background Matrix */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, var(--border-subtle) 1px, transparent 1px),
              linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)
            `,
            backgroundSize: '40px 30px',
            opacity: 0.35,
            pointerEvents: 'none',
          }}
        />

        {/* SVG Visualization */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: '100%', overflow: 'visible', position: 'relative', zIndex: 1 }}
          preserveAspectRatio="none"
        >
          <defs>
            {/* Smooth Neon Wave Gradient */}
            <linearGradient id="neonWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--brand-primary, #6366f1)" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Pillar Gradient */}
            <linearGradient id="cyberPillarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="30%" stopColor="var(--brand-primary, #6366f1)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--brand-primary, #6366f1)" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="todayPillarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#10b981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.25" />
            </linearGradient>

            {/* Neon Glow Filter */}
            <filter id="neonGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal Reference Lines */}
          <line
            x1={paddingX}
            y1={paddingTop}
            x2={svgWidth - paddingX}
            y2={paddingTop}
            stroke="var(--border-subtle)"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          <line
            x1={paddingX}
            y1={paddingTop + plotHeight * 0.5}
            x2={svgWidth - paddingX}
            y2={paddingTop + plotHeight * 0.5}
            stroke="var(--border-subtle)"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <line
            x1={paddingX}
            y1={paddingTop + plotHeight}
            x2={svgWidth - paddingX}
            y2={paddingTop + plotHeight}
            stroke="var(--border-subtle)"
            opacity="0.8"
          />

          {/* VIEW MODE 1: SMOOTH NEON SPLINE WAVE */}
          {viewMode === 'spline' && (
            <>
              {/* Area fill under spline */}
              <path d={areaPath} fill="url(#neonWaveGrad)" />

              {/* Glowing Outline Curve */}
              <path
                d={linePath}
                fill="none"
                stroke="var(--brand-primary, #6366f1)"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#neonGlowFilter)"
              />

              {/* Additional Cyber Core Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            </>
          )}

          {/* VIEW MODE 2: CYBER PILLARS */}
          {viewMode === 'pillars' && (
            <g>
              {points.map((pt, idx) => {
                const isToday = idx === points.length - 1;
                const barWidth = 26;
                const barX = pt.x - barWidth / 2;
                const barHeight = Math.max(6, (pt.val / maxCheckIns) * plotHeight);
                const barY = paddingTop + plotHeight - barHeight;

                return (
                  <g key={`pillar-${idx}`}>
                    {/* Ghost track in background */}
                    <rect
                      x={barX}
                      y={paddingTop}
                      width={barWidth}
                      height={plotHeight}
                      rx="6"
                      fill="var(--border-subtle)"
                      opacity="0.25"
                    />

                    {/* Active Pillar */}
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      rx="6"
                      fill={isToday ? 'url(#todayPillarGrad)' : 'url(#cyberPillarGrad)'}
                      filter={isToday || pt.val > 0 ? 'url(#neonGlowFilter)' : undefined}
                    />

                    {/* Neon Cap Accent */}
                    <rect
                      x={barX + 2}
                      y={barY}
                      width={barWidth - 4}
                      height="3"
                      rx="1.5"
                      fill="#ffffff"
                      opacity={pt.val > 0 ? 0.9 : 0.4}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* DATA NODES & RADAR BEACONS */}
          {points.map((pt, idx) => {
            const isToday = idx === points.length - 1;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={`node-${idx}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(idx)}
              >
                {/* Invisible wide hit area for easy hovering */}
                <rect
                  x={pt.x - 25}
                  y={paddingTop - 15}
                  width="50"
                  height={plotHeight + 35}
                  fill="transparent"
                />

                {/* Laser scan crosshair when hovered */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop - 10}
                    x2={pt.x}
                    y2={paddingTop + plotHeight}
                    stroke="var(--brand-primary, #6366f1)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />
                )}

                {/* Today Radar Pulse Beacon Ring */}
                {isToday && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="12"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    opacity="0.4"
                  >
                    <animate
                      attributeName="r"
                      values="6;16;22"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.8;0.3;0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Outer Node Ring */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : isToday ? 5.5 : 4}
                  fill="var(--bg-card-solid)"
                  stroke={isToday ? '#10b981' : isHovered ? '#38bdf8' : 'var(--brand-primary, #6366f1)'}
                  strokeWidth={isHovered ? 2.5 : 2}
                  style={{ transition: 'all 0.15s ease' }}
                />

                {/* Inner Bright Center */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 3.5 : isToday ? 2.5 : 1.8}
                  fill={isToday ? '#10b981' : '#ffffff'}
                />

                {/* Check-in Value Label above node */}
                <text
                  x={pt.x}
                  y={pt.y - (isHovered ? 12 : 9)}
                  textAnchor="middle"
                  fill={isToday ? '#10b981' : pt.val > 0 ? 'var(--text-primary)' : 'var(--text-muted)'}
                  fontSize="9.5"
                  fontWeight={isToday || isHovered ? '800' : '600'}
                  fontFamily="var(--font-heading)"
                >
                  {pt.val}
                </text>

                {/* Day Label on X Axis */}
                <text
                  x={pt.x}
                  y={paddingTop + plotHeight + 18}
                  textAnchor="middle"
                  fill={isToday ? '#10b981' : isHovered ? 'var(--brand-primary)' : 'var(--text-secondary)'}
                  fontSize="10"
                  fontWeight={isToday || isHovered ? '800' : '600'}
                >
                  {pt.day}
                </text>
              </g>
            );
          })}
        </svg>

        {/* HOLOGRAPHIC FLOATING TELEMETRY TOOLTIP */}
        {activePoint && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(80, Math.max(20, (activePoint.x / svgWidth) * 100))}%`,
              top: '12px',
              transform: 'translateX(-50%)',
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 12px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(99, 102, 241, 0.2)',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backdropFilter: 'blur(12px)',
              whiteSpace: 'nowrap',
            }}
          >
            <div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {activePoint.day} • {activePoint.date}
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{activePoint.val} Check-ins</span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: activePoint.val > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                    color: activePoint.val > 0 ? '#34d399' : 'var(--text-muted)',
                  }}
                >
                  {activePoint.val > 10 ? 'High Surge' : activePoint.val > 0 ? 'Normal Flow' : 'Floor Inactive'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CAPACITY & FLOOR OCCUPANCY TELEMETRY BAR */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: currentlyInGym > 0 ? '#10b981' : '#94a3b8',
                boxShadow: currentlyInGym > 0 ? '0 0 8px #10b981' : 'none',
              }}
            />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('dash_floor_occupancy', 'Floor Occupancy')}:
            </span>
            <span style={{ fontSize: '0.74rem', color: currentlyInGym > 0 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
              {currentlyInGym} active athletes
            </span>
          </div>

          {/* Micro Capacity Gauge Rail */}
          <div
            style={{
              flex: 1,
              maxWidth: '140px',
              height: '5px',
              borderRadius: '9999px',
              background: 'var(--border-subtle)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${Math.max(4, occupancyPercent)}%`,
                height: '100%',
                borderRadius: '9999px',
                background:
                  occupancyPercent > 80
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(90deg, #06b6d4, #10b981)',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            {occupancyPercent}% cap
          </span>
        </div>

        <Link
          href={linkHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: 'var(--brand-primary, #6366f1)',
            textDecoration: 'none',
            transition: 'gap 0.15s ease',
          }}
        >
          <span>{displayLinkLabel}</span>
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
