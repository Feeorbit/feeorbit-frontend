'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useGym } from '../context/GymContext';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Plus,
  Bell,
  X,
  LogOut,
  ChevronDown,
  User,
  Search,
  Briefcase,
  Dumbbell,
  Menu,
  CheckCheck,
  CreditCard,
  QrCode,
  Sparkles,
  GitBranch,
  Check,
  Camera,
  Upload,
  RefreshCw,
  Palette,
} from 'lucide-react';
import { uploadImageToCloudinary } from '../utils/upload';
import ReceiptModal from './ReceiptModal';
import { toast } from '../context/ToastContext';
import { THEME_PRESETS, applyThemeVariables, getThemePreset } from '../utils/themePresets';
import { useLanguage } from '../context/LanguageContext';

export default function GymHeader({ onToggleSidebar }) {
  const { gyms, currentGym, switchGym, refreshGyms, updateCurrentGymSettings } = useGym();
  const { user, token, logout, updateUserProfile } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  const [showAddGymModal, setShowAddGymModal] = useState(false);
  const [newGymName, setNewGymName] = useState('');
  const [newGymPhone, setNewGymPhone] = useState('');
  const [newGymAddress, setNewGymAddress] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [gymDropdownOpen, setGymDropdownOpen] = useState(false);
  const gymDropdownRef = useRef(null);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef(null);
  const { t } = useLanguage();
  const [themeFilter, setThemeFilter] = useState('all'); // 'all' | 'light' | 'dark'

  const [currentPresetId, setCurrentPresetId] = useState(() => {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('feeorbit_theme_preset');
      if (local) return local;
    }
    return currentGym?.themePreset || 'midnight';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('feeorbit_theme_preset');
      if (local) {
        setCurrentPresetId(local);
        return;
      }
    }
    if (currentGym?.themePreset) {
      setCurrentPresetId(currentGym.themePreset);
    }
  }, [currentGym?.themePreset]);

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e?.detail?.preset) {
        setCurrentPresetId(e.detail.preset);
      }
    };
    window.addEventListener('feeorbit_theme_changed', handleThemeChange);
    return () => window.removeEventListener('feeorbit_theme_changed', handleThemeChange);
  }, []);

  const activeTheme = getThemePreset(currentPresetId);
  const isAppLight = activeTheme?.mode === 'light';

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [deletedIds, setDeletedIds] = useState(new Set());
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [latestPaymentToast, setLatestPaymentToast] = useState(null);
  const knownPaymentIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Soft cheerful synthesizer chime when payment is received
  const playPaymentChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      // Note 1: E5 (659Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: A5 (880Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {}
  };

  // Close gym and theme switch dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (gymDropdownRef.current && !gymDropdownRef.current.contains(e.target)) {
        setGymDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setThemeDropdownOpen(false);
      }
    };
    if (gymDropdownOpen || themeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [gymDropdownOpen, themeDropdownOpen]);

  // Scoped gyms based on user role (Admin only sees their main gym + branches)
  const availableGyms = useMemo(() => {
    if (!gyms || gyms.length === 0) return [];
    if (user?.role === 'superadmin') return gyms;
    if (user?.role === 'admin') {
      const currentUserId = user._id || user.id;
      const currentUserGym = user.gym;
      return gyms.filter((g) => {
        const gymOwnerId = typeof g.owner === 'object' ? g.owner?._id : g.owner;
        const isOwner = gymOwnerId && currentUserId && String(gymOwnerId) === String(currentUserId);
        const isAssignedGym = currentUserGym && String(g._id) === String(currentUserGym);
        const isBranchOfAssignedGym =
          currentUserGym &&
          g.parentGym &&
          (String(g.parentGym) === String(currentUserGym) ||
            String(g.parentGym?._id) === String(currentUserGym));
        return isOwner || isAssignedGym || isBranchOfAssignedGym;
      });
    }
    if (user?.gym) {
      return gyms.filter((g) => String(g._id) === String(user.gym));
    }
    return gyms;
  }, [gyms, user]);

  // Auto-align current gym if it was out of scope
  useEffect(() => {
    if (availableGyms.length > 0 && currentGym) {
      const exists = availableGyms.some((g) => String(g._id) === String(currentGym._id));
      if (!exists) {
        switchGym(availableGyms[0]._id);
      }
    }
  }, [availableGyms, currentGym]);

  // Load read & deleted notifications from localStorage
  useEffect(() => {
    const syncNotificationState = () => {
      try {
        const storedRead = localStorage.getItem('feeorbit_read_notifs');
        if (storedRead) setReadIds(new Set(JSON.parse(storedRead)));
        const storedDeleted = localStorage.getItem('feeorbit_deleted_notifs');
        if (storedDeleted) setDeletedIds(new Set(JSON.parse(storedDeleted)));
      } catch (e) {}
    };

    syncNotificationState();
    window.addEventListener('feeorbit-notifications-updated', syncNotificationState);
    window.addEventListener('storage', syncNotificationState);
    return () => {
      window.removeEventListener('feeorbit-notifications-updated', syncNotificationState);
      window.removeEventListener('storage', syncNotificationState);
    };
  }, []);

  // Fetch real notifications from database
  useEffect(() => {
    let isMounted = true;
    const loadRealNotifications = async () => {
      try {
        let url = '/api/dashboard/stats';
        if (currentGym?._id) url += `?gymId=${currentGym._id}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && isMounted) {
          const list = [];

          // 1. Real fee payments (Highest Priority)
          if (data.recentActivity?.payments?.length > 0) {
            const freshPayments = [];
            data.recentActivity.payments.forEach((item) => {
              if (item._id && !knownPaymentIdsRef.current.has(item._id)) {
                freshPayments.push(item);
                knownPaymentIdsRef.current.add(item._id);
              }
            });

            // Trigger notification sound & toast if not initial load
            if (!isFirstLoadRef.current && freshPayments.length > 0) {
              const newest = freshPayments[0];
              playPaymentChime();
              setLatestPaymentToast(newest);
              setTimeout(() => {
                setLatestPaymentToast((curr) => (curr?._id === newest._id ? null : curr));
              }, 8000);
            }
            isFirstLoadRef.current = false;

            data.recentActivity.payments.forEach((item) => {
              const pDate = item.paymentDate ? new Date(item.paymentDate) : new Date();
              const timeStr = pDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
              const name = item.memberName || item.member?.fullName || 'Member';
              list.push({
                id: `pay-${item._id}`,
                title: `Fee Payment: ₹${(item.amountPaid || 0).toLocaleString('en-IN')}`,
                desc: `₹${(item.amountPaid || 0).toLocaleString('en-IN')} received from ${name} via ${item.paymentMethod || 'UPI'} (${item.planName || 'Plan'})`,
                time: timeStr,
                type: 'payment',
                timestamp: pDate.getTime(),
                href: '/billing',
                paymentData: item,
              });
            });
          }

          // 2. Real check-in activities
          if (data.recentActivity?.checkIns?.length > 0) {
            data.recentActivity.checkIns.forEach((item) => {
              const cDate = item.checkIn ? new Date(item.checkIn) : new Date();
              const timeStr = cDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
              const name = item.memberName || item.member?.fullName || 'Member';
              list.push({
                id: `ci-${item._id}`,
                title: `${name} Checked In`,
                desc: item.method === 'qr' ? 'QR pass scanned via kiosk' : 'Front desk check-in recorded',
                time: timeStr,
                type: 'checkin',
                timestamp: cDate.getTime(),
                href: '/kiosk',
              });
            });
          }

          // 3. Expiring soon alerts
          if (data.expiringSoonList?.length > 0) {
            data.expiringSoonList.slice(0, 3).forEach((m) => {
              list.push({
                id: `exp-${m._id}`,
                title: 'Membership Expiring Soon',
                desc: `${m.fullName}'s membership ends on ${new Date(m.endDate).toLocaleDateString()}`,
                time: 'Alert',
                type: 'ai',
                timestamp: Date.now() - 15000,
                href: `/billing?memberId=${m._id}`,
              });
            });
          }

          // Strict chronological sort: Newest events strictly on top!
          list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setNotifications(list);
        }
      } catch (err) {
        // quiet fallback
      }
    };

    loadRealNotifications();
    const timer = setInterval(loadRealNotifications, 12000);

    const handlePaymentReceived = (e) => {
      if (e?.detail) {
        knownPaymentIdsRef.current.add(e.detail._id);
        playPaymentChime();
        setLatestPaymentToast(e.detail);
        setTimeout(() => {
          setLatestPaymentToast((curr) => (curr?._id === e.detail?._id ? null : curr));
        }, 8000);
      }
      loadRealNotifications();
    };
    window.addEventListener('feeorbit-payment-received', handlePaymentReceived);

    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener('feeorbit-payment-received', handlePaymentReceived);
    };
  }, [currentGym]);

  // Click outside to close notification and user menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#notification-bell-container')) {
        setShowNotifications(false);
      }
      if (!e.target.closest('#user-profile-menu-container')) {
        setShowUserMenu(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Only show active unread notifications in popup tray
  const activeUnreadNotifications = notifications.filter(
    (n) => !readIds.has(n.id) && !deletedIds.has(n.id)
  );

  const unreadCount = activeUnreadNotifications.length;

  const markAllNotificationsRead = (e) => {
    e.stopPropagation();
    const updated = new Set(readIds);
    notifications.forEach((n) => updated.add(n.id));
    setReadIds(updated);
    try {
      localStorage.setItem('feeorbit_read_notifs', JSON.stringify([...updated]));
      window.dispatchEvent(new Event('feeorbit-notifications-updated'));
    } catch (err) {}
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newGymName || !newGymPhone) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/gyms/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentGymId: currentGym?._id,
          branchName: newGymName,
          branchCode: newBranchCode || `BR-${Date.now().toString().slice(-3)}`,
          phone: newGymPhone,
          address: newGymAddress || currentGym?.address,
          ownerId: user?._id || user?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddGymModal(false);
        setNewGymName('');
        setNewGymPhone('');
        setNewGymAddress('');
        setNewBranchCode('');
        await refreshGyms(user?.role === 'superadmin');
        switchGym(data.data._id);
        toast.success(`Branch "${data.data.name}" created successfully!`, { title: 'Branch Created' });
      } else {
        toast.error(data.message || 'Error creating branch', { title: 'Creation Failed' });
      }
    } catch (err) {
      toast.error('Failed to connect to server', { title: 'Network Error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Please choose a valid image file (PNG, JPG, WEBP).', { title: 'Invalid File' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await uploadImageToCloudinary(file, 'feeorbit/avatars');
      const updateRes = await updateUserProfile({ avatar: res.url });
      if (updateRes.success) {
        toast.success('Profile picture uploaded & updated successfully! ☁️', { title: 'Avatar Updated' });
      } else {
        toast.error(updateRes.message || 'Failed to update user profile avatar.', { title: 'Update Failed' });
      }
    } catch (err) {
      toast.error('Upload failed: ' + (err.message || 'Please check Cloudinary credentials.'), { title: 'Upload Failed' });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <>
      <header
        className="gym-top-header no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '6px 2px',
          marginBottom: '14px',
        }}
      >
        {/* Left Side: Hamburger Menu (mobile only) + Active Gym Selector + Branch Button + Onboard Gym Button */}
        <div className="gym-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mobile Drawer Toggle (Hidden on Desktop >=1024px) */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onToggleSidebar}
            aria-label="Open Navigation Menu"
          >
            <Menu size={18} />
          </button>

          {/* If Member: Show clean luxury badge for their Gym */}
          {user?.role === 'member' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '11px',
                padding: '0 12px 0 6px',
                height: '38px',
                boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04))',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-hover, var(--brand-primary)))',
                  boxShadow: '0 2px 6px var(--brand-glow, rgba(99, 102, 241, 0.25))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                <Dumbbell size={13} strokeWidth={2.4} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span
                  style={{
                    fontSize: '0.56rem',
                    color: 'var(--brand-primary)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  MY GYM
                </span>
                <span
                  style={{
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    maxWidth: '220px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentGym?.name || user?.gym?.name || 'FeeOrbit Fitness Club'}
                </span>
              </div>
            </div>
          ) : (
            /* For Admin & SuperAdmin: Custom Luxury Gym / Branch Dropdown */
            <div ref={gymDropdownRef} style={{ position: 'relative', minWidth: 0 }}>
              <button
                type="button"
                className="gym-switcher-btn"
                onClick={() => setGymDropdownOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: gymDropdownOpen ? 'var(--brand-primary-light)' : 'var(--bg-card)',
                  border: gymDropdownOpen
                    ? '1px solid var(--brand-primary)'
                    : '1px solid var(--border-subtle)',
                  borderRadius: '11px',
                  padding: '0 12px 0 6px',
                  height: '38px',
                  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04))',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  minWidth: 0,
                }}
                title="Switch Active Gym or Branch"
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '7px',
                    background: currentGym?.isBranch
                      ? 'linear-gradient(135deg, #0284c7, #38bdf8)'
                      : 'linear-gradient(135deg, var(--brand-primary), var(--brand-hover, var(--brand-primary)))',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0,
                  }}
                >
                  {currentGym?.isBranch ? <GitBranch size={13} strokeWidth={2.4} /> : <Building2 size={13} strokeWidth={2.4} />}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.15 }}>
                  <div className="gym-switcher-sublabel-row" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      className="gym-switcher-sublabel"
                      style={{
                        fontSize: '0.56rem',
                        color: currentGym?.isBranch ? '#0284c7' : 'var(--brand-primary)',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {currentGym?.isBranch ? t('header_active_branch', 'ACTIVE BRANCH') : t('header_active_gym', 'ACTIVE GYM')}
                    </span>
                    {currentGym?.isBranch && (
                      <span
                        style={{
                          fontSize: '0.52rem',
                          background: 'rgba(56, 189, 248, 0.18)',
                          color: '#0284c7',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          fontWeight: 800,
                          lineHeight: 1,
                        }}
                      >
                        {t('header_branch', 'BRANCH')}
                      </span>
                    )}
                  </div>
                  <span
                    className="gym-switcher-title"
                    style={{
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginTop: '1px',
                      maxWidth: '190px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentGym?.name || 'FeeOrbit Fitness Club'}
                  </span>
                </div>

                <ChevronDown
                  size={12}
                  style={{
                    color: gymDropdownOpen ? 'var(--brand-primary)' : 'var(--text-muted)',
                    marginLeft: '2px',
                    transform: gymDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease, color 0.2s ease',
                  }}
                />
              </button>

              {/* Luxury Dropdown Menu Popover */}
              {gymDropdownOpen && (
                <div
                  className="header-popover-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    zIndex: 1100,
                    minWidth: '320px',
                    maxWidth: '380px',
                    background: 'var(--bg-card-solid, rgba(10, 16, 32, 0.98))',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                    borderRadius: '12px',
                    boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-glow, rgba(99, 102, 241, 0.25))',
                    padding: '8px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top Bar inside Dropdown */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px 10px',
                      borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.07))',
                      marginBottom: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={13} style={{ color: 'var(--brand-primary, #818cf8)' }} />
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--text-primary, #cbd5e1)',
                        }}
                      >
                        {user?.role === 'superadmin' ? t('header_switch_tenant', 'Switch Tenant Gym') : t('header_locations_branches', 'Gym Locations & Branches')}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: '#94a3b8',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {availableGyms.length} {availableGyms.length === 1 ? 'Location' : 'Locations'}
                    </span>
                  </div>

                  {/* Locations List */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      maxHeight: '260px',
                      overflowY: 'auto',
                    }}
                  >
                    {availableGyms.map((g) => {
                      const isSelected = currentGym?._id === g._id;
                      const isBranch = !!g.isBranch;
                      return (
                        <div
                          key={g._id}
                          onClick={() => {
                            switchGym(g._id);
                            setGymDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                            border: isSelected
                              ? '1px solid rgba(99, 102, 241, 0.35)'
                              : '1px solid transparent',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '7px',
                                background: isBranch
                                  ? 'rgba(56, 189, 248, 0.15)'
                                  : 'rgba(139, 92, 246, 0.18)',
                                border: isBranch
                                  ? '1px solid rgba(56, 189, 248, 0.35)'
                                  : '1px solid rgba(139, 92, 246, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isBranch ? '#38bdf8' : '#a78bfa',
                                flexShrink: 0,
                              }}
                            >
                              {isBranch ? <GitBranch size={14} /> : <Briefcase size={14} />}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    fontSize: '0.78rem',
                                    fontWeight: isSelected ? 700 : 600,
                                    color: isSelected ? '#ffffff' : '#e2e8f0',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '180px',
                                  }}
                                >
                                  {g.name}
                                </span>
                                {isBranch ? (
                                  <span
                                    style={{
                                      fontSize: '0.58rem',
                                      fontWeight: 700,
                                      color: '#38bdf8',
                                      background: 'rgba(56, 189, 248, 0.12)',
                                      border: '1px solid rgba(56, 189, 248, 0.25)',
                                      borderRadius: '4px',
                                      padding: '1px 5px',
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    Branch
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: '0.58rem',
                                      fontWeight: 700,
                                      color: '#a78bfa',
                                      background: 'rgba(139, 92, 246, 0.12)',
                                      border: '1px solid rgba(139, 92, 246, 0.25)',
                                      borderRadius: '4px',
                                      padding: '1px 5px',
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    Main Hub
                                  </span>
                                )}
                              </div>
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  color: '#64748b',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {g.address || (isBranch && g.branchCode ? `Branch Code: ${g.branchCode}` : 'Main Campus')}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                flexShrink: 0,
                                marginLeft: '8px',
                              }}
                            >
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Quick Links */}
                  <div
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                      marginTop: '8px',
                      paddingTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    {user?.role === 'admin' && (
                      <>
                        <Link
                          href="/branches"
                          onClick={() => setGymDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: '#818cf8',
                            textDecoration: 'none',
                            padding: '4px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          <GitBranch size={12} />
                          <span>Branch Directory</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setGymDropdownOpen(false);
                            setShowAddGymModal(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={11} strokeWidth={2.6} />
                          <span>+ New Branch</span>
                        </button>
                      </>
                    )}

                    {user?.role === 'superadmin' && (
                      <>
                        <Link
                          href="/superadmin/gyms"
                          onClick={() => setGymDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: '#818cf8',
                            textDecoration: 'none',
                            padding: '4px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          <Building2 size={12} />
                          <span>All Gyms Directory</span>
                        </Link>

                        <Link
                          href="/onboarding"
                          onClick={() => setGymDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#a78bfa',
                            background: 'rgba(139, 92, 246, 0.15)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                          }}
                        >
                          <Plus size={11} strokeWidth={2.6} />
                          <span>+ Add Gym</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* + Branch Button (Strictly for Admin only, opens branch modal for current gym) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAddGymModal(true)}
              className="d-none-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                height: '34px',
                padding: '0 11px',
                background: 'var(--bg-input, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                borderRadius: '8px',
                color: 'var(--text-primary, #e2e8f0)',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04)',
              }}
              title="Add New Branch to this Gym"
            >
              <Plus size={13} strokeWidth={2.5} style={{ color: '#38bdf8' }} />
              <span>{t('header_branch', 'Branch')}</span>
            </button>
          )}

          {/* + Add Gym Button (STRICTLY FOR SUPERADMIN ONLY!) */}
          {user?.role === 'superadmin' && (
            <Link
              href="/onboarding"
              className="d-none-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                height: '34px',
                padding: '0 14px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.15s ease',
              }}
              title="Onboard a new Gym tenant to FeeOrbit"
            >
              <Plus size={13} strokeWidth={2.6} />
              <span>Add Gym</span>
            </Link>
          )}
        </div>

        {/* Right Side: Global Command Search Bar + Notifications + Profile Avatar */}
        <div className="gym-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Global Search Bar (Linear Command Style) */}
          <div
            style={{
              position: 'relative',
              width: '240px',
              height: '38px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '11px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px 0 32px',
              boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.03))',
              transition: 'all 0.15s ease',
            }}
            className="d-none-sm"
          >
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '11px',
                color: 'var(--brand-primary)',
                opacity: 0.85,
              }}
            />
            <input
              type="text"
              placeholder={t('header_search', 'Search members, mobile, bills...')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  window.location.href = `/members?q=${encodeURIComponent(e.target.value.trim())}`;
                }
              }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                fontWeight: 500,
                outline: 'none',
              }}
            />
            <span
              style={{
                fontSize: '0.60rem',
                color: 'var(--brand-primary)',
                background: 'var(--brand-primary-light, rgba(99, 102, 241, 0.1))',
                padding: '2px 6px',
                borderRadius: '5px',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'monospace',
                fontWeight: 700,
                pointerEvents: 'none',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ⌘K
            </span>
          </div>

          {/* Luxury Atmosphere Theme Switcher Popover */}
          <div ref={themeDropdownRef} style={{ position: 'relative' }}>
            {(() => {
              const visiblePresets = THEME_PRESETS.filter((p) => {
                if (themeFilter === 'light') return p.mode === 'light';
                if (themeFilter === 'dark') return p.mode === 'dark';
                return true;
              });

              return (
                <>
                  <button
                    type="button"
                    className="header-icon-btn"
                    onClick={() => {
                      setThemeDropdownOpen((prev) => !prev);
                      setShowNotifications(false);
                      setShowUserMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      height: '38px',
                      padding: '0 10px 0 6px',
                      background: themeDropdownOpen
                        ? 'var(--brand-primary-light)'
                        : 'var(--bg-card)',
                      border: themeDropdownOpen
                        ? '1px solid var(--brand-primary)'
                        : '1px solid var(--border-subtle)',
                      borderRadius: '11px',
                      color: 'var(--text-primary)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04))',
                    }}
                    title="Switch Luxury Atmosphere Theme"
                    aria-label="Theme Customizer"
                  >
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '7px',
                        background: `linear-gradient(135deg, ${activeTheme.primaryColor}, ${activeTheme.previewSwatches?.[3] || activeTheme.primaryColor})`,
                        boxShadow: `0 2px 6px ${activeTheme.primaryGlow || 'rgba(0, 0, 0, 0.15)'}`,
                        border: '1px solid rgba(255, 255, 255, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        flexShrink: 0,
                      }}
                    >
                      <Palette size={13} strokeWidth={2.4} />
                    </div>
                    <span className="d-none-sm" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.78rem' }}>
                      {activeTheme.name.split(' ')[0]}
                    </span>
                    <ChevronDown
                      size={11}
                      className="d-none-sm"
                      style={{
                        transform: themeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                        color: 'var(--text-muted)',
                      }}
                    />
                  </button>

                  {themeDropdownOpen && (
                    <div
                      className="header-popover-menu"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        zIndex: 1200,
                        width: '360px',
                        maxWidth: '92vw',
                        background: isAppLight ? '#ffffff' : 'var(--bg-card-solid, #0a1020)',
                        backdropFilter: 'blur(28px)',
                        WebkitBackdropFilter: 'blur(28px)',
                        border: isAppLight
                          ? '1px solid rgba(15, 23, 42, 0.12)'
                          : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                        borderRadius: '14px',
                        boxShadow: isAppLight
                          ? '0 20px 50px -10px rgba(15, 23, 42, 0.2), 0 0 0 1px var(--border-glow, rgba(99, 102, 241, 0.15))'
                          : '0 24px 60px -12px rgba(0, 0, 0, 0.92), 0 0 0 1px var(--border-glow, rgba(99, 102, 241, 0.25))',
                        padding: '12px',
                        animation: 'slideUp 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {/* Popover Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingBottom: '10px',
                          borderBottom: isAppLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <Sparkles size={14} style={{ color: activeTheme.primaryColor }} />
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isAppLight ? '#0f172a' : '#ffffff' }}>
                              {t('header_themes_title', 'Atmosphere Themes')}
                            </div>
                            <div style={{ fontSize: '0.64rem', color: isAppLight ? '#64748b' : '#94a3b8' }}>
                              {t('header_themes_subtitle', '12 Curated Ultra-Luxury & Studio Palettes')}
                            </div>
                          </div>
                        </div>

                        <Link
                          href="/settings"
                          onClick={() => setThemeDropdownOpen(false)}
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            color: activeTheme.primaryColor,
                            textDecoration: 'none',
                            background: isAppLight ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                            border: isAppLight ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          Fine-Tune &rarr;
                        </Link>
                      </div>

                      {/* Theme Category Filter Pills */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '4px',
                          background: isAppLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                          padding: '3px',
                          borderRadius: '8px',
                          marginBottom: '10px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setThemeFilter('all')}
                          style={{
                            flex: 1,
                            fontSize: '0.66rem',
                            fontWeight: themeFilter === 'all' ? 700 : 500,
                            padding: '4px 0',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            background: themeFilter === 'all' ? (isAppLight ? '#ffffff' : 'rgba(255, 255, 255, 0.12)') : 'transparent',
                            color: themeFilter === 'all' ? (isAppLight ? '#0f172a' : '#ffffff') : isAppLight ? '#64748b' : '#94a3b8',
                            boxShadow: themeFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.14s ease',
                          }}
                        >
                          All (12)
                        </button>
                        <button
                          type="button"
                          onClick={() => setThemeFilter('light')}
                          style={{
                            flex: 1.3,
                            fontSize: '0.66rem',
                            fontWeight: themeFilter === 'light' ? 700 : 500,
                            padding: '4px 0',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            background: themeFilter === 'light' ? (isAppLight ? '#ffffff' : 'rgba(255, 255, 255, 0.12)') : 'transparent',
                            color: themeFilter === 'light' ? (isAppLight ? '#0284c7' : '#38bdf8') : isAppLight ? '#64748b' : '#94a3b8',
                            boxShadow: themeFilter === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.14s ease',
                          }}
                        >
                          ☀️ Light (4)
                        </button>
                        <button
                          type="button"
                          onClick={() => setThemeFilter('dark')}
                          style={{
                            flex: 1.3,
                            fontSize: '0.66rem',
                            fontWeight: themeFilter === 'dark' ? 700 : 500,
                            padding: '4px 0',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            background: themeFilter === 'dark' ? (isAppLight ? '#ffffff' : 'rgba(255, 255, 255, 0.12)') : 'transparent',
                            color: themeFilter === 'dark' ? (isAppLight ? '#4338ca' : '#a5b4fc') : isAppLight ? '#64748b' : '#94a3b8',
                            boxShadow: themeFilter === 'dark' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.14s ease',
                          }}
                        >
                          🌙 Dark (8)
                        </button>
                      </div>

                      {/* Themes Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '8px',
                          maxHeight: '340px',
                          overflowY: 'auto',
                          paddingRight: '2px',
                        }}
                      >
                        {visiblePresets.map((preset) => {
                          const isSelected = currentPresetId === preset.id;
                          return (
                            <div
                              key={preset.id}
                              onClick={async () => {
                                if (isSelected) return;
                                setCurrentPresetId(preset.id);
                                applyThemeVariables(preset.id, preset.primaryColor);
                                if (
                                  currentGym?._id &&
                                  (user?.role === 'admin' || user?.role === 'superadmin')
                                ) {
                                  updateCurrentGymSettings({
                                    themePreset: preset.id,
                                    primaryColor: preset.primaryColor,
                                  });
                                }
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
                                toast.success(`Theme transformed to ${preset.name}! ✨`, {
                                  title: 'Theme Applied',
                                });
                              }}
                              style={{
                                background: isSelected
                                  ? isAppLight
                                    ? `${preset.primaryColor}18`
                                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.02))'
                                  : isAppLight
                                  ? '#f8fafc'
                                  : 'rgba(255, 255, 255, 0.02)',
                                border: isSelected
                                  ? `1.5px solid ${preset.primaryColor}`
                                  : isAppLight
                                  ? '1px solid rgba(15, 23, 42, 0.12)'
                                  : '1px solid rgba(255, 255, 255, 0.07)',
                                borderRadius: '9px',
                                padding: '8px 9px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                position: 'relative',
                                boxShadow: isSelected
                                  ? `0 0 14px ${preset.primaryGlow}`
                                  : 'none',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = isAppLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)';
                                  e.currentTarget.style.borderColor = isAppLight ? 'rgba(15, 23, 42, 0.22)' : 'rgba(255, 255, 255, 0.16)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = isAppLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)';
                                  e.currentTarget.style.borderColor = isAppLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.07)';
                                }
                              }}
                            >
                              {/* Swatch Bar */}
                              <div
                                style={{
                                  display: 'flex',
                                  height: '8px',
                                  borderRadius: '3px',
                                  overflow: 'hidden',
                                  marginBottom: '6px',
                                  border: isAppLight ? '1px solid rgba(15, 23, 42, 0.14)' : '1px solid rgba(255, 255, 255, 0.12)',
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                                }}
                              >
                                {preset.previewSwatches.map((color, idx) => (
                                  <div
                                    key={idx}
                                    style={{ flex: 1, background: color }}
                                  />
                                ))}
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '4px',
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      color: isSelected
                                        ? isAppLight ? '#0f172a' : '#ffffff'
                                        : isAppLight ? '#334155' : '#cbd5e1',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {preset.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.56rem',
                                      color: isAppLight ? '#64748b' : '#94a3b8',
                                      textTransform: 'uppercase',
                                      fontWeight: 600,
                                      letterSpacing: '0.04em',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    <span>{preset.mode === 'light' ? '☀️' : '🌙'}</span>
                                    <span>{preset.badge}</span>
                                  </div>
                                </div>

                                {isSelected ? (
                                  <div
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      background: preset.primaryColor,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#ffffff',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Check size={10} strokeWidth={3} />
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '50%',
                                      border: isAppLight ? '1.5px solid rgba(15, 23, 42, 0.25)' : '1.5px solid rgba(255, 255, 255, 0.2)',
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Popover Footer Info */}
                      <div
                        style={{
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: isAppLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.62rem',
                          color: isAppLight ? '#64748b' : '#94a3b8',
                        }}
                      >
                        <span>⚡ Instant live preview across all pages</span>
                        <button
                          type="button"
                          onClick={() => setThemeDropdownOpen(false)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isAppLight ? '#475569' : '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.66rem',
                            fontWeight: 600,
                          }}
                        >
                          {t('btn_close', 'Close')}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

            {/* Notification Bell with Badge & Interactive Dropdown */}
          <div id="notification-bell-container" style={{ position: 'relative' }}>
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              style={{
                position: 'relative',
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: showNotifications
                  ? 'var(--brand-primary-light)'
                  : 'var(--bg-card)',
                border: showNotifications
                  ? '1px solid var(--brand-primary)'
                  : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: showNotifications ? 'var(--brand-primary)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04))',
              }}
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell size={16} strokeWidth={2.2} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '8px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.45)',
                    border: '1.5px solid var(--bg-card)',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {showNotifications && (
              <div
                className="header-popover-menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '320px',
                  background: isAppLight ? '#ffffff' : 'var(--bg-card-solid, #0d1527)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                  borderRadius: '12px',
                  boxShadow: '0 16px 48px -8px rgba(0, 0, 0, 0.25), 0 0 20px var(--brand-primary-light, rgba(99, 102, 241, 0.15))',
                  zIndex: 200,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isAppLight ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          background: 'rgba(239, 68, 68, 0.18)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#f87171',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                        }}
                      >
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--brand-primary, #6366f1)',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <CheckCheck size={12} />
                      Mark read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {activeUnreadNotifications.length === 0 ? (
                    <div style={{ padding: '26px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#34d399',
                          margin: '0 auto 8px auto',
                        }}
                      >
                        <CheckCheck size={17} />
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>All Caught Up!</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        All notifications marked as read.
                      </div>
                    </div>
                  ) : (
                    activeUnreadNotifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={notif.href}
                        onClick={() => {
                          setShowNotifications(false);
                          const updated = new Set(readIds);
                          updated.add(notif.id);
                          setReadIds(updated);
                          try {
                            localStorage.setItem('feeorbit_read_notifs', JSON.stringify([...updated]));
                            window.dispatchEvent(new Event('feeorbit-notifications-updated'));
                          } catch (err) {}
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 14px',
                          textDecoration: 'none',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: 'rgba(99, 102, 241, 0.06)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Icon */}
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background:
                              notif.type === 'checkin'
                                ? 'rgba(6, 182, 212, 0.15)'
                                : notif.type === 'payment'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(168, 85, 247, 0.15)',
                            border:
                              notif.type === 'checkin'
                                ? '1px solid rgba(6, 182, 212, 0.3)'
                                : notif.type === 'payment'
                                ? '1px solid rgba(16, 185, 129, 0.3)'
                                : '1px solid rgba(168, 85, 247, 0.3)',
                            color:
                              notif.type === 'checkin'
                                ? '#22d3ee'
                                : notif.type === 'payment'
                                ? '#34d399'
                                : '#c084fc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          {notif.type === 'checkin' ? (
                            <QrCode size={13} />
                          ) : notif.type === 'payment' ? (
                            <CreditCard size={13} />
                          ) : (
                            <Sparkles size={13} />
                          )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {notif.title}
                            </span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                          </div>
                          <p style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                            {notif.desc}
                          </p>
                          {notif.type === 'payment' && notif.paymentData && (
                            <div style={{ marginTop: '5px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedReceipt(notif.paymentData);
                                  setShowNotifications(false);
                                }}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.18)',
                                  border: '1px solid rgba(16, 185, 129, 0.4)',
                                  color: '#10b981',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <CreditCard size={10} /> View Tax Invoice
                              </button>
                            </div>
                          )}
                        </div>

                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: notif.type === 'payment' ? '#10b981' : 'var(--brand-primary)',
                            boxShadow: notif.type === 'payment' ? '0 0 8px #10b981' : '0 0 6px var(--brand-primary)',
                            flexShrink: 0,
                            marginTop: '6px',
                          }}
                        />
                      </Link>
                    ))
                  )}
                </div>

                {/* Footer: Link to Full Notification Center */}
                <div
                  style={{
                    padding: '9px 14px',
                    background: isAppLight ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.02)',
                    textAlign: 'center',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifications(false)}
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--brand-primary)',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>View All in Notification Center</span>
                    <span style={{ fontSize: '0.8rem' }}>&rarr;</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Pill with Chevron */}
          <div
            id="user-profile-menu-container"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              position: 'relative',
              height: '38px',
              padding: '0 8px 0 5px',
              background: showUserMenu ? 'var(--brand-primary-light)' : 'var(--bg-card)',
              border: showUserMenu ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
              borderRadius: '11px',
              boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04))',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-hover, var(--brand-primary)))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 800,
                boxShadow: '0 2px 6px var(--brand-glow, rgba(0, 0, 0, 0.15))',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                flexShrink: 0,
              }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : user?.name ? (
                user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              ) : (
                'RS'
              )}
            </div>

            <div className="d-none-sm" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, textAlign: 'left' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <span style={{ fontSize: '0.54rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {user?.role === 'superadmin' ? 'SUPER' : user?.role === 'admin' ? 'ADMIN' : 'MEMBER'}
              </span>
            </div>

            <ChevronDown
              size={11}
              style={{
                color: showUserMenu ? 'var(--brand-primary)' : 'var(--text-muted)',
                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
              }}
            />

            {showUserMenu && (
              <div
                className="header-popover-menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  background: isAppLight ? '#ffffff' : 'var(--bg-card-solid, #0d1527)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                  borderRadius: '12px',
                  padding: '6px',
                  minWidth: '210px',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
                  zIndex: 200,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9px',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-hover, var(--brand-primary)))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        flexShrink: 0,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user?.name ? user.name.slice(0, 2).toUpperCase() : 'RS'
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.name || 'Gym Admin'}
                      </div>
                      <div style={{ fontSize: '0.64rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                        {user?.role?.toUpperCase() || 'ADMIN'}
                      </div>
                    </div>
                  </div>

                  {/* Cloudinary Profile Photo Upload Button */}
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '6px 8px',
                      background: 'var(--brand-primary-light)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--brand-primary)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {uploadingAvatar ? (
                      <>
                        <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera size={11} />
                        <span>Upload Photo (Cloudinary)</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                <button
                  onClick={logout}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 10px',
                    color: '#f87171',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    marginTop: '2px',
                  }}
                >
                  <LogOut size={12} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Add Branch Modal */}
      {showAddGymModal && (
        <div className="modal-overlay" onClick={() => setShowAddGymModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: 0,
              boxShadow: 'var(--shadow-lg, 0 24px 60px rgba(0, 0, 0, 0.5))',
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
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
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
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    Add New Gym Branch
                  </h3>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Expand {currentGym?.name || 'your gym'} with a new location
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
                  transition: 'all 0.15s ease',
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateBranch} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', display: 'block' }}>
                  Branch Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Phoenix Fitness - Downtown Branch"
                  value={newGymName}
                  onChange={(e) => setNewGymName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', display: 'block' }}>
                    Branch Code <span style={{ color: '#64748b', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BR-NOIDA-62"
                    value={newBranchCode}
                    onChange={(e) => setNewBranchCode(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', display: 'block' }}>
                    Contact Phone <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={newGymPhone}
                    onChange={(e) => setNewGymPhone(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', display: 'block' }}>
                  Branch Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2nd Floor, Grand Mall, Sector 62, Noida"
                  value={newGymAddress}
                  onChange={(e) => setNewGymAddress(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '6px',
                  paddingTop: '14px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddGymModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '0.78rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    padding: '7px 18px',
                    fontSize: '0.78rem',
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.4)',
                  }}
                >
                  {submitting ? 'Creating...' : '+ Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Floating Payment Received Toast Banner */}
      {latestPaymentToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.96), rgba(5, 150, 105, 0.96))',
            border: '1.5px solid rgba(255, 255, 255, 0.35)',
            borderRadius: '16px',
            padding: '14px 18px',
            color: '#ffffff',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.75), 0 0 30px rgba(16, 185, 129, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            animation: 'fadeIn 0.25s ease-out',
            maxWidth: '400px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <CreditCard size={22} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                💰 Payment Received!
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '1px 7px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                }}
              >
                {latestPaymentToast.transactionId?.startsWith('pay_')
                  ? 'Razorpay'
                  : latestPaymentToast.paymentMethod === 'UPI' && latestPaymentToast.transactionId
                  ? '⚡ Direct UPI'
                  : latestPaymentToast.paymentMethod || 'UPI'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#ecfdf5', marginTop: '2px', fontWeight: 600 }}>
              <strong style={{ fontSize: '0.94rem', color: '#ffffff' }}>
                ₹{(latestPaymentToast.amountPaid || 0).toLocaleString('en-IN')}
              </strong>{' '}
              from {latestPaymentToast.memberName || 'Member'}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#a7f3d0', marginTop: '1px' }}>
              Receipt: {latestPaymentToast.receiptNumber || 'REC'} • {latestPaymentToast.planName || 'Gym Plan'}
              {latestPaymentToast.transactionId ? ` • UTR: ${latestPaymentToast.transactionId}` : ''}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                setSelectedReceipt(latestPaymentToast);
                setLatestPaymentToast(null);
              }}
              style={{
                background: '#ffffff',
                color: '#065f46',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                whiteSpace: 'nowrap',
              }}
            >
              View Receipt
            </button>
            <button
              type="button"
              onClick={() => setLatestPaymentToast(null)}
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.68rem',
                cursor: 'pointer',
                textAlign: 'center',
                opacity: 0.85,
                padding: '2px',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Professional Tax Invoice Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          gymInfo={currentGym}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </>
  );
}
