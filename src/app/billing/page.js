'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Printer,
  Share2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Send,
  MessageSquare,
  Sparkles,
  Layers,
  X,
  Phone,
  Mail,
  Clock,
  History,
  Flame,
  RefreshCw,
  Check,
  ArrowUpDown,
  Filter,
  AlertTriangle,
  ExternalLink,
  User,
} from 'lucide-react';
import ReceiptModal from '../../components/ReceiptModal';
import { useGym } from '../../context/GymContext';
import { useLanguage } from '../../context/LanguageContext';

export default function BillingPage() {
  const { currentGym, formatCurrency } = useGym();
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [pendingDues, setPendingDues] = useState([]);
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dues'); // 'dues', 'history', 'plans'
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const q = searchQuery.toLowerCase().trim();
    return payments.filter(
      (p) =>
        p.receiptNumber?.toLowerCase().includes(q) ||
        p.memberName?.toLowerCase().includes(q) ||
        p.memberPhone?.includes(q) ||
        p.paymentMethod?.toLowerCase().includes(q) ||
        p.planName?.toLowerCase().includes(q) ||
        p.transactionId?.toLowerCase().includes(q)
    );
  }, [payments, searchQuery]);

  // Smart Dues & Multi-Channel Reminder States
  const [duesMeta, setDuesMeta] = useState({ totalOutstanding: 0, overdueCount: 0, dueTodayCount: 0, dueSoonCount: 0 });
  const [duesFilter, setDuesFilter] = useState('all'); // 'all' | 'overdue' | 'today' | 'soon'
  const [duesSearch, setDuesSearch] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success' | 'error' | 'info', title: string, message: string }
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [activeCallItem, setActiveCallItem] = useState(null);
  const [callStatus, setCallStatus] = useState('spoke');
  const [callNotes, setCallNotes] = useState('');
  const [savingCallLog, setSavingCallLog] = useState(false);
  const [activeHistoryItem, setActiveHistoryItem] = useState(null);
  const [reminderHistory, setReminderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const showToast = (type, message, title = '') => {
    setToast({ type, message, title });
    if (type === 'success' || type === 'info') {
      setTimeout(() => setToast((curr) => (curr?.message === message ? null : curr)), 5000);
    }
  };

  // Modals
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Collect Fee Form
  const [collectData, setCollectData] = useState({
    memberId: '',
    amountPaid: '',
    totalAmount: '',
    paymentMethod: 'UPI',
    transactionId: '',
    dueDate: '',
    remarks: '',
  });

  // New Plan Form
  const [planData, setPlanData] = useState({
    name: '',
    durationMonths: 1,
    price: '',
    description: '',
    features: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const gymQuery = currentGym?._id ? `?gymId=${currentGym._id}` : '';
      const [payRes, duesRes, planRes, memRes] = await Promise.all([
        fetch(`/api/payments${gymQuery}`),
        fetch(`/api/payments/dues/pending${gymQuery}`),
        fetch(`/api/plans${gymQuery}`),
        fetch(`/api/members${gymQuery}`),
      ]);

      const [payData, duesData, pData, mData] = await Promise.all([
        payRes.json(),
        duesRes.json(),
        planRes.json(),
        memRes.json(),
      ]);

      if (payData.success) setPayments(payData.data);
      if (duesData.success) {
        setPendingDues(duesData.data || []);
        setDuesMeta({
          totalOutstanding: duesData.totalOutstanding || 0,
          overdueCount: duesData.overdueCount || 0,
          dueTodayCount: duesData.dueTodayCount || 0,
          dueSoonCount: duesData.dueSoonCount || 0,
        });
      }
      if (pData.success) setPlans(pData.data);
      if (mData.success) {
        setMembers(mData.data);
        if (mData.data.length > 0) {
          setCollectData((prev) => ({
            ...prev,
            memberId: mData.data[0]._id,
          }));
        } else {
          setCollectData((prev) => ({
            ...prev,
            memberId: '',
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 15000);
    const handlePayment = () => fetchData();
    window.addEventListener('feeorbit-payment-received', handlePayment);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'history') {
        setActiveTab('history');
      }
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('feeorbit-payment-received', handlePayment);
    };
  }, [currentGym]);

  const handleMemberSelectInPayment = (mId) => {
    const mem = members.find((m) => m._id === mId);
    setCollectData((prev) => ({
      ...prev,
      memberId: mId,
      totalAmount: mem?.plan?.price || '',
      amountPaid: mem?.plan?.price || '',
    }));
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...collectData,
          gymId: currentGym?._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCollectModal(false);
        fetchData();
        setSelectedReceipt(data.data);
        window.dispatchEvent(new CustomEvent('feeorbit-payment-received', { detail: data.data }));
        showToast('success', 'Payment recorded successfully!', 'Payment Received');
      } else {
        showToast('error', data.message || 'Error recording payment', 'Payment Error');
      }
    } catch (err) {
      showToast('error', 'Failed to connect to server', 'Network Error');
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...planData,
        durationMonths: Number(planData.durationMonths),
        price: Number(planData.price),
        features: planData.features.split(',').map((f) => f.trim()).filter(Boolean),
        gym: currentGym?._id,
      };

      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowPlanModal(false);
        fetchData();
        showToast('success', 'Membership plan created successfully!', 'Plan Created');
        setPlanData({
          name: '',
          durationMonths: 1,
          price: '',
          description: '',
          features: '',
        });
      } else {
        showToast('error', data.message || 'Error creating plan', 'Plan Error');
      }
    } catch (err) {
      showToast('error', 'Failed to create plan', 'Plan Error');
    }
  };

  const handleSendWhatsApp = async (item) => {
    const phone = item.memberPhone || item.member?.phone;
    if (!phone) {
      showToast('error', 'Member does not have a registered phone number.', 'No Phone');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const dueAmt = item.dueAmount;
    const gymName = currentGym?.name || 'FeeOrbit Gym';
    const currencySym = currentGym?.currency?.symbol || '₹';

    let text = '';
    if (currentGym?.templates?.dueReminder) {
      text = currentGym.templates.dueReminder
        .replace(/\{memberName\}/g, item.memberName)
        .replace(/\{amount\}/g, dueAmt.toLocaleString('en-IN'))
        .replace(/\{currency\}/g, currencySym)
        .replace(/\{planName\}/g, item.planName || 'Gym Plan')
        .replace(/\{gymName\}/g, gymName)
        .replace(/\{dueDate\}/g, item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN') : 'Immediate');
    } else {
      text = `Hello ${item.memberName},\nThis is a friendly reminder from *${gymName}* that an outstanding balance of *${currencySym}${dueAmt.toLocaleString('en-IN')}* is due for your *${item.planName || 'Gym Membership'}*.\nKindly clear your pending balance at the reception desk or via UPI.\nThank you! 💪`;
    }

    if (currentGym?.upiId) {
      text += `\n\n💳 Direct UPI Pay: ${currentGym.upiId}`;
    }

    const msg = encodeURIComponent(text);
    window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${msg}`, '_blank');

    // Optimistically update & log reminder in background
    try {
      await fetch('/api/payments/dues/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: item._id,
          channel: 'whatsapp',
          notes: 'WhatsApp reminder message dispatched with direct UPI link',
        }),
      });

      setPendingDues((prev) =>
        prev.map((d) =>
          d._id === item._id
            ? {
                ...d,
                reminderCount: (d.reminderCount || 0) + 1,
                lastReminderChannel: 'whatsapp',
                lastReminderSentAt: new Date().toISOString(),
              }
            : d
        )
      );

      showToast('success', `WhatsApp reminder recorded for ${item.memberName}.`, 'Reminder Dispatched! 💬');
    } catch (e) {
      console.error('Failed to log WhatsApp reminder:', e);
    }
  };

  const handleSendEmail = async (item) => {
    const email = item.member?.email || item.memberEmail;
    if (!email) {
      showToast('error', `${item.memberName} does not have an email address on file.`, 'No Email Address');
      return;
    }

    setSendingEmailId(item._id);
    try {
      const res = await fetch('/api/payments/dues/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: item._id,
          channel: 'email',
          notes: 'Official fee reminder notice emailed',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingDues((prev) =>
          prev.map((d) =>
            d._id === item._id
              ? {
                  ...d,
                  reminderCount: (d.reminderCount || 0) + 1,
                  lastReminderChannel: 'email',
                  lastReminderSentAt: new Date().toISOString(),
                }
              : d
          )
        );
        showToast('success', `Branded reminder email sent to ${email}.`, 'Email Dispatched! ✉️');
      } else {
        showToast('error', data.message || 'Failed to send email reminder.', 'Email Failed');
      }
    } catch (e) {
      showToast('error', 'Network error connecting to email service.', 'Email Error');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleStartCall = (item) => {
    const phone = item.memberPhone || item.member?.phone;
    if (!phone) {
      showToast('error', 'Member does not have a phone number.', 'No Phone Number');
      return;
    }
    setActiveCallItem(item);
    setCallStatus('spoke');
    setCallNotes('');
    window.location.href = `tel:${phone}`;
  };

  const handleSaveCallLog = async () => {
    if (!activeCallItem) return;
    setSavingCallLog(true);

    const statusLabels = {
      spoke: 'Spoke to Member (Promised Payment)',
      no_answer: 'Call Not Answered / Busy',
      switched_off: 'Phone Switched Off / Unreachable',
      callback: 'Member Requested Callback',
    };

    const formattedNote = `${statusLabels[callStatus] || 'Call logged'}${callNotes.trim() ? ` — "${callNotes.trim()}"` : ''}`;

    try {
      const res = await fetch('/api/payments/dues/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: activeCallItem._id,
          channel: 'call',
          notes: formattedNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingDues((prev) =>
          prev.map((d) =>
            d._id === activeCallItem._id
              ? {
                  ...d,
                  reminderCount: (d.reminderCount || 0) + 1,
                  lastReminderChannel: 'call',
                  lastReminderSentAt: new Date().toISOString(),
                }
              : d
          )
        );
        showToast('success', `Call record saved for ${activeCallItem.memberName}.`, 'Call Logged! 📞');
        setActiveCallItem(null);
      } else {
        showToast('error', data.message || 'Failed to save call log.', 'Error');
      }
    } catch (e) {
      showToast('error', 'Network error saving call log.', 'Error');
    } finally {
      setSavingCallLog(false);
    }
  };

  const handleOpenHistory = async (item) => {
    setActiveHistoryItem(item);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/payments/${item._id}/reminders`);
      const data = await res.json();
      if (data.success) {
        setReminderHistory(data.data || []);
      } else {
        setReminderHistory([]);
      }
    } catch (e) {
      setReminderHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const totalOutstanding = pendingDues.reduce((acc, curr) => acc + curr.dueAmount, 0);
  const overdueAmount = pendingDues.filter((d) => d.urgency === 'overdue').reduce((acc, c) => acc + c.dueAmount, 0);
  const dueTodayAmount = pendingDues.filter((d) => d.urgency === 'due_today').reduce((acc, c) => acc + c.dueAmount, 0);
  const dueSoonAmount = pendingDues.filter((d) => d.urgency === 'due_soon').reduce((acc, c) => acc + c.dueAmount, 0);

  const filteredDues = pendingDues.filter((item) => {
    if (duesSearch.trim()) {
      const q = duesSearch.toLowerCase();
      const matchName = item.memberName?.toLowerCase().includes(q);
      const matchPhone = (item.memberPhone || item.member?.phone || '').includes(q);
      const matchReceipt = (item.receiptNumber || '').toLowerCase().includes(q);
      const matchPlan = (item.planName || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchReceipt && !matchPlan) return false;
    }

    if (duesFilter === 'overdue') return item.urgency === 'overdue';
    if (duesFilter === 'today') return item.urgency === 'due_today';
    if (duesFilter === 'soon') return item.urgency === 'due_soon';
    return true;
  });

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
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>{t('billing_title', 'FeeOrbit Billing & Invoices')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px', margin: '3px 0 0 0' }}>
            {t('billing_subtitle', 'Automated dues tracking, smart reminders, and printable tax receipts')} ({currentGym?.name || 'your gym'}).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowPlanModal(true)} className="btn btn-secondary btn-sm">
            <Layers size={15} /> {t('billing_btn_manage_plans', 'Manage Plans')}
          </button>
          <button onClick={() => setShowCollectModal(true)} className="btn btn-primary btn-sm">
            <CreditCard size={15} /> {t('billing_btn_collect', 'Collect Fee / Payment')}
          </button>
        </div>
      </div>

      {/* Dues Alert Banner (Only shown when browsing OTHER tabs to notify admin of pending dues) */}
      {totalOutstanding > 0 && activeTab !== 'dues' && (
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.07) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.28)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '14px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 20px -2px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.15))',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-amber)',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.25)',
              }}
            >
              <AlertCircle size={19} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Total Pending Dues:</span>
                <span style={{ color: 'var(--brand-amber)', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>
                  {formatCurrency(totalOutstanding)}
                </span>
                <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  {pendingDues.length} Outstanding
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Instant 1-click WhatsApp payment reminders with dynamic UPI links.
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('dues')}
            style={{
              borderColor: 'rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.08)',
              color: 'var(--text-primary)',
              fontWeight: 600,
            }}
          >
            Review Pending Dues &rarr;
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'inline-flex',
          gap: '6px',
          background: 'var(--bg-card-solid)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: '16px',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
        }}
      >
        <button
          onClick={() => setActiveTab('dues')}
          className={`btn ${activeTab === 'dues' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          <span>{t('billing_tab_dues', 'Pending Dues')}</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 800,
              background: activeTab === 'dues' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(239, 68, 68, 0.15)',
              color: activeTab === 'dues' ? '#ffffff' : '#ef4444',
            }}
          >
            {pendingDues.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          <span>{t('billing_tab_history', 'Payment Transactions')}</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 800,
              background: activeTab === 'history' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-card)',
              color: activeTab === 'history' ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            {payments.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`btn ${activeTab === 'plans' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          <span>{t('billing_tab_plans', 'Membership Plans')}</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 800,
              background: activeTab === 'plans' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-card)',
              color: activeTab === 'plans' ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            {plans.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PENDING DUES (SMART DUES & REMINDER HUB) */}
      {activeTab === 'dues' && (
        <div className="glass-card" style={{ padding: '22px' }}>
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                  {t('billing_dues_hub', 'Smart Dues & Collections Hub')}
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: 'var(--brand-primary)',
                  }}
                >
                  ⚡ Auto-Prioritized: Closest Due First
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
                {t('billing_dues_hub_sub', 'Track impending fee deadlines and dispatch instant 1-click reminders across WhatsApp, Email, and Phone.')}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={fetchData}
                className="btn btn-secondary btn-sm"
                title="Refresh Dues Data"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>{t('billing_btn_refresh', 'Refresh')}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCollectModal(true)}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                <span>{t('billing_btn_collect_fee', 'Collect Fee')}</span>
              </button>
            </div>
          </div>

          {/* 4 Interactive KPI Summary Cards (Filter on Click) */}
          <div
            className="kpi-card-grid responsive-kpi-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {/* Card 1: All Dues */}
            <div
              onClick={() => setDuesFilter('all')}
              style={{
                cursor: 'pointer',
                padding: '14px 16px',
                borderRadius: '12px',
                background: duesFilter === 'all'
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(79, 70, 229, 0.12) 100%)'
                  : 'var(--bg-card)',
                border: duesFilter === 'all'
                  ? '1.5px solid var(--brand-primary)'
                  : '1px solid var(--border-subtle)',
                boxShadow: duesFilter === 'all'
                  ? '0 0 20px -3px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: duesFilter === 'all' ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                  {t('billing_total_dues', 'Total Pending Dues')}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: duesFilter === 'all' ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                }}>
                  {pendingDues.length}
                </span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(totalOutstanding)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {pendingDues.length} members with balances
              </div>
              {duesFilter === 'all' && (
                <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '2px', background: 'var(--brand-primary)', borderRadius: '2px' }} />
              )}
            </div>

            {/* Card 2: Overdue */}
            <div
              onClick={() => setDuesFilter('overdue')}
              style={{
                cursor: 'pointer',
                padding: '14px 16px',
                borderRadius: '12px',
                background: duesFilter === 'overdue'
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(185, 28, 28, 0.12) 100%)'
                  : 'var(--bg-card)',
                border: duesFilter === 'overdue'
                  ? '1.5px solid #ef4444'
                  : '1px solid var(--border-subtle)',
                boxShadow: duesFilter === 'overdue'
                  ? '0 0 20px -3px rgba(239, 68, 68, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flame size={13} style={{ color: '#ef4444' }} /> {t('billing_overdue', 'Overdue')}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: '#ef4444',
                  color: '#ffffff',
                }}>
                  {duesMeta.overdueCount}
                </span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(overdueAmount)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '4px' }}>
                {duesMeta.overdueCount} {duesMeta.overdueCount === 1 ? 'member' : 'members'} past deadline
              </div>
              {duesFilter === 'overdue' && (
                <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '2px', background: '#ef4444', borderRadius: '2px' }} />
              )}
            </div>

            {/* Card 3: Due Today */}
            <div
              onClick={() => setDuesFilter('today')}
              style={{
                cursor: 'pointer',
                padding: '14px 16px',
                borderRadius: '12px',
                background: duesFilter === 'today'
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(180, 83, 9, 0.12) 100%)'
                  : 'var(--bg-card)',
                border: duesFilter === 'today'
                  ? '1.5px solid #f59e0b'
                  : '1px solid var(--border-subtle)',
                boxShadow: duesFilter === 'today'
                  ? '0 0 20px -3px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} style={{ color: '#f59e0b' }} /> {t('billing_due_today', 'Due Today')}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: '#f59e0b',
                  color: '#000000',
                }}>
                  {duesMeta.dueTodayCount}
                </span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(dueTodayAmount)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '4px' }}>
                {duesMeta.dueTodayCount} {duesMeta.dueTodayCount === 1 ? 'member' : 'members'} expiring today
              </div>
              {duesFilter === 'today' && (
                <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '2px', background: '#f59e0b', borderRadius: '2px' }} />
              )}
            </div>

            {/* Card 4: Due in 7 Days */}
            <div
              onClick={() => setDuesFilter('soon')}
              style={{
                cursor: 'pointer',
                padding: '14px 16px',
                borderRadius: '12px',
                background: duesFilter === 'soon'
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(14, 116, 144, 0.12) 100%)'
                  : 'var(--bg-card)',
                border: duesFilter === 'soon'
                  ? '1.5px solid #06b6d4'
                  : '1px solid var(--border-subtle)',
                boxShadow: duesFilter === 'soon'
                  ? '0 0 20px -3px rgba(6, 182, 212, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} style={{ color: '#06b6d4' }} /> {t('billing_due_soon', 'Due in 7 Days')}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: '#06b6d4',
                  color: '#ffffff',
                }}>
                  {duesMeta.dueSoonCount}
                </span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(dueSoonAmount)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '4px' }}>
                {duesMeta.dueSoonCount} {duesMeta.dueSoonCount === 1 ? 'member' : 'members'} upcoming
              </div>
              {duesFilter === 'soon' && (
                <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '2px', background: '#06b6d4', borderRadius: '2px' }} />
              )}
            </div>
          </div>

          {/* Toolbar: Search & Filter Status */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '10px 14px',
              background: 'var(--bg-card, rgba(15, 23, 42, 0.45))',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('billing_search_dues', 'Search member name, phone, plan or receipt...')}
                value={duesSearch}
                onChange={(e) => setDuesSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 34px',
                  background: 'var(--bg-input, #ffffff)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              {duesSearch && (
                <button
                  type="button"
                  onClick={() => setDuesSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter status & quick reset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                {t('billing_showing_dues', 'Showing pending dues')} <strong style={{ color: 'var(--text-primary)' }}>{filteredDues.length}</strong> {t('billing_of', 'of')} {pendingDues.length}
              </span>
              {duesFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setDuesFilter('all')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Clear Filter ✕
                </button>
              )}
            </div>
          </div>

          {/* Consolidated 5-Column Data Table: No Horizontal Scroll, No Text Cut-Off */}
          <div className="table-container" style={{ borderRadius: '10px', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
            <table className="data-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '27%', padding: '12px 14px' }}>{t('th_member', 'Member')} &amp; {t('billing_tab_plans', 'Plan')}</th>
                  <th style={{ width: '17%', padding: '12px 14px' }}>{t('billing_th_due_amount', 'Pending Amount')}</th>
                  <th style={{ width: '15%', padding: '12px 14px' }}>{t('billing_th_due_date', 'Due Date & Status')}</th>
                  <th style={{ width: '17%', padding: '12px 14px' }}>{t('billing_th_last_reminder', 'Last Reminder')}</th>
                  <th style={{ width: '24%', padding: '12px 16px', textAlign: 'right' }}>{t('billing_th_quick_actions', 'Quick Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDues.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '48px 20px' }}>
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px auto',
                          color: '#10b981',
                        }}
                      >
                        <CheckCircle2 size={26} />
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {pendingDues.length === 0
                          ? 'All gym members are fully paid!'
                          : `No dues found under "${duesFilter === 'overdue' ? 'Overdue' : duesFilter === 'today' ? 'Due Today' : duesFilter === 'soon' ? 'Due in 7 Days' : 'Search'}"`}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 14px auto' }}>
                        {pendingDues.length === 0
                          ? 'There are currently zero pending fee balances. Keep up the great collections!'
                          : 'Try resetting your search query or switching to another category.'}
                      </p>
                      {duesFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setDuesFilter('all')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.74rem' }}
                        >
                          View All Dues ({pendingDues.length})
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDues.map((item) => {
                    const totalAmt = item.totalAmount || item.plan?.price || 1;
                    const paidAmt = item.amountPaid || 0;
                    const pctPaid = Math.min(100, Math.max(0, Math.round((paidAmt / totalAmt) * 100)));

                    return (
                      <tr
                        key={item._id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background:
                            item.urgency === 'overdue'
                              ? 'rgba(239, 68, 68, 0.035)'
                              : item.urgency === 'due_today'
                              ? 'rgba(245, 158, 11, 0.035)'
                              : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* 1. Member & Plan */}
                        <td style={{ verticalAlign: 'middle', padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Member Avatar */}
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background:
                                  item.urgency === 'overdue'
                                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.35))'
                                    : item.urgency === 'due_today'
                                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(180, 83, 9, 0.35))'
                                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(59, 130, 246, 0.3))',
                                border:
                                  item.urgency === 'overdue'
                                    ? '1.5px solid rgba(239, 68, 68, 0.6)'
                                    : item.urgency === 'due_today'
                                    ? '1.5px solid rgba(245, 158, 11, 0.6)'
                                    : '1.5px solid rgba(99, 102, 241, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                fontSize: '0.84rem',
                                fontWeight: 800,
                                color: item.urgency === 'overdue' ? '#fca5a5' : item.urgency === 'due_today' ? '#fde68a' : '#c7d2fe',
                                flexShrink: 0,
                              }}
                            >
                              {item.member?.photoUrl ? (
                                <img src={item.member.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                item.memberName?.charAt(0)?.toUpperCase() || 'M'
                              )}
                            </div>

                            {/* Details */}
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.90rem' }}>
                                  {item.memberName}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 600,
                                    color: '#94a3b8',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  #{item.receiptNumber}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '3px' }}>
                                <span
                                  style={{
                                    fontSize: '0.70rem',
                                    fontWeight: 600,
                                    color: '#38bdf8',
                                    background: 'rgba(56, 189, 248, 0.1)',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {item.planName || item.plan?.name || 'General Membership'}
                                </span>
                                <a
                                  href={`tel:${item.memberPhone || item.member?.phone}`}
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                  title="Click to call"
                                >
                                  📞 {item.memberPhone || item.member?.phone || 'No phone'}
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Outstanding Balance */}
                        <td style={{ verticalAlign: 'middle', padding: '12px 14px' }}>
                          <div>
                            <div
                              style={{
                                fontSize: '1.15rem',
                                fontWeight: 800,
                                color: item.urgency === 'overdue' ? '#f87171' : item.urgency === 'due_today' ? '#fbbf24' : '#ffffff',
                                fontFamily: 'var(--font-heading)',
                                letterSpacing: '-0.01em',
                                lineHeight: 1.1,
                              }}
                            >
                              {formatCurrency(item.dueAmount)}
                            </div>

                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Paid: <span style={{ color: '#34d399', fontWeight: 600 }}>{formatCurrency(paidAmt)}</span> of {formatCurrency(totalAmt)}
                            </div>

                            {/* Mini Progress Bar */}
                            <div
                              style={{
                                width: '100%',
                                maxWidth: '130px',
                                height: '4px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: '2px',
                                overflow: 'hidden',
                                marginTop: '4px',
                              }}
                            >
                              <div
                                style={{
                                  width: `${pctPaid}%`,
                                  height: '100%',
                                  background: '#10b981',
                                  borderRadius: '2px',
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 3. Due Date & Status */}
                        <td style={{ verticalAlign: 'middle', padding: '12px 14px' }}>
                          <div>
                            <div>
                              {item.urgency === 'overdue' ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.70rem',
                                    fontWeight: 800,
                                    color: '#f87171',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <Flame size={12} /> {item.urgencyLabel}
                                </span>
                              ) : item.urgency === 'due_today' ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.70rem',
                                    fontWeight: 800,
                                    color: '#fbbf24',
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    border: '1px solid rgba(245, 158, 11, 0.35)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <Clock size={12} /> Due Today
                                </span>
                              ) : item.urgency === 'due_soon' ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.70rem',
                                    fontWeight: 700,
                                    color: '#38bdf8',
                                    background: 'rgba(6, 182, 212, 0.12)',
                                    border: '1px solid rgba(6, 182, 212, 0.3)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <Clock size={12} /> {item.urgencyLabel}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.70rem',
                                    fontWeight: 600,
                                    color: '#94a3b8',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {item.urgencyLabel}
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: '#cbd5e1',
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Calendar size={12} style={{ color: '#64748b' }} />
                              <span>
                                {item.dueDate
                                  ? new Date(item.dueDate).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : 'Immediate'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Last Reminder */}
                        <td style={{ verticalAlign: 'middle', padding: '12px 14px' }}>
                          <div>
                            {item.lastReminderSentAt ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                                  {item.lastReminderChannel === 'whatsapp' ? (
                                    <MessageSquare size={13} style={{ color: '#25D366', flexShrink: 0 }} />
                                  ) : item.lastReminderChannel === 'email' ? (
                                    <Mail size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
                                  ) : (
                                    <Phone size={13} style={{ color: '#fbbf24', flexShrink: 0 }} />
                                  )}
                                  <span style={{ textTransform: 'capitalize', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                    {item.lastReminderChannel}
                                  </span>
                                  <span style={{ color: '#64748b', fontSize: '0.70rem', whiteSpace: 'nowrap' }}>
                                    • {new Date(item.lastReminderSentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', whiteSpace: 'nowrap' }}>
                                  <span
                                    style={{
                                      fontSize: '0.64rem',
                                      color: '#94a3b8',
                                      background: 'rgba(255, 255, 255, 0.06)',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {item.reminderCount || 1} sent
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenHistory(item)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#a78bfa',
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      padding: 0,
                                      textDecoration: 'underline',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    History ↗
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                                No reminder sent yet
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Quick Actions */}
                        <td style={{ verticalAlign: 'middle', padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', width: '100%' }}>
                            {/* 🟢 WhatsApp Icon Button */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(item)}
                              title={`Send WhatsApp payment reminder to ${item.memberName}`}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                border: '1px solid rgba(37, 211, 102, 0.4)',
                                background: 'rgba(37, 211, 102, 0.12)',
                                color: '#25D366',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                              }}
                            >
                              <MessageSquare size={13} />
                            </button>

                            {/* ✉️ Email Icon Button */}
                            <button
                              type="button"
                              disabled={sendingEmailId === item._id}
                              onClick={() => handleSendEmail(item)}
                              title={`Send official reminder notice via Email to ${item.memberName}`}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                border: '1px solid rgba(56, 189, 248, 0.4)',
                                background: 'rgba(56, 189, 248, 0.12)',
                                color: '#38bdf8',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: sendingEmailId === item._id ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                              }}
                            >
                              {sendingEmailId === item._id ? (
                                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                              ) : (
                                <Mail size={13} />
                              )}
                            </button>

                            {/* 📞 Call Icon Button */}
                            <button
                              type="button"
                              onClick={() => handleStartCall(item)}
                              title={`Call ${item.memberName} & record commitment notes`}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                background: 'rgba(245, 158, 11, 0.12)',
                                color: '#fbbf24',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                              }}
                            >
                              <Phone size={13} />
                            </button>

                            {/* 💳 Clear Due Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setCollectData({
                                  memberId: item.member?._id || item.member,
                                  totalAmount: item.dueAmount,
                                  amountPaid: item.dueAmount,
                                  paymentMethod: 'UPI',
                                  transactionId: '',
                                  dueDate: '',
                                  remarks: `Balance clearance for ${item.receiptNumber}`,
                                });
                                setShowCollectModal(true);
                              }}
                              className="btn btn-primary btn-sm"
                              title="Collect payment & clear outstanding balance"
                              style={{
                                padding: '5px 10px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                borderRadius: '8px',
                                flexShrink: 0,
                              }}
                            >
                              <CreditCard size={12} />
                              <span>Clear Due</span>
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
      )}

      {/* TAB 2: PAYMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="glass-card">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Fee Transaction Ledger
                </h2>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.18)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    textTransform: 'uppercase',
                  }}
                >
                  ⚡ Live Inflows ({filteredPayments.length})
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Complete real-time record of all cash, UPI, card, and online payments received.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search
                  size={13}
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
                  placeholder="Search receipt, member, mode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    borderRadius: '8px',
                    background: 'var(--bg-card-solid)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.76rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={fetchData}
                className="btn btn-secondary btn-sm"
                title="Refresh Ledger"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date & Time</th>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Mode</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      {searchQuery ? 'No payment transactions matched your search.' : 'No payment transactions recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isRecent = Date.now() - new Date(p.paymentDate).getTime() < 1000 * 60 * 30;
                    return (
                      <tr
                        key={p._id}
                        style={{
                          background: isRecent ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontFamily: 'monospace', color: 'var(--brand-primary)', fontWeight: 800 }}>
                              {p.receiptNumber}
                            </span>
                            {isRecent && (
                              <span
                                style={{
                                  fontSize: '0.58rem',
                                  fontWeight: 800,
                                  background: 'rgba(16, 185, 129, 0.25)',
                                  border: '1px solid rgba(16, 185, 129, 0.45)',
                                  color: '#34d399',
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
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {new Date(p.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: 'var(--brand-primary)',
                                flexShrink: 0,
                              }}
                            >
                              {p.memberName?.charAt(0)?.toUpperCase() || 'M'}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                              {p.memberName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>
                            {p.planName}
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
                              style={{ width: 'fit-content' }}
                            >
                              {p.transactionId?.startsWith('pay_')
                                ? 'Razorpay'
                                : p.paymentMethod === 'UPI' && p.transactionId
                                ? '⚡ Direct UPI'
                                : p.paymentMethod || 'UPI'}
                            </span>
                            {p.transactionId && (
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                {p.transactionId.startsWith('pay_')
                                  ? p.transactionId.slice(0, 12) + '…'
                                  : `UTR: ${p.transactionId}`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--brand-emerald)' }}>
                          ₹{p.amountPaid.toLocaleString('en-IN')}
                        </td>
                        <td>
                          {p.dueAmount > 0 ? (
                            <span style={{ color: 'var(--brand-red)', fontWeight: 600 }}>
                              ₹{p.dueAmount.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <span className={`badge ${p.status === 'paid' ? 'badge-active' : 'badge-warning'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="btn btn-secondary btn-sm"
                            title="View Printable Receipt"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Printer size={13} />
                            <span>Receipt</span>
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
      )}

      {/* TAB 3: MEMBERSHIP PLANS */}
      {activeTab === 'plans' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {plans.map((p) => (
              <div key={p._id} className="glass-card glass-card-interactive">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {p.name}
                    </h3>
                    <span className="badge badge-info" style={{ marginTop: '6px' }}>
                      {p.durationMonths} {p.durationMonths === 1 ? 'Month' : 'Months'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-primary)', lineHeight: 1 }}>
                      ₹{p.price.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {p.description || 'Full gym facility access package.'}
                </p>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Included Features:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {p.features?.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collect Fee Modal */}
      {showCollectModal && (
        <div className="modal-overlay" onClick={() => setShowCollectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Record Fee Payment</h2>
              <button
                onClick={() => setShowCollectModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Member *</label>
                  <select
                    className="form-select"
                    required
                    value={collectData.memberId}
                    onChange={(e) => handleMemberSelectInPayment(e.target.value)}
                  >
                    {members.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.fullName} ({m.memberId}) - {m.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Total Fee Amount (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="0"
                      value={collectData.totalAmount}
                      onChange={(e) => setCollectData({ ...collectData, totalAmount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount Paid Now (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="0"
                      value={collectData.amountPaid}
                      onChange={(e) => setCollectData({ ...collectData, amountPaid: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Payment Mode</label>
                    <select
                      className="form-select"
                      value={collectData.paymentMethod}
                      onChange={(e) => setCollectData({ ...collectData, paymentMethod: e.target.value })}
                    >
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Balance Due Date (if partial)</label>
                    <input
                      type="date"
                      className="form-input"
                      value={collectData.dueDate}
                      onChange={(e) => setCollectData({ ...collectData, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Transaction / UPI Reference (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. UPI-129482103"
                    value={collectData.transactionId}
                    onChange={(e) => setCollectData({ ...collectData, transactionId: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Note</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Paid in full for renewal"
                    value={collectData.remarks}
                    onChange={(e) => setCollectData({ ...collectData, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCollectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create New Membership Plan</h2>
              <button
                onClick={() => setShowPlanModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Plan Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Couples Fitness Package"
                    value={planData.name}
                    onChange={(e) => setPlanData({ ...planData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Duration (Months) *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="1"
                      value={planData.durationMonths}
                      onChange={(e) => setPlanData({ ...planData, durationMonths: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="0"
                      placeholder="e.g. 4500"
                      value={planData.price}
                      onChange={(e) => setPlanData({ ...planData, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Short description of this plan"
                    value={planData.description}
                    onChange={(e) => setPlanData({ ...planData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Features (comma separated)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Gym Floor, Steam Bath, Personal Locker, Free Shaker"
                    value={planData.features}
                    onChange={(e) => setPlanData({ ...planData, features: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Call Log & Notes Modal */}
      {activeCallItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '22px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                  }}
                >
                  <Phone size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Log Call with {activeCallItem.memberName}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Phone: {activeCallItem.memberPhone || activeCallItem.member?.phone} • Due: {formatCurrency(activeCallItem.dueAmount)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCallItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Call Outcome Status */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                Call Outcome / Member Response *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'spoke', label: '🤝 Spoke & Promised Pay' },
                  { id: 'no_answer', label: '📵 No Answer / Busy' },
                  { id: 'switched_off', label: '📴 Switched Off' },
                  { id: 'callback', label: '🔄 Requested Callback' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCallStatus(opt.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: callStatus === opt.id ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: callStatus === opt.id ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: callStatus === opt.id ? '#fde68a' : '#cbd5e1',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Call Notes Input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                Admin Notes / Commitment Details
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Member promised to pay ₹1000 via Google Pay by 7 PM today..."
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#090e1a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveCallItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingCallLog}
                onClick={handleSaveCallLog}
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none' }}
              >
                {savingCallLog ? (
                  <>
                    <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Save Call Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder History Modal */}
      {activeHistoryItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '22px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                  }}
                >
                  <History size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Reminder History
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {activeHistoryItem.memberName} • Due: {formatCurrency(activeHistoryItem.dueAmount)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveHistoryItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* History Timeline */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', marginBottom: '14px' }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '0.8rem' }}>Loading reminder history...</div>
                </div>
              ) : reminderHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  <History size={28} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>No reminders sent yet for this due.</div>
                  <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>Use WhatsApp, Email, or Call to dispatch a reminder.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reminderHistory.map((rem, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background:
                            rem.channel === 'whatsapp'
                              ? 'rgba(37, 211, 102, 0.15)'
                              : rem.channel === 'email'
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color:
                            rem.channel === 'whatsapp'
                              ? '#25D366'
                              : rem.channel === 'email'
                              ? '#38bdf8'
                              : '#f59e0b',
                          flexShrink: 0,
                        }}
                      >
                        {rem.channel === 'whatsapp' ? (
                          <MessageSquare size={14} />
                        ) : rem.channel === 'email' ? (
                          <Mail size={14} />
                        ) : (
                          <Phone size={14} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
                            {rem.channel} Reminder
                          </span>
                          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                            {new Date(rem.sentAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                          {rem.notes || 'Reminder recorded'}
                        </div>
                        {rem.sentBy && (
                          <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '3px' }}>
                            By: {rem.sentBy}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveHistoryItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '12px',
            background:
              toast.type === 'error'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95))'
                : toast.type === 'info'
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95))'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '380px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            {toast.title && <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{toast.title}</div>}
            <div style={{ fontSize: '0.74rem', opacity: 0.95 }}>{toast.message}</div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
