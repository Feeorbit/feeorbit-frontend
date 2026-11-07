'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Phone,
  CreditCard,
  RefreshCw,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ManualCheckInModal({ isOpen, onClose, onAttendanceUpdated, gymId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Load members and today's attendance roster
  const loadData = async () => {
    setLoading(true);
    try {
      const membersUrl = '/api/members' + (gymId ? `?gymId=${gymId}` : '');
      const attendanceUrl = '/api/attendance/today' + (gymId ? `?gymId=${gymId}` : '');

      const [membersRes, attendanceRes] = await Promise.all([
        fetch(membersUrl),
        fetch(attendanceUrl),
      ]);

      const membersData = await membersRes.json();
      const attendanceData = await attendanceRes.json();

      if (membersData.success) {
        setMembers(membersData.data || []);
      }
      if (attendanceData.success) {
        setTodayAttendance(attendanceData.data || []);
      }
    } catch (err) {
      console.error('Failed to load manual checkin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setNotification(null);
    }
  }, [isOpen, gymId]);

  if (!isOpen) return null;

  // Filter members based on search
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.fullName && m.fullName.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q)) ||
      (m.memberId && m.memberId.toLowerCase().includes(q))
    );
  });

  // Check if member currently has an active session today (checked in, not checked out)
  const getActiveAttendance = (memberId) => {
    return todayAttendance.find(
      (a) => (a.member?._id === memberId || a.member === memberId) && !a.checkOut
    );
  };

  // Perform Manual Check-In
  const handleCheckIn = async (member) => {
    setActionLoadingId(member._id);
    setNotification(null);
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member._id, gymId }),
      });
      const data = await res.json();

      if (data.success) {
        confetti({
          particleCount: 70,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#10b981', '#6366f1', '#38bdf8'],
        });

        setNotification({
          type: 'success',
          message: `✅ ${member.fullName} checked in manually at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        });

        await loadData();
        if (onAttendanceUpdated) onAttendanceUpdated();
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Check-in failed',
        });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Network error connecting to server' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Perform Manual Check-Out
  const handleCheckOut = async (attendanceRecord, memberName) => {
    setActionLoadingId(attendanceRecord._id);
    setNotification(null);
    try {
      const res = await fetch(`/api/attendance/check-out/${attendanceRecord._id}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        const duration = data.data?.durationMinutes || 1;
        setNotification({
          type: 'success',
          message: `👋 ${memberName} checked out manually. Total workout: ${duration} mins.`,
        });

        await loadData();
        if (onAttendanceUpdated) onAttendanceUpdated();
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Check-out failed',
        });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Network error connecting to server' });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1150 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '680px',
          width: '95%',
          background: 'var(--bg-card-solid, var(--bg-card))',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-modal, 0 25px 60px rgba(0, 0, 0, 0.4))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={20} color="#10b981" />
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Manual Check-In & Check-Out Desk
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              For members who forgot their mobile phone or need front-desk manual entry.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div style={{ padding: '16px 20px 8px 20px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search member by Name (e.g. Aman), Phone, or Member ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px 11px 42px',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: 'var(--bg-input, var(--bg-card-solid))',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              autoFocus
            />
          </div>

          {/* Quick Notification Toast */}
          {notification && (
            <div
              style={{
                marginTop: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 600,
                background:
                  notification.type === 'success'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                border:
                  notification.type === 'success'
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(239, 68, 68, 0.4)',
                color: notification.type === 'success' ? '#34d399' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Member Roster List */}
        <div style={{ padding: '10px 20px 20px 20px', maxHeight: '55vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 10px auto' }} />
              <div>Loading gym members...</div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <UserX size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <div style={{ fontWeight: 600 }}>No members found matching "{searchQuery}"</div>
              <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                Check spelling or register a new member in the Members Directory.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredMembers.map((member) => {
                const activeSession = getActiveAttendance(member._id);
                const isInside = !!activeSession;
                const isLoading =
                  actionLoadingId === member._id || actionLoadingId === activeSession?._id;

                return (
                  <div
                    key={member._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isInside
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))'
                        : 'var(--bg-card, rgba(255, 255, 255, 0.02))',
                      border: isInside
                        ? '1px solid rgba(16, 185, 129, 0.35)'
                        : '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Member Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: isInside
                            ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                            : 'linear-gradient(135deg, #6366f1, #38bdf8)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          flexShrink: 0,
                        }}
                      >
                        {member.fullName?.charAt(0)?.toUpperCase() || 'M'}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {member.fullName}
                          </span>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--brand-primary, #6366f1)',
                              background: 'var(--brand-primary-light, rgba(99, 102, 241, 0.15))',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {member.memberId}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={11} /> {member.phone}
                          </span>
                          <span>•</span>
                          <span style={{ color: 'var(--brand-cyan)' }}>
                            {member.plan?.name || 'Active Plan'}
                          </span>
                          {isInside && (
                            <>
                              <span>•</span>
                              <span
                                style={{
                                  color: '#34d399',
                                  fontWeight: 700,
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
                                  }}
                                />
                                Inside since{' '}
                                {new Date(activeSession.checkIn).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Check In / Check Out */}
                    <div>
                      {isInside ? (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleCheckOut(activeSession, member.fullName)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderColor: '#38bdf8',
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.1)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            padding: '6px 12px',
                          }}
                        >
                          {isLoading ? (
                            <RefreshCw size={14} className="spin-animation" />
                          ) : (
                            <Clock size={14} />
                          )}
                          Check Out
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleCheckIn(member)}
                          className="btn btn-primary btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            borderColor: '#10b981',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            padding: '6px 14px',
                            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          {isLoading ? (
                            <RefreshCw size={14} className="spin-animation" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>Total {filteredMembers.length} member profiles loaded</span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
