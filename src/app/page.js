'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGym } from '../context/GymContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  QrCode,
  FileText,
  Zap,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Wallet,
  CreditCard,
  MessageSquare,
  Phone,
  Mail,
  Flame,
  AlertCircle,
  Printer,
  Coins,
  Megaphone,
  X,
  ShieldCheck,
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import FuturisticVelocityChart from '../components/FuturisticVelocityChart';
import { useToast } from '../context/ToastContext';
import LandingPage from '../components/LandingPage';
import FeeOrbitLoadingScreen from '../components/FeeOrbitLoadingScreen';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardPage() {
  const { currentGym, formatCurrency } = useGym();
  const { user, token, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [platformBroadcasts, setPlatformBroadcasts] = useState([]);

  useEffect(() => {
    if (!token) return;
    const fetchBroadcasts = async () => {
      try {
        const res = await fetch('/api/announcements/broadcasts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setPlatformBroadcasts(data.data);
        }
      } catch (e) {}
    };
    fetchBroadcasts();
  }, [token]);

  const handleDismissBroadcast = async (id) => {
    setPlatformBroadcasts((prev) => prev.filter((b) => b._id !== id));
    try {
      await fetch(`/api/announcements/${id}/dismiss`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {}
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      let url = '/api/dashboard/stats?';
      if (currentGym?._id) url += `gymId=${currentGym._id}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStats(data);
      } else {
        setError(data.message || 'Failed to load statistics');
      }
    } catch (err) {
      setError('Could not connect to API server. Ensure backend is running.');
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchStats();
    const interval = setInterval(() => fetchStats(false), 15000);
    const handlePayment = () => fetchStats(false);
    window.addEventListener('feeorbit-payment-received', handlePayment);
    return () => {
      clearInterval(interval);
      window.removeEventListener('feeorbit-payment-received', handlePayment);
    };
  }, [user, currentGym]);

  // Quick Multi-Channel Reminder Handlers for Dashboard
  const handleQuickWhatsApp = async (item) => {
    const phone = item.memberPhone || item.member?.phone;
    if (!phone) {
      return toast.warning('Member phone number not available', { title: 'Missing Contact' });
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const dueAmt = item.dueAmount;
    const gymName = currentGym?.name || 'FeeOrbit Gym';
    const currencySym = currentGym?.currency?.symbol || '₹';

    let text = `Hello ${item.memberName},\nThis is a friendly reminder from *${gymName}* that an outstanding balance of *${currencySym}${dueAmt.toLocaleString('en-IN')}* is due for your *${item.planName || 'Gym Membership'}*.\nKindly clear your pending balance at the reception desk or via UPI.\nThank you! 💪`;
    if (currentGym?.upiId) {
      text += `\n\n💳 Direct UPI Pay: ${currentGym.upiId}`;
    }

    window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(text)}`, '_blank');
    toast.success(`WhatsApp reminder opened for ${item.memberName}`, { title: 'WhatsApp Dispatched' });
    try {
      await fetch('/api/payments/dues/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: item._id, channel: 'whatsapp', notes: 'WhatsApp reminder sent from Dashboard' }),
      });
      fetchStats(false);
    } catch (e) {}
  };

  const handleQuickCall = (item) => {
    const phone = item.memberPhone || item.member?.phone;
    if (!phone) {
      return toast.warning('Member phone number not available', { title: 'Missing Contact' });
    }
    toast.info(`Initiating phone call to ${item.memberName}...`, { title: 'Call Dialed' });
    window.location.href = `tel:${phone}`;
    try {
      fetch('/api/payments/dues/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: item._id, channel: 'call', notes: 'Call initiated from Dashboard' }),
      });
    } catch (e) {}
  };

  const handleQuickEmail = async (item) => {
    const email = item.member?.email || item.memberEmail;
    if (!email) {
      return toast.warning(`${item.memberName} does not have an email address on file.`, { title: 'Email Missing' });
    }
    try {
      const res = await fetch('/api/payments/dues/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: item._id, channel: 'email', notes: 'Official fee reminder notice emailed from Dashboard' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Reminder email sent to ${email}`, { title: 'Email Sent' });
        fetchStats(false);
      } else {
        toast.error(data.message || 'Error sending email', { title: 'Delivery Failed' });
      }
    } catch (e) {
      toast.error('Failed to communicate with mail service', { title: 'Network Error' });
    }
  };

  // 1. Session resolution barrier: Never show LandingPage while checking auth or before mounting
  if (authLoading || !mounted) {
    return <FeeOrbitLoadingScreen message="Verifying secure workspace session..." />;
  }

  // 2. If visitor is confirmed unauthenticated: render public landing page!
  if (!user) {
    return <LandingPage />;
  }

  // Determine Greeting & Formatted Date
  const now = new Date();
  const currentHour = now.getHours();
  let greetingTime = t('dash_good_evening', 'Good Evening');
  if (currentHour < 12) greetingTime = t('dash_good_morning', 'Good Morning');
  else if (currentHour < 17) greetingTime = t('dash_good_afternoon', 'Good Afternoon');

  const adminFirstName = user?.name ? user.name.split(' ')[0] : 'Admin';

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const s = stats?.stats || {
    totalMembers: 0,
    activeMembers: 0,
    todayCheckinsCount: 0,
    currentlyInGym: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0,
    totalDues: 0,
    expiringSoonCount: 0,
    staffCount: 0,
    equipmentCount: 0,
    equipmentNeedsService: 0,
  };

  // 7-day attendance trend data from database
  const trendData = stats?.last7DaysTrend || [];
  const maxTrend = Math.max(5, ...trendData.map((d) => Number(d.checkIns || 0)));

  // Real recent check-ins from database
  const realRecentCheckIns = (stats?.recentActivity?.checkIns || []).map((item) => {
    const timeStr = item.checkIn
      ? new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      : 'Recent';
    const name = item.memberName || item.member?.fullName || 'Member';
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return {
      id: item._id,
      name,
      time: timeStr,
      avatar: item.member?.photoUrl || null,
      avatarInitial: initials || 'MB',
      memberId: item.memberId || item.member?.memberId || '',
      method: item.method || 'kiosk',
    };
  });

  // Real recent payments from database
  const realRecentPayments = (stats?.recentActivity?.payments || []).map((item) => {
    const pDate = item.paymentDate ? new Date(item.paymentDate) : new Date();
    const timeStr = pDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = pDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const name = item.memberName || item.member?.fullName || 'Member';
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return {
      ...item,
      id: item._id,
      name,
      initials,
      avatar: item.member?.photoUrl || null,
      timeDisplay: `${dateStr}, ${timeStr}`,
      isRecent: Date.now() - pDate.getTime() < 1000 * 60 * 30, // within 30 mins
    };
  });

  const retentionRate = s.totalMembers > 0 ? Math.round((s.activeMembers / s.totalMembers) * 100) : 100;

  if (loading && !stats) {
    return <FeeOrbitLoadingScreen variant="inline" message="Loading FeeOrbit Dashboard..." />;
  }

  return (
    <div style={{ paddingBottom: '16px' }}>
      {/* Super Admin Platform Broadcast Banner */}
      {platformBroadcasts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          {platformBroadcasts.map((broadcast) => (
            <div
              key={broadcast._id}
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.16), rgba(99, 102, 241, 0.1))',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: '0 4px 18px rgba(139, 92, 246, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#a78bfa',
                        background: 'rgba(139, 92, 246, 0.2)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      SUPERADMIN PLATFORM UPDATE
                    </span>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {broadcast.title}
                    </h4>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {broadcast.message}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <Link
                  href="/announcements"
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#a78bfa',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  Notice Board →
                </Link>
                <button
                  onClick={() => handleDismissBroadcast(broadcast._id)}
                  title="Dismiss notification"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. EXECUTIVE OPERATIONS COMMAND BAR (Bespoke Human UI) */}
      <div className="executive-command-bar">
        <div className="executive-command-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {greetingTime}, {adminFirstName}
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 7px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '9999px',
                fontSize: '0.62rem',
                color: '#10b981',
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
              {t('dash_live_shift', 'Live Shift')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 500 }}>
              {currentGym?.name || 'FeeOrbit Fitness Club'}
            </span>
            <span style={{ color: 'var(--border-subtle, #cbd5e1)', opacity: 0.7 }}>•</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              <Calendar size={11} style={{ color: 'var(--brand-primary, #6366f1)' }} />
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Instant Action Bar for Quick Reception Workflows */}
        <div className="executive-command-actions">
          <Link href="/members" className="cmd-action-btn cmd-action-primary">
            <UserPlus size={13} strokeWidth={2.4} />
            <span>{t('dash_btn_new_member', 'New Member')}</span>
          </Link>

          <Link href="/billing" className="cmd-action-btn cmd-action-secondary">
            <CreditCard size={13} strokeWidth={2.2} style={{ color: '#38bdf8' }} />
            <span>{t('dash_btn_collect_fee', 'Collect Fee')}</span>
          </Link>

          <Link href="/events" className="cmd-action-btn cmd-action-secondary">
            <CalendarDays size={13} strokeWidth={2.2} style={{ color: '#f472b6' }} />
            <span>{t('dash_btn_events', 'Events & Offs')}</span>
          </Link>

          <Link href="/kiosk" className="cmd-action-btn cmd-action-secondary">
            <QrCode size={13} strokeWidth={2.2} style={{ color: '#34d399' }} />
            <span>{t('dash_btn_kiosk', 'Kiosk Desk')}</span>
          </Link>

          <Link href="/expenses" className="cmd-action-btn cmd-action-secondary">
            <Wallet size={13} strokeWidth={2.2} style={{ color: '#f59e0b' }} />
            <span>{t('dash_btn_add_expense', 'Add Expense')}</span>
          </Link>

          <Link href="/announcements" className="cmd-action-btn cmd-action-secondary">
            <Megaphone size={13} strokeWidth={2.2} style={{ color: '#f59e0b' }} />
            <span>{t('dash_btn_notices', 'Notice Board')}</span>
          </Link>
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

      {/* Dynamic Public Notice Board Banner from Gym Settings */}
      {currentGym?.noticeBoard?.isActive && currentGym?.noticeBoard?.content && (
        <div
          className="dashboard-notice-banner"
          style={{
            background:
              currentGym.noticeBoard.priority === 'urgent'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(185, 28, 28, 0.22))'
                : currentGym.noticeBoard.priority === 'alert'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(180, 83, 9, 0.22))'
                : 'linear-gradient(135deg, var(--brand-primary-light, rgba(99, 102, 241, 0.12)), rgba(6, 182, 212, 0.08))',
            border:
              currentGym.noticeBoard.priority === 'urgent'
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : currentGym.noticeBoard.priority === 'alert'
                ? '1px solid rgba(245, 158, 11, 0.4)'
                : '1px solid var(--border-glow, rgba(99, 102, 241, 0.35))',
            borderRadius: '8px',
            padding: '8px 14px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '2px 7px',
                borderRadius: '4px',
                background:
                  currentGym.noticeBoard.priority === 'urgent'
                    ? 'rgba(239, 68, 68, 0.25)'
                    : currentGym.noticeBoard.priority === 'alert'
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'var(--brand-primary-light, rgba(99, 102, 241, 0.25))',
                color:
                  currentGym.noticeBoard.priority === 'urgent'
                    ? '#ef4444'
                    : currentGym.noticeBoard.priority === 'alert'
                    ? '#f59e0b'
                    : 'var(--brand-primary, #6366f1)',
              }}
            >
              📢 {currentGym.noticeBoard.title || 'Gym Notice'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {currentGym.noticeBoard.content}
            </span>
          </div>

          <Link
            href="/settings"
            style={{
              fontSize: '0.68rem',
              color: 'var(--brand-primary, #6366f1)',
              textDecoration: 'none',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {t('dash_manage_notice', 'Manage Notice')} →
          </Link>
        </div>
      )}

      {/* 2. PRIMARY 4 KPI METRIC TILES (Sleek Human SaaS Precision) */}
      <div className="kpi-card-grid">
        {/* Active Members */}
        <div className="kpi-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {t('dash_stat_active_members', 'Active Members')}
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <Users size={15} strokeWidth={2.2} />
            </div>
          </div>

          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
            }}
          >
            {s.activeMembers || 0}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '4px',
              paddingTop: '6px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              {t('dash_total', 'Total')}: {s.totalMembers || 0} {t('dash_registered', 'registered')}
            </span>
            <span
              style={{
                color: '#34d399',
                fontSize: '0.66rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              ▲ {retentionRate}% {t('dash_active', 'Active')}
            </span>
          </div>
        </div>

        {/* Live on Floor */}
        <div className="kpi-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {t('dash_stat_live_floor', 'Live On Floor')}
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22d3ee',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 6.5 1.3.9-1.9z" />
              </svg>
            </div>
          </div>

          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
            }}
          >
            {s.currentlyInGym || 0}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '4px',
              paddingTop: '6px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              {t('dash_today', 'Today')}: {s.todayCheckinsCount || 0} {t('dash_checkins', 'check-ins')}
            </span>
            <span
              style={{
                color: s.currentlyInGym > 0 ? '#34d399' : 'var(--text-muted)',
                fontSize: '0.66rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {s.currentlyInGym > 0 ? (
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
                  {t('dash_live_now', 'Live Now')}
                </>
              ) : (
                t('dash_floor_clear', 'Floor Clear')
              )}
            </span>
          </div>
        </div>

        {/* Gross Collections */}
        <div className="kpi-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {t('dash_stat_monthly_revenue', 'Monthly Revenue')}
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <Coins size={15} strokeWidth={2.2} />
            </div>
          </div>

          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
            }}
          >
            {formatCurrency(s.monthlyRevenue || 0)}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '4px',
              paddingTop: '6px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              {t('dash_fee_income_month', 'Fee income this month')}
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
              {t('dash_realtime_sync', '✓ Real-time Sync')}
            </span>
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="kpi-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {t('dash_stat_outstanding_dues', 'Outstanding Dues')}
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: s.totalDues > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: s.totalDues > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: s.totalDues > 0 ? '#fbbf24' : '#34d399',
              }}
            >
              <Calendar size={15} strokeWidth={2.2} />
            </div>
          </div>

          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: s.totalDues > 0 ? '#fbbf24' : 'var(--text-primary)',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
            }}
          >
            {formatCurrency(s.totalDues || 0)}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '4px',
              paddingTop: '6px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              {t('dash_uncollected_balances', 'Uncollected balances')}
            </span>
            <span
              style={{
                color: s.totalDues > 0 ? '#f87171' : '#34d399',
                fontSize: '0.66rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              {s.totalDues > 0 ? t('dash_action_required', '⚠ Action Required') : t('dash_cleared', '✓ Cleared')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL ERP ROW (3 Clean Unified Cards: Staff, Equipment, Expenses) */}
      <div className="operational-grid">
        {/* Staff & Coaches */}
        <Link href="/staff" className="operational-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
                flexShrink: 0,
              }}
            >
              <Users size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {t('dash_stat_staff_coaches', 'Staff & Trainers')}
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' }}>
                {s.staffCount || 0} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)' }}>{t('dash_coaches_registered', 'Coaches Registered')}</span>
              </div>
              <div style={{ fontSize: '0.66rem', color: '#818cf8', fontWeight: 500 }}>
                {t('dash_manage_team_payroll', 'Manage team & payroll →')}
              </div>
            </div>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </Link>

        {/* Equipment Health */}
        <Link href="/inventory" className="operational-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                flexShrink: 0,
              }}
            >
              <Dumbbell size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {t('dash_stat_equipment', 'Equipment Health')}
              </div>
              <div
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  color: s.equipmentNeedsService > 0 ? '#fbbf24' : '#34d399',
                  marginTop: '1px',
                }}
              >
                {s.equipmentNeedsService > 0 ? `${s.equipmentNeedsService} ${t('dash_need_service', 'Need Service')}` : t('dash_all_operational', 'All Operational')}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#2dd4bf', fontWeight: 500 }}>
                {s.equipmentCount || 0} {t('dash_machines_tracked', 'machines tracked →')}
              </div>
            </div>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </Link>

        {/* Monthly Expenses */}
        <Link href="/expenses" className="operational-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb7185',
                flexShrink: 0,
              }}
            >
              <Wallet size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {t('dash_stat_expenses', 'Monthly Expenses')}
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' }}>
                {formatCurrency(s.monthlyExpenses || 0)}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#fb7185', fontWeight: 500 }}>
                {t('dash_view_pnl', 'View P&L balance statement →')}
              </div>
            </div>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </Link>
      </div>

      {/* 3.5 SMART DUES & MULTI-CHANNEL RECOVERY CENTER */}
      {stats?.urgentDuesList && stats.urgentDuesList.length > 0 && (
        <div
          className="fee-recovery-banner"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: '10px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.14)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                  flexShrink: 0,
                }}
              >
                <Flame size={16} strokeWidth={2.2} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {t('dash_fee_recovery', 'Fee Recovery & Outstanding Dues')}
                  </h3>
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#f87171',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {stats.urgentDuesList.length} {t('dash_action_needed', 'Action Needed')}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {t('dash_dues_desc', 'Dispatch 1-click reminders directly via WhatsApp, Phone, or Email to recover outstanding member balances.')}
                </div>
              </div>
            </div>

            <Link
              href="/billing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#d97706',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{t('dash_manage_all_dues', 'Manage All Dues')} ({s.totalDues ? formatCurrency(s.totalDues) : ''})</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {/* Dues Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {stats.urgentDuesList.slice(0, 4).map((item) => (
              <div
                key={item._id}
                className="fee-recovery-item"
                style={{
                  background: 'var(--bg-card-solid)',
                  border:
                    item.urgency === 'overdue'
                      ? '1px solid rgba(239, 68, 68, 0.35)'
                      : item.urgency === 'due_today'
                      ? '1px solid rgba(245, 158, 11, 0.35)'
                      : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Top: Member Info & Balance Due */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background:
                          item.urgency === 'overdue'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        border:
                          item.urgency === 'overdue'
                            ? '1px solid rgba(239, 68, 68, 0.35)'
                            : '1px solid rgba(245, 158, 11, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: item.urgency === 'overdue' ? '#ef4444' : '#d97706',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {item.member?.photoUrl ? (
                        <img src={item.member.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        item.memberName?.charAt(0)?.toUpperCase() || 'M'
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.memberName}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                        {item.planName || 'Gym Plan'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: item.urgency === 'overdue' ? '#ef4444' : '#d97706' }}>
                      {formatCurrency(item.dueAmount)}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background:
                          item.urgency === 'overdue'
                            ? 'rgba(239, 68, 68, 0.16)'
                            : item.urgency === 'due_today'
                            ? 'rgba(245, 158, 11, 0.16)'
                            : 'rgba(6, 182, 212, 0.16)',
                        color:
                          item.urgency === 'overdue'
                            ? '#ef4444'
                            : item.urgency === 'due_today'
                            ? '#d97706'
                            : '#0284c7',
                      }}
                    >
                      {item.urgencyLabel}
                    </span>
                  </div>
                </div>

                {/* Bottom: Direct Reminder Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                    {item.lastReminderSentAt
                      ? `${t('dash_reminded', 'Reminded')} ${new Date(item.lastReminderSentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                      : t('dash_not_reminded', 'Not reminded yet')}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <button
                      type="button"
                      onClick={() => handleQuickWhatsApp(item)}
                      title="Send WhatsApp Reminder"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        background: 'rgba(37, 211, 102, 0.12)',
                        border: '1px solid rgba(37, 211, 102, 0.35)',
                        color: '#16a34a',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.14s ease',
                      }}
                    >
                      <MessageSquare size={11} /> {t('dash_remind_wa', 'WA')}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickCall(item)}
                      title="Call Member"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        color: '#d97706',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.14s ease',
                      }}
                    >
                      <Phone size={11} /> {t('dash_remind_call', 'Call')}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickEmail(item)}
                      title="Send Reminder Email"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        background: 'rgba(2, 132, 199, 0.12)',
                        border: '1px solid rgba(2, 132, 199, 0.35)',
                        color: '#0284c7',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.14s ease',
                      }}
                    >
                      <Mail size={11} /> {t('dash_remind_mail', 'Mail')}
                    </button>

                    <Link
                      href={`/billing?memberId=${item.member?._id || item.memberId || ''}`}
                      title="Collect Payment Directly"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        background: 'linear-gradient(135deg, var(--brand-primary, #6366f1) 0%, var(--brand-primary-hover, #4f46e5) 100%)',
                        border: '1px solid var(--border-glow, rgba(99, 102, 241, 0.35))',
                        color: '#ffffff',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px var(--brand-primary-light, rgba(99, 102, 241, 0.3))',
                      }}
                    >
                      <span>{t('dash_remind_collect', 'Collect')}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN TWO-COLUMN SECTION */}
      <div className="dashboard-split-grid">
        {/* LEFT COLUMN: Attendance Trend + Recent Check-in Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Card 1: Futuristic Weekly Attendance Velocity Matrix */}
          <FuturisticVelocityChart
            data={trendData}
            currentlyInGym={s.currentlyInGym || 0}
            todayCheckinsCount={s.todayCheckinsCount || 0}
            maxCapacity={currentGym?.capacity || 100}
            onSync={() => fetchStats(true)}
            refreshing={refreshing}
            t={t}
          />

          {/* Card 2: Recent Check-in Activity (Horizontal 4 Cards Row) */}
          <div
            style={{
              background: 'var(--bg-card, rgba(16, 22, 36, 0.72))',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '12px 16px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                  }}
                >
                  <Clock size={13} />
                </div>
                <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {t('dash_live_checkins', 'Live Check-in Stream')}
                </h3>
              </div>
              <Link
                href="/kiosk"
                style={{
                  color: 'var(--brand-primary, #818cf8)',
                  textDecoration: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span>{t('dash_view_full_log', 'View Full Log')}</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            {/* Check-ins 4-Column Horizontal Row */}
            <div className="recent-checkins-grid">
              {realRecentCheckIns.length > 0 ? (
                realRecentCheckIns.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="stream-activity-item"
                    style={{
                      background: 'var(--bg-card-solid)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid var(--border-subtle)',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(59, 130, 246, 0.4))',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {item.avatarInitial}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                          {item.time} {item.memberId ? `• ${item.memberId}` : ''}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        background:
                          item.method === 'qr'
                            ? 'rgba(14, 165, 233, 0.1)'
                            : 'rgba(16, 185, 129, 0.1)',
                        border:
                          item.method === 'qr'
                            ? '1px solid rgba(14, 165, 233, 0.25)'
                            : '1px solid rgba(16, 185, 129, 0.25)',
                        color: item.method === 'qr' ? '#0284c7' : '#059669',
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {item.method === 'qr' ? 'QR Pass' : 'Desk'}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '12px 14px',
                    textAlign: 'center',
                    background: 'var(--bg-card-solid)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                  }}
                >
                  {t('dash_no_checkins', 'No check-ins recorded yet today.')}{' '}
                  <Link href="/kiosk" style={{ color: 'var(--brand-primary, #818cf8)', fontWeight: 600 }}>
                    {t('dash_launch_kiosk_scan', 'Launch Kiosk to scan attendance →')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Expiring Soon + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Card 1: Expiring Soon (Next 7 Days) */}
          <div
            style={{
              background: 'var(--bg-card, rgba(16, 22, 36, 0.72))',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '14px 16px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '165px',
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
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fbbf24',
                    }}
                  >
                    <Clock size={13} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {t('dash_expiring_soon_title', 'Expiring Soon (7 Days)')}
                    </h3>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      {t('dash_expiring_soon_desc', 'Member retention alerts & renewal pipeline')}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    background: s.expiringSoonCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                    border: s.expiringSoonCount > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                    color: s.expiringSoonCount > 0 ? '#ef4444' : '#10b981',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.02em',
                  }}
                >
                  {s.expiringSoonCount || 0} {t('dash_alerts', 'Alerts')}
                </span>
              </div>

              {/* Body */}
              {stats?.expiringSoonList?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '135px', overflowY: 'auto' }}>
                  {stats.expiringSoonList.map((m) => (
                    <div
                      key={m._id}
                      className="expiring-soon-item"
                      style={{
                        background: 'var(--bg-card-solid)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {m.fullName}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                          {t('dash_ends', 'Ends')}: {new Date(m.endDate).toLocaleDateString()} • {m.plan?.name || 'Membership'}
                        </div>
                      </div>
                      <Link
                        href={`/billing?memberId=${m._id}`}
                        style={{
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: 'var(--brand-primary, #6366f1)',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '5px',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {t('dash_renew', 'Renew')}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 10px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981',
                      marginBottom: '8px',
                    }}
                  >
                    <CheckCircle2 size={18} />
                  </div>

                  <div style={{ color: 'var(--text-primary)', fontSize: '0.76rem', fontWeight: 600 }}>
                    {t('dash_memberships_healthy', 'All Memberships Healthy')}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.66rem', marginTop: '2px' }}>
                    {t('dash_zero_expiring', 'Zero memberships expiring in the next 7 days')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Quick Actions */}
          <div
            style={{
              background: 'var(--bg-card, rgba(16, 22, 36, 0.72))',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '12px 16px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <Zap size={13} />
                </div>
                <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {t('dash_quick_launch', 'Quick Launch')}
                </h3>
              </div>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{t('dash_shortcuts', 'Shortcuts')}</span>
            </div>

            {/* 4 Action Buttons in a Single Row */}
            <div className="quick-actions-grid">
              <Link href="/members" className="quick-action-button">
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                  }}
                >
                  <UserPlus size={15} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, textAlign: 'center', color: 'var(--text-primary)' }}>
                  {t('dash_btn_new_member', 'New Member')}
                </span>
              </Link>

              <Link href="/kiosk" className="quick-action-button">
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                  }}
                >
                  <QrCode size={15} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, textAlign: 'center', color: 'var(--text-primary)' }}>
                  {t('dash_btn_kiosk', 'Desk Kiosk')}
                </span>
              </Link>

              <Link href="/billing" className="quick-action-button">
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}
                >
                  <CreditCard size={15} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, textAlign: 'center', color: 'var(--text-primary)' }}>
                  {t('dash_btn_collect_fee', 'Collect Fee')}
                </span>
              </Link>

              <Link href="/expenses" className="quick-action-button">
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
                  }}
                >
                  <FileText size={15} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, textAlign: 'center', color: 'var(--text-primary)' }}>
                  {t('dash_btn_add_expense', 'Add Expense')}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 5. LIVE RECENT PAYMENTS INFLOW TABLE */}
      <div
        style={{
          background: 'var(--bg-card, rgba(16, 22, 36, 0.72))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '16px 20px',
          marginTop: '12px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                flexShrink: 0,
              }}
            >
              <CreditCard size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                  {t('dash_revenue_inflow', 'Live Revenue Inflow Ledger')}
                </h3>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#10b981',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }} />
                  Live Sync
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                {t('dash_revenue_inflow_desc', 'Verified transactions from desk collections, UPI, cards, and online renewals')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => fetchStats(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--bg-card-solid)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={11} className={refreshing ? 'spin' : ''} />
              {t('btn_sync', 'Sync')}
            </button>
            <Link
              href="/billing?tab=history"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--brand-primary, #818cf8)',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '4px 10px',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{t('dash_view_all_history', 'Full Billing Ledger')}</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Table Container */}
        <div className="table-container" style={{ maxHeight: '360px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Member</th>
                <th>Plan</th>
                <th>Mode</th>
                <th>Amount Paid</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Tax Invoice</th>
              </tr>
            </thead>
            <tbody>
              {realRecentPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    No recent payments recorded yet.{' '}
                    <Link href="/billing" style={{ color: 'var(--brand-primary, #818cf8)', fontWeight: 600 }}>
                      Record a payment in Billing &rarr;
                    </Link>
                  </td>
                </tr>
              ) : (
                realRecentPayments.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      background: p.isRecent ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--brand-primary, #818cf8)', fontWeight: 700, fontSize: '0.78rem' }}>
                          {p.receiptNumber}
                        </span>
                        {p.isRecent && (
                          <span
                            style={{
                              fontSize: '0.58rem',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt=""
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid var(--border-subtle)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(59, 130, 246, 0.4))',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              color: '#ffffff',
                              flexShrink: 0,
                            }}
                          >
                            {p.initials}
                          </div>
                        )}
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                        {p.planName || p.plan?.name || 'Gym Plan'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span
                          className={`badge ${
                            p.transactionId?.startsWith('pay_')
                              ? 'badge-primary'
                              : p.paymentMethod === 'UPI' && p.transactionId
                              ? 'badge-active'
                              : 'badge-info'
                          }`}
                          style={{ fontSize: '0.65rem', width: 'fit-content' }}
                        >
                          {p.transactionId?.startsWith('pay_')
                            ? 'Razorpay'
                            : p.paymentMethod === 'UPI' && p.transactionId
                            ? '⚡ Direct UPI'
                            : p.paymentMethod || 'UPI'}
                        </span>
                        {p.transactionId && (
                          <span style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'monospace' }}>
                            {p.transactionId.startsWith('pay_')
                              ? p.transactionId.slice(0, 12) + '…'
                              : `UTR: ${p.transactionId}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{(p.amountPaid || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                        {p.timeDisplay}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${p.status === 'paid' ? 'badge-active' : 'badge-warning'}`}
                        style={{ fontSize: '0.64rem' }}
                      >
                        {p.status || 'paid'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(p)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.68rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        <Printer size={12} />
                        <span>Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Professional Tax Invoice Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          gymInfo={currentGym}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
