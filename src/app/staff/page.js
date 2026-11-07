'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useGym } from '../../context/GymContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  UserCog,
  UserPlus,
  Users,
  DollarSign,
  Clock,
  Phone,
  Mail,
  Shield,
  Trash2,
  X,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Key,
  Building2,
  Calendar,
  CalendarDays,
  FileText,
  Printer,
  Sparkles,
  Search,
  Check,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Send,
  RefreshCw,
  Plus,
  ChevronRight,
} from 'lucide-react';

export default function StaffPage() {
  const { currentGym, formatCurrency } = useGym();
  const { t } = useLanguage();

  // Active Tab: 'directory' | 'leaves' | 'attendance' | 'payroll'
  const [activeTab, setActiveTab] = useState('directory');

  // Staff Directory state
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [invitedCredentials, setInvitedCredentials] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Trainer',
    phone: '',
    email: '',
    specialization: 'General Fitness',
    salary: '',
    shift: 'Morning (6:00 AM - 2:00 PM)',
    paidLeavesPerMonth: 2,
    accountName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Leaves & Chutti Approvals state
  const [leaves, setLeaves] = useState([]);
  const [leaveMetrics, setLeaveMetrics] = useState({ pendingCount: 0, approvedCount: 0, rejectedCount: 0 });
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    staffId: '',
    leaveType: 'Casual Leave',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isHalfDay: false,
    reason: '',
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { [staffId]: { status, notes } }
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Payroll state
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [payrollMonth, setPayrollMonth] = useState(currentMonthStr);
  const [payrollSlips, setPayrollSlips] = useState([]);
  const [payrollMetrics, setPayrollMetrics] = useState(null);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);

  // Pay Slip Modal (Print / View)
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Edit / Pay Salary Modal
  const [editingSlip, setEditingSlip] = useState(null);
  const [slipForm, setSlipForm] = useState({
    bonusAndIncentives: 0,
    advanceDeduction: 0,
    paymentStatus: 'paid',
    paymentMethod: 'Bank Transfer',
    transactionRef: '',
    notes: '',
  });
  const [updatingSlip, setUpdatingSlip] = useState(false);

  // 1. Fetch Staff Directory
  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      let url = '/api/staff?';
      if (currentGym?._id) url += `gymId=${currentGym._id}&`;
      if (roleFilter !== 'all') url += `role=${roleFilter}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStaff(data.data || []);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  // 2. Fetch Leaves
  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      let url = '/api/payroll/leaves?';
      if (currentGym?._id) url += `gymId=${currentGym._id}&`;
      if (leaveStatusFilter !== 'all') url += `status=${leaveStatusFilter}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLeaves(data.data || []);
        if (data.metrics) setLeaveMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error loading leaves:', err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  // 3. Fetch Attendance for selected Date
  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const url = `/api/payroll/attendance?date=${attendanceDate}&gymId=${currentGym?._id || ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const map = {};
        data.data?.forEach((rec) => {
          const sId = rec.staff?._id || rec.staff;
          map[sId] = { status: rec.status, notes: rec.notes || '' };
        });
        setAttendanceRecords(map);
      }
    } catch (err) {
      console.error('Error loading attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // 4. Fetch Payroll for selected Month
  const fetchPayroll = async () => {
    setLoadingPayroll(true);
    try {
      const url = `/api/payroll?month=${payrollMonth}&gymId=${currentGym?._id || ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPayrollSlips(data.data || []);
        if (data.metrics) setPayrollMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error loading payroll:', err);
    } finally {
      setLoadingPayroll(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [currentGym, roleFilter]);

  useEffect(() => {
    if (activeTab === 'leaves') fetchLeaves();
    else if (activeTab === 'attendance') fetchAttendance();
    else if (activeTab === 'payroll') fetchPayroll();
  }, [activeTab, attendanceDate, payrollMonth, leaveStatusFilter, currentGym]);

  // Handle Add Staff Submit
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setSubmittingStaff(true);
    try {
      const payload = {
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        email: formData.email,
        specialization: formData.specialization,
        salary: Number(formData.salary) || 0,
        shift: formData.shift,
        paidLeavesPerMonth: Number(formData.paidLeavesPerMonth) || 2,
        bankDetails: {
          accountName: formData.accountName || formData.name,
          accountNumber: formData.accountNumber,
          ifsc: formData.ifsc,
          upiId: formData.upiId,
        },
        gym: currentGym?._id,
      };

      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setShowAddModal(false);
        if (data.tempPassword) {
          setInvitedCredentials({ email: formData.email, tempPassword: data.tempPassword });
        }
        setFormData({
          name: '',
          role: 'Trainer',
          phone: '',
          email: '',
          specialization: 'General Fitness',
          salary: '',
          shift: 'Morning (6:00 AM - 2:00 PM)',
          paidLeavesPerMonth: 2,
          accountName: '',
          accountNumber: '',
          ifsc: '',
          upiId: '',
        });
        await fetchStaff();
      } else {
        alert(data.message || 'Failed to add staff');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating staff member');
    } finally {
      setSubmittingStaff(false);
    }
  };

  // Handle Apply Leave Submit
  const handleApplyLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.staffId || !leaveForm.reason) {
      alert('Please select staff member and enter reason.');
      return;
    }
    setSubmittingLeave(true);
    try {
      const res = await fetch('/api/payroll/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leaveForm,
          gymId: currentGym?._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowApplyLeaveModal(false);
        setLeaveForm({
          staffId: '',
          leaveType: 'Casual Leave',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          isHalfDay: false,
          reason: '',
        });
        await fetchLeaves();
      } else {
        alert(data.message || 'Failed to submit leave request');
      }
    } catch (err) {
      console.error(err);
      alert('Error applying leave');
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Handle Review Leave (Approve / Reject)
  const handleReviewLeave = async (leaveId, status, isPaid = true) => {
    try {
      const res = await fetch(`/api/payroll/leaves/${leaveId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          isPaid,
          adminNotes: status === 'approved' ? (isPaid ? 'Approved as Paid Leave' : 'Approved as Unpaid Deduction') : 'Rejected by Owner',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchLeaves();
      } else {
        alert(data.message || 'Failed to review leave');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating leave');
    }
  };

  // Handle Save Attendance
  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const records = staff.map((st) => ({
        staffId: st._id,
        status: attendanceRecords[st._id]?.status || 'present',
        notes: attendanceRecords[st._id]?.notes || '',
      }));

      const res = await fetch('/api/payroll/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: attendanceDate,
          records,
          gymId: currentGym?._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Attendance for ${attendanceDate} saved successfully!`);
      } else {
        alert(data.message || 'Failed to save attendance');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Mark all staff present for today
  const handleMarkAllPresent = () => {
    const updated = { ...attendanceRecords };
    staff.forEach((st) => {
      updated[st._id] = { status: 'present', notes: '' };
    });
    setAttendanceRecords(updated);
  };

  // Handle Auto-Generate Monthly Payroll
  const handleGeneratePayroll = async () => {
    setGeneratingPayroll(true);
    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: payrollMonth,
          gymId: currentGym?._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPayroll();
      } else {
        alert(data.message || 'Failed to generate payroll');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating payroll');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  // Open Edit / Pay Modal
  const openEditSlipModal = (slip) => {
    setEditingSlip(slip);
    setSlipForm({
      bonusAndIncentives: slip.bonusAndIncentives || 0,
      advanceDeduction: slip.advanceDeduction || 0,
      paymentStatus: slip.paymentStatus || 'paid',
      paymentMethod: slip.paymentMethod || 'Bank Transfer',
      transactionRef: slip.transactionRef || '',
      notes: slip.notes || '',
    });
  };

  // Save Slip Updates / Mark as Paid
  const handleSaveSlipUpdates = async (e) => {
    e.preventDefault();
    if (!editingSlip) return;
    setUpdatingSlip(true);
    try {
      const res = await fetch(`/api/payroll/${editingSlip._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...slipForm,
          gymId: currentGym?._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingSlip(null);
        await fetchPayroll();
      } else {
        alert(data.message || 'Failed to update payroll slip');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating slip');
    } finally {
      setUpdatingSlip(false);
    }
  };

  const formatPrice = (amt) => {
    if (formatCurrency) return formatCurrency(amt);
    return `₹${Number(amt).toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px',
          padding: '28px 32px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#6366f1',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '3px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <UserCog size={12} />
              GYM STAFF, CHUTTI & PAYROLL SUITE
            </span>

            {leaveMetrics.pendingCount > 0 && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#f59e0b',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  animation: 'pulse 2s infinite',
                }}
              >
                ⏳ {leaveMetrics.pendingCount} Chutti Approvals Pending
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Staff & Automated Payroll
          </h1>
          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            Complete management for gym trainers, maids/housekeeping staff, and receptionists. Track
            chutti, review leave approvals, mark daily attendance, and auto-calculate payroll with deductions.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowApplyLeaveModal(true)}
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f59e0b',
              borderRadius: '12px',
              padding: '11px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CalendarDays size={16} />
            Apply Leave (Chutti)
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '11px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            }}
          >
            <UserPlus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          marginBottom: '24px',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'directory', label: '👥 Staff Directory', count: staff.length },
          { id: 'leaves', label: '🏖️ Chutti & Leave Approvals', count: leaveMetrics.pendingCount || null, badgeColor: '#f59e0b' },
          { id: 'attendance', label: '📅 Daily Staff Attendance' },
          { id: 'payroll', label: '💰 Monthly Payroll & Slips', count: payrollSlips.length },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: active ? 'var(--bg-card)' : 'transparent',
                border: active ? '1px solid var(--border-subtle)' : 'none',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.92rem',
                padding: '10px 18px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: tab.badgeColor || 'var(--bg-input)',
                    color: tab.badgeColor ? '#ffffff' : 'var(--text-muted)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 800,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <div>
          {/* Role Filter Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {['all', 'Trainer', 'Maid', 'Receptionist', 'Manager'].map((r) => {
              const active = roleFilter === r;
              return (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  style={{
                    background: active ? 'var(--brand-primary, #6366f1)' : 'var(--bg-card)',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    border: active ? 'none' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '7px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {r === 'all' ? 'All Roles' : r === 'Maid' ? '🧹 Maid / Cleaning' : r}
                </button>
              );
            })}
          </div>

          {/* Staff Cards Grid */}
          {loadingStaff ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p>Loading gym staff directory...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {staff.map((st) => {
                const isMaid = st.role === 'Maid' || st.role === 'Cleaner';
                const isTrainer = st.role === 'Trainer';

                return (
                  <div
                    key={st._id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '18px',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '14px',
                            background: isMaid
                              ? 'linear-gradient(135deg, #10b981, #059669)'
                              : isTrainer
                              ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                              : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1.2rem',
                          }}
                        >
                          {st.name?.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            {st.name}
                          </h3>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: isMaid ? '#10b981' : isTrainer ? '#a5b4fc' : '#38bdf8',
                            }}
                          >
                            {isMaid ? '🧹 Housekeeping / Maid' : st.role}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Salary</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                          {formatPrice(st.salary)}
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>/mo</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {st.specialization}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} />
                        <span>Shift: {st.shift}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={14} />
                        <span>Phone: {st.phone}</span>
                      </div>
                      {st.bankDetails?.upiId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CreditCard size={14} />
                          <span>UPI: {st.bankDetails.upiId}</span>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: 'auto',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Paid Leaves: <strong>{st.paidLeavesPerMonth || 2}/month</strong>
                      </span>

                      <button
                        onClick={() => {
                          setLeaveForm((prev) => ({ ...prev, staffId: st._id }));
                          setShowApplyLeaveModal(true);
                        }}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        + Record Chutti
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: CHUTTI & LEAVE APPROVALS QUEUE */}
      {activeTab === 'leaves' && (
        <div>
          {/* Status Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'all', label: 'All Requests' },
                { id: 'pending', label: '⏳ Pending Approval' },
                { id: 'approved', label: '✅ Approved' },
                { id: 'rejected', label: '❌ Rejected' },
              ].map((f) => {
                const active = leaveStatusFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setLeaveStatusFilter(f.id)}
                    style={{
                      background: active ? 'var(--brand-primary, #f59e0b)' : 'var(--bg-card)',
                      color: active ? '#ffffff' : 'var(--text-secondary)',
                      border: active ? 'none' : '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '7px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowApplyLeaveModal(true)}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 16px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={16} />
              Apply Leave for Employee
            </button>
          </div>

          {/* Leaves List */}
          {loadingLeaves ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p>Loading leave requests...</p>
            </div>
          ) : leaves.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px dashed var(--border-subtle)',
              }}
            >
              <CalendarDays size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
                No leave requests found
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Employees have not submitted any leave requests for this filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {leaves.map((lv) => {
                const isPending = lv.status === 'pending';
                const isApproved = lv.status === 'approved';

                return (
                  <div
                    key={lv._id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {lv.staffName}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'var(--bg-input)',
                            color: 'var(--text-secondary)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {lv.staffRole}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            borderRadius: '999px',
                            padding: '2px 10px',
                            color: isPending ? '#f59e0b' : isApproved ? '#10b981' : '#ef4444',
                            background: isPending
                              ? 'rgba(245, 158, 11, 0.12)'
                              : isApproved
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(239, 68, 68, 0.12)',
                          }}
                        >
                          {isPending
                            ? 'Pending Approval'
                            : isApproved
                            ? lv.isPaid
                              ? 'Approved (Paid Leave)'
                              : 'Approved (Unpaid Deduction)'
                            : 'Rejected'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        📅 <strong>{new Date(lv.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong> to{' '}
                        <strong>{new Date(lv.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>{' '}
                        ({lv.totalDays} {lv.totalDays === 1 ? 'day' : 'days'}) • {lv.leaveType}
                      </div>

                      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Reason: "{lv.reason}"
                      </div>
                    </div>

                    {/* Owner Action Buttons */}
                    {isPending ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleReviewLeave(lv._id, 'approved', true)}
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            color: '#10b981',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={14} />
                          Approve (Paid)
                        </button>

                        <button
                          onClick={() => handleReviewLeave(lv._id, 'approved', false)}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: '#f59e0b',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          Approve (Unpaid)
                        </button>

                        <button
                          onClick={() => handleReviewLeave(lv._id, 'rejected')}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Reviewed on {lv.reviewedAt ? new Date(lv.reviewedAt).toLocaleDateString('en-IN') : 'N/A'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: DAILY STAFF ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div>
          {/* Date Picker Bar & Quick Actions */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={18} style={{ color: '#38bdf8' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Attendance Date:
              </span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '7px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleMarkAllPresent}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#10b981',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ✓ Mark All Present Today
              </button>

              <button
                disabled={savingAttendance}
                onClick={handleSaveAttendance}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: savingAttendance ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                {savingAttendance ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Save Roster</span>
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '18px',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)' }}>EMPLOYEE</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)' }}>ROLE / SHIFT</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)' }}>STATUS FOR {attendanceDate}</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)' }}>NOTES / REASON</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((st) => {
                  const currentStatus = attendanceRecords[st._id]?.status || 'present';
                  const currentNotes = attendanceRecords[st._id]?.notes || '';

                  return (
                    <tr key={st._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.94rem' }}>{st.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{st.phone}</div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: st.role === 'Maid' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
                            color: st.role === 'Maid' ? '#10b981' : 'var(--text-secondary)',
                          }}
                        >
                          {st.role === 'Maid' ? '🧹 Maid / Cleaning' : st.role}
                        </span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>{st.shift}</div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[
                            { id: 'present', label: 'Present', color: '#10b981' },
                            { id: 'half_day', label: 'Half Day', color: '#38bdf8' },
                            { id: 'absent', label: 'Absent', color: '#ef4444' },
                            { id: 'on_leave', label: 'Leave', color: '#f59e0b' },
                          ].map((btn) => {
                            const isSel = currentStatus === btn.id;
                            return (
                              <button
                                key={btn.id}
                                type="button"
                                onClick={() => {
                                  setAttendanceRecords({
                                    ...attendanceRecords,
                                    [st._id]: { status: btn.id, notes: currentNotes },
                                  });
                                }}
                                style={{
                                  background: isSel ? btn.color : 'var(--bg-input)',
                                  color: isSel ? '#ffffff' : 'var(--text-secondary)',
                                  border: isSel ? 'none' : '1px solid var(--border-subtle)',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                {btn.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <input
                          type="text"
                          placeholder="e.g. In late / medical"
                          value={currentNotes}
                          onChange={(e) => {
                            setAttendanceRecords({
                              ...attendanceRecords,
                              [st._id]: { status: currentStatus, notes: e.target.value },
                            });
                          }}
                          style={{
                            width: '100%',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            color: 'var(--text-primary)',
                            fontSize: '0.82rem',
                            outline: 'none',
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 4: MONTHLY PAYROLL & SALARY SLIPS */}
      {activeTab === 'payroll' && (
        <div>
          {/* Month Selector & Metrics Bar */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '20px 24px',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Payroll Month:
              </span>
              <input
                type="month"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
            </div>

            <button
              disabled={generatingPayroll}
              onClick={handleGeneratePayroll}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '11px 20px',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: generatingPayroll ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              {generatingPayroll ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>Auto-Calculate {payrollMonth} Payroll</span>
            </button>
          </div>

          {/* Payroll KPI Cards */}
          {payrollMetrics && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px 20px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Net Payroll</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                  {formatPrice(payrollMetrics.totalPayrollExpense || 0)}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px 20px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Absence Deductions</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
                  -{formatPrice(payrollMetrics.totalDeductions || 0)}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px 20px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Salaries Paid</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                  {payrollMetrics.paidCount} / {payrollSlips.length}
                </div>
              </div>
            </div>
          )}

          {/* Payroll Slips Table */}
          {loadingPayroll ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p>Calculating staff payroll...</p>
            </div>
          ) : payrollSlips.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px dashed var(--border-subtle)',
              }}
            >
              <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
                No payroll generated for {payrollMonth}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 16px 0' }}>
                Click the "Auto-Calculate Payroll" button above to generate salary slips with automatic leave deductions.
              </p>
              <button
                onClick={handleGeneratePayroll}
                style={{
                  background: 'var(--brand-primary, #10b981)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Calculate Now
              </button>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '18px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>EMPLOYEE</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>BASE SALARY</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>ATTENDANCE & LEAVES</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>DEDUCTIONS</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>NET PAYABLE</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>STATUS</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollSlips.map((slip) => {
                    const isPaid = slip.paymentStatus === 'paid';
                    const isMaid = slip.staffRole === 'Maid' || slip.staffRole === 'Cleaner';

                    return (
                      <tr key={slip._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                            {slip.staffName}
                          </div>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: isMaid ? '#10b981' : '#38bdf8',
                            }}
                          >
                            {isMaid ? '🧹 Maid / Cleaning' : slip.staffRole}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatPrice(slip.baseSalary)}
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ₹{slip.perDaySalary}/day
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '0.82rem' }}>
                          <div style={{ color: '#10b981', fontWeight: 700 }}>
                            ✓ {slip.presentDays} Days Present
                          </div>
                          {slip.unpaidAbsences > 0 && (
                            <div style={{ color: '#ef4444', fontWeight: 600 }}>
                              ✗ {slip.unpaidAbsences} Days Unpaid/Absent
                            </div>
                          )}
                          {slip.approvedPaidLeaves > 0 && (
                            <div style={{ color: '#38bdf8', fontSize: '0.76rem' }}>
                              🏖️ {slip.approvedPaidLeaves} Paid Leaves
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '0.85rem' }}>
                          <div style={{ color: slip.leaveDeduction > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}>
                            -{formatPrice(slip.leaveDeduction)}
                          </div>
                          {slip.bonusAndIncentives > 0 && (
                            <div style={{ color: '#10b981', fontSize: '0.76rem' }}>
                              +{formatPrice(slip.bonusAndIncentives)} (Bonus/PT)
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981' }}>
                            {formatPrice(slip.netPayable)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {slip.paymentMethod}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              borderRadius: '999px',
                              padding: '3px 10px',
                              color: isPaid ? '#10b981' : '#f59e0b',
                              background: isPaid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              border: `1px solid ${isPaid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                            }}
                          >
                            {isPaid ? 'PAID' : 'DRAFT'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setSelectedPayslip(slip)}
                              title="View & Print Salary Slip"
                              style={{
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Printer size={13} />
                              <span>Slip</span>
                            </button>

                            <button
                              onClick={() => openEditSlipModal(slip)}
                              style={{
                                background: isPaid ? 'rgba(56, 189, 248, 0.12)' : 'linear-gradient(135deg, #10b981, #059669)',
                                color: isPaid ? '#38bdf8' : '#ffffff',
                                border: isPaid ? '1px solid rgba(56, 189, 248, 0.3)' : 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              {isPaid ? 'Edit' : 'Pay Now'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. PRINTABLE SALARY SLIP MODAL */}
      {selectedPayslip && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            id="printable-salary-slip"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '0 0 2px 0' }}>
                  {currentGym?.name || 'GymPulse Fitness Club'}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {currentGym?.address || 'Main Branch Location'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Phone: {currentGym?.phone || '8810632895'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', color: '#475569' }}>
                  OFFICIAL SALARY SLIP
                </span>
                <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>
                  Slip #{selectedPayslip.payslipNumber}
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedPayslip.monthLabel || selectedPayslip.month}
                </div>
              </div>
            </div>

            {/* Employee Info Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.84rem' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>Employee Name</div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedPayslip.staffName}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>Designation / Role</div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedPayslip.staffRole}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>Total Days in Month</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedPayslip.totalDaysInMonth} Days</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>Days Present</div>
                <div style={{ fontWeight: 700, color: '#10b981' }}>{selectedPayslip.presentDays} Days</div>
              </div>
            </div>

            {/* Breakdown Table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '0.86rem' }}>
                <span style={{ color: '#475569' }}>Base Monthly Salary</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatPrice(selectedPayslip.baseSalary)}</span>
              </div>

              {selectedPayslip.leaveDeduction > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '0.86rem', color: '#dc2626' }}>
                  <span>Unpaid Leave Deductions ({selectedPayslip.unpaidAbsences} days)</span>
                  <span style={{ fontWeight: 700 }}>-{formatPrice(selectedPayslip.leaveDeduction)}</span>
                </div>
              )}

              {selectedPayslip.bonusAndIncentives > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '0.86rem', color: '#16a34a' }}>
                  <span>Bonus / Personal Training (PT) Commission</span>
                  <span style={{ fontWeight: 700 }}>+{formatPrice(selectedPayslip.bonusAndIncentives)}</span>
                </div>
              )}

              {selectedPayslip.advanceDeduction > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '0.86rem', color: '#dc2626' }}>
                  <span>Advance Salary / Other Deductions</span>
                  <span style={{ fontWeight: 700 }}>-{formatPrice(selectedPayslip.advanceDeduction)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                <span>NET PAYABLE SALARY</span>
                <span style={{ color: '#16a34a' }}>{formatPrice(selectedPayslip.netPayable)}</span>
              </div>
            </div>

            {/* Payment Details Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#64748b', marginBottom: '24px' }}>
              <div>
                Payment Mode: <strong>{selectedPayslip.paymentMethod}</strong> • Status: <strong style={{ color: selectedPayslip.paymentStatus === 'paid' ? '#16a34a' : '#d97706' }}>{selectedPayslip.paymentStatus.toUpperCase()}</strong>
              </div>
              {selectedPayslip.paidAt && (
                <div>Date: {new Date(selectedPayslip.paidAt).toLocaleDateString('en-IN')}</div>
              )}
            </div>

            {/* Modal Buttons (Hidden on Print) */}
            <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '11px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={16} />
                <span>Print / Save PDF</span>
              </button>

              <button
                onClick={() => setSelectedPayslip(null)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  borderRadius: '10px',
                  padding: '11px 20px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. EDIT / PAY SALARY MODAL */}
      {editingSlip && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Pay Salary: {editingSlip.staffName}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {editingSlip.staffRole} • Month: {editingSlip.monthLabel || editingSlip.month}
                </div>
              </div>
              <button
                onClick={() => setEditingSlip(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSlipUpdates} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-input)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Base Salary:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatPrice(editingSlip.baseSalary)}</span>
              </div>

              <div style={{ background: 'var(--bg-input)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Leave Deductions ({editingSlip.unpaidAbsences} days):</span>
                <span style={{ fontWeight: 800, color: '#ef4444' }}>-{formatPrice(editingSlip.leaveDeduction)}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Bonus / PT Commission (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={slipForm.bonusAndIncentives}
                    onChange={(e) => setSlipForm({ ...slipForm, bonusAndIncentives: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Advance Deductions (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={slipForm.advanceDeduction}
                    onChange={(e) => setSlipForm({ ...slipForm, advanceDeduction: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Payment Method
                  </label>
                  <select
                    value={slipForm.paymentMethod}
                    onChange={(e) => setSlipForm({ ...slipForm, paymentMethod: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Cash">Cash on Hand</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={slipForm.paymentStatus}
                    onChange={(e) => setSlipForm({ ...slipForm, paymentStatus: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  >
                    <option value="paid">✅ Mark as Paid</option>
                    <option value="approved">👍 Approved (Unpaid)</option>
                    <option value="draft">⏳ Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Transaction / UTR Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-93821094829 or Cash Voucher"
                  value={slipForm.transactionRef}
                  onChange={(e) => setSlipForm({ ...slipForm, transactionRef: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={updatingSlip}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: updatingSlip ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updatingSlip ? 'Saving...' : 'Confirm & Save Payroll'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingSlip(null)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. APPLY LEAVE (CHUTTI) MODAL */}
      {showApplyLeaveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Apply Leave (Chutti)
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Submit request for Owner approval
                </div>
              </div>
              <button
                onClick={() => setShowApplyLeaveModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplyLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Select Employee *
                </label>
                <select
                  required
                  value={leaveForm.staffId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, staffId: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                >
                  <option value="">-- Choose Staff Member --</option>
                  {staff.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name} ({st.role === 'Maid' ? '🧹 Maid' : st.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Leave Type
                </label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                >
                  <option value="Casual Leave">Casual Leave (General Chutti)</option>
                  <option value="Sick Leave">Sick / Medical Leave</option>
                  <option value="Emergency Leave">Family Emergency</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Reason for Chutti / Leave *
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Village wedding, fever, urgent personal work..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: submittingLeave ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingLeave ? 'Submitting...' : 'Submit Leave Request'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowApplyLeaveModal(false)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Add Gym Employee
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunita Devi (Maid) or Kabir Sharma (Trainer)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Role / Position
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Trainer">🏋️ Gym Trainer / Coach</option>
                    <option value="Maid">🧹 Maid / Housekeeping</option>
                    <option value="Receptionist">💼 Receptionist / Front Desk</option>
                    <option value="Manager">👔 Floor Manager</option>
                    <option value="Technician">🛠️ Equipment Technician</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Monthly Base Salary (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="15000"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="staff@gym.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Shift Timing
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Morning (6:00 AM - 2:00 PM)">Morning (6:00 AM - 2:00 PM)</option>
                    <option value="Evening (2:00 PM - 10:00 PM)">Evening (2:00 PM - 10:00 PM)</option>
                    <option value="General (9:00 AM - 6:00 PM)">General (9:00 AM - 6:00 PM)</option>
                    <option value="Full Day (6:00 AM - 9:00 PM)">Full Day Shift</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Paid Leaves / Month
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="2"
                    value={formData.paidLeavesPerMonth}
                    onChange={(e) => setFormData({ ...formData, paidLeavesPerMonth: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  UPI ID for Salary (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. employee@upi or 9876543210@paytm"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: submittingStaff ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingStaff ? 'Adding Employee...' : 'Add to Gym Staff'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
