'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  CreditCard,
  Plus,
  Edit2,
  Check,
  RefreshCw,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export default function SuperAdminPlansPage() {
  const { token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    badge: '',
    description: '',
    monthlyPrice: 0,
    annualPrice: 0,
    trialDays: 14,
    maxMembers: 500,
    maxBranches: 1,
    popular: false,
    featuresText: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPlans(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPlans();
  }, [token]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      code: '',
      badge: '',
      description: '',
      monthlyPrice: 1499,
      annualPrice: 14990,
      trialDays: 14,
      maxMembers: 300,
      maxBranches: 2,
      popular: false,
      featuresText: 'Up to 300 Active Members\n2 Branch Locations\nCheck-In Kiosk & QR Pass\nStaff Payroll\nWhatsApp Alerts',
    });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditingPlan(p);
    setFormData({
      name: p.name,
      code: p.code,
      badge: p.badge || '',
      description: p.description || '',
      monthlyPrice: p.monthlyPrice,
      annualPrice: p.annualPrice,
      trialDays: p.trialDays ?? 14,
      maxMembers: p.maxMembers,
      maxBranches: p.maxBranches ?? 1,
      popular: !!p.popular,
      featuresText: (p.features || []).join('\n'),
    });
    setShowModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const features = formData.featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        ...(editingPlan?._id ? { _id: editingPlan._id } : {}),
        name: formData.name,
        code: formData.code.toLowerCase().trim(),
        badge: formData.badge,
        description: formData.description,
        monthlyPrice: Number(formData.monthlyPrice),
        annualPrice: Number(formData.annualPrice),
        trialDays: Number(formData.trialDays),
        maxMembers: Number(formData.maxMembers),
        maxBranches: Number(formData.maxBranches),
        popular: formData.popular,
        features,
      };

      const res = await fetch('/api/superadmin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchPlans();
        alert('Plan saved successfully!');
      } else {
        alert(data.message || 'Error saving plan');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            SaaS Subscription Plans
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Define global pricing tiers, member limits, and branch allowances for all gym tenants on FeeOrbit.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchPlans}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <RefreshCw size={13} className={loading ? 'spinning' : ''} />
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Add Plan Tier
          </button>
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {plans.map((p) => {
          const isPro = p.code === 'pro' || p.popular;
          return (
            <div
              key={p._id || p.code}
              style={{
                background: isPro ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.7)',
                border: isPro ? '2px solid #6366f1' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isPro ? '0 10px 30px rgba(99, 102, 241, 0.2)' : 'none',
              }}
            >
              {p.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                    color: '#fff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 10px',
                    borderRadius: '12px',
                    letterSpacing: '0.05em',
                  }}
                >
                  MOST POPULAR
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {p.name}
                  </h3>
                  <button
                    onClick={() => openEditModal(p)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minHeight: '36px', margin: 0 }}>
                  {p.description || 'Enterprise grade gym management tier.'}
                </p>

                {/* Price Display */}
                <div style={{ margin: '18px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff' }}>
                      ₹{p.monthlyPrice?.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ month</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600, marginTop: '2px' }}>
                    Annual billing: ₹{p.annualPrice?.toLocaleString('en-IN')} / year (Save ~16%)
                  </div>
                </div>

                {/* Limits pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#e2e8f0',
                    }}
                  >
                    👥 Max {p.maxMembers === 99999 ? 'Unlimited' : p.maxMembers} Members
                  </span>
                  <span
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#a5b4fc',
                    }}
                  >
                    🏢 {p.maxBranches >= 90 ? 'Unlimited Branches' : `${p.maxBranches} Branch Location${p.maxBranches > 1 ? 's' : ''}`}
                  </span>
                </div>

                {/* Features List */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    INCLUDED CAPABILITIES:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(p.features || []).map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                        <Check size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Code Identifier: <code style={{ color: '#818cf8' }}>{p.code}</code>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingPlan ? `Edit SaaS Plan: ${editingPlan.name}` : 'Create New SaaS Tier'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePlan}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Plan Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. FeeOrbit Franchise Elite"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Code Identifier *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. franchise"
                      value={formData.code}
                      disabled={!!editingPlan}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Monthly Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      className="form-input"
                      value={formData.monthlyPrice}
                      onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Annual Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      className="form-input"
                      value={formData.annualPrice}
                      onChange={(e) => setFormData({ ...formData, annualPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Max Members</label>
                    <input
                      type="number"
                      min={1}
                      className="form-input"
                      value={formData.maxMembers}
                      onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Allowed Branches</label>
                    <input
                      type="number"
                      min={1}
                      className="form-input"
                      value={formData.maxBranches}
                      onChange={(e) => setFormData({ ...formData, maxBranches: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Short description for gym owners"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Plan Features (1 per line)</label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    placeholder="Enter feature bullet points..."
                    value={formData.featuresText}
                    onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving Plan...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
