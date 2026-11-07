'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Search,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Flame,
  Download,
  Printer,
  Calendar,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Snowflake,
  Play,
} from 'lucide-react';
import QRCodeModal from '../../components/QRCodeModal';
import GymQRPosterModal from '../../components/GymQRPosterModal';
import ManualCheckInModal from '../../components/ManualCheckInModal';
import AttendanceReportModal from '../../components/AttendanceReportModal';
import { useGym } from '../../context/GymContext';
import { useLanguage } from '../../context/LanguageContext';

export default function KioskPage() {
  const { currentGym, formatCurrency } = useGym();
  const { t } = useLanguage();

  // Kiosk Scanner States
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Play Web Audio Chime on scan
  const playKioskSound = (type = 'success') => {
    if (!currentGym?.kioskSettings?.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  // Live Today Overview Stats (Top headcount banner)
  const [todayOverview, setTodayOverview] = useState({ liveInside: 0, totalToday: 0 });

  // Table Data & Filtering States
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [datePreset, setDatePreset] = useState('today'); // 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [methodFilter, setMethodFilter] = useState('all'); // 'all' | 'qr' | 'manual' | 'kiosk'
  const [tableSearch, setTableSearch] = useState('');

  // Modals
  const [selectedMemberForPass, setSelectedMemberForPass] = useState(null);
  const [showGymPosterModal, setShowGymPosterModal] = useState(false);
  const [showManualCheckInModal, setShowManualCheckInModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsStandalone(params.get('mode') === 'standalone');
    }
  }, []);

  // Suggestions & Member Autocomplete States
  const [gymMembers, setGymMembers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const suggestionsBoxRef = useRef(null);

  // Fetch real-time live headcount (Today's global stats)
  const fetchLiveStats = async () => {
    try {
      const url = '/api/attendance/today' + (currentGym?._id ? `?gymId=${currentGym._id}` : '');
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTodayOverview({
          liveInside: data.liveInside ?? 0,
          totalToday: data.totalToday ?? 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch live headcount:', err);
    }
  };

  // Fetch active gym members for instant search suggestions
  const fetchGymMembers = async () => {
    try {
      const url = '/api/members' + (currentGym?._id ? `?gymId=${currentGym._id}` : '');
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setGymMembers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load gym members for suggestions:', err);
    }
  };

  // Fetch filtered attendance records for table
  const fetchAttendanceRecords = async () => {
    try {
      setLoadingList(true);
      const params = new URLSearchParams();

      if (currentGym?._id) {
        params.set('gymId', currentGym._id);
      }

      if (datePreset === 'today') {
        params.set('date', 'today');
      } else if (datePreset === 'yesterday') {
        params.set('date', 'yesterday');
      } else if (datePreset === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.set('startDate', d.toISOString().split('T')[0]);
        params.set('endDate', new Date().toISOString().split('T')[0]);
      } else if (datePreset === 'month') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        params.set('startDate', firstDay.toISOString().split('T')[0]);
        params.set('endDate', now.toISOString().split('T')[0]);
      } else if (datePreset === 'all') {
        params.set('date', 'all');
      } else if (datePreset === 'custom') {
        if (customStartDate) params.set('startDate', customStartDate);
        if (customEndDate) params.set('endDate', customEndDate);
      }

      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (methodFilter !== 'all') params.set('method', methodFilter);
      if (tableSearch.trim()) params.set('q', tableSearch.trim());

      const res = await fetch(`/api/attendance?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAttendanceRecords(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch attendance records:', err);
    } finally {
      setLoadingList(false);
    }
  };

  // Initial load and periodic polling
  useEffect(() => {
    fetchLiveStats();
    fetchGymMembers();
    inputRef.current?.focus();
    const interval = setInterval(() => {
      fetchLiveStats();
    }, 15000);
    return () => clearInterval(interval);
  }, [currentGym]);

  // Click outside to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsBoxRef.current &&
        !suggestionsBoxRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Re-fetch table records when filters or active gym change
  useEffect(() => {
    fetchAttendanceRecords();
  }, [datePreset, customStartDate, customEndDate, statusFilter, methodFilter, tableSearch, currentGym]);

  // Helper to check if a member is currently active inside gym today
  const isMemberInside = (memberId, memberObjId) => {
    return attendanceRecords.some(
      (a) =>
        (a.memberId === memberId ||
          a.member?._id === memberObjId ||
          a.member === memberObjId) &&
        !a.checkOut
    );
  };

  // Live filtered suggestions based on typing in input
  const suggestions = useMemo(() => {
    const q = identifier.trim().toLowerCase();
    if (!q) return [];
    return gymMembers
      .filter((m) => {
        return (
          (m.fullName && m.fullName.toLowerCase().includes(q)) ||
          (m.phone && m.phone.includes(q)) ||
          (m.memberId && m.memberId.toLowerCase().includes(q))
        );
      })
      .slice(0, 6);
  }, [gymMembers, identifier]);

  // Execute Scan Core
  const executeScan = async (scanId) => {
    const targetId = (scanId || identifier).trim();
    if (!targetId) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);

    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetId,
          gymId: currentGym?._id,
        }),
      });
      const data = await res.json();

      if (data.action === 'cooldown') {
        setResult(data);
        setError(null);
      } else if (data.action === 'frozen_blocked' || data.isFrozen) {
        setResult(data);
        setError(null);
        playKioskSound('error');
      } else if (data.success) {
        setResult(data);
        setIdentifier('');

        // Trigger celebratory sound & confetti on check-in
        if (data.action === 'check-in') {
          playKioskSound('success');
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#0ea5e9', '#10b981', '#38bdf8'],
          });
        } else if (data.action === 'check-out') {
          playKioskSound('checkout');
        }

        // Refresh stats & list
        fetchLiveStats();
        fetchAttendanceRecords();
      } else {
        setError(data.message || 'Member not found');
      }
    } catch (err) {
      setError('Connection error with server');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Instant Resume & Check-In from Kiosk Alert
  const handleResumeAndScan = async (memberObjectId, memberId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/members/${memberObjectId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        await executeScan(memberId);
      } else {
        setError(data.message || 'Could not resume membership plan');
      }
    } catch (err) {
      setError('Connection error resuming membership plan');
    } finally {
      setLoading(false);
    }
  };

  // When a suggestion row is clicked
  const handleSelectSuggestion = (member) => {
    setIdentifier(member.memberId);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    executeScan(member.memberId);
  };

  // Form submit
  const handleScan = (e) => {
    if (e) e.preventDefault();
    if (showSuggestions && activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
      handleSelectSuggestion(suggestions[activeSuggestionIndex]);
    } else {
      executeScan(identifier);
    }
  };

  // Keyboard navigation for suggestions
  const handleInputKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Manual Check-Out from table row
  const handleManualCheckOut = async (attendanceId) => {
    try {
      const res = await fetch(`/api/attendance/check-out/${attendanceId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        fetchLiveStats();
        fetchAttendanceRecords();
      }
    } catch (err) {
      console.error('Check out error:', err);
    }
  };

  // Formatters for Date and Time
  const formatDate = (dateVal) => {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateVal) => {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if any non-default filter is applied
  const isFilterActive = useMemo(() => {
    return (
      datePreset !== 'today' ||
      statusFilter !== 'all' ||
      methodFilter !== 'all' ||
      tableSearch.trim() !== '' ||
      customStartDate !== '' ||
      customEndDate !== ''
    );
  }, [datePreset, statusFilter, methodFilter, tableSearch, customStartDate, customEndDate]);

  // Reset all filters back to default
  const handleResetFilters = () => {
    setDatePreset('today');
    setCustomStartDate('');
    setCustomEndDate('');
    setStatusFilter('all');
    setMethodFilter('all');
    setTableSearch('');
  };

  // Export CSV Report
  const handleExportCSV = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      alert('No records available for the selected filters to export.');
      return;
    }

    const headers = [
      'Date',
      'Member Name',
      'Member ID',
      'Phone',
      'Check-In Date',
      'Check-In Time',
      'Check-Out Date',
      'Check-Out Time',
      'Workout Duration (Mins)',
      'Status',
      'Entry Method',
    ];

    const rows = attendanceRecords.map((r) => {
      const checkInDate = formatDate(r.checkIn || r.date);
      const checkInTime = formatTime(r.checkIn);
      const checkOutDate = r.checkOut ? formatDate(r.checkOut) : '—';
      const checkOutTime = r.checkOut ? formatTime(r.checkOut) : 'Still Inside';
      const duration =
        r.durationMinutes > 0
          ? r.durationMinutes
          : r.checkOut
          ? 1
          : Math.max(1, Math.round((Date.now() - new Date(r.checkIn).getTime()) / 60000));
      const statusStr = r.checkOut ? 'Checked Out' : 'Working Out';
      const methodStr = r.method === 'qr' ? 'QR Code' : r.method === 'manual' ? 'Manual Desk' : 'Kiosk Scanner';

      return [
        `"${r.date || ''}"`,
        `"${(r.memberName || '').replace(/"/g, '""')}"`,
        `"${r.memberId || ''}"`,
        `"${r.member?.phone || ''}"`,
        `"${checkInDate}"`,
        `"${checkInTime}"`,
        `"${checkOutDate}"`,
        `"${checkOutTime}"`,
        `"${duration}"`,
        `"${statusStr}"`,
        `"${methodStr}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `FeeOrbit_Attendance_${datePreset}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Human label for active filters (used in report header)
  const activeFilterLabel = useMemo(() => {
    let parts = [];
    if (datePreset === 'today') parts.push('Date: Today');
    else if (datePreset === 'yesterday') parts.push('Date: Yesterday');
    else if (datePreset === 'week') parts.push('Date: Last 7 Days');
    else if (datePreset === 'month') parts.push('Date: This Month');
    else if (datePreset === 'all') parts.push('Date: All Time');
    else if (datePreset === 'custom') parts.push(`Range: ${customStartDate || 'Start'} to ${customEndDate || 'End'}`);

    if (statusFilter !== 'all') parts.push(`Status: ${statusFilter === 'active' ? 'Inside' : 'Completed'}`);
    if (methodFilter !== 'all') parts.push(`Method: ${methodFilter.toUpperCase()}`);
    if (tableSearch.trim()) parts.push(`Search: "${tableSearch.trim()}"`);

    return parts.join(' • ') || 'Today (All Activity)';
  }, [datePreset, customStartDate, customEndDate, statusFilter, methodFilter, tableSearch]);

  return (
    <div style={{ padding: isStandalone ? '24px 28px' : '0' }}>
      {/* Top Header with live gym headcount & action desk */}
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
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{t('kiosk_title', 'FeeOrbit Check-In Kiosk')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
            {t('kiosk_subtitle', 'Instant front-desk attendance by Member ID, phone number, or QR scan.')}
            {currentGym?.openingHours && (
              <span style={{ marginLeft: '10px', color: 'var(--brand-cyan)', fontWeight: 600 }}>
                ⏰ {currentGym.openingHours}
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Live Headcount pill */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--brand-emerald)',
                boxShadow: '0 0 10px var(--brand-emerald)',
                animation: 'pulse 1.5s infinite',
              }}
            />
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {t('kiosk_currently_in_gym', 'Currently in Gym')}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-cyan)', lineHeight: 1 }}>
                {todayOverview.liveInside}{' '}
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  / {todayOverview.totalToday} {t('kiosk_today_suffix', 'today')}
                </span>
              </div>
            </div>
          </div>

          {/* Manual Check-In Button */}
          <button
            type="button"
            onClick={() => setShowManualCheckInModal(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderColor: '#10b981',
              color: '#ffffff',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              cursor: 'pointer',
            }}
          >
            <UserCheck size={16} /> {t('kiosk_manual_desk', 'Manual Check-In Desk')}
          </button>

          {/* Standee QR Poster Button */}
          <button
            type="button"
            onClick={() => setShowGymPosterModal(true)}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glow, rgba(99, 102, 241, 0.35))',
              background: 'var(--brand-primary-light, rgba(99, 102, 241, 0.12))',
              color: 'var(--brand-primary, #6366f1)',
              fontWeight: 700,
            }}
          >
            <QrCode size={15} /> {t('kiosk_qr_poster', 'Reception QR Poster')}
          </button>

          {/* Standalone Kiosk Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isStandalone) {
                window.location.href = '/kiosk';
              } else {
                window.location.href = '/kiosk?mode=standalone';
              }
            }}
            className="btn btn-secondary"
            title={isStandalone ? 'Exit Standalone Kiosk' : 'Launch Fullscreen Kiosk Mode (for Reception Counter Tablets)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: isStandalone ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card-solid, rgba(255, 255, 255, 0.05))',
              color: isStandalone ? '#ef4444' : 'var(--text-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isStandalone ? ('✕ ' + t('kiosk_exit_standalone', 'Exit Standalone')) : ('⛶ ' + t('kiosk_standalone_mode', 'Standalone Counter Mode'))}
          </button>
        </div>
      </div>

      {/* Dynamic Public Notice Board Banner on Kiosk Screen */}
      {currentGym?.noticeBoard?.isActive && currentGym?.noticeBoard?.content && (
        <div
          style={{
            background:
              currentGym.noticeBoard.priority === 'urgent'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.14), rgba(185, 28, 28, 0.1))'
                : currentGym.noticeBoard.priority === 'alert'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(180, 83, 9, 0.1))'
                : 'linear-gradient(135deg, var(--brand-primary-light, rgba(99, 102, 241, 0.12)), rgba(6, 182, 212, 0.08))',
            border:
              currentGym.noticeBoard.priority === 'urgent'
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : currentGym.noticeBoard.priority === 'alert'
                ? '1px solid rgba(245, 158, 11, 0.4)'
                : '1px solid var(--border-glow, rgba(99, 102, 241, 0.35))',
            borderRadius: '8px',
            padding: '8px 14px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
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
                  ? 'rgba(239, 68, 68, 0.2)'
                  : currentGym.noticeBoard.priority === 'alert'
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'var(--brand-primary-light, rgba(99, 102, 241, 0.2))',
              color:
                currentGym.noticeBoard.priority === 'urgent'
                  ? '#ef4444'
                  : currentGym.noticeBoard.priority === 'alert'
                  ? '#d97706'
                  : 'var(--brand-primary, #6366f1)',
            }}
          >
            📢 {currentGym.noticeBoard.title || t('kiosk_announcements', 'GYM ANNOUNCEMENTS')}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            {currentGym.noticeBoard.content || t('kiosk_announcement_default', 'Welcome to our facility! Please re-rack your weights after use.')}
          </span>
        </div>
      )}

      {/* Compact Kiosk Scanner Input Box */}
      <div
        className="glass-card"
        style={{
          marginBottom: '18px',
          padding: '14px 18px',
          background: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-card, 0 4px 16px rgba(0, 0, 0, 0.06))',
        }}
      >
        <form onSubmit={handleScan}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--brand-primary)',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <QrCode size={15} /> {t('kiosk_enter_prompt', 'Enter Member Name, Phone Number, or Member ID')}
              </label>

              {/* Quick Click Hints */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>{t('kiosk_quick_search', 'Quick Search:')}</span>
                <button
                  type="button"
                  onClick={() => setShowManualCheckInModal(true)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '4px',
                    color: 'var(--brand-emerald, #10b981)',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                >
                  {t('kiosk_lookup_all', 'Lookup All Members')}
                </button>
                {(attendanceRecords?.slice(0, 2).map((item) => item.memberId) || ['TF-1001']).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setIdentifier(id);
                      inputRef.current?.focus();
                    }}
                    style={{
                      background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.05))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '3px',
                      color: 'var(--text-secondary)',
                      padding: '1px 6px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                    }}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={t('kiosk_input_placeholder', 'e.g. Aman Verma, phone number (9876543210), or TF-1001...')}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setShowSuggestions(true);
                    setActiveSuggestionIndex(-1);
                  }}
                  onFocus={() => {
                    if (identifier.trim().length >= 1) setShowSuggestions(true);
                  }}
                  onKeyDown={handleInputKeyDown}
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '9px 14px 9px 36px',
                    fontSize: '0.98rem',
                    fontWeight: 600,
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: showSuggestions && suggestions.length > 0 ? '1.5px solid var(--brand-primary)' : '1.5px solid var(--border-subtle)',
                    borderRadius: showSuggestions && suggestions.length > 0 ? 'var(--radius-sm) var(--radius-sm) 0 0' : 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    letterSpacing: '0.02em',
                    transition: 'border-color 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  }}
                  autoFocus
                />

                {/* Floating Suggestions Dropdown */}
                {showSuggestions && identifier.trim().length >= 1 && (
                  <div
                    ref={suggestionsBoxRef}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: 'var(--bg-card-solid, var(--bg-card))',
                      border: '1px solid var(--border-glow, rgba(99, 102, 241, 0.35))',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-dropdown, 0 16px 36px rgba(0, 0, 0, 0.25))',
                      zIndex: 300,
                      overflow: 'hidden',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    {/* Suggestions Header */}
                    <div
                      style={{
                        padding: '7px 14px',
                        background: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {suggestions.length > 0
                          ? `Found ${suggestions.length} matching member${suggestions.length > 1 ? 's' : ''}`
                          : 'No matching members'}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Use ↑ ↓ and Enter to select
                      </span>
                    </div>

                    {/* Suggestions List */}
                    {suggestions.length > 0 ? (
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {suggestions.map((m, idx) => {
                          const isInside = isMemberInside(m.memberId, m._id);
                          const isSelected = idx === activeSuggestionIndex;
                          return (
                            <div
                              key={m._id || m.memberId}
                              onClick={() => handleSelectSuggestion(m)}
                              onMouseEnter={() => setActiveSuggestionIndex(idx)}
                              style={{
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                background: isSelected
                                  ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.15))'
                                  : 'transparent',
                                borderBottom:
                                  idx < suggestions.length - 1
                                    ? '1px solid var(--border-subtle)'
                                    : 'none',
                                transition: 'background 0.12s ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {/* Member Avatar */}
                                <div
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: isInside
                                      ? 'linear-gradient(135deg, #10b981, #059669)'
                                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    color: '#fff',
                                    flexShrink: 0,
                                    boxShadow: isInside
                                      ? '0 0 10px rgba(16, 185, 129, 0.4)'
                                      : 'none',
                                  }}
                                >
                                  {m.fullName?.charAt(0)?.toUpperCase() || 'M'}
                                </div>

                                {/* Member Details */}
                                <div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: 700,
                                        fontSize: '0.92rem',
                                        color: 'var(--text-primary)',
                                      }}
                                    >
                                      {m.fullName}
                                    </span>
                                    <span
                                      style={{
                                        fontFamily: 'monospace',
                                        fontWeight: 700,
                                        fontSize: '0.72rem',
                                        background: 'var(--brand-primary-light, rgba(99, 102, 241, 0.12))',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--brand-primary, #6366f1)',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                      }}
                                    >
                                      {m.memberId}
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      fontSize: '0.76rem',
                                      color: 'var(--text-muted)',
                                      display: 'flex',
                                      gap: '10px',
                                      marginTop: '2px',
                                    }}
                                  >
                                    <span>📞 {m.phone || 'No phone'}</span>
                                    {m.plan?.name && <span>• {m.plan.name}</span>}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons & Status Badge */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    background: isInside
                                      ? 'rgba(16, 185, 129, 0.15)'
                                      : 'var(--bg-card-solid, rgba(255, 255, 255, 0.06))',
                                    color: isInside ? 'var(--brand-emerald, #10b981)' : 'var(--text-muted)',
                                    border: isInside
                                      ? '1px solid rgba(16, 185, 129, 0.3)'
                                      : '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      background: isInside ? '#10b981' : '#94a3b8',
                                    }}
                                  />
                                  {isInside ? 'Inside Gym' : 'Outside'}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectSuggestion(m);
                                  }}
                                  style={{
                                    background: isInside
                                      ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                                      : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
                                  }}
                                >
                                  {isInside ? 'Check Out' : 'Check In'}
                                  <ArrowRight size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.84rem',
                        }}
                      >
                        <div>No member found matching "{identifier}"</div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSuggestions(false);
                            setShowManualCheckInModal(true);
                          }}
                          style={{
                            marginTop: '8px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '5px',
                            color: '#a5b4fc',
                            padding: '4px 12px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Open All Members Directory
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ minWidth: '135px', padding: '8px 16px', fontSize: '0.85rem' }}
              >
                {loading ? t('btn_saving', 'Verifying...') : t('kiosk_btn_checkin_out', 'Check In / Out')}
              </button>
            </div>
          </div>
        </form>

        {/* Feedback Alert / Result card */}
        {error && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AlertCircle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('kiosk_scan_error', 'Scan Error')}</div>
              <div style={{ fontSize: '0.84rem' }}>{error}</div>
            </div>
          </div>
        )}

        {result &&
          (result.action === 'frozen_blocked' || result.isFrozen ? (
            <div
              style={{
                marginTop: '16px',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(30, 58, 138, 0.25))',
                border: '1px solid rgba(56, 189, 248, 0.55)',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.2)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: '0 0 16px rgba(14, 165, 233, 0.5)',
                  }}
                >
                  <Snowflake size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Membership is PAUSED (Frozen)
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {result.message}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Member: <strong style={{ color: 'var(--text-primary)' }}>{result.member?.fullName}</strong> ({result.member?.memberId}) • Preserved Balance: <strong style={{ color: 'var(--brand-cyan, #0ea5e9)' }}>{result.member?.frozenRemainingDays || 0} Days</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleResumeAndScan(result.member?._id, result.member?.memberId)}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderColor: '#10b981',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                }}
              >
                <Play size={14} fill="#fff" /> Resume Plan & Check In
              </button>
            </div>
          ) : result.action === 'cooldown' ? (
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.1))',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <Clock size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Already Checked In! Cooldown Active
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{result.message}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Member: <strong style={{ color: 'var(--text-primary)' }}>{result.member?.fullName}</strong> (
                  {result.member?.memberId}) • Accidental checkout protection: 5-minute safety window.
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background:
                  result.action === 'check-in'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 182, 212, 0.1))'
                    : 'linear-gradient(135deg, rgba(6, 182, 212, 0.18), rgba(99, 102, 241, 0.1))',
                border:
                  result.action === 'check-in'
                    ? '1px solid rgba(16, 185, 129, 0.45)'
                    : '1px solid rgba(6, 182, 212, 0.45)',
                boxShadow:
                  result.action === 'check-in'
                    ? '0 0 20px rgba(16, 185, 129, 0.15)'
                    : '0 0 20px rgba(6, 182, 212, 0.15)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background:
                      result.action === 'check-in'
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #06b6d4, #0284c7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow:
                      result.action === 'check-in'
                        ? '0 0 14px rgba(16, 185, 129, 0.4)'
                        : '0 0 14px rgba(6, 182, 212, 0.4)',
                  }}
                >
                  {result.action === 'check-in' ? <UserCheck size={22} /> : <Clock size={22} />}
                </div>

                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {result.message}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Member: <strong style={{ color: 'var(--text-primary)' }}>{result.member?.fullName}</strong> (
                    {result.member?.memberId}) • Plan: {result.member?.plan}
                  </div>
                  {result.durationMinutes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--brand-cyan)', fontWeight: 700, marginTop: '2px' }}>
                      🔥 Total Workout Duration: {result.durationMinutes} minutes
                    </div>
                  )}
                </div>
              </div>

              {result.warning && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    color: '#f87171',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ShieldAlert size={15} /> {result.warning}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Entry & Exit Log with Filters & Export Tools */}
      <div
        className="glass-card"
        style={{
          padding: '16px 18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md, 0 10px 30px rgba(0, 0, 0, 0.08))',
        }}
      >
        {/* Table Top Header: Title, Counts & Export Actions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('kiosk_log_title', 'Entry & Exit Attendance Log')}
              </h2>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                {attendanceRecords.length} {attendanceRecords.length === 1 ? t('kiosk_record_suffix', 'Record') : t('kiosk_records_suffix', 'Records')}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t('kiosk_log_subtitle', 'Full timeline with Check-In & Check-Out Date and Time, filter options, and export reports.')}
            </div>
          </div>

          {/* Action Buttons: Export CSV & Print Report */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleExportCSV}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                padding: '6px 12px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                background: 'rgba(56, 189, 248, 0.1)',
                color: 'var(--brand-cyan, #0284c7)',
                fontWeight: 700,
              }}
              title="Export filtered records to Excel / CSV spreadsheet"
            >
              <Download size={14} /> {t('kiosk_export_csv', 'Export CSV Report')}
            </button>

            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                padding: '6px 12px',
                border: '1px solid var(--border-glow, rgba(129, 140, 248, 0.35))',
                background: 'var(--brand-primary-light, rgba(129, 140, 248, 0.1))',
                color: 'var(--brand-primary, #6366f1)',
                fontWeight: 700,
              }}
              title="Print official roster or save PDF"
            >
              <Printer size={14} /> {t('kiosk_print_report', 'Print Report')}
            </button>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div
          style={{
            background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.02))',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Row 1: Date Range Presets */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginRight: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Calendar size={13} color="var(--brand-primary)" /> {t('kiosk_filter_date', 'Date:')}
              </span>

              {[
                { id: 'today', label: t('kiosk_filter_today', 'Today') },
                { id: 'yesterday', label: t('kiosk_filter_yesterday', 'Yesterday') },
                { id: 'week', label: t('kiosk_filter_week', 'Last 7 Days') },
                { id: 'month', label: t('kiosk_filter_month', 'This Month') },
                { id: 'all', label: t('kiosk_filter_all', 'All Records') },
                { id: 'custom', label: t('kiosk_filter_custom', 'Custom Range...') },
              ].map((preset) => {
                const isActive = datePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDatePreset(preset.id)}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, var(--brand-primary, #6366f1), #4f46e5)'
                        : 'var(--bg-card, rgba(255, 255, 255, 0.04))',
                      border: isActive
                        ? '1px solid var(--brand-primary)'
                        : '1px solid var(--border-subtle)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.74rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.35)' : 'none',
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Reset Filters button if any filter is active */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw size={11} /> Reset Filters
              </button>
            )}
          </div>

          {/* Row 2: Custom Date Inputs (if custom is active) */}
          {datePreset === 'custom' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                padding: '8px 12px',
                background: 'var(--bg-card, rgba(0, 0, 0, 0.05))',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.76rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.76rem',
                    outline: 'none',
                  }}
                />
              </div>

              <span style={{ fontSize: '0.7rem', color: 'var(--brand-cyan)' }}>
                Select custom start & end date to view historical attendance.
              </span>
            </div>
          )}

          {/* Row 3: Status, Method, and Real-Time Search */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            {/* Status Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('kiosk_status_label', 'STATUS')}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: 'var(--bg-input, var(--bg-card-solid))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">{t('kiosk_status_all', 'All Statuses (Active & Checked Out)')}</option>
                <option value="active">🟢 {t('kiosk_status_active', 'Currently Active Inside')}</option>
                <option value="completed">🏁 {t('kiosk_status_completed', 'Checked Out / Completed')}</option>
              </select>
            </div>

            {/* Entry Method Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('kiosk_method_label', 'ENTRY METHOD')}
              </label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                style={{
                  background: 'var(--bg-input, var(--bg-card-solid))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">{t('kiosk_method_all', 'All Methods (QR, Manual & Kiosk)')}</option>
                <option value="qr">📱 {t('kiosk_method_qr', 'QR Code Scan')}</option>
                <option value="manual">✍️ {t('kiosk_method_manual', 'Manual Check-In Desk')}</option>
                <option value="kiosk">🖥️ {t('kiosk_method_kiosk', 'Self-Kiosk')}</option>
              </select>
            </div>

            {/* Table Quick Search Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('kiosk_search_label', 'SEARCH LOG')}
              </label>
              <div style={{ position: 'relative' }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: '9px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder={t('kiosk_search_placeholder', 'Filter name, phone, or ID...')}
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px 6px 28px',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem',
                    outline: 'none',
                  }}
                />
                {tableSearch && (
                  <button
                    type="button"
                    onClick={() => setTableSearch('')}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabular Attendance Data with Both Date and Time */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('kiosk_th_name', 'Member Name')}</th>
                <th>{t('kiosk_th_id', 'Member ID')}</th>
                <th>{t('kiosk_th_checkin', 'Check-In (Date & Time)')}</th>
                <th>{t('kiosk_th_checkout', 'Check-Out (Date & Time)')}</th>
                <th>{t('kiosk_th_workout_time', 'Workout Time')}</th>
                <th>{t('kiosk_th_method', 'Entry Method')}</th>
                <th>{t('kiosk_th_status', 'Status')}</th>
                <th style={{ textAlign: 'right' }}>{t('kiosk_th_action', 'Quick Action')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px' }}>
                    {t('kiosk_loading', 'Loading attendance entries...')}
                  </td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span>{t('kiosk_no_records', 'No attendance records found matching current filters.')}</span>
                      {isFilterActive && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: '4px' }}
                        >
                          {t('btn_filter', 'Clear Active Filters')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((item) => (
                  <tr key={item._id}>
                    {/* Member Name + Phone */}
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                            color: '#fff',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {(item.memberName?.charAt(0) || 'M').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                            {item.memberName}
                          </div>
                          {item.member?.phone && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {item.member.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Member ID (Clickable to open pass) */}
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          color: 'var(--brand-primary, #6366f1)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'var(--brand-primary-light, rgba(99, 102, 241, 0.1))',
                          border: '1px solid var(--border-subtle)',
                        }}
                        onClick={() =>
                          setSelectedMemberForPass(
                            item.member || { fullName: item.memberName, memberId: item.memberId }
                          )
                        }
                        title="Click to view Digital QR Pass"
                      >
                        {item.memberId}
                      </span>
                    </td>

                    {/* Check-In Date and Time */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            fontSize: '0.82rem',
                          }}
                        >
                          <Calendar size={13} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                          <span>{formatDate(item.checkIn || item.date)}</span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: 'var(--text-secondary)',
                            fontSize: '0.74rem',
                          }}
                        >
                          <Clock size={12} style={{ color: 'var(--brand-cyan)', flexShrink: 0 }} />
                          <span>{formatTime(item.checkIn)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Check-Out Date and Time */}
                    <td>
                      {item.checkOut ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              fontSize: '0.82rem',
                            }}
                          >
                            <Calendar size={13} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                            <span>{formatDate(item.checkOut)}</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              color: 'var(--text-secondary)',
                              fontSize: '0.74rem',
                            }}
                          >
                            <Clock size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            <span>{formatTime(item.checkOut)}</span>
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 9px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#10b981',
                              boxShadow: '0 0 6px #10b981',
                              animation: 'pulse 1.5s infinite',
                            }}
                          />
                          {t('kiosk_status_active_tag', 'Still Inside')}
                        </span>
                      )}
                    </td>

                    {/* Workout Time */}
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: item.checkOut ? 'var(--text-secondary)' : 'var(--brand-cyan, #0284c7)',
                        }}
                      >
                        {item.durationMinutes > 0
                          ? `${item.durationMinutes} min`
                          : item.checkOut
                          ? '1 min'
                          : `${Math.max(
                              1,
                              Math.round((Date.now() - new Date(item.checkIn).getTime()) / 60000)
                            )} min (${t('kiosk_status_active', 'Active')})`}
                      </span>
                    </td>

                    {/* Entry Method */}
                    <td>
                      {item.method === 'qr' ? (
                        <span
                          className="badge"
                          style={{
                            background: 'var(--brand-primary-light, rgba(99, 102, 241, 0.12))',
                            color: 'var(--brand-primary, #6366f1)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <QrCode size={11} /> {t('kiosk_method_qr', 'QR Scan')}
                        </span>
                      ) : item.method === 'manual' ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--brand-emerald, #10b981)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          <UserCheck size={11} /> {t('kiosk_method_manual', 'Manual Desk')}
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: 'var(--brand-cyan, #0284c7)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                          }}
                        >
                          <Search size={11} /> {t('kiosk_method_kiosk', 'Kiosk')}
                        </span>
                      )}
                    </td>

                    {/* Current Status */}
                    <td>
                      {item.checkOut ? (
                        <span className="badge badge-info">{t('kiosk_status_completed_tag', 'Checked Out')}</span>
                      ) : (
                        <span
                          className="badge badge-active"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: '#10b981',
                              boxShadow: '0 0 5px #10b981',
                            }}
                          />
                          {t('kiosk_status_active_tag', 'Working Out')}
                        </span>
                      )}
                    </td>

                    {/* Quick Action */}
                    <td style={{ textAlign: 'right' }}>
                      {!item.checkOut ? (
                        <button
                          onClick={() => handleManualCheckOut(item._id)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            borderColor: 'rgba(244, 63, 94, 0.4)',
                            color: '#fb7185',
                            background: 'rgba(244, 63, 94, 0.1)',
                          }}
                        >
                          {t('kiosk_btn_checkout_now', 'Check Out')}
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={13} color="#10b981" /> {t('dash_cleared', 'Done')}
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

      {/* Digital QR Pass Modal */}
      {selectedMemberForPass && (
        <QRCodeModal
          member={selectedMemberForPass}
          onClose={() => setSelectedMemberForPass(null)}
        />
      )}

      {/* Gym Reception QR Poster Modal */}
      {showGymPosterModal && (
        <GymQRPosterModal
          gymId={currentGym?._id}
          onClose={() => setShowGymPosterModal(false)}
        />
      )}

      {/* Manual Check-In Modal for members who forgot their phone */}
      {showManualCheckInModal && (
        <ManualCheckInModal
          isOpen={showManualCheckInModal}
          gymId={currentGym?._id}
          onClose={() => setShowManualCheckInModal(false)}
          onAttendanceUpdated={() => {
            fetchLiveStats();
            fetchAttendanceRecords();
          }}
        />
      )}

      {/* Attendance Printable Report & Roster Modal */}
      {showReportModal && (
        <AttendanceReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          records={attendanceRecords}
          activeFilters={{ label: activeFilterLabel }}
          gym={currentGym}
          onExportCsv={handleExportCSV}
        />
      )}
    </div>
  );
}
