'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Download,
  Filter,
  QrCode,
  Calendar,
  Phone,
  CreditCard,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  CheckCircle,
  MessageSquare,
  Pause,
  Play,
  Snowflake,
  ShieldCheck,
  AlertCircle,
  CalendarClock,
  Sparkles,
} from 'lucide-react';
import QRCodeModal from '../../components/QRCodeModal';
import ReceiptModal from '../../components/ReceiptModal';
import { useGym } from '../../context/GymContext';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../context/ToastContext';

export default function MembersPage() {
  const { currentGym, formatCurrency } = useGym();
  const { t } = useLanguage();
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMemberForPass, setSelectedMemberForPass] = useState(null);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);

  // Membership Pause & Resume State
  const [selectedMemberForPause, setSelectedMemberForPause] = useState(null);
  const [selectedMemberForResume, setSelectedMemberForResume] = useState(null);
  const [pauseReasonPreset, setPauseReasonPreset] = useState('Travel / Vacation');
  const [pauseCustomNote, setPauseCustomNote] = useState('');
  const [pauseSendWhatsApp, setPauseSendWhatsApp] = useState(true);
  const [resumeSendWhatsApp, setResumeSendWhatsApp] = useState(true);
  const [pauseSubmitting, setPauseSubmitting] = useState(false);
  const [resumeSubmitting, setResumeSubmitting] = useState(false);

  // New Member Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'Male',
    bloodGroup: '',
    emergencyName: '',
    emergencyPhone: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    amountPaid: '',
    paymentMethod: 'UPI',
    lockerNumber: '',
    notes: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchPlans = async () => {
    try {
      const url = '/api/plans' + (currentGym?._id ? `?gymId=${currentGym._id}` : '');
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
        if (data.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            planId: data.data[0]._id,
            amountPaid: data.data[0].price,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      let url = `/api/members?`;
      if (currentGym?._id) url += `gymId=${currentGym._id}&`;
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      if (statusFilter && statusFilter !== 'all') url += `status=${statusFilter}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [currentGym]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, statusFilter, currentGym]);

  const handlePlanChange = (e) => {
    const pId = e.target.value;
    const selected = plans.find((p) => p._id === pId);
    setFormData((prev) => ({
      ...prev,
      planId: pId,
      amountPaid: selected ? selected.price : prev.amountPaid,
    }));
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
        },
        planId: formData.planId,
        startDate: formData.startDate,
        amountPaid: Number(formData.amountPaid),
        paymentMethod: formData.paymentMethod,
        lockerNumber: formData.lockerNumber,
        notes: formData.notes,
        gymId: currentGym?._id,
      };

      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setShowAddModal(false);
        fetchMembers();

        // Show generated fee receipt
        if (data.payment) {
          setGeneratedReceipt(data.payment);
        }

        // Reset form
        setFormData({
          fullName: '',
          phone: '',
          email: '',
          gender: 'Male',
          bloodGroup: '',
          emergencyName: '',
          emergencyPhone: '',
          planId: plans[0]?._id || '',
          startDate: new Date().toISOString().split('T')[0],
          amountPaid: plans[0]?.price || '',
          paymentMethod: 'UPI',
          lockerNumber: '',
          notes: '',
        });
      } else {
        setFormError(data.message || 'Failed to add member');
      }
    } catch (err) {
      setFormError('Failed to connect to server');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleExecutePause = async (e) => {
    if (e) e.preventDefault();
    if (!selectedMemberForPause) return;
    setPauseSubmitting(true);

    try {
      const fullReason = pauseCustomNote.trim()
        ? `${pauseReasonPreset}: ${pauseCustomNote.trim()}`
        : pauseReasonPreset;

      const res = await fetch(`/api/members/${selectedMemberForPause._id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: fullReason }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `Membership paused! ${data.daysPreserved} remaining days safely preserved.`,
          { title: 'Membership Frozen ❄️' }
        );

        const memberPhone = selectedMemberForPause.phone;
        const memberName = selectedMemberForPause.fullName;
        const daysPreserved = data.daysPreserved;
        const shouldNotify = pauseSendWhatsApp;

        setSelectedMemberForPause(null);
        fetchMembers();

        if (shouldNotify && memberPhone) {
          const cleanPhone = memberPhone.replace(/[^0-9]/g, '');
          const gymName = currentGym?.name || 'FeeOrbit Gym';
          const text = `Hi ${memberName}, your gym membership at *${gymName}* has been PAUSED. ❄️\n\nYour *${daysPreserved} remaining days* are safely preserved and locked in your account. When you return, just let us know at reception and your plan will continue from that date with 0 days lost! See you soon. 💪`;
          window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(text)}`, '_blank');
        }
      } else {
        toast.error(data.message || 'Failed to pause membership', { title: 'Pause Error' });
      }
    } catch (err) {
      toast.error('Network error pausing membership', { title: 'Server Error' });
    } finally {
      setPauseSubmitting(false);
    }
  };

  const handleExecuteResume = async (e) => {
    if (e) e.preventDefault();
    if (!selectedMemberForResume) return;
    setResumeSubmitting(true);

    try {
      const res = await fetch(`/api/members/${selectedMemberForResume._id}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (data.success) {
        const formattedDate = new Date(data.newEndDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        toast.success(
          `Membership resumed! ${data.daysRestored} days added back. Valid until ${formattedDate}.`,
          { title: 'Membership Resumed ▶️' }
        );

        const memberPhone = selectedMemberForResume.phone;
        const memberName = selectedMemberForResume.fullName;
        const daysRestored = data.daysRestored;
        const shouldNotify = resumeSendWhatsApp;

        setSelectedMemberForResume(null);
        fetchMembers();

        if (shouldNotify && memberPhone) {
          const cleanPhone = memberPhone.replace(/[^0-9]/g, '');
          const gymName = currentGym?.name || 'FeeOrbit Gym';
          const text = `Welcome back ${memberName}! 🎉\n\nYour gym membership at *${gymName}* is active again. All *${daysRestored} preserved days* have been restored starting from today.\nYour new membership expiry date is *${formattedDate}*.\n\nLet’s crush those fitness goals! 🔥🏋️‍♂️`;
          window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(text)}`, '_blank');
        }
      } else {
        toast.error(data.message || 'Failed to resume membership', { title: 'Resume Error' });
      }
    } catch (err) {
      toast.error('Network error resuming membership', { title: 'Server Error' });
    } finally {
      setResumeSubmitting(false);
    }
  };

  const handleDeleteMember = async (id, name) => {
    if (!confirm(`Are you sure you want to remove member ${name}? This will delete their records.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Member removed successfully', { title: 'Member Deleted' });
        fetchMembers();
      } else {
        toast.error(data.message || 'Error deleting member', { title: 'Delete Failed' });
      }
    } catch (err) {
      toast.error('Error deleting member', { title: 'Delete Failed' });
    }
  };

  const handleExportCsv = () => {
    window.open('/api/members/export/csv', '_blank');
  };

  return (
    <div>
      {/* Header */}
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
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{t('members_title', 'FeeOrbit Member Directory')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
            {t('members_subtitle', 'Complete digital registry replacing Excel sheets and physical notebooks')} ({currentGym?.name || 'Active Gym'}).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCsv} className="btn btn-secondary btn-sm">
            <Download size={15} /> {t('members_export_csv', 'Export CSV / Excel')}
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
            <UserPlus size={15} /> {t('members_btn_add', 'Add New Member')}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '8px 12px',
          marginBottom: '14px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder={t('members_search_placeholder', 'Search by name, Member ID, phone, or email...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', padding: '6px 10px 6px 32px', fontSize: '0.82rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'all', label: t('members_tab_all', 'All') },
              { id: 'active', label: t('members_tab_active', 'Active') },
              { id: 'frozen', label: t('members_tab_paused', '❄️ Paused') },
              { id: 'expired', label: t('members_tab_expired', 'Expired') },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  background: statusFilter === tab.id ? 'var(--brand-primary)' : 'transparent',
                  color: statusFilter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: statusFilter === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button onClick={fetchMembers} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="glass-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('th_member', 'Member')}</th>
                <th>{t('th_member_id', 'Member ID')}</th>
                <th>{t('th_contact', 'Contact')}</th>
                <th>{t('th_assigned_plan', 'Assigned Plan')}</th>
                <th>{t('th_valid_until', 'Valid Until')}</th>
                <th>{t('th_status', 'Status')}</th>
                <th style={{ textAlign: 'right' }}>{t('th_actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px' }}>
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px' }}>
                    No members match your criteria. Click "Add New Member" to register one.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const isFrozen = m.status === 'frozen' || m.isFrozen;
                  const isExp = !isFrozen && new Date(m.endDate) < new Date();
                  const diffDays = isFrozen
                    ? (m.frozenRemainingDays || 0)
                    : Math.ceil((new Date(m.endDate) - new Date()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={m._id} style={isFrozen ? { background: 'rgba(14, 165, 233, 0.04)' } : {}}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: isFrozen
                                ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                                : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.76rem',
                              boxShadow: isFrozen
                                ? '0 2px 6px rgba(14, 165, 233, 0.35)'
                                : '0 2px 6px rgba(99, 102, 241, 0.3)',
                              flexShrink: 0,
                            }}
                          >
                            {isFrozen ? <Snowflake size={14} /> : m.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                              {m.fullName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {m.gender} {m.bloodGroup ? `• ${m.bloodGroup}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            color: isFrozen ? '#38bdf8' : 'var(--brand-primary)',
                            fontWeight: 700,
                          }}
                        >
                          {m.memberId}
                        </span>
                      </td>

                      <td>
                        <div style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{m.phone}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{m.email || '—'}</div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--brand-cyan)' }}>
                          {m.plan?.name || 'General'}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatCurrency(m.plan?.price || 0)}
                        </div>
                      </td>

                      <td>
                        {isFrozen ? (
                          <div>
                            <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Snowflake size={12} /> Paused
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#93c5fd', fontWeight: 600 }}>
                              {m.frozenRemainingDays || 0} days safely held
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                              {new Date(m.endDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div style={{ fontSize: '0.75rem' }}>
                              {isExp ? (
                                <span style={{ color: 'var(--brand-red)' }}>Expired</span>
                              ) : diffDays <= 7 ? (
                                <span style={{ color: 'var(--brand-amber)', fontWeight: 600 }}>
                                  {diffDays} days left
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>{diffDays} days left</span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      <td>
                        {isFrozen ? (
                          <span className="badge badge-frozen" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Snowflake size={11} /> Paused ({m.frozenRemainingDays || 0}d)
                          </span>
                        ) : (
                          <span
                            className={`badge ${
                              isExp ? 'badge-expired' : diffDays <= 7 ? 'badge-warning' : 'badge-active'
                            }`}
                          >
                            {isExp ? 'Expired' : m.status}
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
                          {/* Pause / Resume Feature Trigger */}
                          {isFrozen ? (
                            <button
                              type="button"
                              onClick={() => setSelectedMemberForResume(m)}
                              className="btn btn-sm"
                              style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                border: '1px solid #10b981',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                padding: '4px 9px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                              }}
                              title="Resume / Unpause Membership"
                            >
                              <Play size={11} fill="#fff" /> Resume
                            </button>
                          ) : !isExp ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMemberForPause(m);
                                setPauseReasonPreset('Travel / Vacation');
                                setPauseCustomNote('');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{
                                borderColor: 'rgba(56, 189, 248, 0.45)',
                                color: '#38bdf8',
                                background: 'rgba(56, 189, 248, 0.08)',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                padding: '4px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title="Pause / Freeze Membership (Save Days)"
                            >
                              <Pause size={11} /> Pause
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => {
                              if (!m.phone) return toast.warning('Member phone number not available', { title: 'Missing Contact' });
                              const cleanPhone = m.phone.replace(/[^0-9]/g, '');
                              const gymName = currentGym?.name || 'FeeOrbit Gym';
                              let text = '';
                              if (isFrozen) {
                                text = `Hi ${m.fullName}, your gym membership at *${gymName}* is currently paused with *${m.frozenRemainingDays || 0} days safely saved*. Whenever you're ready to resume workouts, just let us know at reception! 💪`;
                              } else if (diffDays <= 7 || isExp) {
                                if (currentGym?.templates?.expiryAlert) {
                                  text = currentGym.templates.expiryAlert
                                    .replace(/\{memberName\}/g, m.fullName)
                                    .replace(/\{gymName\}/g, gymName)
                                    .replace(/\{planName\}/g, m.plan?.name || 'Membership')
                                    .replace(/\{daysLeft\}/g, String(Math.max(0, diffDays)))
                                    .replace(/\{expiryDate\}/g, new Date(m.endDate).toLocaleDateString('en-IN'));
                                } else {
                                  text = `Hi ${m.fullName}, your gym membership at *${gymName}* expires in ${Math.max(0, diffDays)} days. Please renew at the front desk to continue uninterrupted workouts! 💪`;
                                }
                              } else {
                                if (currentGym?.templates?.welcome) {
                                  text = currentGym.templates.welcome
                                    .replace(/\{memberName\}/g, m.fullName)
                                    .replace(/\{gymName\}/g, gymName)
                                    .replace(/\{planName\}/g, m.plan?.name || 'Membership');
                                } else {
                                  text = `Welcome to *${gymName}*, ${m.fullName}! Your membership is active. Let’s crush your fitness goals together! 🔥`;
                                }
                              }
                              window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#25d366', borderColor: 'rgba(37, 211, 102, 0.35)', padding: '4px 7px' }}
                            title="Send WhatsApp Template"
                          >
                            <MessageSquare size={13} />
                          </button>
                          <button
                            onClick={() => setSelectedMemberForPass(m)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 7px' }}
                            title="Digital Gym Pass"
                          >
                            <QrCode size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m._id, m.fullName)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 7px' }}
                            title="Delete Member"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add New Gym Member</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="modal-body">
                {formError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '16px',
                      fontSize: '0.85rem',
                    }}
                  >
                    {formError}
                  </div>
                )}

                <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Vikram Sharma"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-input"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="member@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Membership Plan *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.planId}
                      onChange={handlePlanChange}
                    >
                      {plans.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.durationMonths} Mo) - ₹{p.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Initial Payment Collection */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '8px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '10px' }}>
                    Fee Collection & Receipt
                  </div>

                  <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Amount Paid (₹) *</label>
                      <input
                        type="number"
                        className="form-input"
                        required
                        min="0"
                        value={formData.amountPaid}
                        onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Payment Mode</label>
                      <select
                        className="form-select"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      >
                        <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Debit / Credit Card</option>
                        <option value="Net Banking">Net Banking</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. O+, B+"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Locker</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. L-12 (Optional)"
                      value={formData.lockerNumber}
                      onChange={(e) => setFormData({ ...formData, lockerNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn btn-primary"
                >
                  {formSubmitting ? 'Registering...' : 'Register & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital QR Pass Modal */}
      {selectedMemberForPass && (
        <QRCodeModal
          member={selectedMemberForPass}
          onClose={() => setSelectedMemberForPass(null)}
        />
      )}

      {/* Generated Receipt Modal */}
      {generatedReceipt && (
        <ReceiptModal
          receipt={generatedReceipt}
          onClose={() => setGeneratedReceipt(null)}
        />
      )}

      {/* Membership Pause Modal */}
      {selectedMemberForPause && (
        <div className="modal-overlay" onClick={() => !pauseSubmitting && setSelectedMemberForPause(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px', background: '#0e1424', border: '1px solid rgba(56, 189, 248, 0.35)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Snowflake size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    Pause / Freeze Membership
                  </h2>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Preserve remaining days with zero loss
                  </div>
                </div>
              </div>
              <button
                onClick={() => !pauseSubmitting && setSelectedMemberForPause(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecutePause}>
              <div className="modal-body" style={{ padding: '20px' }}>
                {/* Member Preview Card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                      {selectedMemberForPause.fullName}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ID: <strong style={{ color: 'var(--brand-primary)', fontFamily: 'monospace' }}>{selectedMemberForPause.memberId}</strong> • Plan: {selectedMemberForPause.plan?.name || 'General'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Current End Date</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {new Date(selectedMemberForPause.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Preserved Days Highlight Card */}
                {(() => {
                  const preservedDays = Math.max(0, Math.ceil((new Date(selectedMemberForPause.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.14), rgba(30, 58, 138, 0.2))',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '18px',
                        boxShadow: '0 0 20px rgba(14, 165, 233, 0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: '1.15rem',
                              boxShadow: '0 0 12px rgba(14, 165, 233, 0.4)',
                            }}
                          >
                            {preservedDays}
                          </div>
                          <div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#e0f2fe' }}>
                              {preservedDays} Days Will Be Saved
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#bae6fd', marginTop: '2px' }}>
                              Locked safely in member account
                            </div>
                          </div>
                        </div>
                        <ShieldCheck size={26} style={{ color: '#38bdf8' }} />
                      </div>
                      <div style={{ marginTop: '10px', fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.72)', borderTop: '1px solid rgba(56, 189, 248, 0.2)', paddingTop: '8px' }}>
                        💡 When {selectedMemberForPause.fullName} returns to the gym, click <strong>"Resume"</strong> to add these {preservedDays} days starting from their return date.
                      </div>
                    </div>
                  );
                })()}

                {/* Pause Reason Presets */}
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '8px', fontSize: '0.8rem' }}>
                    Reason for Pause:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {[
                      { label: '✈️ Travel / Out of Town', val: 'Travel / Out of Town' },
                      { label: '🏥 Medical / Injury', val: 'Medical / Injury' },
                      { label: '📚 Exams / Studies', val: 'Exams / Studies' },
                      { label: '💼 Work / Relocation', val: 'Work / Relocation' },
                      { label: '🌴 Festival / Vacation', val: 'Festival / Vacation' },
                      { label: '✍️ Personal / Other', val: 'Personal / Other' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setPauseReasonPreset(item.val)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: pauseReasonPreset === item.val ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${pauseReasonPreset === item.val ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
                          color: pauseReasonPreset === item.val ? '#38bdf8' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Additional notes / comments (optional)..."
                    value={pauseCustomNote}
                    onChange={(e) => setPauseCustomNote(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '7px 10px' }}
                  />
                </div>

                {/* WhatsApp Confirmation Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(37, 211, 102, 0.08)',
                    border: '1px solid rgba(37, 211, 102, 0.25)',
                    marginTop: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} style={{ color: '#25d366' }} />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Send WhatsApp Confirmation
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Informs member that their days have been locked
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pauseSendWhatsApp}
                    onChange={(e) => setPauseSendWhatsApp(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#25d366' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={pauseSubmitting}
                  onClick={() => setSelectedMemberForPause(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pauseSubmitting}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    borderColor: '#0ea5e9',
                    color: '#fff',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)',
                  }}
                >
                  {pauseSubmitting ? 'Freezing Membership...' : '❄️ Confirm & Freeze Membership'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Membership Resume Modal */}
      {selectedMemberForResume && (
        <div className="modal-overlay" onClick={() => !resumeSubmitting && setSelectedMemberForResume(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px', background: '#0e1424', border: '1px solid rgba(16, 185, 129, 0.35)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Play size={16} fill="#fff" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    Resume / Continue Membership
                  </h2>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Reactivate membership and restore preserved days
                  </div>
                </div>
              </div>
              <button
                onClick={() => !resumeSubmitting && setSelectedMemberForResume(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecuteResume}>
              <div className="modal-body" style={{ padding: '20px' }}>
                {/* Member Preview Card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                      {selectedMemberForResume.fullName}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ID: <strong style={{ color: 'var(--brand-primary)', fontFamily: 'monospace' }}>{selectedMemberForResume.memberId}</strong> • Plan: {selectedMemberForResume.plan?.name || 'General'}
                    </div>
                  </div>
                  <span className="badge badge-frozen" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Snowflake size={11} /> Paused
                  </span>
                </div>

                {/* Days Restoration Calculation Card */}
                {(() => {
                  const preservedDays = selectedMemberForResume.frozenRemainingDays || 0;
                  const newExpiry = new Date();
                  newExpiry.setDate(newExpiry.getDate() + preservedDays);
                  const formattedNewExpiry = newExpiry.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedToday = new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(6, 182, 212, 0.14))',
                        border: '1px solid rgba(16, 185, 129, 0.45)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '18px',
                        boxShadow: '0 0 25px rgba(16, 185, 129, 0.12)',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 12px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Preserved Balance
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                            {preservedDays} Days
                          </div>
                        </div>
                        <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 12px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Resume Date
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                            {formattedToday}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          padding: '12px 14px',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ fontSize: '0.74rem', color: '#a7f3d0', fontWeight: 600 }}>
                          🎯 Calculated New Expiry Date:
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {formattedNewExpiry}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#a7f3d0', marginTop: '3px' }}>
                          ✅ Exactly {preservedDays} days added from today. Zero days lost!
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* WhatsApp Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(37, 211, 102, 0.08)',
                    border: '1px solid rgba(37, 211, 102, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} style={{ color: '#25d366' }} />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Send WhatsApp Welcome Back
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Sends extended expiry date to member
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={resumeSendWhatsApp}
                    onChange={(e) => setResumeSendWhatsApp(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#25d366' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={resumeSubmitting}
                  onClick={() => setSelectedMemberForResume(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resumeSubmitting}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderColor: '#10b981',
                    color: '#fff',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {resumeSubmitting ? 'Resuming Plan...' : '▶️ Unfreeze & Resume Plan Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
