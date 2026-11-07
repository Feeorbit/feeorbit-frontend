'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import FeeOrbitLoadingScreen from '../../components/FeeOrbitLoadingScreen';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  QrCode,
  ArrowRight,
  TrendingUp,
  Activity,
  Plus,
  RefreshCw,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Crown,
  Search,
  Check,
  X,
  Lock,
  Phone,
  Mail,
  MapPin,
  Power,
  Zap,
  Calendar,
  Clock,
  Coins,
  Wallet,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
import FuturisticVelocityChart from '../../components/FuturisticVelocityChart';

export default function SuperAdminDashboardPage() {
  const { user, token } = useAuth();
  const { switchGym, refreshGyms } = useGym();
  const [stats, setStats] = useState({
    totalGyms: 2,
    totalBranches: 1,
    activeTenants: 3,
    totalMembers: 3,
    activeMembers: 3,
    saasMrr: 3998,
    todayAttendanceCount: 0,
    liveInsidePlatform: 0,
    totalRevenue: 0,
    planBreakdown: { trial: 1, starter: 0, pro: 2, enterprise: 0 },
    last7DaysTraffic: [],
    recentCheckIns: [],
    recentGyms: [],
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Quick Onboard Gym Modal
  const [showAddGymModal, setShowAddGymModal] = useState(false);
  const [newGymData, setNewGymData] = useState({
    gymName: '',
    phone: '',
    address: '',
    adminName: '',
    adminEmail: '',
    adminPassword: 'Password@123',
    subscriptionPlan: 'pro',
  });
  const [creatingGym, setCreatingGym] = useState(false);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/superadmin/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Could not fetch platform stats');
      }
    } catch (err) {
      setError('Connection error with server');
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    if (token) fetchStats();
  }, [token]);

  // Determine Greeting & Formatted Date
  const now = new Date();
  const currentHour = now.getHours();
  let greetingTime = 'Good Evening';
  if (currentHour < 12) greetingTime = 'Good Morning';
  else if (currentHour < 17) greetingTime = 'Good Afternoon';

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Toggle gym status (Active / Suspended)
  const handleToggleStatus = async (gymId, e) => {
    e.stopPropagation();
    setActionLoadingId(gymId);
    try {
      const res = await fetch(`/api/superadmin/gyms/${gymId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentGyms: prev.recentGyms.map((g) =>
              g._id === gymId ? { ...g, isActive: !g.isActive } : g
            ),
          };
        });
      } else {
        alert(data.message || 'Error updating status');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Jump into gym workspace
  const handleImpersonate = (gymId) => {
    switchGym(gymId);
    window.location.href = '/';
  };

  // Create new gym tenant
  const handleCreateGym = async (e) => {
    e.preventDefault();
    if (!newGymData.gymName || !newGymData.adminEmail || !newGymData.phone) return;

    setCreatingGym(true);
    try {
      const res = await fetch('/api/superadmin/gyms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newGymData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddGymModal(false);
        setNewGymData({
          gymName: '',
          phone: '',
          address: '',
          adminName: '',
          adminEmail: '',
          adminPassword: 'Password@123',
          subscriptionPlan: 'pro',
        });
        await fetchStats();
        if (refreshGyms) refreshGyms(true);
        alert(`Success: Gym "${data.data.gym.name}" onboarded with Admin account!`);
      } else {
        alert(data.message || 'Error creating gym');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setCreatingGym(false);
    }
  };

  const filteredGyms = (stats?.recentGyms || []).filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.owner?.name?.toLowerCase().includes(q) ||
      g.owner?.email?.toLowerCase().includes(q) ||
      g.phone?.includes(q)
    );
  });

  // Calculate max check-in for 7-day chart
  const trafficDays = stats?.last7DaysTraffic || [];
  const maxTraffic = Math.max(5, ...trafficDays.map((d) => Number(d.checkIns || 0)));

  // Recent cross-gym activity formatted
  const recentActivities = (stats?.recentCheckIns || []).map((item) => {
    const timeStr = item.checkIn
      ? new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      : 'Recent';
    const memberName = item.member?.fullName || 'Member';
    const initials = memberName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return {
      id: item._id,
      name: memberName,
      gymName: item.gym?.name || 'Partner Gym',
      time: timeStr,
      avatarInitial: initials || 'MB',
      method: item.method || 'kiosk',
    };
  });

  if (loading && !stats) {
    return <FeeOrbitLoadingScreen variant="inline" message="Loading SuperAdmin Command Center..." />;
  }

  return (
    <div style={{ paddingBottom: '16px' }}>
      {/* 1. HERO BANNER: Compact 96px Height matching Admin Dashboard */}
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
            {greetingTime}, SuperAdmin 👋
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '3px', marginBottom: '8px' }}>
            Unified control center for all gym tenants, multi-branch operations & SaaS revenue.
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
              Multi-Tenant Cloud Active
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
              Platform Master Key
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
              &ldquo;Scaling Global Fitness Franchises With Multi-Tenant Architecture&rdquo;
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

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            padding: '6px 10px',
            color: '#f87171',
            marginBottom: '8px',
            fontSize: '0.74rem',
          }}
        >
          {error}
        </div>
      )}

      {/* 2. PRIMARY 4 KPI CARDS: 1:1 match with Admin Dashboard Aesthetics */}
      <div className="kpi-card-grid">
        {/* Card 1: Estimated SaaS MRR */}
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
            <Crown size={18} />
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
              ESTIMATED SAAS MRR
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
              ₹{(stats?.saasMrr || 0).toLocaleString('en-IN')}
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
                ARR: ₹{((stats?.saasMrr || 0) * 12).toLocaleString('en-IN')} / yr
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
                ▲ Realtime MRR
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Gym Brands & Branches */}
        <div
          className="kpi-stat-card"
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.22) 0%, rgba(13, 20, 37, 0.95) 100%)',
            borderColor: 'rgba(59, 130, 246, 0.4)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.45)',
              flexShrink: 0,
            }}
          >
            <Building2 size={18} />
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
              GYM BRANDS & BRANCHES
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
              {stats?.totalGyms || 0}{' '}
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>
                ({stats?.totalBranches || 0} br)
              </span>
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
                {stats?.activeTenants || 0} active subscriptions
              </span>
              <span
                style={{
                  color: '#38bdf8',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                ✓ 100% Online
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Network Members */}
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
              TOTAL NETWORK MEMBERS
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
              {stats?.totalMembers || 0}
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
                {stats?.activeMembers || 0} Active Memberships
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
                ▲ Active Retention
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Today's Cross-Gym Check-ins */}
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
            {/* Athletic Running Man Icon matching Admin */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ display: 'block' }}
            >
              <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 6.5 1.3.9-1.9z" />
            </svg>
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
              TODAY'S CROSS-GYM TRAFFIC
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
              {stats?.todayAttendanceCount || 0}
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
                {stats?.liveInsidePlatform || 0} active inside gyms
              </span>
              <span
                style={{
                  color: stats?.liveInsidePlatform > 0 ? '#34d399' : '#94a3b8',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {stats?.liveInsidePlatform > 0 ? (
                  <>
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 5px #10b981',
                      }}
                    />
                    Live Now
                  </>
                ) : (
                  'Checked Out'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL PLATFORM ROW (3 Cards: SaaS Tiers, Platform Volume, Multi-Tenant Infrastructure) */}
      <div className="operational-grid">
        {/* SaaS Subscription Plans */}
        <Link
          href="/superadmin/plans"
          className="operational-card"
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.16) 0%, rgba(13, 20, 37, 0.95) 100%)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
                flexShrink: 0,
              }}
            >
              <CreditCard size={16} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                SAAS PRICING TIERS
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '1px' }}>
                3 Active Plans
              </div>
              <div style={{ fontSize: '0.66rem', color: '#60a5fa', fontWeight: 600 }}>
                Configure Tiers & Pricing &rarr;
              </div>
            </div>
          </div>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'rgba(37, 99, 235, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            <ChevronRight size={16} />
          </div>
        </Link>

        {/* Platform Gross Fee Volume */}
        <Link
          href="/superadmin/reports"
          className="operational-card"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.16) 0%, rgba(13, 20, 37, 0.95) 100%)',
            borderColor: 'rgba(124, 58, 237, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)',
                flexShrink: 0,
              }}
            >
              <Coins size={16} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                PLATFORM GROSS VOLUME
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '1px' }}>
                ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#c084fc', fontWeight: 600 }}>
                Consolidated P&L Audit &rarr;
              </div>
            </div>
          </div>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'rgba(124, 58, 237, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
            }}
          >
            <TrendingUp size={16} />
          </div>
        </Link>

        {/* Multi-Tenant Infrastructure */}
        <Link
          href="/superadmin/gyms"
          className="operational-card"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(13, 20, 37, 0.95) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                flexShrink: 0,
              }}
            >
              <Zap size={16} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                EDGE MULTI-TENANT CLOUD
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '1px' }}>
                99.98% Uptime
              </div>
              <div style={{ fontSize: '0.66rem', color: '#34d399', fontWeight: 600 }}>
                MongoDB Replica Online &rarr;
              </div>
            </div>
          </div>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}
          >
            <CheckCircle2 size={16} />
          </div>
        </Link>

        {/* Platform Broadcasts & Announcements */}
        <Link
          href="/announcements"
          className="operational-card"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(13, 20, 37, 0.95) 100%)',
            borderColor: 'rgba(245, 158, 11, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                flexShrink: 0,
              }}
            >
              <Megaphone size={16} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                PLATFORM BROADCASTS
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '1px' }}>
                Announce to Gyms
              </div>
              <div style={{ fontSize: '0.66rem', color: '#f59e0b', fontWeight: 600 }}>
                Broadcast Updates & Notices &rarr;
              </div>
            </div>
          </div>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}
          >
            <ChevronRight size={16} />
          </div>
        </Link>
      </div>

      {/* 4. MAIN TWO-COLUMN SECTION (Matching Admin Dashboard Split Grid) */}
      <div className="dashboard-split-grid">
        {/* LEFT COLUMN: 7-Day Attendance Trend + Recent Cross-Gym Check-in Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Card 1: Futuristic Cross-Gym Attendance Velocity Chart */}
          <FuturisticVelocityChart
            data={trafficDays}
            currentlyInGym={stats?.activeCheckins || stats?.liveInsidePlatform || 0}
            todayCheckinsCount={stats?.todayCheckins || 0}
            maxCapacity={stats?.totalMembers ? Math.max(100, Math.round(stats.totalMembers * 0.4)) : 200}
            onSync={() => fetchStats(true)}
            refreshing={refreshing}
            title="Cross-Gym Attendance Velocity"
            subtitle="Aggregated daily member check-ins across all client gyms"
            badgeLabel="Platform Live"
            linkLabel="All Facilities"
            linkHref="/superadmin/gyms"
          />

          {/* Card 2: Recent Cross-Gym Check-in Activity */}
          <div
            style={{
              background: '#0d1425',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '10px 14px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: '#818cf8' }} />
                <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                  Live Cross-Gym Activity Stream
                </h3>
              </div>
              <Link
                href="/kiosk"
                style={{
                  color: '#818cf8',
                  textDecoration: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                Kiosk Radar &rarr;
              </Link>
            </div>

            {/* Check-ins Horizontal Grid */}
            <div className="recent-checkins-grid">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
                        }}
                      >
                        {item.avatarInitial}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#f8fafc',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.6rem',
                            color: '#94a3b8',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.time} • {item.gymName}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        background:
                          item.method === 'qr'
                            ? 'rgba(6, 182, 212, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        border:
                          item.method === 'qr'
                            ? '1px solid rgba(6, 182, 212, 0.35)'
                            : '1px solid rgba(16, 185, 129, 0.35)',
                        color: item.method === 'qr' ? '#22d3ee' : '#34d399',
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {item.method === 'qr' ? 'QR Pass' : 'Check-In'}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '12px 14px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px dashed rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    fontSize: '0.72rem',
                  }}
                >
                  No cross-gym check-ins recorded yet today.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SaaS Tier Allocation + Quick Action Hub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Card 1: SaaS Subscription Tier Share */}
          <div
            style={{
              background: '#0d1425',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fbbf24',
                    }}
                  >
                    <Crown size={14} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                      SaaS Subscription Tier Share
                    </h3>
                    <div style={{ fontSize: '0.64rem', color: '#64748b' }}>
                      Active platform pricing tier allocation
                    </div>
                  </div>
                </div>

                <Link
                  href="/superadmin/plans"
                  style={{
                    fontSize: '0.7rem',
                    color: '#818cf8',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Configure &rarr;
                </Link>
              </div>

              {/* Tiers List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Trial Workspaces', count: stats?.planBreakdown?.trial || 0, color: '#38bdf8', price: 'Free 14d' },
                  { label: 'Starter Plan', count: stats?.planBreakdown?.starter || 0, color: '#10b981', price: '₹999/mo' },
                  { label: 'Pro Growth Plan', count: stats?.planBreakdown?.pro || 0, color: '#8b5cf6', price: '₹1,999/mo' },
                  { label: 'Enterprise Multi-Branch', count: stats?.planBreakdown?.enterprise || 0, color: '#f59e0b', price: '₹4,999/mo' },
                ].map((tier) => (
                  <div
                    key={tier.label}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: tier.color }} />
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#ffffff' }}>{tier.label}</span>
                      <span style={{ fontSize: '0.64rem', color: '#64748b' }}>({tier.price})</span>
                    </div>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: tier.color }}>
                      {tier.count} Gyms
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.68rem',
                color: '#94a3b8',
              }}
            >
              <span>Platform Gateway: Razorpay Live</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>Auto-Renewal Active</span>
            </div>
          </div>

          {/* Card 2: Quick Action Hub (4-Tile Grid) */}
          <div
            style={{
              background: '#0d1425',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              PLATFORM QUICK ACTIONS
            </div>

            <div className="quick-actions-grid">
              <button
                type="button"
                onClick={() => setShowAddGymModal(true)}
                className="quick-action-button"
                style={{ cursor: 'pointer', border: 'none' }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                  }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>Onboard Gym</span>
              </button>

              <Link href="/superadmin/plans" className="quick-action-button">
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <CreditCard size={14} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>SaaS Plans</span>
              </Link>

              <Link href="/superadmin/reports" className="quick-action-button">
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}
                >
                  <BarChart3 size={14} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>Reports Audit</span>
              </Link>

              <Link href="/superadmin/gyms" className="quick-action-button">
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
                  }}
                >
                  <Building2 size={14} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>All Gyms</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 5. MASTER REGISTERED GYMS DIRECTORY */}
      <div
        style={{
          background: '#0d1425',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '14px 16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          marginTop: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              All Platform Gym Tenants & Workspaces
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Real-time tenant status, owner details, member scale, and 1-click workspace access
            </p>
          </div>

          {/* Search Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                position: 'relative',
                width: '220px',
                background: '#090e1a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px 0 28px',
              }}
            >
              <Search size={12} style={{ position: 'absolute', left: '9px', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search gyms, owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '28px',
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.74rem',
                  outline: 'none',
                }}
              />
            </div>

            <Link
              href="/superadmin/gyms"
              style={{
                padding: '5px 10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#818cf8',
                fontSize: '0.72rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Full Directory &rarr;
            </Link>
          </div>
        </div>

        {/* Gym Tenants Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 700 }}>Gym Brand / Facility</th>
                <th style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 700 }}>Owner / Admin</th>
                <th style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>Scale</th>
                <th style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 700 }}>SaaS Tier</th>
                <th style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>Tenant Status</th>
                <th style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGyms.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No gym tenants found matching your query.
                  </td>
                </tr>
              ) : (
                filteredGyms.map((g) => {
                  const initial = (g.name || 'G').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={g._id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Gym Brand & Branch */}
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.82rem' }}>
                              {g.name}
                            </div>
                            <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '1px' }}>
                              {g.branchName || 'Main HQ'} • {g.address || 'Location registered'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Details */}
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.78rem' }}>{g.owner?.name || 'Rahul Singh'}</div>
                        <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '1px' }}>
                          {g.owner?.email || g.email || 'No email'} • {g.phone}
                        </div>
                      </td>

                      {/* Scale (Members & Collections) */}
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#ffffff' }}>
                          {g.memberCount ?? 0} <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Members</span>
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#10b981', fontWeight: 700, marginTop: '1px' }}>
                          ₹{(g.totalRevenue ?? 0).toLocaleString('en-IN')} vol
                        </div>
                      </td>

                      {/* SaaS Tier */}
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            background:
                              g.subscription?.plan === 'enterprise'
                                ? 'rgba(245, 158, 11, 0.18)'
                                : g.subscription?.plan === 'pro'
                                ? 'rgba(139, 92, 246, 0.18)'
                                : 'rgba(56, 189, 248, 0.18)',
                            border:
                              g.subscription?.plan === 'enterprise'
                                ? '1px solid rgba(245, 158, 11, 0.35)'
                                : g.subscription?.plan === 'pro'
                                ? '1px solid rgba(139, 92, 246, 0.35)'
                                : '1px solid rgba(56, 189, 248, 0.35)',
                            color:
                              g.subscription?.plan === 'enterprise'
                                ? '#fbbf24'
                                : g.subscription?.plan === 'pro'
                                ? '#c084fc'
                                : '#38bdf8',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {g.subscription?.plan || 'pro'}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(g._id, e)}
                          disabled={actionLoadingId === g._id}
                          title="Click to toggle Active / Suspended"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: g.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: g.isActive ? '#34d399' : '#f87171',
                            border: g.isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: g.isActive ? '#10b981' : '#ef4444',
                            }}
                          />
                          <span>{actionLoadingId === g._id ? '...' : g.isActive ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>

                      {/* Actions: Impersonate / Enter Workspace */}
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleImpersonate(g._id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                            border: 'none',
                            borderRadius: '5px',
                            color: '#ffffff',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                          }}
                          title="1-Click Jump into this Gym's Workspace"
                        >
                          <span>Open ERP</span>
                          <ExternalLink size={11} />
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

      {/* Quick Onboard Gym Modal */}
      {showAddGymModal && (
        <div className="modal-overlay" onClick={() => setShowAddGymModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              background: '#0d1527',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              padding: 0,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(99, 102, 241, 0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                  }}
                >
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    Quick Onboard New Gym
                  </h3>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Create tenant workspace & assign owner credentials
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddGymModal(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateGym} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                    Gym Brand / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Iron Forge Elite Fitness"
                    value={newGymData.gymName}
                    onChange={(e) => setNewGymData({ ...newGymData, gymName: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#090e1a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Phone / Mobile *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={newGymData.phone}
                      onChange={(e) => setNewGymData({ ...newGymData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        background: '#090e1a',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      SaaS Plan Tier
                    </label>
                    <select
                      value={newGymData.subscriptionPlan}
                      onChange={(e) => setNewGymData({ ...newGymData, subscriptionPlan: e.target.value })}
                      style={{
                        width: '100%',
                        background: '#090e1a',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        outline: 'none',
                      }}
                    >
                      <option value="trial">14-Day Free Trial (₹0)</option>
                      <option value="starter">Starter Plan (₹999/mo)</option>
                      <option value="pro">Pro Growth (₹1,999/mo)</option>
                      <option value="enterprise">Enterprise VIP (₹4,999/mo)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                    Facility Address / City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 18, Noida, Uttar Pradesh"
                    value={newGymData.address}
                    onChange={(e) => setNewGymData({ ...newGymData, address: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#090e1a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#818cf8', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Gym Admin Account Credentials
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                        Admin Name
                      </label>
                      <input
                        type="text"
                        placeholder="Owner Name"
                        value={newGymData.adminName}
                        onChange={(e) => setNewGymData({ ...newGymData, adminName: e.target.value })}
                        style={{
                          width: '100%',
                          background: '#090e1a',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#ffffff',
                          fontSize: '0.8rem',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                        Admin Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="owner@gym.com"
                        value={newGymData.adminEmail}
                        onChange={(e) => setNewGymData({ ...newGymData, adminEmail: e.target.value })}
                        style={{
                          width: '100%',
                          background: '#090e1a',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#ffffff',
                          fontSize: '0.8rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '18px',
                  paddingTop: '14px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddGymModal(false)}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '7px',
                    color: '#cbd5e1',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGym}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    borderRadius: '7px',
                    color: '#ffffff',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {creatingGym ? (
                    <>
                      <RefreshCw size={13} className="spin" />
                      <span>Onboarding...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={13} strokeWidth={2.5} />
                      <span>Create Gym Workspace</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
