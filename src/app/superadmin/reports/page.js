'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useGym } from '../../../context/GymContext';
import {
  FileBarChart,
  Download,
  RefreshCw,
  Search,
  Building2,
  TrendingUp,
  CreditCard,
  Users,
  QrCode,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Coins,
  GitBranch,
  ExternalLink,
  Flame,
  Award,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function SuperAdminReportsPage() {
  const { token } = useAuth();
  const { switchGym } = useGym();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, main, branch, pro, enterprise

  const fetchReports = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/superadmin/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    if (token) fetchReports();
  }, [token]);

  // Determine Greeting & Formatted Date
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        (r.gymName && r.gymName.toLowerCase().includes(q)) ||
        (r.branchName && r.branchName.toLowerCase().includes(q)) ||
        (r.ownerName && r.ownerName.toLowerCase().includes(q)) ||
        (r.ownerEmail && r.ownerEmail.toLowerCase().includes(q)) ||
        (r.subscriptionPlan && r.subscriptionPlan.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterType === 'main') return !r.isBranch;
      if (filterType === 'branch') return !!r.isBranch;
      if (filterType === 'pro') return r.subscriptionPlan === 'pro';
      if (filterType === 'enterprise') return r.subscriptionPlan === 'enterprise';

      return true;
    });
  }, [reports, search, filterType]);

  const totalRev = reports.reduce((acc, r) => acc + (r.totalRevenue || 0), 0);
  const totalMems = reports.reduce((acc, r) => acc + (r.totalMembers || 0), 0);
  const totalActiveMems = reports.reduce((acc, r) => acc + (r.activeMembers || 0), 0);
  const totalAtt = reports.reduce((acc, r) => acc + (r.attendanceTotal || 0), 0);
  const avgRevPerGym = reports.length > 0 ? Math.round(totalRev / reports.length) : 0;
  const retentionRate = totalMems > 0 ? Math.round((totalActiveMems / totalMems) * 100) : 100;

  // Highlights
  const topGymByRevenue = [...reports].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))[0];
  const topGymByScans = [...reports].sort((a, b) => (b.attendanceTotal || 0) - (a.attendanceTotal || 0))[0];

  const handleExportCSV = () => {
    if (reports.length === 0) return;
    const headers = [
      'Gym Name',
      'Type',
      'Branch Info',
      'Owner Name',
      'Owner Email',
      'Total Members',
      'Active Members',
      'Total Revenue (INR)',
      'Total Check-Ins',
      'SaaS Plan',
      'Status',
    ];

    const rows = filteredReports.map((r) => [
      `"${r.gymName}"`,
      r.isBranch ? 'Branch' : 'Main Facility',
      `"${r.branchName || 'Main'}"`,
      `"${r.ownerName}"`,
      `"${r.ownerEmail}"`,
      r.totalMembers || 0,
      r.activeMembers || 0,
      r.totalRevenue || 0,
      r.attendanceTotal || 0,
      r.subscriptionPlan || 'pro',
      r.status || 'Active',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `FeeOrbit_Consolidated_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImpersonate = (gymId) => {
    switchGym(gymId);
    window.location.href = '/';
  };

  return (
    <div style={{ paddingBottom: '20px' }}>
      {/* 1. HERO BANNER: 100% Aligned with Admin & SuperAdmin Hub */}
      <div className="hero-banner-container">
        <div className="hero-banner-left">
          <h1
            style={{
              fontSize: '1.28rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              lineHeight: 1.15,
            }}
          >
            Consolidated Multi-Gym Reports 📊
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '3px', marginBottom: '8px' }}>
            Cross-gym financial performance, member headcount comparison & platform analytics.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '5px',
                fontSize: '0.68rem',
                color: '#cbd5e1',
                fontWeight: 600,
              }}
            >
              <Calendar size={11} style={{ color: '#94a3b8' }} />
              {formattedDate}
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                borderRadius: '5px',
                fontSize: '0.68rem',
                color: '#34d399',
                fontWeight: 700,
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
              {reports.length} Platform Facilities Active
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                borderRadius: '5px',
                fontSize: '0.68rem',
                color: '#c084fc',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <ShieldCheck size={11} />
              Platform Financial Audit
            </div>
          </div>
        </div>

        {/* Right Side: Photo Banner with Overlaid Quote matching Admin */}
        <div className="hero-banner-right">
          <div className="hero-banner-overlay" />
          <div className="hero-banner-quote" style={{ position: 'relative', zIndex: 3, maxWidth: '300px' }}>
            <div
              style={{
                fontStyle: 'italic',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#f1f5f9',
                lineHeight: 1.3,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.95)',
              }}
            >
              &ldquo;Transparent Financial Auditing Across Every Network Facility&rdquo;
            </div>
            <div
              style={{
                fontSize: '0.66rem',
                fontWeight: 600,
                color: '#94a3b8',
                marginTop: '3px',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.95)',
              }}
            >
              — FeeOrbit Multi-Tenant Cloud
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY 4 KPI CARDS: Matching Admin Design System Exactly */}
      <div className="kpi-card-grid">
        {/* Card 1: Platform Gross Volume */}
        <div
          className="kpi-stat-card"
          style={{
            background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.22) 0%, rgba(13, 20, 37, 0.95) 100%)',
            borderColor: 'rgba(245, 158, 11, 0.4)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 10px rgba(217, 119, 6, 0.45)',
              flexShrink: 0,
            }}
          >
            <Coins size={18} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              PLATFORM GROSS VOLUME
            </div>
            <div
              style={{
                fontSize: '1.55rem',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                marginTop: '1px',
              }}
            >
              ₹{totalRev.toLocaleString('en-IN')}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '2px',
              }}
            >
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                Across {reports.length} facilities
              </span>
              <span
                style={{
                  color: '#fbbf24',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                ✓ Reconciled
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Platform Members */}
        <div
          className="kpi-stat-card"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(13, 20, 37, 0.95) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.45)',
              flexShrink: 0,
            }}
          >
            <Users size={18} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              TOTAL REGISTERED MEMBERS
            </div>
            <div
              style={{
                fontSize: '1.55rem',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                marginTop: '1px',
              }}
            >
              {totalMems}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '2px',
              }}
            >
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                {totalActiveMems} Active Members
              </span>
              <span
                style={{
                  color: '#34d399',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                ▲ {retentionRate}% Active
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Workout Scans */}
        <div
          className="kpi-stat-card"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(13, 20, 37, 0.95) 100%)',
            borderColor: 'rgba(6, 182, 212, 0.4)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 10px rgba(6, 182, 212, 0.45)',
              flexShrink: 0,
            }}
          >
            <QrCode size={18} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              TOTAL WORKOUT SCANS
            </div>
            <div
              style={{
                fontSize: '1.55rem',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                marginTop: '1px',
              }}
            >
              {totalAtt}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '2px',
              }}
            >
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                Kiosk & QR check-ins
              </span>
              <span
                style={{
                  color: '#22d3ee',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                ✓ Realtime Sync
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Avg Revenue Per Facility */}
        <div
          className="kpi-stat-card"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.28) 0%, rgba(13, 20, 37, 0.95) 100%)',
            borderColor: 'rgba(139, 92, 246, 0.45)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 10px rgba(124, 58, 237, 0.45)',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={18} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              AVG REVENUE / FACILITY
            </div>
            <div
              style={{
                fontSize: '1.55rem',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                marginTop: '1px',
              }}
            >
              ₹{avgRevPerGym.toLocaleString('en-IN')}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '2px',
              }}
            >
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                Benchmark run-rate
              </span>
              <span
                style={{
                  color: '#c084fc',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                ▲ Healthy SaaS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTER & TOOLBAR CARD */}
      <div
        style={{
          background: '#0d1425',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '10px 14px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Search input + Filter pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          <div
            style={{
              position: 'relative',
              width: '260px',
              background: '#090e1a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px 0 28px',
            }}
          >
            <Search size={12} style={{ position: 'absolute', left: '9px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search gym, owner, email, plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: '30px',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.74rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Quick Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {[
              { id: 'all', label: `All (${reports.length})` },
              { id: 'main', label: 'Main Facilities' },
              { id: 'branch', label: 'Branches' },
              { id: 'pro', label: 'Pro Plan' },
              { id: 'enterprise', label: 'Enterprise' },
            ].map((f) => {
              const isSelected = filterType === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id)}
                  style={{
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#a5b4fc' : '#94a3b8',
                    padding: '3px 9px',
                    borderRadius: '5px',
                    fontSize: '0.68rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Showing <strong style={{ color: '#ffffff' }}>{filteredReports.length}</strong> of {reports.length} Facilities
          </span>

          <button
            type="button"
            onClick={() => fetchReports(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '7px',
              padding: '0 10px',
              height: '30px',
              color: '#cbd5e1',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={11} className={refreshing ? 'spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '7px',
              padding: '0 12px',
              height: '30px',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={12} strokeWidth={2.4} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4. MASTER FINANCIAL & PERFORMANCE TABLE */}
      <div
        style={{
          background: '#0d1425',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '12px 14px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700, width: '28%' }}>Gym Facility / Location</th>
                <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700, width: '22%' }}>Owner Details</th>
                <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700, textAlign: 'center', width: '10%' }}>Scale</th>
                <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700, textAlign: 'center', width: '10%' }}>Active</th>
                <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700, textAlign: 'center', width: '11%' }}>Fee Volume</th>
                <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700, textAlign: 'center', width: '11%' }}>Scans</th>
                <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700, textAlign: 'center', width: '9%' }}>SaaS Tier</th>
                <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700, textAlign: 'center', width: '8%' }}>Status</th>
                <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700, textAlign: 'right', width: '8%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={24} style={{ color: '#475569' }} />
                      <div>No facility records found matching your query.</div>
                      {search && (
                        <button
                          type="button"
                          onClick={() => { setSearch(''); setFilterType('all'); }}
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: '#818cf8',
                            padding: '3px 10px',
                            borderRadius: '5px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const initial = (r.gymName || 'G').charAt(0).toUpperCase();
                  const isBranch = !!r.isBranch;

                  return (
                    <tr
                      key={r.gymId}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Facility Brand & Branch */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              background: isBranch
                                ? 'linear-gradient(135deg, #0284c7, #06b6d4)'
                                : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            {isBranch ? <GitBranch size={14} /> : initial}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.82rem' }}>
                                {r.gymName}
                              </span>
                              {isBranch ? (
                                <span
                                  style={{
                                    fontSize: '0.56rem',
                                    fontWeight: 800,
                                    color: '#38bdf8',
                                    background: 'rgba(56, 189, 248, 0.12)',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                    borderRadius: '3px',
                                    padding: '1px 5px',
                                    lineHeight: 1.1,
                                  }}
                                >
                                  Branch
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '0.56rem',
                                    fontWeight: 800,
                                    color: '#a78bfa',
                                    background: 'rgba(139, 92, 246, 0.12)',
                                    border: '1px solid rgba(139, 92, 246, 0.25)',
                                    borderRadius: '3px',
                                    padding: '1px 5px',
                                    lineHeight: 1.1,
                                  }}
                                >
                                  Main Hub
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '1px' }}>
                              {r.branchName || 'Headquarters'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Details */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.78rem' }}>
                          {r.ownerName}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '1px' }}>
                          {r.ownerEmail}
                        </div>
                      </td>

                      {/* Total Scale */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.84rem' }}>
                          {r.totalMembers || 0}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Members</div>
                      </td>

                      {/* Active Members */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontWeight: 800,
                            color: '#34d399',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                          }}
                        >
                          {r.activeMembers || 0}
                        </span>
                      </td>

                      {/* Fee Volume */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.84rem' }}>
                          ₹{(r.totalRevenue || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Processed</div>
                      </td>

                      {/* Attendance Scans */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.84rem' }}>
                          {r.attendanceTotal || 0}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Scans</div>
                      </td>

                      {/* SaaS Tier */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          style={{
                            background:
                              r.subscriptionPlan === 'enterprise'
                                ? 'rgba(245, 158, 11, 0.18)'
                                : r.subscriptionPlan === 'pro'
                                ? 'rgba(139, 92, 246, 0.18)'
                                : 'rgba(56, 189, 248, 0.18)',
                            border:
                              r.subscriptionPlan === 'enterprise'
                                ? '1px solid rgba(245, 158, 11, 0.35)'
                                : r.subscriptionPlan === 'pro'
                                ? '1px solid rgba(139, 92, 246, 0.35)'
                                : '1px solid rgba(56, 189, 248, 0.35)',
                            color:
                              r.subscriptionPlan === 'enterprise'
                                ? '#fbbf24'
                                : r.subscriptionPlan === 'pro'
                                ? '#c084fc'
                                : '#38bdf8',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {r.subscriptionPlan || 'trial'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            background: r.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: r.status === 'Active' ? '#34d399' : '#f87171',
                            border: r.status === 'Active' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: r.status === 'Active' ? '#10b981' : '#ef4444',
                            }}
                          />
                          {r.status || 'Active'}
                        </span>
                      </td>

                      {/* Action: 1-Click Jump In */}
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleImpersonate(r.gymId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '4px 9px',
                            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                            border: 'none',
                            borderRadius: '5px',
                            color: '#ffffff',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                          }}
                          title="Jump directly into this facility's workspace"
                        >
                          <span>Open</span>
                          <ExternalLink size={10} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. BOTTOM SUMMARY INSIGHT TILES */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '8px',
          marginTop: '8px',
        }}
      >
        {/* Top Earning Facility */}
        <div
          style={{
            background: '#0d1425',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '7px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              flexShrink: 0,
            }}
          >
            <Award size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
              Top Earning Facility
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topGymByRevenue?.gymName || 'FeeOrbit Flagship Club'}
            </div>
            <div style={{ fontSize: '0.64rem', color: '#fbbf24', fontWeight: 600 }}>
              ₹{(topGymByRevenue?.totalRevenue || 0).toLocaleString('en-IN')} volume recorded
            </div>
          </div>
        </div>

        {/* Top Footfall Location */}
        <div
          style={{
            background: '#0d1425',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '7px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22d3ee',
              flexShrink: 0,
            }}
          >
            <Flame size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
              Highest Traffic Facility
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topGymByScans?.gymName || 'FeeOrbit Flagship Club'}
            </div>
            <div style={{ fontSize: '0.64rem', color: '#22d3ee', fontWeight: 600 }}>
              {topGymByScans?.attendanceTotal || 4} total check-in entries
            </div>
          </div>
        </div>

        {/* Platform Cloud Multi-Tenant Security */}
        <div
          style={{
            background: '#0d1425',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '7px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
              Multi-Tenant Cloud Health
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff' }}>
              100% Tenant Isolation
            </div>
            <div style={{ fontSize: '0.64rem', color: '#34d399', fontWeight: 600 }}>
              Automated DB Backup & Edge Routing Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
