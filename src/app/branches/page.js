'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import {
  GitBranch,
  Building2,
  Plus,
  Phone,
  MapPin,
  CheckCircle2,
  Users,
  RefreshCw,
  X,
  Sparkles,
  Coins,
  ShieldCheck,
  Search,
  ArrowRight,
  Crown,
  Layers,
  Activity,
  Check,
  TrendingUp,
} from 'lucide-react';

export default function BranchesPage() {
  const { user } = useAuth();
  const { currentGym, switchGym, refreshGyms, formatCurrency } = useGym();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'hq', 'branch'

  // Form states for creating a branch
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchBranches = async (isManual = false) => {
    if (!currentGym) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      // Find parent gym id (if current is a branch, take parent; else take current._id)
      const parentId = currentGym.parentGym || currentGym._id;
      const res = await fetch(`/api/gyms/${parentId}/branches`);
      const data = await res.json();
      if (data.success) {
        setBranches(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [currentGym]);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!branchName || !branchPhone) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const parentId = currentGym.parentGym || currentGym._id;
      const res = await fetch('/api/gyms/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentGymId: parentId,
          branchName,
          branchCode: branchCode || `BR-${Date.now().toString().slice(-3)}`,
          phone: branchPhone,
          address: branchAddress || currentGym.address,
          ownerId: user?._id || user?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setBranchName('');
        setBranchCode('');
        setBranchPhone('');
        setBranchAddress('');
        await refreshGyms();
        await fetchBranches();
        switchGym(data.data._id);
      } else {
        setFormError(data.message || 'Failed to create branch');
      }
    } catch (err) {
      setFormError('Server connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Date formatted
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Aggregated network stats
  const totalBranches = branches.length;
  const hqBranch = branches.find((b) => !b.isBranch) || branches[0];
  const childBranches = branches.filter((b) => b.isBranch);
  const totalMembers = branches.reduce((acc, b) => acc + (b.memberCount || 0), 0);
  const totalActiveMembers = branches.reduce((acc, b) => acc + (b.activeMembers || 0), 0);
  const totalRevenue = branches.reduce((acc, b) => acc + (b.totalRevenue || 0), 0);
  const memberRetention = totalMembers > 0 ? Math.round((totalActiveMembers / totalMembers) * 100) : 100;

  // Filtered branches
  const filteredBranches = branches.filter((b) => {
    // Type filter
    if (filterType === 'hq' && b.isBranch) return false;
    if (filterType === 'branch' && !b.isBranch) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.branchCode?.toLowerCase().includes(q) ||
      b.phone?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* 1. HERO BANNER: Compact 96px Height matching Admin & SuperAdmin Dashboards */}
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
            Multi-Branch Network Command 🌿
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '3px', marginBottom: '8px' }}>
            Manage multiple physical facilities, isolated member databases, staff teams & cross-branch financial streams.
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
              <Activity size={11} style={{ color: '#94a3b8' }} />
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
              {totalBranches} {totalBranches === 1 ? 'Location Connected' : 'Locations Connected'}
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '5px',
                fontSize: '0.68rem',
                color: '#a5b4fc',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <Crown size={11} />
              HQ: {hqBranch?.name?.replace(/ - .*/, '') || currentGym?.name || 'Main Brand'}
            </div>
          </div>
        </div>

        {/* Right Side: Dumbbells Photo with Overlaid Quote */}
        <div className="hero-banner-right">
          <div className="hero-banner-overlay" />
          <div className="hero-banner-quote" style={{ position: 'relative', zIndex: 3, maxWidth: '290px' }}>
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
              &ldquo;Expanding Strength Across Every City & Neighborhood&rdquo;
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
              — FeeOrbit Franchise Cloud
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY 4 KPI CARDS: Fully theme-adaptive across Light & Dark */}
      <div className="kpi-card-grid">
        {/* Total Branch Nodes */}
        <div
          className="kpi-stat-card"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
              flexShrink: 0,
            }}
          >
            <Building2 size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Network Nodes
            </div>
            <div style={{ fontSize: '1.24rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '2px' }}>
              {totalBranches}
            </div>
            <div style={{ fontSize: '0.64rem', color: 'var(--brand-cyan, #0284c7)', marginTop: '2px', fontWeight: 600 }}>
              1 HQ + {childBranches.length} Branch Facilities
            </div>
          </div>
        </div>

        {/* Cross-Branch Members */}
        <div
          className="kpi-stat-card"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              flexShrink: 0,
            }}
          >
            <Users size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Cross-Branch Athletes
            </div>
            <div style={{ fontSize: '1.24rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '2px' }}>
              {totalActiveMembers.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.64rem', color: 'var(--brand-emerald, #10b981)', marginTop: '2px', fontWeight: 600 }}>
              {totalMembers.toLocaleString('en-IN')} Total ({memberRetention}% Active Retention)
            </div>
          </div>
        </div>

        {/* Aggregated Revenue Volume */}
        <div
          className="kpi-stat-card"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
              flexShrink: 0,
            }}
          >
            <Coins size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Network Revenue Volume
            </div>
            <div style={{ fontSize: '1.24rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '2px' }}>
              {formatCurrency(totalRevenue)}
            </div>
            <div style={{ fontSize: '0.64rem', color: '#d97706', marginTop: '2px', fontWeight: 600 }}>
              Aggregated collections across all nodes
            </div>
          </div>
        </div>

        {/* Architecture & Scaling */}
        <div
          className="kpi-stat-card"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.35)',
              flexShrink: 0,
            }}
          >
            <GitBranch size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Franchise Architecture
            </div>
            <div style={{ fontSize: '1.24rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '2px' }}>
              Partitioned
            </div>
            <div style={{ fontSize: '0.64rem', color: 'var(--brand-primary, #6366f1)', marginTop: '2px', fontWeight: 600 }}>
              Isolated rosters, billing & staff shifts
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTROL & SEARCH BAR */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left: Search & Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: '360px',
            }}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '11px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search branches by name, code, phone, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 34px',
                background: 'var(--bg-input, var(--bg-card-solid))',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: filterType === 'all' ? '1px solid var(--brand-primary, #6366f1)' : '1px solid var(--border-subtle)',
                background: filterType === 'all' ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.18))' : 'transparent',
                color: filterType === 'all' ? 'var(--brand-primary, #6366f1)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              All ({branches.length})
            </button>
            <button
              onClick={() => setFilterType('hq')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: filterType === 'hq' ? '1px solid var(--brand-primary, #6366f1)' : '1px solid var(--border-subtle)',
                background: filterType === 'hq' ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.18))' : 'transparent',
                color: filterType === 'hq' ? 'var(--brand-primary, #6366f1)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              HQ ({branches.filter((b) => !b.isBranch).length})
            </button>
            <button
              onClick={() => setFilterType('branch')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: filterType === 'branch' ? '1px solid var(--brand-primary, #6366f1)' : '1px solid var(--border-subtle)',
                background: filterType === 'branch' ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.18))' : 'transparent',
                color: filterType === 'branch' ? 'var(--brand-primary, #6366f1)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Child Branches ({childBranches.length})
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => fetchBranches(true)}
            disabled={loading || refreshing}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', padding: '6px 12px' }}
          >
            <RefreshCw size={13} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              padding: '6px 14px',
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              boxShadow: '0 2px 10px rgba(79, 70, 229, 0.35)',
            }}
          >
            <Plus size={15} /> Add New Branch
          </button>
        </div>
      </div>

      {/* 4. BRANCH CARDS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {filteredBranches.map((b) => {
          const isCurrent = currentGym?._id === b._id;
          const isHQ = !b.isBranch;

          return (
            <div
              key={b._id}
              style={{
                background: isCurrent
                  ? 'linear-gradient(145deg, var(--brand-primary-light, rgba(99, 102, 241, 0.12)) 0%, var(--bg-card) 100%)'
                  : 'var(--bg-card)',
                border: isCurrent ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isCurrent
                  ? '0 10px 28px -4px rgba(99, 102, 241, 0.25), 0 0 0 1px var(--brand-primary)'
                  : 'var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.05))',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Active Workspace Floating Badge */}
              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-11px',
                    right: '16px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.45)',
                  }}
                >
                  <CheckCircle2 size={12} /> ACTIVE WORKSPACE
                </div>
              )}

              <div>
                {/* Header: Facility Icon + Name & Badges */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: isHQ
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.4))'
                        : 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(8, 145, 178, 0.4))',
                      color: isHQ ? '#818cf8' : '#22d3ee',
                      border: isHQ ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(6, 182, 212, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: isHQ ? '0 0 14px rgba(99, 102, 241, 0.25)' : '0 0 14px rgba(6, 182, 212, 0.25)',
                    }}
                  >
                    {isHQ ? <Crown size={22} /> : <Building2 size={22} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        margin: 0,
                        lineHeight: 1.25,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={b.name}
                    >
                      {b.name}
                    </h3>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.08))',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {b.branchCode || (isHQ ? 'HQ-01' : 'BRANCH')}
                      </span>

                      <span
                        style={{
                          background: isHQ ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.15))' : 'rgba(6, 182, 212, 0.15)',
                          border: isHQ ? '1px solid var(--border-glow, rgba(99, 102, 241, 0.3))' : '1px solid rgba(6, 182, 212, 0.3)',
                          color: isHQ ? 'var(--brand-primary, #6366f1)' : '#0891b2',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                        }}
                      >
                        {isHQ ? 'Main Headquarters' : 'Child Facility'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2x2 Metric Matrix inside card */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.03))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={11} style={{ color: '#38bdf8' }} /> Active Athletes
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {b.activeMembers || 0}{' '}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        / {b.memberCount || 0}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.03))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Coins size={11} style={{ color: '#f59e0b' }} /> Revenue Stream
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                      {formatCurrency(b.totalRevenue || 0)}
                    </div>
                  </div>
                </div>

                {/* Contact & Location Details */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                    marginBottom: '16px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{b.phone || 'Phone on record'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                    <span
                      style={{
                        lineHeight: 1.35,
                        color: 'var(--text-secondary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={b.address}
                    >
                      {b.address || 'Facility location on file'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: 'auto' }}>
                {isCurrent ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '9px 14px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      color: '#059669',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    <Check size={15} /> Currently Managing This Branch
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchGym(b._id)}
                    className="btn btn-primary btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '9px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      gap: '8px',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    }}
                  >
                    Switch To This Branch <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. CROSS-FACILITY OPERATIONAL MATRIX & BENCHMARK TABLE */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-md, 0 4px 20px rgba(0, 0, 0, 0.08))',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.02))',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--brand-primary, #818cf8)' }} />
              Facility Operations & Performance Matrix
            </h2>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Real-time cross-branch operational breakdown, member rosters & processed fees.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              Showing {filteredBranches.length} of {branches.length} Facilities
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.02))', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px 18px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Facility & Code
                </th>
                <th style={{ padding: '12px 18px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hierarchy Tier
                </th>
                <th style={{ padding: '12px 18px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Location & Contact
                </th>
                <th style={{ padding: '12px 18px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Athletes Scale
                </th>
                <th style={{ padding: '12px 18px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Processed Volume
                </th>
                <th style={{ padding: '12px 18px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Status
                </th>
                <th style={{ padding: '12px 18px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((b) => {
                const isCurrent = currentGym?._id === b._id;
                const isHQ = !b.isBranch;
                const percent = b.memberCount > 0 ? Math.round(((b.activeMembers || 0) / b.memberCount) * 100) : 0;

                return (
                  <tr
                    key={b._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isCurrent ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.06))' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Facility & Code */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isHQ ? 'rgba(99, 102, 241, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                            color: isHQ ? '#818cf8' : '#22d3ee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isHQ ? <Crown size={16} /> : <Building2 size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{b.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                            Code: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{b.branchCode || (isHQ ? 'HQ' : 'BRANCH')}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Hierarchy Tier */}
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: isHQ ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.15))' : 'rgba(6, 182, 212, 0.15)',
                          border: isHQ ? '1px solid var(--border-glow, rgba(99, 102, 241, 0.3))' : '1px solid rgba(6, 182, 212, 0.3)',
                          color: isHQ ? 'var(--brand-primary, #6366f1)' : '#0891b2',
                        }}
                      >
                        {isHQ ? 'HQ Master Hub' : 'Satellite Facility'}
                      </span>
                    </td>

                    {/* Location & Contact */}
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 500 }}>{b.phone || 'Phone on file'}</div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          maxWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px',
                        }}
                        title={b.address}
                      >
                        {b.address || 'Address registered'}
                      </div>
                    </td>

                    {/* Athletes Scale */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {b.activeMembers || 0} active{' '}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({b.memberCount || 0} total)</span>
                      </div>
                      <div
                        style={{
                          width: '110px',
                          height: '4px',
                          background: 'var(--border-subtle)',
                          borderRadius: '3px',
                          marginTop: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, percent)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #10b981, #059669)',
                          }}
                        />
                      </div>
                    </td>

                    {/* Processed Volume */}
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#d97706' }}>
                      {formatCurrency(b.totalRevenue || 0)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 18px' }}>
                      {isCurrent ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                          Current Active
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.05))',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                          }}
                        >
                          Ready to Switch
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      {isCurrent ? (
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Active</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => switchGym(b._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '4px 10px', gap: '4px' }}
                        >
                          Switch <ArrowRight size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. FRANCHISE ARCHITECTURE & SCALING HIGHLIGHTS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1 */}
        <div
          style={{
            background: 'var(--bg-card-solid)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Tenant Data Isolation
            </h4>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Each facility maintains independent athlete records, trainer shift schedules, equipment logs, and payment receipts for complete operational integrity.
          </p>
        </div>

        {/* Card 2 */}
        <div
          style={{
            background: 'var(--bg-card-solid)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Instant Context Switching
            </h4>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Gym owners and regional directors can jump across all branch dashboards instantly from the top header selector without logging in or out.
          </p>
        </div>

        {/* Card 3 */}
        <div
          style={{
            background: 'var(--bg-card-solid)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={18} />
            </div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Franchise Scalability
            </h4>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Expand seamlessly to new neighborhoods, commercial zones, or cities. Add new branch locations in seconds with dedicated branch identification codes.
          </p>
        </div>
      </div>

      {/* 7. ADD NEW BRANCH MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              background: 'var(--bg-card-solid, var(--bg-card))',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-modal, 0 20px 50px rgba(0, 0, 0, 0.35))',
            }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', padding: '18px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Add New Branch Facility
                  </h2>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Expand your gym network under the {currentGym?.name} franchise.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  margin: '16px 24px 0',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateBranch}>
              <div className="modal-body" style={{ padding: '20px 24px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Branch / Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Sector 62 Branch, Indiranagar Hub, Downtown..."
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    style={{
                      background: 'var(--bg-input, var(--bg-card-solid))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontSize: '0.84rem',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Will be titled as:{' '}
                    <span style={{ color: 'var(--brand-primary, #6366f1)', fontWeight: 600 }}>
                      "{currentGym?.name?.replace(/ - .*/, '')} – {branchName || '[Branch Name]'}"
                    </span>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Branch Code
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. NOIDA-02, BLR-01"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                      style={{
                        background: 'var(--bg-input, var(--bg-card-solid))',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '9px 12px',
                        fontSize: '0.84rem',
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Contact Phone *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. +91 98765 00000"
                      value={branchPhone}
                      onChange={(e) => setBranchPhone(e.target.value)}
                      style={{
                        background: 'var(--bg-input, var(--bg-card-solid))',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '9px 12px',
                        fontSize: '0.84rem',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Facility Physical Address
                  </label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="e.g. Plot 12, Electronic City, Sector 62, Noida, Uttar Pradesh"
                    value={branchAddress}
                    onChange={(e) => setBranchAddress(e.target.value)}
                    style={{
                      background: 'var(--bg-input, var(--bg-card-solid))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontSize: '0.84rem',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div
                className="modal-footer"
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '16px 24px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.82rem',
                    padding: '8px 18px',
                    background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                    boxShadow: '0 2px 12px rgba(79, 70, 229, 0.4)',
                  }}
                >
                  {submitting ? 'Creating Branch...' : 'Create & Launch Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
