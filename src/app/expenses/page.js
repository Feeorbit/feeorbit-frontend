'use client';

import React, { useState, useEffect } from 'react';
import { useGym } from '../../context/GymContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  TrendingDown,
  TrendingUp,
  Plus,
  DollarSign,
  PieChart,
  Calendar,
  CreditCard,
  Trash2,
  X,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function ExpensesPage() {
  const { currentGym, formatCurrency } = useGym();
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    paidTo: '',
    referenceNumber: '',
    remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchExpensesAndPnl = async () => {
    setLoading(true);
    try {
      let expUrl = `/api/expenses?`;
      let pnlUrl = `/api/expenses/pnl?`;
      if (currentGym?._id) {
        expUrl += `gymId=${currentGym._id}&`;
        pnlUrl += `gymId=${currentGym._id}&`;
      }
      if (categoryFilter && categoryFilter !== 'all') {
        expUrl += `category=${categoryFilter}&`;
      }

      const [expRes, pnlRes] = await Promise.all([fetch(expUrl), fetch(pnlUrl)]);
      const [expData, pnlData] = await Promise.all([expRes.json(), pnlRes.json()]);

      if (expData.success) setExpenses(expData.data);
      if (pnlData.success) setPnl(pnlData);
    } catch (err) {
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndPnl();
  }, [currentGym, categoryFilter]);

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    if (!currentGym) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount) || 0,
          gym: currentGym._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          title: '',
          category: 'Utilities',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Bank Transfer',
          paidTo: '',
          referenceNumber: '',
          remarks: '',
        });
        fetchExpensesAndPnl();
      } else {
        alert(data.message || 'Error recording expense');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id, title) => {
    if (!confirm(`Are you sure you want to delete expense "${title}"?`)) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchExpensesAndPnl();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  const summary = pnl?.summary || {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
  };

  const isProfitable = summary.netProfit >= 0;

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
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{t('expenses_title', 'FeeOrbit Financial ERP & P&L Statement')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
            {t('expenses_subtitle', 'Track rent, electricity, salaries, and operational costs against membership revenue for your gym.')}
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
          <Plus size={15} /> {t('expenses_btn_add', '+ Record Expense')}
        </button>
      </div>

      {/* P&L Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        {/* Total Fee Revenue */}
        <div
          className="glass-card"
          style={{
            padding: '11px 14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, var(--bg-card-solid) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Gross Collections
            </span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={15} style={{ color: 'var(--brand-emerald)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--brand-emerald)', marginTop: '4px', lineHeight: 1.1 }}>
            {formatCurrency(summary.totalRevenue)}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Income from gym memberships & PT
          </div>
        </div>

        {/* Total Operating Costs */}
        <div
          className="glass-card"
          style={{
            padding: '11px 14px',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, var(--bg-card-solid) 100%)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Operating Expenses
            </span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownRight size={15} style={{ color: 'var(--brand-red)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--brand-red)', marginTop: '4px', lineHeight: 1.1 }}>
            {formatCurrency(summary.totalExpenses)}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Rent, staff salaries, electricity & AMC
          </div>
        </div>

        {/* Net Profit / Loss */}
        <div
          className="glass-card"
          style={{
            padding: '11px 14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, var(--bg-card-solid) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Net Operating P&L
            </span>
            <span className={`badge ${isProfitable ? 'badge-active' : 'badge-expired'}`}>
              {isProfitable ? 'Profitable' : 'Deficit'}
            </span>
          </div>
          <div
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: isProfitable ? 'var(--brand-primary)' : 'var(--brand-amber)',
              marginTop: '4px',
              lineHeight: 1.1,
            }}
          >
            {formatCurrency(summary.netProfit)}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Net operational balance
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress */}
      {pnl?.categoryBreakdown?.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>
            Expense Distribution by Category
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {pnl.categoryBreakdown.map((cat) => (
              <div
                key={cat.category}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.category}</span>
                  <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{cat.percentage}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(5, cat.percentage))}%`,
                      background: 'var(--brand-primary)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {formatCurrency(cat.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses Ledger Table */}
      <div className="glass-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Operational Expenses Ledger</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Complete record of overhead payments
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '160px' }}
            >
              <option value="all">All Categories</option>
              <option value="Rent">Premises Rent</option>
              <option value="Utilities">Utilities & Electricity</option>
              <option value="Staff Salaries">Staff Salaries</option>
              <option value="Equipment Maintenance">Equipment Maintenance</option>
              <option value="Cleaning & Sanitation">Cleaning & Sanitation</option>
              <option value="Marketing">Marketing & Ads</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Expense Item</th>
                <th>Category</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Paid To / Reference</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Loading expenses ledger...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No expenses recorded yet. Click "Record Expense" to log overhead costs.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{exp.title}</div>
                      {exp.remarks && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.remarks}</div>
                      )}
                    </td>

                    <td>
                      <span className="badge badge-warning">{exp.category}</span>
                    </td>

                    <td>{new Date(exp.date).toLocaleDateString('en-IN')}</td>

                    <td style={{ fontWeight: 700, color: 'var(--brand-red)' }}>
                      {formatCurrency(exp.amount)}
                    </td>

                    <td>
                      <span className="badge badge-info">{exp.paymentMethod}</span>
                    </td>

                    <td>
                      <div>{exp.paidTo || '—'}</div>
                      {exp.referenceNumber && (
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          Ref: {exp.referenceNumber}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteExpense(exp._id, exp.title)}
                        className="btn btn-danger btn-sm"
                        title="Delete Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Record Operational Expense</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordExpense}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Expense Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Electricity Bill - September"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Rent">Premises Rent</option>
                      <option value="Utilities">Utilities / Power / Water</option>
                      <option value="Staff Salaries">Staff Salaries</option>
                      <option value="Equipment Maintenance">Equipment Maintenance AMC</option>
                      <option value="Cleaning & Sanitation">Cleaning & Sanitation</option>
                      <option value="Marketing">Marketing & Advertising</option>
                      <option value="Supplements & Goods">Supplements & Goods</option>
                      <option value="Other">Other Expenses</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount ({currentGym?.currency?.symbol || '₹'}) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="form-input"
                      placeholder="e.g. 25000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Corporate Card</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Paid To / Vendor</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. State Electricity Board"
                      value={formData.paidTo}
                      onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reference / Txn ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. RTGS-8921"
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Short note"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Recording...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
