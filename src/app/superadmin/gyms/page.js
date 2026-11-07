'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useGym } from '../../../context/GymContext';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  ExternalLink,
  Power,
  CheckCircle2,
  XCircle,
  X,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';

export default function SuperAdminGymsPage() {
  const { token } = useAuth();
  const { switchGym, refreshGyms } = useGym();
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    gymName: '',
    phone: '',
    address: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    subscriptionPlan: 'pro',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchGyms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/gyms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setGyms(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load gyms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchGyms();
  }, [token]);

  const handleToggleStatus = async (gymId) => {
    try {
      const res = await fetch(`/api/superadmin/gyms/${gymId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setGyms((prev) =>
          prev.map((g) => (g._id === gymId ? { ...g, isActive: data.data.isActive } : g))
        );
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  const handleCreateGym = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/superadmin/gyms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          gymName: '',
          phone: '',
          address: '',
          adminName: '',
          adminEmail: '',
          adminPassword: '',
          subscriptionPlan: 'pro',
        });
        await fetchGyms();
        await refreshGyms(true);
        alert(`Success: Gym "${data.data.gym.name}" and Admin account created!`);
      } else {
        setFormError(data.message || 'Failed to create gym');
      }
    } catch (err) {
      setFormError('Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGyms = gyms.filter((g) => {
    const q = search.toLowerCase();
    return (
      (g.name && g.name.toLowerCase().includes(q)) ||
      (g.owner?.name && g.owner.name.toLowerCase().includes(q)) ||
      (g.owner?.email && g.owner.email.toLowerCase().includes(q)) ||
      (g.phone && g.phone.includes(q))
    );
  });

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            All Gyms & Franchises
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Manage all onboarded fitness centers, view tenant owners, and control operational access.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchGyms}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <RefreshCw size={13} className={loading ? 'spinning' : ''} />
            Refresh
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Onboard New Gym
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
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
            type="text"
            placeholder="Search by gym name, owner, email, or phone..."
            className="form-input"
            style={{ paddingLeft: '36px', height: '36px', fontSize: '0.84rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredGyms.length}</strong> of {gyms.length} gyms
        </div>
      </div>

      {/* Gyms Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Gym Facility</th>
                <th>Owner & Admin</th>
                <th>Members</th>
                <th>Branches</th>
                <th>Gross Revenue</th>
                <th>SaaS Plan</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGyms.length > 0 ? (
                filteredGyms.map((g) => (
                  <tr key={g._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
                            color: '#818cf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff' }}>{g.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {g.isBranch ? `Branch of ${g.parentGym?.name || 'Main'}` : 'Headquarter (HQ)'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            📞 {g.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{g.owner?.name || 'Unassigned'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {g.owner?.email || 'No email registered'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: '#34d399' }}>{g.memberCount ?? 0}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>members</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {g.branchCount ? `${g.branchCount} branches` : 'Single location'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: '#fbbf24' }}>
                        ₹{(g.totalRevenue ?? 0).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          background: 'rgba(99, 102, 241, 0.18)',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                          color: '#a5b4fc',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {g.subscription?.plan || 'trial'}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(g._id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: g.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: g.isActive ? '#34d399' : '#f87171',
                          border: g.isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                        title={g.isActive ? 'Click to Suspend Gym' : 'Click to Activate Gym'}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: g.isActive ? '#10b981' : '#ef4444',
                          }}
                        />
                        {g.isActive ? 'Active' : 'Suspended'}
                      </button>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          switchGym(g._id);
                          window.location.href = '/';
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        Inspect <ExternalLink size={11} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No gyms match your query. Click "+ Onboard New Gym" to add a new tenant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard New Gym Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Onboard New Gym Tenant</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  margin: '16px 20px 0',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  fontSize: '0.84rem',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateGym}>
              <div className="modal-body">
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', marginBottom: '8px' }}>
                  🏢 Gym Details
                </div>

                <div className="form-group">
                  <label className="form-label">Gym Brand Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Iron Forge Elite Fitness"
                    value={formData.gymName}
                    onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">SaaS Subscription Plan</label>
                    <select
                      className="form-select"
                      value={formData.subscriptionPlan}
                      onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                    >
                      <option value="starter">FeeOrbit Starter (1 Branch)</option>
                      <option value="pro">FeeOrbit Pro (3 Branches)</option>
                      <option value="enterprise">FeeOrbit Enterprise (Unlimited)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Central Avenue, New Delhi"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#818cf8',
                    marginTop: '16px',
                    marginBottom: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '12px',
                  }}
                >
                  👤 Primary Gym Admin Account
                </div>

                <div className="form-group">
                  <label className="form-label">Admin Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Admin Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="e.g. ramesh@ironforge.com"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Temporary Password *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. GymAdmin@2026"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
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
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Creating Tenant...' : 'Onboard & Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
