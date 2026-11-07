'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useGym } from '../../context/GymContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Gift,
  PartyPopper,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageSquare,
  Share2,
  Send,
  Trash2,
  Filter,
  Sparkles,
  Users,
  Phone,
  Info,
  X,
  Building2,
  Flame,
  Check,
  Megaphone,
} from 'lucide-react';

// Helper to remove any duplicate leading emojis from event titles
const cleanEventTitle = (title) => {
  if (!title) return '';
  return title.replace(/^[\p{Extended_Pictographic}\u200d\ufe0f\s]+/u, '').trim();
};

export default function EventsAndHolidaysPage() {
  const { currentGym } = useGym();
  const { user } = useAuth();
  const toast = useToast();
  const { t, currentLanguage = 'en' } = useLanguage();

  const getLocale = (lang = currentLanguage) => (lang === 'hi' ? 'hi-IN' : 'en-IN');

  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    gymClosedCount: 0,
    birthdaysCount: 0,
    todaysBirthdaysCount: 0,
    nextUpcomingClosure: null,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'feed'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'holiday' | 'birthday' | 'festival' | 'event'

  // Current calendar view date cursor
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedEventForBroadcast, setSelectedEventForBroadcast] = useState(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  // Add Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'holiday',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isGymClosed: true,
    closureType: 'full_day',
    description: '',
    targetAudience: 'all',
    color: '#ef4444',
  });
  const [submitting, setSubmitting] = useState(false);

  // Broadcast Modal State
  const [broadcastData, setBroadcastData] = useState({
    messageText: '',
    whatsappShareUrl: '',
    targetCount: 0,
  });
  const [generatingBroadcast, setGeneratingBroadcast] = useState(false);

  // Fetch events for current month/year
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const gymQuery = currentGym?._id ? `&gymId=${currentGym._id}` : '';
      const res = await fetch(`/api/events?month=${month}&year=${year}${gymQuery}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
        if (data.metrics) setMetrics(data.metrics);
      } else {
        console.warn('Events API message:', data.message);
      }
    } catch (err) {
      console.error('Could not connect to event service:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentGym?._id, currentDate.getMonth(), currentDate.getFullYear()]);

  // Navigate calendar months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  // Calendar Days Calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday-based indexing: Sunday=6, Monday=0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    // Previous month padding
    const prevMonthDays = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push({
        dayNumber: prevMonthLastDay - i,
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    const currentMonthDays = [];
    for (let d = 1; d <= daysInMonth; d++) {
      currentMonthDays.push({
        dayNumber: d,
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill complete grid of 35 or 42
    const totalFilled = prevMonthDays.length + currentMonthDays.length;
    const remaining = (7 - (totalFilled % 7)) % 7;
    const nextMonthDays = [];
    for (let n = 1; n <= remaining; n++) {
      nextMonthDays.push({
        dayNumber: n,
        date: new Date(year, month + 1, n),
        isCurrentMonth: false,
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentDate]);

  // Handle Event Creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.startDate) {
      toast.warning('Please enter an event title and start date.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEvent,
          gymId: currentGym?._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Event / Holiday scheduled successfully! 🗓️');
        setShowAddModal(false);
        setNewEvent({
          title: '',
          type: 'holiday',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          isGymClosed: true,
          closureType: 'full_day',
          description: '',
          targetAudience: 'all',
          color: '#ef4444',
        });
        fetchEvents();
      } else {
        toast.error(data.message || 'Failed to create event');
      }
    } catch (err) {
      toast.error('Network error creating event');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Event Deletion
  const handleDeleteEvent = async (id) => {
    if (!id || id.startsWith('bday_') || id.startsWith('fest_')) return;
    if (!confirm('Are you sure you want to remove this scheduled holiday/event?')) return;

    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Event deleted successfully');
        if (selectedEventDetails?._id === id) setSelectedEventDetails(null);
        fetchEvents();
      } else {
        toast.error(data.message || 'Could not delete event');
      }
    } catch (err) {
      toast.error('Network error deleting event');
    }
  };

  // Open Broadcast Modal
  const handleOpenBroadcast = async (event = null) => {
    setSelectedEventForBroadcast(event);
    setShowBroadcastModal(true);
    setGeneratingBroadcast(true);

    try {
      const res = await fetch('/api/events/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymId: currentGym?._id,
          eventId: event?._id || null,
          type: event ? 'event_notice' : 'holiday_broadcast',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastData({
          messageText: data.messageText,
          whatsappShareUrl: data.whatsappShareUrl,
          targetCount: data.targetCount,
        });
      }
    } catch (err) {
      toast.error('Failed to construct broadcast template');
    } finally {
      setGeneratingBroadcast(false);
    }
  };

  // Send Direct Birthday WhatsApp Wish
  const handleWishBirthday = (member) => {
    const gymName = currentGym?.name || 'FeeOrbit Fitness Club';
    const text = `Hey ${member.fullName}! 🎂🎉\n\nWishing you a tremendous Happy Birthday from all of us at *${gymName}*! May this year bring you immense strength, peak health, and endless fitness PRs! 💪🏋️\n\nCelebrate hard!\n*— ${gymName} Team*`;
    const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast.success(`Opening WhatsApp to wish ${member.fullName}! 🎂`);
  };

  // Copy Broadcast Notice to Clipboard
  const handleCopyNotice = () => {
    if (!broadcastData.messageText) return;
    navigator.clipboard.writeText(broadcastData.messageText);
    toast.success('Broadcast notice copied to clipboard! 📋');
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. EXECUTIVE OPERATIONS HEADER */}
      <div
        className="page-operations-header"
        style={{
          background: 'var(--bg-card, rgba(16, 22, 36, 0.72))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.05))',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <div className="page-header-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              flexShrink: 0,
            }}
          >
            <CalendarDays size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="page-header-title-row" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h1 className="page-header-title" style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                {t('events_title', 'Events, Holidays & Member Birthdays')}
              </h1>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#34d399',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('events_sync', '● Operational Sync')}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {t('events_subtitle', 'Schedule gym off-days, track upcoming festivals, member birthdays, and dispatch 1-click WhatsApp notices')}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenBroadcast()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Megaphone size={14} />
            <span>{t('events_btn_broadcast', 'Broadcast Notice')}</span>
          </button>

          <button
            onClick={() => {
              setNewEvent((prev) => ({
                ...prev,
                type: 'holiday',
                isGymClosed: true,
                color: '#ef4444',
                title: 'Gym Closed - Maintenance / Holiday',
              }));
              setShowAddModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={14} />
            <span>{t('events_btn_schedule_off', 'Schedule Gym Off')}</span>
          </button>

          <button
            onClick={() => {
              setNewEvent((prev) => ({
                ...prev,
                type: 'event',
                isGymClosed: false,
                color: '#6366f1',
                title: '',
              }));
              setShowAddModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '7px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={14} />
            <span>{t('events_btn_new_event', 'New Gym Event')}</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR KEY METRIC TILES */}
      <div
        className="kpi-card-grid responsive-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '10px',
        }}
      >
        {/* Tile 1: Scheduled Gym Closures */}
        <div className="kpi-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('events_stat_closures', 'Gym Closures (This Month)')}
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
              }}
            >
              <AlertCircle size={14} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {metrics.gymClosedCount}
            </span>
            <span style={{ fontSize: '0.72rem', color: metrics.gymClosedCount > 0 ? '#f87171' : '#10b981', fontWeight: 600 }}>
              {metrics.gymClosedCount > 0 ? t('events_stat_days_off', 'Days Off Scheduled') : t('events_stat_full_schedule', 'Full Operational Schedule')}
            </span>
          </div>
        </div>

        {/* Tile 2: Member Birthdays This Month */}
        <div className="kpi-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('events_stat_birthdays', 'Member Birthdays')} ({currentDate.toLocaleDateString(getLocale(currentLanguage), { month: 'long' })})
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'rgba(236, 72, 153, 0.12)',
                border: '1px solid rgba(236, 72, 153, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f472b6',
              }}
            >
              <Gift size={14} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {metrics.birthdaysCount}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#f472b6', fontWeight: 600 }}>
              {metrics.todaysBirthdaysCount > 0 ? `🎉 ${metrics.todaysBirthdaysCount} ${t('events_celebrating_today', 'Celebrating Today!')}` : t('events_members_celebrating', 'Members Celebrating')}
            </span>
          </div>
        </div>

        {/* Tile 3: Next Upcoming Gym Closure */}
        <div className="kpi-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('events_stat_next_holiday', 'Next Gym Holiday')}
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
              }}
            >
              <Clock size={14} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {metrics.nextUpcomingClosure ? (
              <div>
                <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#fbbf24' }}>
                  {new Date(metrics.nextUpcomingClosure.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                  • {metrics.nextUpcomingClosure.title.replace('🪔 ', '')}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#10b981' }}>
                {t('events_stat_no_offs', '✓ No Upcoming Offs')}
              </span>
            )}
          </div>
        </div>

        {/* Tile 4: Notice Dispatch Readiness */}
        <div className="kpi-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('events_stat_reach', 'Member Reach')}
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Users size={14} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981' }}>
              100%
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {t('events_stat_reach_desc', 'WhatsApp & In-App Sync Active')}
            </span>
          </div>
        </div>
      </div>

      {/* 2.5 ARTISANAL PANCHANG & FESTIVE SPOTLIGHT RIBBON */}
      {(() => {
        const isOctober = currentDate.getMonth() === 9;
        // Specifically look for Dussehra / Vijayadashami on 20 October 2026
        const dussehraEvent = events.find(
          (e) => e.title && (e.title.toLowerCase().includes('dussehra') || e.title.toLowerCase().includes('vijaya'))
        );

        if (!dussehraEvent && !isOctober) return null;

        const featuredEvent = dussehraEvent || {
          _id: 'fest_2026_9_20',
          title: 'Dussehra / Vijayadashami',
          startDate: new Date(currentDate.getFullYear(), 9, 20, 9, 0, 0),
          type: 'festival',
          isGymClosed: true,
          closureType: 'evening_only',
        };

        return (
          <div
            className="festive-spotlight-ribbon"
            style={{
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(245, 158, 11, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  boxShadow: '0 1px 4px rgba(245, 158, 11, 0.15)',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <img
                  src="/images/dussehra_festive_gym.jpg"
                  alt="Dussehra Celebration"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="festive-spotlight-title" style={{ fontSize: '0.94rem', fontWeight: 800 }}>
                    श्री विजयादशमी • Dussehra / Vijayadashami (20 October 2026)
                  </span>
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#d97706',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    100% PANCHANG ACCURATE
                  </span>
                </div>
                <div className="festive-spotlight-desc" style={{ fontSize: '0.74rem', marginTop: '3px' }}>
                  Gym Evening Slot Closed for Shubh Puja (Morning 6:00 AM – 11:00 AM Open for Training)
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenBroadcast(featuredEvent)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '7px 14px',
                borderRadius: '7px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
              }}
            >
              <Megaphone size={13} />
              <span>{t('events_btn_broadcast_festive', 'Broadcast Festival Off Notice')}</span>
            </button>
          </div>
        );
      })()}

      {/* 2.6 TODAY'S BIRTHDAY LOUNGE (IF ANY) */}
      {(() => {
        const todaysBirthdays = events.filter((e) => {
          if (e.type !== 'birthday') return false;
          const today = new Date();
          if (e.startDate) {
            const ed = new Date(e.startDate);
            return ed.getDate() === today.getDate() && ed.getMonth() === today.getMonth();
          }
          return e.day === today.getDate();
        });

        if (todaysBirthdays.length === 0) return null;

        return (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.35)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>🎂</span>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fbcfe8' }}>
                  {todaysBirthdays.length} Gym Member{todaysBirthdays.length > 1 ? 's have' : ' has a'} Birthday Today!
                </div>
                <div style={{ fontSize: '0.72rem', color: '#f472b6' }}>
                  {todaysBirthdays.map((b) => cleanEventTitle(b.title)).join(', ')}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {todaysBirthdays.map((b, idx) => (
                <button
                  key={idx}
                  onClick={() => handleWishBirthday({ fullName: cleanEventTitle(b.title).replace("'s Birthday", '').replace('Birthday: ', ''), phone: b.phone })}
                  style={{
                    background: 'rgba(236, 72, 153, 0.2)',
                    border: '1px solid rgba(236, 72, 153, 0.4)',
                    color: '#fbcfe8',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <MessageSquare size={12} />
                  <span>Wish {cleanEventTitle(b.title).replace("'s Birthday", '').replace('Birthday: ', '').split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 3. CALENDAR CONTROLS & FILTER BAR */}
      <div
        className="calendar-toolbar-bar"
        style={{
          background: 'var(--bg-card, rgba(16, 22, 36, 0.72))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '12px 18px',
          boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.05))',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Left: Month Navigator */}
        <div className="calendar-month-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handlePrevMonth}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: '150px', textAlign: 'center' }}>
            {currentDate.toLocaleDateString(getLocale(currentLanguage), { month: 'long', year: 'numeric' })}
          </div>

          <button
            onClick={handleNextMonth}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={handleGoToday}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: '6px',
            }}
          >
            {t('events_btn_today', 'Today')}
          </button>
        </div>

        {/* Center: Category Filter Pills */}
        <div className="calendar-filter-pills responsive-tabs-bar" style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: t('events_tab_all', 'All Items') },
            { id: 'holiday', label: `🔴 ${t('events_tab_closures', 'Gym Closures')}` },
            { id: 'birthday', label: `🎂 ${t('events_tab_birthdays', 'Member Birthdays')}` },
            { id: 'festival', label: `🪔 ${t('events_tab_festivals', 'Festivals')}` },
            { id: 'event', label: `🏆 ${t('events_tab_events', 'Gym Events')}` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{
                background: filterType === tab.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                border: filterType === tab.id ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid rgba(255, 255, 255, 0.06)',
                color: filterType === tab.id ? '#ffffff' : '#94a3b8',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: filterType === tab.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: View Switcher (Calendar vs Agenda Feed) */}
        <div className="calendar-view-toggle" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '7px', padding: '2px' }}>
          <button
            onClick={() => setViewMode('calendar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '0.72rem',
              fontWeight: viewMode === 'calendar' ? 700 : 500,
              background: viewMode === 'calendar' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: viewMode === 'calendar' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <CalendarIcon size={13} />
            <span>{t('events_view_calendar', 'Calendar')}</span>
          </button>
          <button
            onClick={() => setViewMode('feed')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '0.72rem',
              fontWeight: viewMode === 'feed' ? 700 : 500,
              background: viewMode === 'feed' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: viewMode === 'feed' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Users size={13} />
            <span>{t('events_view_agenda', 'Agenda Feed')}</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN VIEW CONTENT */}
      {viewMode === 'calendar' ? (
        /* ================= CALENDAR GRID VIEW ================= */
        <div
          className="calendar-grid-container"
          style={{
            background: 'var(--bg-card, rgba(16, 22, 36, 0.72))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '16px',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Day of Week Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '8px',
            }}
          >
            {[
              { id: 'mon', label: t('events_day_mon', 'MON') },
              { id: 'tue', label: t('events_day_tue', 'TUE') },
              { id: 'wed', label: t('events_day_wed', 'WED') },
              { id: 'thu', label: t('events_day_thu', 'THU') },
              { id: 'fri', label: t('events_day_fri', 'FRI') },
              { id: 'sat', label: t('events_day_sat', 'SAT') },
              { id: 'sun', label: t('events_day_sun', 'SUN') },
            ].map((day, idx) => (
              <div
                key={day.id}
                className="calendar-weekday-header"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: idx >= 5 ? '#f43f5e' : 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {day.label}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            className="calendar-days-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '6px',
              minHeight: '480px',
            }}
          >
            {calendarDays.map((cell, idx) => {
              const dateString = cell.date.toDateString();
              const isToday = new Date().toDateString() === dateString;

              const cellYear = cell.date.getFullYear();
              const cellMonth = cell.date.getMonth();
              const cellDateNum = cell.date.getDate();
              const cellDateKey = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(cellDateNum).padStart(2, '0')}`;

              // Bulletproof matching across timezones, serialized ISO dates, and dateKey
              const dayEvents = filteredEvents.filter((ev) => {
                // 1. Direct dateKey match (e.g. "2026-10-20")
                if (ev.dateKey && ev.dateKey === cellDateKey) return true;

                // 2. Day & Month match for current month cells
                if (
                  cell.isCurrentMonth &&
                  ev.day !== undefined &&
                  ev.day === cell.dayNumber &&
                  (ev.month === undefined || ev.month === cellMonth) &&
                  (ev.year === undefined || ev.year === cellYear)
                ) {
                  return true;
                }

                // 3. Date object & toDateString match
                if (ev.startDate) {
                  const evD = new Date(ev.startDate);
                  if (
                    evD.getFullYear() === cellYear &&
                    evD.getMonth() === cellMonth &&
                    evD.getDate() === cellDateNum
                  ) {
                    return true;
                  }
                  if (evD.toDateString() === dateString) {
                    return true;
                  }
                }
                return false;
              });

              const hasGymClosure = dayEvents.some((e) => e.isGymClosed);

              return (
                <div
                  key={idx}
                  className={`calendar-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''}`}
                  style={{
                    minHeight: '100px',
                    borderRadius: '8px',
                    padding: '6px',
                    background: hasGymClosure
                      ? 'rgba(239, 68, 68, 0.08)'
                      : undefined,
                    border: isToday
                      ? '1.5px solid #10b981'
                      : hasGymClosure
                      ? '1px solid rgba(239, 68, 68, 0.35)'
                      : undefined,
                    opacity: cell.isCurrentMonth ? 1 : 0.45,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Top Bar of Cell */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: isToday ? 800 : 700,
                        color: isToday ? '#10b981' : cell.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)',
                        background: isToday ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        padding: isToday ? '1px 6px' : '0',
                        borderRadius: '4px',
                      }}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasGymClosure && (
                      <span
                        style={{
                          fontSize: '0.54rem',
                          fontWeight: 800,
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          textTransform: 'uppercase',
                        }}
                      >
                        OFF
                      </span>
                    )}
                  </div>

                  {/* Day Events Pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflowY: 'auto' }}>
                    {dayEvents.map((ev) => (
                      <div
                        key={ev._id}
                        onClick={() => setSelectedEventDetails(ev)}
                        className={`calendar-event-pill calendar-event-pill-${ev.isGymClosed ? 'closed' : ev.type}`}
                        style={{
                          padding: '2px 5px',
                          borderRadius: '4px',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                        title={ev.title}
                      >
                        <span style={{ fontSize: '0.6rem' }}>
                          {ev.isGymClosed
                            ? '🔴'
                            : ev.type === 'festival'
                            ? '🪔'
                            : ev.type === 'birthday'
                            ? '🎂'
                            : '🏆'}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cleanEventTitle(ev.title)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= AGENDA FEED LIST VIEW ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredEvents.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-card, rgba(16, 22, 36, 0.72))',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94a3b8',
              }}
            >
              <CalendarDays size={32} style={{ color: '#64748b', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                No events or closures scheduled for this view.
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
                Click "+ Schedule Gym Off" to log a holiday or add a workout event.
              </div>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const evDate = new Date(ev.startDate);
              const dateStr = evDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });

              return (
                <div
                  key={ev._id}
                  style={{
                    background: 'var(--bg-card, rgba(16, 22, 36, 0.72))',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {/* Date Block */}
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '8px',
                        background: ev.isGymClosed
                          ? 'rgba(239, 68, 68, 0.12)'
                          : ev.type === 'birthday'
                          ? 'rgba(236, 72, 153, 0.12)'
                          : 'rgba(99, 102, 241, 0.12)',
                        border: ev.isGymClosed
                          ? '1px solid rgba(239, 68, 68, 0.25)'
                          : ev.type === 'birthday'
                          ? '1px solid rgba(236, 72, 153, 0.25)'
                          : '1px solid rgba(99, 102, 241, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                        {evDate.toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                      <span
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: ev.isGymClosed ? '#f87171' : ev.type === 'birthday' ? '#f472b6' : '#818cf8',
                          lineHeight: 1,
                        }}
                      >
                        {evDate.getDate()}
                      </span>
                    </div>

                    {/* Details */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                          {cleanEventTitle(ev.title)}
                        </span>
                        {ev.isGymClosed && (
                          <span
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#f87171',
                              fontSize: '0.58rem',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            GYM CLOSED {ev.closureType ? `(${ev.closureType.replace('_', ' ').toUpperCase()})` : ''}
                          </span>
                        )}
                        {ev.type === 'birthday' && ev.member?.age && (
                          <span
                            style={{
                              background: 'rgba(236, 72, 153, 0.15)',
                              border: '1px solid rgba(236, 72, 153, 0.35)',
                              color: '#f472b6',
                              fontSize: '0.58rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Turns {ev.member.age}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                        {ev.description || 'No description provided.'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {ev.type === 'birthday' && ev.member ? (
                      <button
                        onClick={() => handleWishBirthday(ev.member)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(37, 211, 102, 0.15)',
                          border: '1px solid rgba(37, 211, 102, 0.35)',
                          color: '#25d366',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <MessageSquare size={13} />
                        <span>Wish on WhatsApp</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenBroadcast(ev)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          color: '#38bdf8',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Share2 size={13} />
                        <span>Broadcast Notice</span>
                      </button>
                    )}

                    {!ev.isVirtualBirthday && !ev.isStandardFestival && (
                      <button
                        onClick={() => handleDeleteEvent(ev._id)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title="Delete Event"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= MODAL: ADD CUSTOM EVENT / HOLIDAY ================= */}
      {showAddModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '500px',
              width: '100%',
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.5))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={18} style={{ color: '#818cf8' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Schedule Gym Off or Event
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Title / Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Holiday, Annual Maintenance, Arm Wrestling Meet"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '7px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Event Category
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => {
                      const t = e.target.value;
                      setNewEvent({
                        ...newEvent,
                        type: t,
                        isGymClosed: t === 'holiday' || t === 'maintenance',
                        color: t === 'holiday' ? '#ef4444' : t === 'maintenance' ? '#f59e0b' : '#6366f1',
                      });
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '7px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <option value="holiday">Gym Off / Holiday</option>
                    <option value="event">Gym Challenge / Event</option>
                    <option value="maintenance">Sanitization / Repairs</option>
                    <option value="festival">Festival Special</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '7px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              {/* Gym Closure Toggle */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                      Gym Operational Closure?
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                      Mark if gym floor will be closed to members
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newEvent.isGymClosed}
                    onChange={(e) => setNewEvent({ ...newEvent, isGymClosed: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ef4444' }}
                  />
                </div>

                {newEvent.isGymClosed && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                      Shift Closure:
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { id: 'full_day', label: 'Full Day Off' },
                        { id: 'morning_only', label: 'Morning Off Only' },
                        { id: 'evening_only', label: 'Evening Off Only' },
                      ].map((shift) => (
                        <button
                          key={shift.id}
                          type="button"
                          onClick={() => setNewEvent({ ...newEvent, closureType: shift.id })}
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            borderRadius: '5px',
                            fontSize: '0.68rem',
                            fontWeight: newEvent.closureType === shift.id ? 700 : 500,
                            background: newEvent.closureType === shift.id ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                            border: newEvent.closureType === shift.id ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: newEvent.closureType === shift.id ? '#f87171' : '#cbd5e1',
                            cursor: 'pointer',
                          }}
                        >
                          {shift.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', display: 'block' }}>
                  Description / Member Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Gym will reopen sharp at 6 AM next day. Enjoy your holiday!"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '7px',
                    padding: '8px 10px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BROADCAST NOTICE (WHATSAPP / IN-APP) ================= */}
      {showBroadcastModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.5))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={18} style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Dispatch Member Broadcast Notice
                </h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {generatingBroadcast ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                Generating personalized notice template...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Share this verified announcement directly with your {broadcastData.targetCount} active members via WhatsApp broadcast or copy to your community groups:
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '0.74rem',
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    lineHeight: 1.4,
                  }}
                >
                  {broadcastData.messageText}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    onClick={handleCopyNotice}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: '7px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Share2 size={13} />
                    <span>Copy Text</span>
                  </button>

                  <a
                    href={broadcastData.whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1.3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: '#25d366',
                      border: 'none',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '7px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 2px 10px rgba(37, 211, 102, 0.35)',
                    }}
                  >
                    <MessageSquare size={14} />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: EVENT DETAILS ================= */}
      {selectedEventDetails && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '440px',
              width: '100%',
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.5))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span
                style={{
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: selectedEventDetails.isGymClosed
                    ? '#f87171'
                    : selectedEventDetails.type === 'birthday'
                    ? '#f472b6'
                    : '#818cf8',
                }}
              >
                ● {selectedEventDetails.type.toUpperCase()}
              </span>
              <button
                onClick={() => setSelectedEventDetails(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>
              {cleanEventTitle(selectedEventDetails.title)}
            </h3>

            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '12px' }}>
              Date: {new Date(selectedEventDetails.startDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>

            {selectedEventDetails.isGymClosed && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '7px',
                  padding: '8px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  marginBottom: '10px',
                }}
              >
                ⚠️ GYM CLOSED: {selectedEventDetails.closureType?.replace('_', ' ').toUpperCase()}
              </div>
            )}

            <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '16px' }}>
              {selectedEventDetails.description}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {selectedEventDetails.type === 'birthday' && selectedEventDetails.member ? (
                <button
                  onClick={() => handleWishBirthday(selectedEventDetails.member)}
                  style={{
                    background: '#25d366',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Send Birthday Greeting
                </button>
              ) : (
                <button
                  onClick={() => {
                    const ev = selectedEventDetails;
                    setSelectedEventDetails(null);
                    handleOpenBroadcast(ev);
                  }}
                  style={{
                    background: '#38bdf8',
                    border: 'none',
                    color: '#090c15',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Broadcast Notice
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
