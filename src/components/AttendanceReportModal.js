'use client';

import React, { useEffect } from 'react';
import { Printer, Download, X, Calendar, Clock, UserCheck, ShieldCheck, Dumbbell } from 'lucide-react';

export default function AttendanceReportModal({
  isOpen,
  onClose,
  records = [],
  activeFilters = {},
  gym = { name: 'FeeOrbit Fitness Club', address: 'Sector 21, Hub', phone: '9876543210' },
  onExportCsv,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove('printing-modal-open');
    };
    window.addEventListener('afterprint', cleanup);
    return () => {
      window.removeEventListener('afterprint', cleanup);
      cleanup();
    };
  }, []);

  if (!isOpen) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-modal-open');
    window.print();
  };

  const totalMembers = records.length;
  const liveInside = records.filter((r) => !r.checkOut).length;
  const completed = records.filter((r) => r.checkOut).length;
  const totalMinutes = records.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const avgMinutes = completed > 0 ? Math.round(totalMinutes / completed) : 0;

  const formatDate = (dateVal) => {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateVal) => {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1150 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '880px',
          width: '95%',
          background: 'var(--bg-card-solid, var(--bg-card))',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-modal, 0 25px 60px rgba(0, 0, 0, 0.4))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar (Screen only) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--brand-primary-light, rgba(99, 102, 241, 0.15))',
                color: 'var(--brand-primary, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Printer size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Attendance & Footfall Report
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Printable Roster & Official Front Desk Log
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onExportCsv}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Printer size={14} /> Print Report
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                marginLeft: '6px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div
          className="modal-body attendance-print-sheet"
          style={{
            padding: '24px',
            overflowY: 'auto',
            background: '#ffffff',
            color: '#0f172a',
          }}
        >
          {/* Official Letterhead Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    fontWeight: 900,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.95rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  FEEORBIT
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {gym.name || "Rahul Singh's Fitness Club"}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                {gym.address || 'Front Desk Operations'} • Ph: {gym.phone || '+91-9876543210'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#4338ca',
                  letterSpacing: '0.03em',
                }}
              >
                ATTENDANCE & ROSTER REPORT
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#0f172a', fontWeight: 700, marginTop: '2px' }}>
                Filter: {activeFilters.label || 'All Records'}
              </div>
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                background: '#f8fafc',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Footfalls
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                {totalMembers}
              </div>
            </div>

            <div
              style={{
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '10px 14px',
                background: '#f0fdf4',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                Currently Inside
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d' }}>
                {liveInside}
              </div>
            </div>

            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                background: '#f8fafc',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Completed Workouts
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#334155' }}>
                {completed}
              </div>
            </div>

            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                background: '#f8fafc',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Avg Workout Time
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                {avgMinutes} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>min</span>
              </div>
            </div>
          </div>

          {/* Tabular Attendance Data */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.78rem',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#1e293b' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 700, width: '35px' }}>#</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Member Name</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Member ID</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Phone</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Check-In (Date & Time)</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Check-Out (Date & Time)</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Duration</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Method</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                      No attendance entries found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  records.map((item, idx) => (
                    <tr
                      key={item._id || idx}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}
                    >
                      <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>
                        {item.memberName}
                      </td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 600, color: '#4338ca' }}>
                        {item.memberId}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>
                        {item.member?.phone || '—'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {formatDate(item.checkIn || item.date)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {formatTime(item.checkIn)}
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {item.checkOut ? (
                          <>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>
                              {formatDate(item.checkOut)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {formatTime(item.checkOut)}
                            </div>
                          </>
                        ) : (
                          <span
                            style={{
                              background: '#dcfce7',
                              color: '#166534',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Still Inside
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#334155' }}>
                        {item.durationMinutes > 0
                          ? `${item.durationMinutes} min`
                          : item.checkOut
                          ? '1 min'
                          : `${Math.max(1, Math.round((Date.now() - new Date(item.checkIn).getTime()) / 60000))} min (Live)`}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background:
                              item.method === 'qr'
                                ? '#e0e7ff'
                                : item.method === 'manual'
                                ? '#fef3c7'
                                : '#f1f5f9',
                            color:
                              item.method === 'qr'
                                ? '#3730a3'
                                : item.method === 'manual'
                                ? '#92400e'
                                : '#334155',
                          }}
                        >
                          {item.method === 'qr' ? 'QR Code' : item.method === 'manual' ? 'Manual' : 'Kiosk'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {item.checkOut ? (
                          <span style={{ color: '#475569', fontWeight: 600, fontSize: '0.72rem' }}>
                            Checked Out
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.72rem' }}>
                            Working Out
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Official Sign-Off Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: '28px',
              paddingTop: '16px',
              borderTop: '1px dashed #cbd5e1',
              fontSize: '0.75rem',
              color: '#64748b',
            }}
          >
            <div>
              Generated via FeeOrbit Gym Management Platform • Official Facility Log
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '160px', marginBottom: '4px' }}></div>
              <div>Authorized Desk Signature / Stamp</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar (Screen only) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button
            type="button"
            onClick={onExportCsv}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Export as CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Print Roster Report
          </button>
        </div>
      </div>
    </div>
  );
}
