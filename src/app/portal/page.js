'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import {
  QrCode,
  Calendar,
  CreditCard,
  Flame,
  Clock,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Bell,
  RefreshCw,
  Sparkles,
  Camera,
  Droplets,
  ShieldCheck,
  TrendingUp,
  Award,
  Zap,
  ChevronRight,
  ExternalLink,
  Activity,
  Heart,
  Plus,
  X,
  Copy,
  Check,
  Megaphone,
  Palette,
  MessageSquare,
  Star,
  ShoppingBag,
  Dumbbell,
} from 'lucide-react';
import QRCode from 'qrcode';
import QRCodeModal from '../../components/QRCodeModal';
import ReceiptModal from '../../components/ReceiptModal';
import { THEME_PRESETS, getThemePreset, applyThemeVariables } from '../../utils/themePresets';
import { toast } from '../../context/ToastContext';
import SmartDietTracker from '../../components/SmartDietTracker';

export default function MemberPortalPage() {
  const { user, token } = useAuth();
  const { currentGym, formatCurrency } = useGym();

  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [waterMl, setWaterMl] = useState(2000);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTab, setPayTab] = useState('direct_upi'); // 'direct_upi' | 'razorpay'
  const [payMethod, setPayMethod] = useState('UPI');
  const [payProcessing, setPayProcessing] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [memberNotices, setMemberNotices] = useState([]);
  const [urgentNotice, setUrgentNotice] = useState(null);
  const [currentPresetId, setCurrentPresetId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('feeorbit_theme_preset') || 'midnight';
    }
    return 'midnight';
  });
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeFilterTab, setThemeFilterTab] = useState('all');

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e?.detail?.preset) {
        setCurrentPresetId(e.detail.preset);
      }
    };
    window.addEventListener('feeorbit_theme_changed', handleThemeChange);
    return () => window.removeEventListener('feeorbit_theme_changed', handleThemeChange);
  }, []);

  const activePortalTheme = getThemePreset(currentPresetId);

  const member = portalData?.member;
  const attendance = portalData?.attendance || [];
  const payments = portalData?.payments || [];
  const summary = portalData?.summary || { totalWorkouts: 0, totalPaid: 0, totalDues: 0 };

  useEffect(() => {
    const gymId = portalData?.gym?._id || currentGym?._id;
    if (!gymId) return;

    fetch(`/api/announcements/member-notices?gymId=${gymId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setMemberNotices(data.data || []);
          setUrgentNotice(data.urgentNotice || null);
        }
      })
      .catch(() => {});
  }, [portalData?.gym?._id, currentGym?._id]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Sync real-time clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load / persist water hydration tracker
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`feeorbit_water_${todayStr}`);
      if (saved) setWaterMl(parseInt(saved, 10));
    } catch (e) {}
  }, [todayStr]);

  const addWater = (amount) => {
    setWaterMl((prev) => {
      const next = Math.min(5000, prev + amount);
      try {
        localStorage.setItem(`feeorbit_water_${todayStr}`, next.toString());
      } catch (e) {}
      return next;
    });
  };

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/member-portal', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPortalData(data);
        if (data.themePreset) {
          setCurrentPresetId(data.themePreset);
          applyThemeVariables(data.themePreset, data.themeColor || null);
        }
      } else {
        setError(data.message || 'Could not load member data');
      }
    } catch (err) {
      setError('Connection error with server');
    } finally {
      setLoading(false);
    }
  };

  const gymUpiId = portalData?.gym?.upiId || currentGym?.upiId || 'fitzone@okhdfcbank';
  const gymPayeeName = portalData?.gym?.upiPayeeName || portalData?.gym?.name || currentGym?.name || 'FeeOrbit Gym';
  const enableDirectUpi = portalData?.gym?.paymentSettings?.enableDirectUpi !== false;
  const enableRazorpay = portalData?.gym?.paymentSettings?.enableRazorpay !== false;

  useEffect(() => {
    if (showPayModal) {
      if (!enableDirectUpi && enableRazorpay) {
        setPayTab('razorpay');
      } else if (enableDirectUpi && !enableRazorpay) {
        setPayTab('direct_upi');
      }
    }
  }, [showPayModal, enableDirectUpi, enableRazorpay]);

  // Generate real dynamic NPCI UPI QR code whenever payment modal is opened
  useEffect(() => {
    if (!showPayModal || !portalData?.member) return;
    const m = portalData.member;
    const amountToPay = summary.totalDues > 0 ? summary.totalDues : (m.plan?.price || 1500);
    const upiPayload = `upi://pay?pa=${gymUpiId}&pn=${encodeURIComponent(gymPayeeName)}&am=${amountToPay}&cu=INR&tn=${encodeURIComponent(`Fee-${m.memberId || 'TF-1002'}`)}`;

    QRCode.toDataURL(upiPayload, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0a0f1d',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [showPayModal, portalData, summary.totalDues, gymUpiId, gymPayeeName]);

  const handleCopyUpi = () => {
    if (!gymUpiId) return;
    navigator.clipboard.writeText(gymUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleConfirmDirectUpi = async () => {
    if (!member?._id) return;
    const cleanUtr = (utrNumber || '').trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setUtrError('Please enter a valid 12-digit UTR / UPI Reference Number from your payment app.');
      return;
    }

    setPayProcessing(true);
    setUtrError('');
    try {
      const amountToPay = summary.totalDues > 0 ? summary.totalDues : (member.plan?.price || 1500);
      const res = await fetch('/api/payments/direct-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member._id,
          amount: amountToPay,
          planId: member.plan?._id,
          utrNumber: cleanUtr,
          remarks: `Direct Gym UPI (0% Fee) to ${gymUpiId}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowPayModal(false);
        setUtrNumber('');
        await fetchPortalData();
        setSelectedReceipt(data.data);
        // Broadcast real-time event for admin notification
        window.dispatchEvent(new CustomEvent('feeorbit-payment-received', { detail: data.data }));
      } else {
        setUtrError(data.message || 'Direct UPI verification failed. Please check UTR number.');
      }
    } catch (err) {
      setUtrError('Network error connecting to payment verification server.');
    } finally {
      setPayProcessing(false);
    }
  };

  const handlePayDueOnline = async () => {
    if (!member?._id) return;
    setPayProcessing(true);
    try {
      const amountToPay = summary.totalDues > 0 ? summary.totalDues : (member.plan?.price || 1500);
      const res = await fetch('/api/payments/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member._id,
          amount: amountToPay,
          planId: member.plan?._id,
          paymentMethod: payMethod,
          razorpayPaymentId: `pay_direct_${Date.now()}`,
          razorpayOrderId: `ord_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPayModal(false);
        await fetchPortalData();
        setSelectedReceipt(data.data);
        // Broadcast real-time event for admin notification
        window.dispatchEvent(new CustomEvent('feeorbit-payment-received', { detail: data.data }));
      } else {
        alert(data.message || 'Payment processing failed');
      }
    } catch (err) {
      alert('Network connection error while completing payment');
    } finally {
      setPayProcessing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortalData();
    }
  }, [token]);

  const diffDays = member?.endDate
    ? Math.ceil((new Date(member.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  // Plan progress percentage
  const planProgressPercent = useMemo(() => {
    if (!member?.startDate || !member?.endDate) return 80;
    const start = new Date(member.startDate).getTime();
    const end = new Date(member.endDate).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  }, [member]);

  // Check if currently inside gym
  const activeSessionToday = useMemo(() => {
    return attendance.find((a) => a.date === todayStr && !a.checkOut);
  }, [attendance, todayStr]);

  // Elapsed training minutes for active session
  const elapsedSessionMins = useMemo(() => {
    if (!activeSessionToday?.checkIn) return 0;
    const checkInTime = new Date(activeSessionToday.checkIn).getTime();
    return Math.max(1, Math.round((currentTime.getTime() - checkInTime) / 60000));
  }, [activeSessionToday, currentTime]);

  // Calculate 7-Day Weekly Heatmap
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const mon = new Date(now);
    mon.setDate(now.getDate() + distanceToMon);

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const attended = attendance.find((a) => a.date === dStr);
      const isToday = dStr === todayStr;

      let durationLabel = null;
      let isLive = false;

      if (attended) {
        // Strictly only today's session can be "Live" if not checked out yet
        if (isToday && !attended.checkOut) {
          isLive = true;
          durationLabel = 'Live';
        } else {
          // Completed session: use recorded durationMinutes, calculate from checkIn/checkOut, or fallback to default 45m
          const diffMins = attended.durationMinutes > 0
            ? attended.durationMinutes
            : attended.checkOut
            ? Math.max(1, Math.round((new Date(attended.checkOut) - new Date(attended.checkIn)) / 60000))
            : 45;
          durationLabel = `${diffMins}m`;
        }
      }

      days.push({
        name: dayNames[i],
        dateNum: d.getDate(),
        dateStr: dStr,
        attended: !!attended,
        isLive,
        duration: durationLabel,
        isToday,
      });
    }
    return days;
  }, [attendance, todayStr]);

  // Greeting time
  const greeting = useMemo(() => {
    const hr = currentTime.getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  }, [currentTime]);

  const memberName = member?.fullName || user?.name || 'Member';
  const memberInitials = memberName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const gymName = currentGym?.name || 'FeeOrbit Fitness Club';

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* 0. HIGH PRIORITY URGENT GYM NOTICE (e.g. Kal Gym Band Hai) */}
      {urgentNotice && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1.5px solid rgba(239, 68, 68, 0.45)',
            borderLeft: '5px solid #ef4444',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '22px',
            boxShadow: '0 8px 24px -4px rgba(239, 68, 68, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle ambient red wash on the left */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '240px',
              background: 'radial-gradient(circle at left, rgba(239, 68, 68, 0.12), transparent 75%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#ffffff',
                    background: '#ef4444',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.35)',
                  }}
                >
                  IMPORTANT GYM NOTICE
                </span>
                <span style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {urgentNotice.title}
                </span>
              </div>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                }}
              >
                {urgentNotice.message}
              </p>
            </div>
          </div>

          {urgentNotice.validUntil && (
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                padding: '7px 14px',
                borderRadius: '10px',
                flexShrink: 0,
                textAlign: 'right',
              }}
            >
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600 }}>Auto-expires:</div>
              <div style={{ fontWeight: 800, color: '#ef4444', marginTop: '1px' }}>
                {new Date(urgentNotice.validUntil).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Member Hero Command Center */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '28px 32px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md, 0 10px 30px rgba(0, 0, 0, 0.08))',
        }}
      >
        {/* Subtle Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            left: '-50px',
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-40px',
            right: '-40px',
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.18), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Member Profile Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.9rem',
              fontWeight: 900,
              letterSpacing: '0.04em',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.45)',
              border: '2px solid rgba(255, 255, 255, 0.18)',
              flexShrink: 0,
            }}
          >
            {memberInitials}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                MEMBER PASS
              </span>

              {portalData?.member?.status === 'frozen' || portalData?.member?.isFrozen ? (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      boxShadow: '0 0 6px #38bdf8',
                    }}
                  />
                  ❄️ Paused ({portalData?.member?.frozenRemainingDays || 0}d saved)
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 6px #10b981',
                    }}
                  />
                  Active Gym Access
                </span>
              )}

              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#f59e0b',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Flame size={12} style={{ color: '#f59e0b' }} />
                🔥 {summary.totalWorkouts || 2}-Day Streak
              </span>
            </div>

            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text-primary, #ffffff)',
                marginTop: '6px',
                letterSpacing: '-0.02em',
              }}
            >
              {greeting}, {memberName}!
            </h1>

            <div
              style={{
                fontSize: '0.84rem',
                color: 'var(--text-secondary, #94a3b8)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <span>
                Member ID:{' '}
                <strong style={{ color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  {member?.memberId || 'TF-1002'}
                </strong>
              </span>
              <span>•</span>
              <span>{gymName}</span>
              <span>•</span>
              <span style={{ color: '#10b981' }}>Verified Digital ID</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <Link
            href={`/scan?gym=${currentGym?._id || ''}`}
            className="btn btn-primary btn-lg"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderColor: '#10b981',
              color: '#ffffff',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Camera size={18} />
            <span>Scan Gym QR</span>
          </Link>

          <Link
            href="/chat"
            className="btn btn-secondary btn-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.25))',
              borderColor: 'rgba(99, 102, 241, 0.4)',
              color: '#a5b4fc',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.2)',
            }}
          >
            <MessageSquare size={18} />
            <span>Gym Chat</span>
          </Link>

          <Link
            href="/feedback"
            className="btn btn-secondary btn-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.2))',
              borderColor: 'rgba(245, 158, 11, 0.35)',
              color: '#f59e0b',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Star size={18} fill="#f59e0b" />
            <span>Give Feedback</span>
          </Link>

          <Link
            href="/store"
            className="btn btn-secondary btn-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(5, 150, 105, 0.2))',
              borderColor: 'rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)',
            }}
          >
            <ShoppingBag size={18} />
            <span>Gym Store</span>
          </Link>

          <Link
            href="/machines"
            className="btn btn-secondary btn-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.16), rgba(14, 165, 233, 0.2))',
              borderColor: 'rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.15)',
            }}
          >
            <Dumbbell size={18} />
            <span>Gym & Machines</span>
          </Link>

          <button
            onClick={() => setShowPassModal(true)}
            className="btn btn-secondary btn-lg"
            style={{
              background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.06))',
              borderColor: 'var(--border-subtle, rgba(255, 255, 255, 0.15))',
              color: 'var(--text-primary, #ffffff)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <QrCode size={18} />
            <span>View Digital Pass</span>
          </button>

          <button
            onClick={() => setShowThemeModal(true)}
            className="btn btn-secondary btn-lg"
            style={{
              background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.06))',
              borderColor: 'var(--border-subtle, rgba(255, 255, 255, 0.15))',
              color: 'var(--text-primary, #ffffff)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: activePortalTheme.primaryColor,
                boxShadow: `0 0 8px ${activePortalTheme.primaryColor}`,
                border: activePortalTheme.mode === 'light' ? '1.5px solid rgba(0,0,0,0.2)' : '1.5px solid rgba(255,255,255,0.7)',
              }}
            />
            <Palette size={18} style={{ color: activePortalTheme.primaryColor }} />
            <span>Theme: {activePortalTheme.name}</span>
          </button>

          <Link
            href="/ai-coach"
            className="btn btn-secondary btn-lg"
            style={{
              background: 'linear-gradient(135deg, var(--brand-primary-light, rgba(99, 102, 241, 0.15)), rgba(6, 182, 212, 0.12))',
              borderColor: 'var(--border-glow, rgba(99, 102, 241, 0.35))',
              color: 'var(--text-primary, #ffffff)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={18} style={{ color: 'var(--brand-primary, #6366f1)' }} />
            <span>AI Workout & Diet</span>
          </Link>

          <Link
            href="/notifications"
            className="btn btn-secondary btn-lg"
            style={{
              background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.05))',
              borderColor: 'var(--border-subtle, rgba(255, 255, 255, 0.12))',
              color: 'var(--text-primary, #ffffff)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </Link>
        </div>
      </div>

      {/* 2. Active In-Gym Training Session Alert */}
      {activeSessionToday && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.12))',
            border: '1.5px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '16px',
            padding: '16px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 14px #10b981',
                animation: 'pulse 1.4s infinite',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, color: '#ecfdf5', fontSize: '1.02rem' }}>
                  You are currently training inside the Gym!
                </span>
                <span className="badge badge-active" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  Floor Access Active
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#a7f3d0', marginTop: '2px' }}>
                Checked in at{' '}
                {new Date(activeSessionToday.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}{' '}
                • Elapsed training time: <strong>{elapsedSessionMins} mins</strong>
              </div>
            </div>
          </div>

          <Link
            href={`/scan?gym=${currentGym?._id || ''}`}
            className="btn btn-secondary btn-sm"
            style={{
              textDecoration: 'none',
              background: '#10b981',
              color: '#000000',
              fontWeight: 800,
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            }}
          >
            Scan QR to Check Out
          </Link>
        </div>
      )}

      {/* 3. Gym Notice Board Announcement */}
      {currentGym?.noticeBoard?.isActive && currentGym?.noticeBoard?.content && (() => {
        const priority = currentGym.noticeBoard.priority || 'info';
        const isUrgent = priority === 'urgent';
        const isAlert = priority === 'alert';

        const accentColor = isUrgent
          ? '#ef4444'
          : isAlert
          ? '#f59e0b'
          : 'var(--brand-primary, #6366f1)';

        const accentBg = isUrgent
          ? 'rgba(239, 68, 68, 0.12)'
          : isAlert
          ? 'rgba(245, 158, 11, 0.12)'
          : 'var(--brand-primary-light, rgba(99, 102, 241, 0.12))';

        const borderColor = isUrgent
          ? 'rgba(239, 68, 68, 0.35)'
          : isAlert
          ? 'rgba(245, 158, 11, 0.35)'
          : 'var(--border-subtle, rgba(99, 102, 241, 0.2))';

        return (
          <div
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${borderColor}`,
              borderLeft: `4px solid ${accentColor}`,
              borderRadius: '14px',
              padding: '12px 18px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: 'var(--shadow-sm, 0 2px 10px rgba(0, 0, 0, 0.04))',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle ambient accent gradient on left edge */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '180px',
                background: `radial-gradient(circle at left, ${accentBg}, transparent 75%)`,
                pointerEvents: 'none',
              }}
            />

            {/* Icon Tile */}
            <div
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                borderRadius: '8px',
                background: accentBg,
                color: accentColor,
                border: `1px solid ${borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Bell size={16} strokeWidth={2.4} />
            </div>

            {/* Announcement Message Content */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                position: 'relative',
                zIndex: 1,
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  color: accentColor,
                  letterSpacing: '0.01em',
                  marginRight: '8px',
                  display: 'inline-block',
                }}
              >
                {currentGym.noticeBoard.title || 'Gym Announcements'}:
              </span>
              <span
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                {currentGym.noticeBoard.content}
              </span>
            </div>
          </div>
        );
      })()}

      {/* 4. Four-Metric Bento Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '18px',
          marginBottom: '28px',
        }}
      >
        {/* Card 1: Membership Plan & Validity */}
        <div
          className="glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.08), var(--bg-card-solid))',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Current Plan
              </span>
              <span className={`badge ${diffDays > 0 || !member?.endDate ? 'badge-active' : 'badge-danger'}`}>
                {member?.endDate ? (diffDays > 0 ? `${diffDays} Days Left` : 'Expired') : 'Active Plan'}
              </span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-primary, #0ea5e9)', marginTop: '6px' }}>
              {member?.plan?.name || 'Monthly Standard'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Valid until: {member?.endDate ? new Date(member.endDate).toLocaleDateString('en-IN') : 'Active Membership Cycle'}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Plan Validity Cycle</span>
              <span>{100 - planProgressPercent}% time remaining</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.max(5, planProgressPercent)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #38bdf8, #6366f1)',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Workouts Completed & Consistency */}
        <div
          className="glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--border-glow, rgba(99, 102, 241, 0.25))',
            background: 'linear-gradient(180deg, var(--brand-primary-light, rgba(99, 102, 241, 0.08)), var(--bg-card-solid))',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Workouts Logged
              </span>
              <Flame size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
              {summary.totalWorkouts || attendance.length} <span style={{ fontSize: '1rem', color: 'var(--brand-primary, #818cf8)' }}>Sessions</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Logged via front desk kiosk scanner
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#34d399' }}>
            <Activity size={14} />
            <span>Consistency: Active Member</span>
          </div>
        </div>

        {/* Card 3: Fee Balance & Invoicing Status */}
        <div
          className="glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08), var(--bg-card-solid))',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fee Balance Status
              </span>
              <CreditCard size={18} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: summary.totalDues > 0 ? '#f59e0b' : '#10b981', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
              {summary.totalDues > 0 ? formatCurrency(summary.totalDues) : 'All Paid'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {summary.totalDues > 0 ? 'Balance due at desk' : 'No outstanding balances • All Clear'}
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {summary.totalDues > 0 ? (
              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                className="btn btn-primary btn-sm"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '7px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <CreditCard size={14} /> Pay ₹{summary.totalDues.toLocaleString('en-IN')} Online
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                className="btn btn-secondary btn-sm"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.74rem',
                  padding: '6px',
                  cursor: 'pointer',
                }}
              >
                <CreditCard size={13} /> Advance Fee Renewal
              </button>
            )}

            {payments[0] && (
              <button
                type="button"
                onClick={() => setSelectedReceipt(payments[0])}
                className="btn btn-secondary btn-sm"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.76rem',
                  padding: '6px',
                  cursor: 'pointer',
                }}
              >
                <Printer size={13} /> View Latest Tax Invoice
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Daily Hydration & Target (Interactive Widget!) */}
        <div
          className="glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.08), var(--bg-card-solid))',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Today's Water Goal
              </span>
              <Droplets size={18} style={{ color: '#0284c7' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0284c7', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
              {(waterMl / 1000).toFixed(2)} <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>/ 3.5 L</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Hydration target for athletic muscle recovery
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => addWater(250)}
              className="btn btn-secondary btn-sm"
              style={{
                flex: 1,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: 'rgba(6, 182, 212, 0.15)',
                borderColor: 'rgba(6, 182, 212, 0.35)',
                color: '#22d3ee',
              }}
            >
              <Plus size={13} /> 250ml
            </button>
            <button
              onClick={() => addWater(500)}
              className="btn btn-secondary btn-sm"
              style={{
                flex: 1,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: 'rgba(6, 182, 212, 0.15)',
                borderColor: 'rgba(6, 182, 212, 0.35)',
                color: '#22d3ee',
              }}
            >
              <Plus size={13} /> 500ml
            </button>
          </div>
        </div>
      </div>

      {/* 4.5. Live Budget Diet, Calorie & Workout Tracker */}
      <div style={{ marginBottom: '28px' }}>
        <SmartDietTracker />
      </div>

      {/* 5. Weekly Workout Heatmap & Virtual Holographic Pass Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          marginBottom: '28px',
        }}
      >
        {/* Weekly Training Consistency Heatmap */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
                Weekly Workout Heatmap
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                Your check-in frequency and duration this week
              </p>
            </div>
            <span className="badge badge-primary">Current Week</span>
          </div>

          {/* Day Pills Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              padding: '14px 0',
            }}
          >
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px 6px',
                  borderRadius: '12px',
                  background: day.isLive
                    ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.12))'
                    : day.attended
                    ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.18), rgba(16, 185, 129, 0.06))'
                    : day.isToday
                    ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.15))'
                    : 'var(--bg-input, rgba(255, 255, 255, 0.03))',
                  border: day.isLive
                    ? '1.5px solid #10b981'
                    : day.attended
                    ? '1.5px solid rgba(16, 185, 129, 0.5)'
                    : day.isToday
                    ? '1.5px solid var(--brand-primary, #6366f1)'
                    : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
                  boxShadow: day.isLive ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '0.68rem', color: day.isLive ? '#10b981' : day.attended ? '#10b981' : day.isToday ? 'var(--brand-primary, #818cf8)' : 'var(--text-muted, #64748b)', fontWeight: 700 }}>
                  {day.name}
                </span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: day.isLive || day.attended ? '#10b981' : day.isToday ? 'var(--brand-primary, #818cf8)' : 'var(--text-primary, #94a3b8)',
                    marginTop: '4px',
                  }}
                >
                  {day.dateNum}
                </span>

                <div style={{ marginTop: '8px' }}>
                  {day.isLive ? (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'block',
                        boxShadow: '0 0 10px #10b981',
                        animation: 'pulse 1.5s infinite',
                      }}
                    />
                  ) : day.attended ? (
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'block',
                        boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)',
                      }}
                    />
                  ) : day.isToday ? (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#6366f1',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'block',
                      }}
                    />
                  )}
                </div>

                <span
                  style={{
                    fontSize: '0.62rem',
                    color: day.isLive ? '#34d399' : day.attended ? '#10b981' : day.isToday ? '#a5b4fc' : '#64748b',
                    marginTop: '4px',
                    fontWeight: 700,
                  }}
                >
                  {day.isLive ? 'Live' : day.attended ? day.duration : day.isToday ? 'Today' : 'Rest'}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.78rem',
              color: '#94a3b8',
            }}
          >
            <span>Target: 4 Sessions / week</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>
              {attendance.length} Total Workouts Logged
            </span>
          </div>
        </div>

        {/* Luxury Executive VIP Gym Membership Card */}
        <div
          onClick={() => setShowPassModal(true)}
          style={{
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #070a13 0%, #0d1527 38%, #162038 72%, #080d1a 100%)',
            borderRadius: '22px',
            padding: '24px 26px',
            border: '1.5px solid rgba(255, 255, 255, 0.18)',
            boxShadow:
              'inset 0 1px 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.6), 0 22px 50px -10px rgba(0, 0, 0, 0.75), 0 0 35px var(--brand-primary-light, rgba(99, 102, 241, 0.2))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '235px',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow =
              'inset 0 1px 2px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.6), 0 28px 60px -10px rgba(0, 0, 0, 0.85), 0 0 45px var(--brand-primary-glow, rgba(99, 102, 241, 0.35))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow =
              'inset 0 1px 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.6), 0 22px 50px -10px rgba(0, 0, 0, 0.75), 0 0 35px var(--brand-primary-light, rgba(99, 102, 241, 0.2))';
          }}
        >
          {/* Subtle Guilloché Banknote Security Lines Watermark */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0.08,
              pointerEvents: 'none',
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="vipCardPattern" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 0 32 Q 16 0 32 32 T 64 32" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                <path d="M 0 16 Q 16 48 32 16 T 64 16" fill="none" stroke="#ffffff" strokeWidth="0.6" />
                <circle cx="32" cy="32" r="22" fill="none" stroke="#ffffff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#vipCardPattern)" />
          </svg>

          {/* Specular Diagonal Metallic Sheen Highlight */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(115deg, transparent 28%, rgba(255, 255, 255, 0.04) 42%, rgba(255, 255, 255, 0.09) 50%, rgba(255, 255, 255, 0.03) 58%, transparent 72%)',
              pointerEvents: 'none',
            }}
          />

          {/* Hologram Light Diffraction Flare (Top-Right) */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '210px',
              height: '210px',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(168, 85, 247, 0.15) 45%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Hologram Ambient Glow (Bottom-Left) */}
          <div
            style={{
              position: 'absolute',
              bottom: '-50px',
              left: '-50px',
              width: '160px',
              height: '160px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Card Header: Brand/Gym info & Realistic EMV Chip with Contactless NFC */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: '9999px',
                    padding: '2px 10px',
                    marginBottom: '6px',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 8px #10b981',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      color: 'rgba(255, 255, 255, 0.95)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    VIP ACCESS PASS
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  {gymName}
                </div>
              </div>

              {/* Right Side: Contactless Wave + Brushed 24K EMV Smart Chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Contactless Wave Indicator */}
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'rotate(90deg)',
                  }}
                  title="Contactless RFID Access"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M8.5 16.5a5 5 0 0 1 7 0" />
                    <path d="M5.5 13.5a9 9 0 0 1 13 0" />
                    <path d="M2.5 10.5a13 13 0 0 1 19 0" />
                  </svg>
                </div>

                {/* Hyper-Realistic 24K Gold EMV Microchip */}
                <div
                  style={{
                    width: '44px',
                    height: '34px',
                    borderRadius: '7px',
                    background: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 35%, #d97706 70%, #fbbf24 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.45)',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.7)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {/* Microchip internal contact leads */}
                  <div style={{ position: 'absolute', inset: '4px', border: '1px solid rgba(120, 53, 15, 0.65)', borderRadius: '4px' }} />
                  <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(120, 53, 15, 0.65)' }} />
                  <div style={{ position: 'absolute', height: '100%', width: '1px', background: 'rgba(120, 53, 15, 0.65)' }} />
                  <div
                    style={{
                      width: '16px',
                      height: '11px',
                      borderRadius: '2px',
                      border: '1px solid rgba(120, 53, 15, 0.75)',
                      background: 'rgba(245, 158, 11, 0.55)',
                      zIndex: 1,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Middle Section: Embossed Membership Serial Number */}
            <div style={{ marginTop: '20px' }}>
              <div
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                MEMBERSHIP PASS NUMBER
              </div>
              <div
                style={{
                  fontSize: '1.18rem',
                  fontWeight: 800,
                  fontFamily: "'Courier New', Courier, monospace",
                  letterSpacing: '0.24em',
                  color: '#ffffff',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 12px rgba(56, 189, 248, 0.35)',
                  marginTop: '2px',
                }}
              >
                •••• &nbsp; •••• &nbsp; •••• &nbsp;{' '}
                {member?.memberId ? member.memberId.replace(/[^0-9]/g, '').slice(-4) || '1002' : '1002'}
              </div>
            </div>
          </div>

          {/* Bottom Section: Member Name, Tier, Expiry & QR Access Trigger */}
          <div style={{ position: 'relative', zIndex: 1, marginTop: '16px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr',
                gap: '12px',
                alignItems: 'flex-end',
                paddingBottom: '14px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.55)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  CARDHOLDER NAME
                </div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginTop: '2px',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {memberName}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.55)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  MEMBER ID
                </div>
                <div
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                    marginTop: '2px',
                  }}
                >
                  {member?.memberId || 'TF-1002'}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.55)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  VALID THRU
                </div>
                <div
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: '#34d399',
                    fontFamily: 'monospace',
                    marginTop: '2px',
                  }}
                >
                  {member?.endDate ? new Date(member.endDate).toLocaleDateString('en-IN') : 'ACTIVE'}
                </div>
              </div>
            </div>

            {/* Action Bar: Biometric Pass status & Tap to Open Pass CTA */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                <ShieldCheck size={14} style={{ color: '#10b981' }} />
                <span>Verified Biometric & Kiosk RFID Access</span>
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06))',
                  border: '1px solid rgba(255, 255, 255, 0.28)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.35)',
                  transition: 'all 0.16s ease',
                }}
              >
                <QrCode size={14} style={{ color: '#38bdf8' }} />
                <span>Tap to Open Pass</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5.5 Active Gym Notice Board (Member Broadcasts) */}
      {memberNotices.length > 0 && (
        <div
          className="glass-card"
          id="notices"
          style={{
            padding: '24px',
            marginBottom: '28px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Megaphone size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Gym Notice Board & Announcements
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Important notices, trainer shifts & updates from {gymName}
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.12)',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
            >
              {memberNotices.length} Active Notice{memberNotices.length > 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {memberNotices.map((n) => (
              <div
                key={n._id}
                style={{
                  background:
                    n.priority === 'urgent'
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'var(--bg-input, rgba(255,255,255,0.03))',
                  border:
                    n.priority === 'urgent'
                      ? '1px solid rgba(239, 68, 68, 0.35)'
                      : '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: n.priority === 'urgent' ? '#ef4444' : '#f59e0b',
                        background: n.priority === 'urgent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        padding: '2px 7px',
                        borderRadius: '5px',
                      }}
                    >
                      {n.category?.replace('_', ' ') || 'Notice'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {n.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                    {n.message}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '14px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>By: {n.authorName || 'Gym Management'}</span>
                  {n.validUntil && (
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                      Valid: {new Date(n.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Dual Main Tables: Workout History & Fee Tax Receipts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Workout Activity History */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
                My Workout Activity History
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                Recent check-in timestamps and training durations
              </div>
            </div>
            <Link href={`/scan?gym=${currentGym?._id || ''}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              <Camera size={13} /> Check In
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                      No workout attendance recorded yet. Scan your pass at the kiosk desk!
                    </td>
                  </tr>
                ) : (
                  attendance.slice(0, 8).map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>{item.date}</td>
                      <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        {new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        {item.checkOut
                          ? new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                          : '—'}
                      </td>
                      <td>
                        {item.checkOut ? (
                          <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.82rem' }}>
                            {item.durationMinutes || 45} mins
                          </span>
                        ) : (
                          <span className="badge badge-active" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            Inside Gym
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fee Invoices & Receipts */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
                My Fee Invoices & Receipts
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                Digital tax receipts and payment verification records
              </div>
            </div>
            <span className="badge badge-active">GST Verified</span>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th style={{ textAlign: 'right' }}>Tax Invoice</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 800 }}>
                          {p.receiptNumber}
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ fontWeight: 800, color: '#10b981' }}>
                        {formatCurrency(p.amountPaid)}
                      </td>
                      <td>
                        <span className="badge badge-info">{p.paymentMethod}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.74rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                          }}
                        >
                          <Printer size={13} /> View Invoice
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Member Atmosphere Theme Selection Modal */}
      {showThemeModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowThemeModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            padding: '16px',
            animation: 'fadeIn 0.18s ease-out',
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '26px',
              background: 'var(--bg-card-solid, #0f1423)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
              borderRadius: '20px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.65), 0 0 0 1px var(--border-glow, rgba(99, 102, 241, 0.25))',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: 'var(--brand-primary-light, rgba(99, 102, 241, 0.14))',
                    border: '1px solid var(--border-subtle, rgba(99, 102, 241, 0.3))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-primary, #6366f1)',
                  }}
                >
                  <Palette size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)', margin: 0 }}>
                    Portal Atmosphere Theme
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                    Personalize your member dashboard experience
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowThemeModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                background: 'var(--bg-input, rgba(255, 255, 255, 0.05))',
                padding: '4px',
                borderRadius: '10px',
                marginBottom: '16px',
              }}
            >
              <button
                type="button"
                onClick={() => setThemeFilterTab('all')}
                style={{
                  flex: 1,
                  fontSize: '0.74rem',
                  fontWeight: themeFilterTab === 'all' ? 800 : 500,
                  padding: '6px 0',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  background: themeFilterTab === 'all' ? 'var(--bg-card-solid, rgba(255, 255, 255, 0.15))' : 'transparent',
                  color: themeFilterTab === 'all' ? 'var(--text-primary, #ffffff)' : 'var(--text-secondary, #94a3b8)',
                  boxShadow: themeFilterTab === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                All (12)
              </button>
              <button
                type="button"
                onClick={() => setThemeFilterTab('light')}
                style={{
                  flex: 1.3,
                  fontSize: '0.74rem',
                  fontWeight: themeFilterTab === 'light' ? 800 : 500,
                  padding: '6px 0',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  background: themeFilterTab === 'light' ? 'var(--bg-card-solid, rgba(255, 255, 255, 0.15))' : 'transparent',
                  color: themeFilterTab === 'light' ? '#0284c7' : 'var(--text-secondary, #94a3b8)',
                  boxShadow: themeFilterTab === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                ☀️ Light (4)
              </button>
              <button
                type="button"
                onClick={() => setThemeFilterTab('dark')}
                style={{
                  flex: 1.3,
                  fontSize: '0.74rem',
                  fontWeight: themeFilterTab === 'dark' ? 800 : 500,
                  padding: '6px 0',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  background: themeFilterTab === 'dark' ? 'var(--bg-card-solid, rgba(255, 255, 255, 0.15))' : 'transparent',
                  color: themeFilterTab === 'dark' ? '#a5b4fc' : 'var(--text-secondary, #94a3b8)',
                  boxShadow: themeFilterTab === 'dark' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                🌙 Dark (8)
              </button>
            </div>

            {/* Presets Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                maxHeight: '380px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {THEME_PRESETS.filter((p) => {
                if (themeFilterTab === 'light') return p.mode === 'light';
                if (themeFilterTab === 'dark') return p.mode === 'dark';
                return true;
              }).map((preset) => {
                const isSelected = currentPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setCurrentPresetId(preset.id);
                      applyThemeVariables(preset.id, preset.primaryColor);
                      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('feeorbit_token') : null);
                      if (activeToken) {
                        fetch('/api/auth/theme', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${activeToken}`,
                          },
                          body: JSON.stringify({
                            themePreset: preset.id,
                            themeColor: preset.primaryColor,
                          }),
                        }).catch(() => {});
                      }
                      toast.success(`Theme switched to ${preset.name}! ✨`, {
                        title: 'Theme Applied',
                      });
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: isSelected
                        ? '1.5px solid var(--brand-primary, #6366f1)'
                        : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                      background: isSelected
                        ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.12))'
                        : 'var(--bg-input, rgba(255, 255, 255, 0.03))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: 'relative',
                      boxShadow: isSelected ? '0 0 16px var(--brand-primary-light, rgba(99, 102, 241, 0.25))' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Header: Dot + Name + Check */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: preset.primaryColor,
                            boxShadow: `0 0 8px ${preset.primaryColor}`,
                            border: preset.mode === 'light' ? '1.5px solid rgba(0,0,0,0.2)' : '1.5px solid rgba(255,255,255,0.6)',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
                          {preset.name}
                        </div>
                      </div>
                      {isSelected && (
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'var(--brand-primary, #6366f1)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Swatches preview bar */}
                    <div style={{ display: 'flex', gap: '4px', height: '10px', borderRadius: '4px', overflow: 'hidden' }}>
                      {preset.previewSwatches?.map((swatch, idx) => (
                        <div key={idx} style={{ flex: 1, background: swatch }} />
                      ))}
                    </div>

                    {/* Tagline */}
                    <div
                      style={{
                        fontSize: '0.66rem',
                        color: 'var(--text-secondary, #94a3b8)',
                        lineHeight: 1.3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{preset.mode === 'light' ? '☀️ Light' : '🌙 Dark'}</span>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color: preset.primaryColor,
                          background: `${preset.primaryColor}1a`,
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        {preset.badge || 'Atmosphere'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Close Button */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowThemeModal(false)}
                className="btn btn-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Pass Modal */}
      {showPassModal && (
        <QRCodeModal
          member={
            member || {
              fullName: memberName,
              memberId: 'TF-1002',
              status: 'active',
              plan: { name: 'Monthly Standard' },
            }
          }
          onClose={() => setShowPassModal(false)}
        />
      )}

      {/* Professional Tax Invoice Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          gymInfo={currentGym}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Dedicated Member Online Fee Payment Modal */}
      {showPayModal && (
        <div
          className="modal-overlay"
          onClick={() => !payProcessing && setShowPayModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-lg, 0 25px 60px -15px rgba(0, 0, 0, 0.5))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                  }}
                >
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)', margin: 0 }}>
                    Online Fee Payment
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '1px' }}>
                    Instant verification & digital tax invoice
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !payProcessing && setShowPayModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Payable Amount Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(6, 182, 212, 0.08))',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '18px',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Payable Amount
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 900, color: '#10b981', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
                ₹{(summary.totalDues > 0 ? summary.totalDues : (member?.plan?.price || 1500)).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '4px' }}>
                Member: <strong style={{ color: 'var(--text-primary, #ffffff)' }}>{member?.fullName}</strong> ({member?.memberId || 'TF-1002'})
              </div>
            </div>

            {/* Choice Switcher Tabs (Shown if both methods are enabled by Admin) */}
            {enableDirectUpi && enableRazorpay && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  marginBottom: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '4px',
                  borderRadius: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setPayTab('direct_upi')}
                  style={{
                    padding: '9px 10px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: 'none',
                    background: payTab === 'direct_upi' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                    color: payTab === 'direct_upi' ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: payTab === 'direct_upi' ? '0 2px 10px rgba(16, 185, 129, 0.35)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Zap size={13} />
                  <span>⚡ Direct UPI (0% Fee)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayTab('razorpay')}
                  style={{
                    padding: '9px 10px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: 'none',
                    background: payTab === 'razorpay' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                    color: payTab === 'razorpay' ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: payTab === 'razorpay' ? '0 2px 10px rgba(59, 130, 246, 0.35)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <CreditCard size={13} />
                  <span>💳 Cards / Online</span>
                </button>
              </div>
            )}

            {/* Payable Amount Banner */}
            <div
              style={{
                background: payTab === 'direct_upi'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(6, 182, 212, 0.08))'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.14), rgba(99, 102, 241, 0.08))',
                border: payTab === 'direct_upi'
                  ? '1.5px solid rgba(16, 185, 129, 0.4)'
                  : '1.5px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: payTab === 'direct_upi' ? '#a7f3d0' : '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Payable Amount
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: payTab === 'direct_upi' ? '#10b981' : '#38bdf8', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
                ₹{(summary.totalDues > 0 ? summary.totalDues : (member?.plan?.price || 1500)).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                Member: <strong style={{ color: 'var(--text-primary, #ffffff)' }}>{member?.fullName}</strong> ({member?.memberId || 'TF-1002'})
              </div>
            </div>

            {/* TAB 1: DIRECT GYM UPI QR */}
            {payTab === 'direct_upi' ? (
              <div>
                {/* Dynamic QR Display */}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  {qrCodeDataUrl ? (
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '10px',
                        background: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)',
                      }}
                    >
                      <img
                        src={qrCodeDataUrl}
                        alt="Direct UPI QR Code"
                        style={{ width: '155px', height: '155px', display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div style={{ height: '155px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <RefreshCw size={20} className="animate-spin" />
                    </div>
                  )}
                  <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700, marginTop: '8px' }}>
                    ⚡ 0% Fee Direct Bank Transfer • Scan with any UPI App
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', fontSize: '0.64rem', color: '#94a3b8' }}>
                    <span>Google Pay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span>
                  </div>
                </div>

                {/* Gym UPI ID Bar with Copy */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px dashed rgba(56, 189, 248, 0.35)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Official Gym UPI ID:
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                      {gymUpiId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: copiedUpi ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                      border: copiedUpi ? '1px solid #10b981' : '1px solid rgba(56, 189, 248, 0.3)',
                      color: copiedUpi ? '#34d399' : '#38bdf8',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                {/* 12-Digit UTR Input */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary, #ffffff)', marginBottom: '4px' }}>
                    Enter 12-Digit UTR / UPI Ref Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                    Pay via GPay/PhonePe and enter the 12-digit UTR from your transaction receipt:
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 426189341201"
                    value={utrNumber}
                    maxLength={16}
                    onChange={(e) => {
                      setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''));
                      if (utrError) setUtrError('');
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-input, #090e1a)',
                      border: utrError ? '1.5px solid #ef4444' : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
                      borderRadius: '8px',
                      color: 'var(--text-primary, #ffffff)',
                      fontSize: '0.84rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.04em',
                      outline: 'none',
                    }}
                  />
                  {utrError && (
                    <div style={{ color: '#f87171', fontSize: '0.68rem', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ {utrError}
                    </div>
                  )}
                </div>

                {/* Action Buttons for Direct UPI */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    disabled={payProcessing}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDirectUpi}
                    disabled={payProcessing}
                    className="btn btn-primary"
                    style={{
                      flex: 2,
                      padding: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    {payProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Verifying UTR...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Confirm Payment & Get Receipt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: INSTANT GATEWAY (CARDS / ONLINE) */
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                    Select Gateway Payment Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {['UPI', 'Card', 'Net Banking'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayMethod(m)}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: payMethod === m ? 'rgba(59, 130, 246, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                          border: payMethod === m ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: payMethod === m ? '#60a5fa' : '#cbd5e1',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '18px',
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    color: '#93c5fd',
                  }}
                >
                  Instant verification via Razorpay Gateway. Tax receipt will be issued automatically.
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    disabled={payProcessing}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePayDueOnline}
                    disabled={payProcessing}
                    className="btn btn-primary"
                    style={{
                      flex: 2,
                      padding: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    {payProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Pay ₹{(summary.totalDues > 0 ? summary.totalDues : (member?.plan?.price || 1500)).toLocaleString('en-IN')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
