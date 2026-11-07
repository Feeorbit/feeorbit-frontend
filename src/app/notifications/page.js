'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useGym } from '../../context/GymContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import ReceiptModal from '../../components/ReceiptModal';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  RefreshCw,
  QrCode,
  CreditCard,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

const STORAGE_KEY = 'feeorbit_read_notifs';
const DELETED_KEY = 'feeorbit_deleted_notifs';

export default function NotificationsPage() {
  const { currentGym, formatCurrency } = useGym();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'checkin' | 'payment' | 'alert'
  const [searchQuery, setSearchQuery] = useState('');
  const [readIds, setReadIds] = useState(new Set());
  const [deletedIds, setDeletedIds] = useState(new Set());

  // Load persisted read & deleted IDs from localStorage
  useEffect(() => {
    try {
      const storedRead = localStorage.getItem(STORAGE_KEY);
      if (storedRead) {
        setReadIds(new Set(JSON.parse(storedRead)));
      }
      const storedDeleted = localStorage.getItem(DELETED_KEY);
      if (storedDeleted) {
        setDeletedIds(new Set(JSON.parse(storedDeleted)));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save readIds to localStorage
  const saveReadIds = (newSet) => {
    setReadIds(newSet);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...newSet]));
      // Notify other components like GymHeader
      window.dispatchEvent(new Event('feeorbit-notifications-updated'));
    } catch (e) {
      // ignore
    }
  };

  // Save deletedIds to localStorage
  const saveDeletedIds = (newSet) => {
    setDeletedIds(newSet);
    try {
      localStorage.setItem(DELETED_KEY, JSON.stringify([...newSet]));
      window.dispatchEvent(new Event('feeorbit-notifications-updated'));
    } catch (e) {
      // ignore
    }
  };

  // Fetch real database activity for notifications
  const fetchNotifications = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      if (user?.role === 'member') {
        const res = await fetch('/api/auth/member-portal', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        if (data.success) {
          const list = [];

          // 1. Personal Attendance events
          if (data.attendance?.length > 0) {
            data.attendance.forEach((item) => {
              const rawTime = item.checkIn || item.createdAt;
              const timeStr = rawTime
                ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                : 'Recent';
              const dateStr = rawTime
                ? new Date(rawTime).toLocaleDateString([], { month: 'short', day: 'numeric' })
                : 'Today';

              list.push({
                id: `ci-${item._id}`,
                type: 'checkin',
                title: item.checkOut ? 'Workout Session Completed' : 'Checked In: Inside Gym',
                desc: item.checkOut
                  ? `Training session logged at ${timeStr}. Duration: ${item.durationMinutes || 1} mins.`
                  : `QR Pass scanned at ${timeStr}. Currently active on gym floor!`,
                timestamp: rawTime ? new Date(rawTime).getTime() : Date.now(),
                timeDisplay: `${dateStr}, ${timeStr}`,
                href: '/portal',
                actionLabel: 'View in My Portal',
                meta: { duration: item.durationMinutes, method: item.method },
              });
            });
          }

          // 2. Personal Payment Receipts
          if (data.payments?.length > 0) {
            data.payments.forEach((p) => {
              const rawTime = p.paymentDate || p.createdAt;
              const timeStr = rawTime
                ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                : 'Recent';
              const dateStr = rawTime
                ? new Date(rawTime).toLocaleDateString([], { month: 'short', day: 'numeric' })
                : 'Today';

              list.push({
                id: `pay-${p._id}`,
                type: 'payment',
                title: `Fee Payment Verified: ₹${p.amountPaid}`,
                desc: `Official Tax Invoice #${p.receiptNumber} generated for ${p.planName || 'Gym Plan'} via ${p.paymentMethod || 'UPI'}. GST 18% SAC 999723 included.`,
                timestamp: rawTime ? new Date(rawTime).getTime() : Date.now(),
                timeDisplay: `${dateStr}, ${timeStr}`,
                action: () => setSelectedReceipt(p),
                actionLabel: 'View Tax Invoice',
                meta: { receipt: p.receiptNumber, amount: p.amountPaid, payment: p },
              });
            });
          }

          // 3. Personal Membership Plan Expiry Reminder
          if (data.member?.endDate) {
            const diffDays = Math.max(0, Math.ceil((new Date(data.member.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
            list.push({
              id: `plan-${data.member._id}`,
              type: 'alert',
              title: diffDays > 0 ? `Membership Active: ${diffDays} Days Left` : 'Membership Expired',
              desc: `Your ${data.member.plan?.name || 'Membership'} is active until ${new Date(data.member.endDate).toLocaleDateString('en-IN')}.`,
              timestamp: Date.now() - 5000,
              timeDisplay: diffDays > 0 ? `${diffDays} days left` : 'Expired',
              href: '/portal',
              actionLabel: 'View Digital Pass',
              meta: { plan: data.member.plan?.name, daysLeft: diffDays },
            });
          }

          // 4. Gym Notice Board Announcement
          if (currentGym?.noticeBoard?.isActive && currentGym?.noticeBoard?.content) {
            list.push({
              id: `gym-notice-${currentGym._id}`,
              type: 'alert',
              title: `Gym Announcement: ${currentGym.noticeBoard.title || 'Notice'}`,
              desc: currentGym.noticeBoard.content,
              timestamp: Date.now() - 1000,
              timeDisplay: 'Announcement',
              href: '/portal',
              actionLabel: 'Read Notice',
            });
          }

          list.sort((a, b) => b.timestamp - a.timestamp);
          setNotifications(list);
        }
      } else {
        let url = '/api/dashboard/stats';
        if (currentGym?._id) url += `?gymId=${currentGym._id}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
          const list = [];

          // 1. Real Check-in events
          if (data.recentActivity?.checkIns?.length > 0) {
            data.recentActivity.checkIns.forEach((item) => {
              const rawTime = item.checkIn || item.createdAt;
              const timeStr = rawTime
                ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                : 'Recent';
              const dateStr = rawTime
                ? new Date(rawTime).toLocaleDateString([], { month: 'short', day: 'numeric' })
                : 'Today';
              const name = item.memberName || item.member?.fullName || 'Member';

              list.push({
                id: `ci-${item._id}`,
                type: 'checkin',
                title: `${name} ${t('notif_checked_in', 'Checked In')}`,
                desc: item.method === 'qr'
                  ? `QR Pass successfully scanned at Kiosk (${item.memberId || 'ID Verified'})`
                  : `Front Desk manual check-in recorded (${item.memberId || 'ID Verified'})`,
                timestamp: rawTime ? new Date(rawTime).getTime() : Date.now(),
                timeDisplay: `${dateStr}, ${timeStr}`,
                href: '/kiosk',
                actionLabel: t('notif_view_kiosk', 'View in Kiosk'),
                meta: { memberName: name, memberId: item.memberId, method: item.method },
              });
            });
          }

          // 2. Real Payment events
          if (data.recentActivity?.payments?.length > 0) {
            data.recentActivity.payments.forEach((item) => {
              const rawTime = item.paymentDate || item.createdAt;
              const timeStr = rawTime
                ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                : 'Recent';
              const dateStr = rawTime
                ? new Date(rawTime).toLocaleDateString([], { month: 'short', day: 'numeric' })
                : 'Today';
              const name = item.memberName || item.member?.fullName || 'Member';

              list.push({
                id: `pay-${item._id}`,
                type: 'payment',
                title: `${t('notif_payment_received', 'Fee Payment Received')}: ₹${item.amountPaid || 0}`,
                desc: `Received ₹${item.amountPaid || 0} from ${name} via ${item.paymentMethod || 'UPI'} for ${item.planName || 'Membership'}. Receipt #${item.receiptNumber || 'REC'}`,
                timestamp: rawTime ? new Date(rawTime).getTime() : Date.now(),
                timeDisplay: `${dateStr}, ${timeStr}`,
                href: '/billing',
                actionLabel: t('notif_view_receipt', 'View Receipt in Billing'),
                meta: { memberName: name, amount: item.amountPaid, receipt: item.receiptNumber },
              });
            });
          }

          // 3. Real Expiring Soon alerts
          if (data.expiringSoonList?.length > 0) {
            data.expiringSoonList.forEach((m) => {
              const daysRemaining = m.endDate
                ? Math.max(0, Math.ceil((new Date(m.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
                : 0;

              list.push({
                id: `exp-${m._id}`,
                type: 'alert',
                title: `Membership Expiring: ${m.fullName}`,
                desc: `${m.fullName}'s plan (${m.plan?.name || 'General'}) expires in ${daysRemaining} days on ${new Date(m.endDate).toLocaleDateString()}. Follow up for renewal.`,
                timestamp: Date.now(),
                timeDisplay: `${daysRemaining} days left`,
                href: `/billing?memberId=${m._id}`,
                actionLabel: 'Collect Renewal Fee',
                meta: { memberName: m.fullName, phone: m.phone, daysLeft: daysRemaining },
              });
            });
          }

          // Sort latest first
          list.sort((a, b) => b.timestamp - a.timestamp);
          setNotifications(list);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(false), 30000);
    return () => clearInterval(interval);
  }, [currentGym, user, token]);

  // Mark a single notification as read
  const handleMarkAsRead = (id) => {
    const updated = new Set(readIds);
    updated.add(id);
    saveReadIds(updated);
  };

  // Mark all current notifications as read
  const handleMarkAllRead = () => {
    const updated = new Set(readIds);
    notifications.forEach((n) => updated.add(n.id));
    saveReadIds(updated);
  };

  // Delete/dismiss a single notification
  const handleDeleteNotification = (id) => {
    const updated = new Set(deletedIds);
    updated.add(id);
    saveDeletedIds(updated);
  };

  // Clear all notifications
  const handleClearAll = () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    const updated = new Set(deletedIds);
    notifications.forEach((n) => updated.add(n.id));
    saveDeletedIds(updated);
  };

  // Filter out deleted notifications
  const activeNotifications = useMemo(() => {
    return notifications.filter((n) => !deletedIds.has(n.id));
  }, [notifications, deletedIds]);

  // Calculate counts
  const unreadCount = useMemo(() => {
    return activeNotifications.filter((n) => !readIds.has(n.id)).length;
  }, [activeNotifications, readIds]);

  // Tab & search filtering
  const filteredNotifications = useMemo(() => {
    return activeNotifications.filter((n) => {
      const isUnread = !readIds.has(n.id);

      // Tab filter
      if (activeTab === 'unread' && !isUnread) return false;
      if (activeTab === 'checkin' && n.type !== 'checkin') return false;
      if (activeTab === 'payment' && n.type !== 'payment') return false;
      if (activeTab === 'alert' && n.type !== 'alert') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.desc.toLowerCase().includes(q) ||
          (n.meta?.memberName && n.meta.memberName.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [activeNotifications, readIds, activeTab, searchQuery]);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Top Header Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.08))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              flexShrink: 0,
            }}
          >
            <Bell size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {t('notif_title', 'Notification Center')}
              </h1>
              {unreadCount > 0 ? (
                <span
                  style={{
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                  }}
                >
                  {unreadCount} {t('notif_unread', 'Unread')}
                </span>
              ) : (
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                  }}
                >
                  {t('notif_all_caught_up', '✓ All Caught Up')}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {t('notif_subtitle', 'Live stream of member check-ins, fee collections, and retention alerts')} ({currentGym?.name || 'FeeOrbit'}).
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fetchNotifications(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            <span>{t('btn_refresh', 'Refresh')}</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(99, 102, 241, 0.18)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '8px',
                color: '#818cf8',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <CheckCheck size={15} />
              <span>{t('notif_btn_mark_read', 'Mark All as Read')}</span>
            </button>
          )}

          {activeNotifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Trash2 size={14} />
              <span>{t('notif_btn_clear', 'Clear History')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: t('notif_tab_all', 'All Activity'), count: activeNotifications.length },
            { key: 'unread', label: t('notif_unread', 'Unread'), count: unreadCount },
            { key: 'checkin', label: t('notif_tab_checkins', 'Check-Ins'), count: activeNotifications.filter((n) => n.type === 'checkin').length },
            { key: 'payment', label: t('notif_tab_payments', 'Payments'), count: activeNotifications.filter((n) => n.type === 'payment').length },
            { key: 'alert', label: t('notif_tab_alerts', 'Alerts'), count: activeNotifications.filter((n) => n.type === 'alert').length },
          ].map((tab) => {
            const isCurrent = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? 700 : 500,
                  cursor: 'pointer',
                  background: isCurrent
                    ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                    : 'var(--bg-card-solid)',
                  border: isCurrent
                    ? '1px solid rgba(255, 255, 255, 0.2)'
                    : '1px solid var(--border-subtle)',
                  color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    padding: '1px 5px',
                    borderRadius: '9999px',
                    background: isCurrent ? 'rgba(255, 255, 255, 0.2)' : 'var(--bg-card)',
                    color: isCurrent ? '#ffffff' : 'var(--text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div
          style={{
            position: 'relative',
            width: '260px',
            background: 'var(--bg-card-solid)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px 0 30px',
          }}
        >
          <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('notif_search_placeholder', 'Search member, amount...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '34px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.76rem',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.7rem',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Notifications List Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <RefreshCw size={24} className="spin" style={{ color: '#6366f1', marginBottom: '10px' }} />
          <div>Loading gym activity stream...</div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* Empty State */
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: '14px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              margin: '0 auto 12px auto',
            }}
          >
            <CheckCheck size={24} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {t('notif_empty_title', 'No notifications in this view')}
          </h3>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto' }}>
            {activeTab === 'unread'
              ? 'Great job! You have marked all current alerts and notifications as read.'
              : 'No activity matches your selected filter or search keyword.'}
          </p>
        </div>
      ) : (
        /* Cards List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifications.map((notif) => {
            const isUnread = !readIds.has(notif.id);

            return (
              <div
                key={notif.id}
                style={{
                  background: isUnread ? 'var(--bg-card-solid)' : 'var(--bg-card)',
                  border: isUnread
                    ? '1px solid var(--brand-primary)'
                    : '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '14px',
                  transition: 'all 0.15s ease',
                  boxShadow: isUnread ? 'var(--shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.08))' : 'none',
                }}
              >
                {/* Left: Icon + Content */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                  {/* Type Icon Badge */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background:
                        notif.type === 'checkin'
                          ? 'rgba(6, 182, 212, 0.14)'
                          : notif.type === 'payment'
                          ? 'rgba(16, 185, 129, 0.14)'
                          : 'rgba(245, 158, 11, 0.14)',
                      border:
                        notif.type === 'checkin'
                          ? '1px solid rgba(6, 182, 212, 0.3)'
                          : notif.type === 'payment'
                          ? '1px solid rgba(16, 185, 129, 0.3)'
                          : '1px solid rgba(245, 158, 11, 0.3)',
                      color:
                        notif.type === 'checkin'
                          ? '#22d3ee'
                          : notif.type === 'payment'
                          ? '#34d399'
                          : '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {notif.type === 'checkin' ? (
                      <QrCode size={18} />
                    ) : notif.type === 'payment' ? (
                      <CreditCard size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                  </div>

                  {/* Body Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4
                        style={{
                          fontSize: '0.86rem',
                          fontWeight: isUnread ? 800 : 600,
                          color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {notif.title}
                      </h4>

                      {/* Unread Status Tag */}
                      {isUnread && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '9999px',
                          }}
                        >
                          <span
                            style={{
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              background: '#38bdf8',
                              boxShadow: '0 0 5px #38bdf8',
                            }}
                          />
                          New
                        </span>
                      )}

                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        • {notif.timeDisplay}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>
                      {notif.desc}
                    </p>

                    {/* Action Link / Button */}
                    <div style={{ marginTop: '8px' }}>
                      {notif.action ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleMarkAsRead(notif.id);
                            notif.action();
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#818cf8',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                          }}
                        >
                          <span>{notif.actionLabel}</span>
                          <ArrowRight size={12} />
                        </button>
                      ) : (
                        <Link
                          href={notif.href || '/portal'}
                          onClick={() => handleMarkAsRead(notif.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#818cf8',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          <span>{notif.actionLabel}</span>
                          <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions: Mark as Read & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      title="Mark as Read"
                      style={{
                        padding: '5px 8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#94a3b8',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <CheckCheck size={12} />
                      <span className="d-none-sm">{t('notif_mark_read', 'Mark Read')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteNotification(notif.id)}
                    title="Dismiss Notification"
                    style={{
                      padding: '5px 7px',
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Tax Receipt Modal */}
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
