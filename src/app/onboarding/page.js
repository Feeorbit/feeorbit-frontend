'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import {
  Orbit,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Lock,
  User,
  Check,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshGyms, switchGym } = useGym();

  const [step, setStep] = useState(1); // 1: Gym details, 2: Owner profile, 3: Plan selection
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    gymName: '',
    tagline: 'Where Champions Train',
    phone: '',
    email: '',
    address: '',
    city: '',
    currencyCode: 'INR',
    currencySymbol: '₹',
    ownerName: '',
    ownerEmail: '',
    password: '',
    subscriptionPlan: 'pro',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register-gym-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        // Save session
        if (typeof window !== 'undefined') {
          localStorage.setItem('feeorbit_token', data.token);
          localStorage.setItem('feeorbit_user', JSON.stringify(data.user));
          localStorage.setItem('feeorbit_active_gym', data.gym._id);
        }

        await refreshGyms();
        switchGym(data.gym._id);

        // Redirect to dashboard
        router.push('/');
      } else {
        setError(data.message || 'Failed to register gym workspace');
      }
    } catch (err) {
      setError('Could not connect to FeeOrbit server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '24px 28px',
          border: '1px solid var(--border-glow)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.15)',
        }}
      >
        {/* FeeOrbit Onboarding Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Link
            href="/"
            title="FeeOrbit Home"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              marginBottom: '8px',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Orbit size={22} strokeWidth={2.4} />
          </Link>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Register Your Gym on FeeOrbit
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
            Multi-Tenant SaaS: Any gym can onboard and start operations in 60 seconds.
          </p>

          {/* Stepper indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
            {['1. Gym Profile', '2. Owner Account', '3. Choose Plan'].map((label, idx) => (
              <span
                key={label}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: step === idx + 1 ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: step === idx + 1 ? '#ffffff' : 'var(--text-muted)',
                  border: step === idx + 1 ? 'none' : '1px solid var(--border-subtle)',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              color: '#f87171',
              fontSize: '0.8rem',
              marginBottom: '14px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={step === 3 ? handleRegister : (e) => { e.preventDefault(); setStep(step + 1); }}>
          {/* STEP 1: Gym Details */}
          {step === 1 && (
            <div>
              <div className="form-group">
                <label className="form-label">Gym or Fitness Club Name *</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Iron Gym & Fitness, PowerHouse Club..."
                    value={formData.gymName}
                    onChange={(e) => handleChange('gymName', e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gym Email</label>
                  <input
                    type="email"
                    placeholder="contact@gym.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">City / Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indiranagar, Bangalore"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    value={formData.currencyCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const sym = code === 'INR' ? '₹' : code === 'USD' ? '$' : code === 'EUR' ? '€' : '₹';
                      handleChange('currencyCode', code);
                      handleChange('currencySymbol', sym);
                    }}
                    className="form-select"
                  >
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!formData.gymName || !formData.phone || !formData.address}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px', padding: '9px' }}
              >
                Continue to Owner Account &rarr;
              </button>
            </div>
          )}

          {/* STEP 2: Owner Profile */}
          {step === 2 && (
            <div>
              <div className="form-group">
                <label className="form-label">Owner Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={formData.ownerName}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Owner Login Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="owner@yourgym.com"
                    value={formData.ownerEmail}
                    onChange={(e) => handleChange('ownerEmail', e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    placeholder="Create a strong password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={!formData.ownerName || !formData.ownerEmail || !formData.password}
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  Select FeeOrbit Plan &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Choose Plan & Activate */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Choose your FeeOrbit SaaS tier (Starts with <strong>14-Day Risk-Free Trial</strong>):
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {[
                  {
                    id: 'starter',
                    name: 'Starter Plan',
                    price: '₹999 / mo',
                    desc: 'For single studios up to 150 members with kiosk & fees.',
                  },
                  {
                    id: 'pro',
                    name: 'Pro Plan (Recommended)',
                    price: '₹1,999 / mo',
                    desc: 'Full ERP: 500 members, staff payroll, machine health, WhatsApp.',
                    popular: true,
                  },
                  {
                    id: 'enterprise',
                    name: 'Enterprise Plan',
                    price: '₹4,999 / mo',
                    desc: 'Unlimited members, multi-branch, white-label CMS & priority SLA.',
                  },
                ].map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleChange('subscriptionPlan', p.id)}
                    style={{
                      border: formData.subscriptionPlan === p.id ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      background: formData.subscriptionPlan === p.id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {p.desc}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--brand-cyan)' }}>
                        {p.price}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--brand-emerald)' }}>
                        14-Day Free Trial
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '10px' }}
                >
                  {loading ? 'Creating Workspace...' : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>🚀 Start 14-Day Free Trial</span>}
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                No credit card required upfront. Instant workspace provisioning.
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
