'use client';

import React, { useState, useEffect } from 'react';
import { useGym } from '../../context/GymContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';

export default function InventoryPage() {
  const { currentGym, formatCurrency } = useGym();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Strength',
    brand: '',
    serialNumber: '',
    purchaseCost: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    maintenanceStatus: 'Operational',
    serviceContact: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      let url = `/api/equipment?`;
      if (currentGym?._id) url += `gymId=${currentGym._id}&`;
      if (categoryFilter && categoryFilter !== 'all') url += `category=${categoryFilter}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (err) {
      console.error('Error fetching equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [currentGym, categoryFilter]);

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    if (!currentGym) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchaseCost: Number(formData.purchaseCost) || 0,
          gym: currentGym._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          category: 'Strength',
          brand: '',
          serialNumber: '',
          purchaseCost: '',
          purchaseDate: new Date().toISOString().split('T')[0],
          maintenanceStatus: 'Operational',
          serviceContact: '',
        });
        fetchEquipment();
      } else {
        alert(data.message || 'Error adding equipment');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus =
      item.maintenanceStatus === 'Operational'
        ? 'Needs Service'
        : item.maintenanceStatus === 'Needs Service'
        ? 'Under Repair'
        : 'Operational';

    try {
      const res = await fetch(`/api/equipment/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceStatus: nextStatus }),
      });
      const data = await res.json();
      if (data.success) fetchEquipment();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleDeleteEquipment = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name} from inventory?`)) return;
    try {
      const res = await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchEquipment();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const totalAssetValue = items.reduce((acc, curr) => acc + (curr.purchaseCost || 0), 0);
  const maintenanceAlerts = items.filter((i) => i.maintenanceStatus !== 'Operational').length;

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
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{t('inventory_title', 'FeeOrbit Equipment & Asset ERP')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
            {t('inventory_subtitle', 'Track machinery, asset values, and preventive maintenance for your gym.')}
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
          <Plus size={15} /> {t('inventory_btn_add', '+ Add Equipment')}
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          className="glass-card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '14px 16px',
            borderTop: '2px solid var(--brand-primary)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Asset Investment
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--brand-primary)', marginTop: '2px' }}>
                {formatCurrency(totalAssetValue)}
              </div>
            </div>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(99, 102, 241, 0.08))',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
              }}
            >
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Total equipment purchase capital
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '14px 16px',
            borderTop: '2px solid var(--brand-cyan)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tracked Machines
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginTop: '2px' }}>
                {items.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Units</span>
              </div>
            </div>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(6, 182, 212, 0.08))',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-cyan)',
              }}
            >
              <Wrench size={16} />
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Cardio, strength & free-weight roster
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '14px 16px',
            borderTop: maintenanceAlerts > 0 ? '2px solid var(--brand-amber)' : '2px solid var(--brand-emerald)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: maintenanceAlerts > 0
                ? 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Service Health
              </span>
              <div
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: maintenanceAlerts > 0 ? 'var(--brand-amber)' : 'var(--brand-emerald)',
                  marginTop: '2px',
                }}
              >
                {maintenanceAlerts > 0 ? `${maintenanceAlerts} Needs Service` : 'All Operational'}
              </div>
            </div>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: maintenanceAlerts > 0
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.08))'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.08))',
                border: maintenanceAlerts > 0
                  ? '1px solid rgba(245, 158, 11, 0.35)'
                  : '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: maintenanceAlerts > 0 ? 'var(--brand-amber)' : 'var(--brand-emerald)',
              }}
            >
              {maintenanceAlerts > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {maintenanceAlerts > 0 ? 'Technician attention recommended' : 'Zero equipment breakdowns'}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Machinery & Asset Roster</h2>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Click on any machine status to cycle its maintenance stage
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '150px', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <option value="all">All Categories</option>
              <option value="Cardio">Cardio</option>
              <option value="Strength">Strength Machines</option>
              <option value="Free Weights">Free Weights</option>
              <option value="Recovery & Spa">Recovery & Spa</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Machine Name</th>
                <th>Category</th>
                <th>Brand / Serial No</th>
                <th>Purchase Cost</th>
                <th>Purchase Date</th>
                <th>Service Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Loading equipment inventory...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No machinery recorded in inventory yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.86rem' }}>{item.name}</div>
                      {item.serviceContact && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          AMC: {item.serviceContact}
                        </div>
                      )}
                    </td>

                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            item.category === 'Cardio'
                              ? 'rgba(6, 182, 212, 0.14)'
                              : item.category === 'Strength'
                              ? 'rgba(99, 102, 241, 0.14)'
                              : item.category === 'Free Weights'
                              ? 'rgba(245, 158, 11, 0.14)'
                              : 'rgba(168, 85, 247, 0.14)',
                          color:
                            item.category === 'Cardio'
                              ? '#38bdf8'
                              : item.category === 'Strength'
                              ? '#a5b4fc'
                              : item.category === 'Free Weights'
                              ? '#fcd34d'
                              : '#d8b4fe',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '0.72rem',
                        }}
                      >
                        {item.category}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.84rem' }}>{item.brand || 'Standard'}</div>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {item.serialNumber || 'N/A'}
                      </div>
                    </td>

                    <td style={{ fontWeight: 600, color: 'var(--brand-primary)', fontSize: '0.86rem' }}>
                      {formatCurrency(item.purchaseCost)}
                    </td>

                    <td style={{ fontSize: '0.82rem' }}>{new Date(item.purchaseDate).toLocaleDateString('en-IN')}</td>

                    <td>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`badge ${
                          item.maintenanceStatus === 'Operational'
                            ? 'badge-active'
                            : item.maintenanceStatus === 'Needs Service'
                            ? 'badge-warning'
                            : 'badge-expired'
                        }`}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.74rem',
                          padding: '3px 8px',
                        }}
                        title="Click to cycle maintenance state"
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background:
                              item.maintenanceStatus === 'Operational'
                                ? '#34d399'
                                : item.maintenanceStatus === 'Needs Service'
                                ? '#fbbf24'
                                : '#f87171',
                            boxShadow: `0 0 6px ${
                              item.maintenanceStatus === 'Operational'
                                ? '#34d399'
                                : item.maintenanceStatus === 'Needs Service'
                                ? '#fbbf24'
                                : '#f87171'
                            }`,
                          }}
                        />
                        {item.maintenanceStatus} ↻
                      </button>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteEquipment(item._id, item.name)}
                        className="btn btn-danger btn-sm"
                        title="Delete Equipment"
                        style={{ padding: '4px 8px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add Equipment to Inventory</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEquipment}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Machine Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Life Fitness Incline Bench"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Cardio">Cardio Equipment</option>
                      <option value="Strength">Strength Machines</option>
                      <option value="Free Weights">Free Weights & Barbells</option>
                      <option value="Recovery & Spa">Recovery & Spa / Sauna</option>
                      <option value="Accessories">Accessories & Mats</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Brand / Manufacturer</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Hammer Strength, Rogue"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SN-88219"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Purchase Cost ({currentGym?.currency?.symbol || '₹'})</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 150000"
                      value={formData.purchaseCost}
                      onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Technician / AMC Service Contact</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Technogym Service +91 98765 11111"
                    value={formData.serviceContact}
                    onChange={(e) => setFormData({ ...formData, serviceContact: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Adding...' : 'Save to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
