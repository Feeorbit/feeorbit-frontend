'use client';

import React, { useState, useEffect } from 'react';
import { useGym } from '../../context/GymContext';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { toast } from '../../context/ToastContext';
import {
  Sparkles,
  Check,
  Zap,
  Shield,
  CreditCard,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  Flame,
  Crown,
  Building2,
  Sliders,
  Eye,
  FileBarChart,
  ShieldCheck,
  X,
} from 'lucide-react';
import { FEEORBIT_LOGO_DATA_URI } from '../../utils/logoDataUri';

export default function SubscriptionPage() {
  const { currentGym, refreshGyms } = useGym();
  const { user } = useAuth();

  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [previewTenantView, setPreviewTenantView] = useState(false);

  // Helper to safely get the active gym ID with full fallbacks
  const getActiveGymId = () => {
    return (
      currentGym?._id ||
      user?.gym ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('feeorbit_active_gym') || localStorage.getItem('gympulse_active_gym')
        : null)
    );
  };

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const activeGymId = getActiveGymId() || '';
      const [plansRes, subRes] = await Promise.all([
        fetch('/api/subscriptions/plans'),
        fetch(`/api/subscriptions/current?gymId=${activeGymId}`),
      ]);
      const [pData, sData] = await Promise.all([plansRes.json(), subRes.json()]);

      if (pData.success) setPlans(pData.data);
      if (sData.success) setCurrentSub(sData.subscription);
    } catch (err) {
      console.error('Failed to load subscription info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [currentGym, user]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if (window.Razorpay) return resolve(true);

      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        if (window.Razorpay) return resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgradePlan = async (planId) => {
    setUpgradingPlan(planId);
    setSuccessMessage('');

    try {
      const activeGymId = getActiveGymId();

      // 1. Ensure Razorpay checkout script is loaded
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded || !window.Razorpay) {
        toast.error('Unable to load Razorpay payment gateway. Please check your internet connection or ad blocker.', {
          title: 'Gateway Unavailable',
        });
        setUpgradingPlan(null);
        return;
      }

      // 2. Create official Razorpay Order from Backend
      const checkoutRes = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymId: activeGymId,
          planId,
          billingCycle,
        }),
      });
      const cData = await checkoutRes.json();

      if (!cData.success || !cData.order?.id) {
        toast.error(cData.message || 'Failed to initialize Razorpay checkout order.', {
          title: 'Payment Error',
        });
        setUpgradingPlan(null);
        return;
      }

      // 3. Open official Razorpay Checkout Modal
      const options = {
        key: cData.keyId,
        amount: cData.order.amount,
        currency: cData.order.currency || 'INR',
        name: 'FeeOrbit SaaS Platform',
        description: `${cData.plan?.name || 'SaaS'} Subscription (${billingCycle === 'annual' ? 'Annual' : 'Monthly'})`,
        image: FEEORBIT_LOGO_DATA_URI || (typeof window !== 'undefined' ? `${window.location.origin}/feeorbit-logo-128.png` : ''),
        order_id: cData.order.id,
        handler: async function (response) {
          setUpgradingPlan(planId);
          toast.info('Payment received! Verifying and activating subscription...', {
            title: 'Processing Payment',
          });

          try {
            const activateRes = await fetch('/api/subscriptions/upgrade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gymId: activeGymId,
                planId,
                billingCycle,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const aData = await activateRes.json();

            if (aData.success) {
              toast.success(`Payment verified! Plan successfully upgraded to ${aData.subscription.planName}! ✨`, {
                title: 'Subscription Activated',
              });
              setSuccessMessage(`Plan successfully upgraded to ${aData.subscription.planName}!`);

              if (refreshGyms) await refreshGyms();
              fetchSubscriptionData();

              // Broadcast sync event to unlock feature gates across all components
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('feeorbit_auth_changed'));
                window.dispatchEvent(new Event('storage'));
              }
            } else {
              toast.error(aData.message || 'Upgrade failed after payment verification.', {
                title: 'Activation Error',
              });
            }
          } catch (verErr) {
            toast.error('Network error while verifying subscription payment.', {
              title: 'Verification Failed',
            });
          } finally {
            setUpgradingPlan(null);
          }
        },
        prefill: {
          name: user?.name || currentGym?.name || 'Gym Admin',
          email: user?.email || currentGym?.email || 'admin@feeorbit.com',
          contact: currentGym?.phone || user?.phone || '9876543210',
        },
        notes: {
          gymId: activeGymId,
          planId,
          billingCycle,
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function () {
            setUpgradingPlan(null);
            toast.info('Payment window closed. Subscription was not changed.', {
              title: 'Checkout Cancelled',
            });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setUpgradingPlan(null);
        toast.error(resp.error?.description || 'Payment was unsuccessful.', {
          title: 'Payment Failed',
        });
      });
      rzp.open();
    } catch (err) {
      toast.error('Error launching Razorpay checkout: ' + (err.message || 'Please try again.'), {
        title: 'Connection Failed',
      });
      setUpgradingPlan(null);
    }
  };

  // 1. If SuperAdmin, show the Executive Platform Master Console by default
  if (user?.role === 'superadmin' && !previewTenantView) {
    return (
      <div style={{ paddingBottom: '32px' }}>
        {/* SuperAdmin Master Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), var(--bg-card-solid))',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '26px 28px',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            boxShadow: 'var(--shadow-lg, 0 15px 35px rgba(0, 0, 0, 0.15))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
              }}
            >
              <Crown size={32} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#f59e0b',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  Platform Master Key
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  Unlimited Enterprise License
                </span>
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
                FeeOrbit SaaS Platform Master Console
              </h1>
              <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginTop: '4px', maxWidth: '650px' }}>
                You are logged in as the <strong>SaaS Platform SuperAdmin (Root Owner)</strong>. You do not purchase subscriptions — you configure SaaS tiers, license gym tenants, and collect MRR revenue.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/superadmin/plans"
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderColor: '#f59e0b',
                color: '#000000',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              }}
            >
              <Sliders size={16} />
              <span>Configure SaaS Pricing Plans</span>
            </Link>

            <button
              onClick={() => setPreviewTenantView(true)}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Eye size={16} />
              <span>Preview Tenant View</span>
            </button>
          </div>
        </div>

        {/* 4-Metric Grid for SuperAdmin */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Master License Status
              </span>
              <ShieldCheck size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '6px' }}>
              Active / Permanent
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Root access across all {currentGym?.name || 'gym'} tenants
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Configured SaaS Tiers
              </span>
              <CreditCard size={18} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '4px' }}>
              {plans.length || 3} Plans Live
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Starter (₹999), Pro (₹1,999), Enterprise (₹4,999)
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Tenant Directory
              </span>
              <Building2 size={18} style={{ color: 'var(--brand-cyan)' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-cyan)', marginTop: '4px' }}>
              Multi-Tenant Active
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Manage accounts & database workspaces
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Platform MRR Stream
              </span>
              <FileBarChart size={18} style={{ color: 'var(--brand-emerald)' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-emerald)', marginTop: '4px' }}>
              ₹1,999 / mo
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Real-time recurring tenant billing
            </div>
          </div>
        </div>

        {/* SuperAdmin Quick Action Links */}
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px' }}>
            SuperAdmin Platform Controls
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <Link
              href="/superadmin/plans"
              style={{
                textDecoration: 'none',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                }}
              >
                <Sliders size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                  Edit SaaS Pricing & Features
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Update monthly/annual prices, member limits, and feature bullets
                </div>
              </div>
            </Link>

            <Link
              href="/superadmin/gyms"
              style={{
                textDecoration: 'none',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                }}
              >
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                  Manage Tenant Subscriptions
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Inspect all gym tenants, change tiers, or grant trial extensions
                </div>
              </div>
            </Link>

            <Link
              href="/superadmin/reports"
              style={{
                textDecoration: 'none',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22d3ee',
                }}
              >
                <FileBarChart size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                  SaaS Revenue & MRR Analytics
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  View consolidated analytics and subscription distribution
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Live Active SaaS Tiers Table */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Currently Active SaaS Pricing Tiers</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                These are the live plans offered to gym owners registering or upgrading on FeeOrbit
              </div>
            </div>
            <Link href="/superadmin/plans" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              <Sliders size={14} /> Edit in SaaS Plans
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plan Tier</th>
                  <th>Monthly Price</th>
                  <th>Annual Price</th>
                  <th>Capacity Limit</th>
                  <th>Trial Period</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#ffffff' }}>{p.name}</span>
                        {p.popular && <span className="badge badge-info">MOST POPULAR</span>}
                        <span className="badge badge-secondary">{p.badge}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-emerald)' }}>
                      ₹{p.monthlyPrice.toLocaleString('en-IN')} / mo
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-cyan)' }}>
                      ₹{p.annualPrice.toLocaleString('en-IN')} / yr
                    </td>
                    <td>{p.maxMembers || 500} Active Members</td>
                    <td>{p.trialDays || 14} Days Free</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href="/superadmin/plans" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                        Configure
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* If SuperAdmin is in preview mode, show preview notification banner */}
      {user?.role === 'superadmin' && previewTenantView && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#f59e0b',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
            <Eye size={18} />
            <span>Preview Mode: Viewing Subscription & Pricing as Tenant Gym Admin ({currentGym?.name})</span>
          </div>
          <button
            onClick={() => setPreviewTenantView(false)}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: '#f59e0b', color: '#f59e0b', background: 'transparent' }}
          >
            Exit Preview & Return to Master Console
          </button>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            FeeOrbit SaaS Subscription & Pricing
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
            Multi-Tenant Platform Licensing: Manage FeeOrbit subscription for <strong>{currentGym?.name}</strong>.
          </p>
        </div>

        {/* Monthly / Annual Billing Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
          }}
        >
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`btn btn-sm ${billingCycle === 'annual' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            Annual Billing <span style={{ color: 'var(--brand-emerald)', fontSize: '0.65rem', marginLeft: '4px' }}>-17%</span>
          </button>
        </div>
      </div>

      {/* Dismissible Feedback Banner */}
      {successMessage && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(6, 182, 212, 0.08))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={16} />
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#34d399' }}>Subscription Active & Synced: </span>
              <span style={{ color: '#e2e8f0' }}>{successMessage}</span>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.2s',
            }}
            title="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Active Gym Current Status Banner */}
      <div
        className="glass-card"
        style={{
          marginBottom: '20px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.09), var(--bg-card))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                flexShrink: 0,
              }}
            >
              <Crown size={22} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Active Workspace Plan: {currentSub?.planName || 'FeeOrbit Pro'}
                </span>
                <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  {currentSub?.status === 'trialing' ? `${currentSub?.daysLeft} Days Trial Left` : 'Active'}
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                Gym: <strong>{currentGym?.name}</strong> • Capacity: <strong>{currentSub?.maxMembers || 500} members</strong> • Valid Until: <strong>{currentSub?.endDate ? new Date(currentSub.endDate).toLocaleDateString() : 'N/A'}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <ShieldCheck size={14} />
              <span>Razorpay Verified</span>
            </span>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {billingCycle === 'annual' ? 'Annual License' : 'Monthly License'}
            </span>
          </div>
        </div>
      </div>

      {/* 3 FeeOrbit SaaS Pricing Plans Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '18px',
        }}
      >
        {plans.map((p) => {
          const planIdentifier = p.id || p.code || p._id;
          const isCurrent =
            currentSub?.plan === planIdentifier ||
            currentSub?.plan === p.code ||
            (currentSub?.plan === 'enterprise' && (planIdentifier === 'franchise' || planIdentifier === 'enterprise')) ||
            (currentSub?.planName && p.name && currentSub.planName.toLowerCase().trim() === p.name.toLowerCase().trim());
          const displayPrice = billingCycle === 'annual' ? p.annualPrice : p.monthlyPrice;

          return (
            <div
              key={planIdentifier}
              className="glass-card"
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px 22px',
                borderRadius: 'var(--radius-lg)',
                border: isCurrent
                  ? '2px solid rgba(16, 185, 129, 0.7)'
                  : p.popular
                  ? '1.5px solid rgba(99, 102, 241, 0.55)'
                  : '1px solid var(--border-subtle)',
                background: isCurrent
                  ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, var(--bg-card-solid) 100%)'
                  : p.popular
                  ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, var(--bg-card-solid) 100%)'
                  : 'var(--bg-card)',
                boxShadow: isCurrent
                  ? '0 8px 30px rgba(16, 185, 129, 0.16)'
                  : p.popular
                  ? '0 8px 30px rgba(99, 102, 241, 0.16)'
                  : 'none',
              }}
            >
              {/* Top Banner Ribbon */}
              {isCurrent ? (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '18px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-full)',
                    letterSpacing: '0.04em',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                  <span>ACTIVE SUBSCRIBED PLAN</span>
                </div>
              ) : p.popular ? (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '18px',
                    background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                    color: '#ffffff',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-full)',
                    letterSpacing: '0.04em',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Flame size={12} />
                  <span>MOST POPULAR CHOICE</span>
                </div>
              ) : null}

              <div style={{ flex: 1 }}>
                {/* Clean Header: Badge ABOVE title so it never wraps or squishes */}
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: isCurrent ? '#34d399' : p.popular ? '#a5b4fc' : '#38bdf8',
                        background: isCurrent
                          ? 'rgba(16, 185, 129, 0.12)'
                          : p.popular
                          ? 'rgba(99, 102, 241, 0.14)'
                          : 'rgba(56, 189, 248, 0.12)',
                        border: isCurrent
                          ? '1px solid rgba(16, 185, 129, 0.35)'
                          : p.popular
                          ? '1px solid rgba(99, 102, 241, 0.35)'
                          : '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {p.name}
                  </h3>
                  <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', marginTop: '5px', lineHeight: 1.45, minHeight: '34px' }}>
                    {p.description}
                  </div>
                </div>

                {/* Price Display */}
                <div style={{ margin: '14px 0 16px 0', padding: '12px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)', fontFamily: 'var(--font-heading)' }}>
                      ₹{displayPrice.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      / {billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--brand-cyan)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={12} />
                    <span>Includes 14-Day Risk-Free Trial</span>
                  </div>
                </div>

                {/* Features List */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                    What's Included:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {p.features.map((f, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: isCurrent ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                            border: isCurrent ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(99, 102, 241, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          <Check size={11} style={{ color: isCurrent ? 'var(--brand-emerald)' : 'var(--brand-cyan)' }} />
                        </div>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  onClick={() => handleUpgradePlan(planIdentifier)}
                  disabled={upgradingPlan === planIdentifier}
                  className={`btn ${isCurrent ? 'btn-success' : p.popular ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    boxShadow: isCurrent
                      ? '0 4px 16px rgba(16, 185, 129, 0.35)'
                      : p.popular
                      ? '0 4px 16px rgba(99, 102, 241, 0.4)'
                      : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    ...(isCurrent
                      ? {
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          borderColor: '#10b981',
                          color: '#ffffff',
                          fontWeight: 800,
                        }
                      : {}),
                  }}
                >
                  {upgradingPlan === planIdentifier ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px', border: '2px solid #fff', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                      <span>Opening Razorpay Gateway...</span>
                    </>
                  ) : isCurrent ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Current Plan (Extend License)</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={15} />
                      <span>Subscribe to {p.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compare All Features Link Banner */}
      <div
        className="glass-card"
        style={{
          marginTop: '20px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.04))',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              Need a deep feature-by-feature breakdown?
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Compare Front-Desk Kiosk voice chimes, Dussehra Panchang festivals, 15-day freeze engine, Gemini AI coach splits, and Multi-Branch HQ features.
            </div>
          </div>
        </div>

        <Link
          href="/home#feature-matrix"
          className="btn btn-secondary btn-sm"
          style={{ textDecoration: 'none', borderColor: '#6366f1', color: '#a5b4fc', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          View Full Feature Matrix <ArrowRight size={14} />
        </Link>
      </div>

      {/* Trust & Security Footnote */}
      <div
        style={{
          marginTop: '20px',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={14} style={{ color: 'var(--brand-emerald)' }} /> 256-Bit SSL Encrypted Billing
        </span>
        <span>•</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} style={{ color: 'var(--brand-primary)' }} /> Instant Multi-Tenant Workspace Provisioning
        </span>
        <span>•</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CreditCard size={14} style={{ color: 'var(--brand-cyan)' }} /> UPI, Cards & NetBanking Supported
        </span>
      </div>
    </div>
  );
}
