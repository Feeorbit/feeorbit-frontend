'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  Phone,
  Building2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Sparkles,
  Zap,
  Check,
  QrCode,
  MessageSquare,
  CalendarDays,
  Shield,
  Layers,
} from 'lucide-react';
import FeeOrbitLogo from '../../components/FeeOrbitLogo';

export default function LoginPage({ initialMode = 'login' }) {
  const { login, register, verifyEmail, resendOtp } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'verify'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form (Always Admin)
  const [signupData, setSignupData] = useState({
    name: '',
    gymName: '',
    email: '',
    phone: '',
    password: '',
  });

  // Email OTP Verification State
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'signup') {
        setMode('signup');
      } else if (params.get('mode') === 'login') {
        setMode('login');
      }
    }

    // Force dark mode on login page so light theme overrides never leak into cyber auth panel
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const prevMode = root.getAttribute('data-theme-mode');
      root.setAttribute('data-theme-mode', 'dark');

      return () => {
        if (prevMode) {
          root.setAttribute('data-theme-mode', prevMode);
        } else {
          root.removeAttribute('data-theme-mode');
        }
      };
    }
  }, []);

  // Timer countdown for resending code
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await login(loginEmail, loginPassword);
    setLoading(false);

    if (res.requireVerification) {
      setVerificationEmail(res.email || loginEmail);
      setMode('verify');
      setCooldown(60);
      setSuccessMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (!res.success) {
      setError(res.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!signupData.name || !signupData.gymName || !signupData.email || !signupData.password) {
      setError('Please fill in all required fields including your Gym Name.');
      setLoading(false);
      return;
    }

    // Every self-signup registers as an Admin/Workspace Owner with their Gym Name
    const res = await register({
      name: signupData.name,
      gymName: signupData.gymName,
      email: signupData.email,
      phone: signupData.phone,
      password: signupData.password,
    });

    setLoading(false);

    if (res.requireVerification) {
      setVerificationEmail(res.email || signupData.email);
      setMode('verify');
      setCooldown(60);
      setSuccessMsg('A 6-digit verification code has been sent to your email.');
      return;
    }

    if (!res.success) {
      setError(res.message || 'Registration failed. Please try again.');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    const res = await verifyEmail(verificationEmail, otpCode);
    setLoading(false);

    if (!res.success) {
      setError(res.message || 'Invalid or expired verification code.');
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || !verificationEmail) return;
    setLoading(true);
    setError('');

    const res = await resendOtp(verificationEmail);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || 'New verification code dispatched to email!');
      setCooldown(60);
    } else {
      setError(res.message || 'Could not resend code. Please wait.');
    }
  };

  return (
    <div
      className="feeorbit-auth-page"
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#04060c',
        backgroundImage: `
          radial-gradient(ellipse 90% 70% at 50% -15%, rgba(56, 189, 248, 0.22) 0%, rgba(99, 102, 241, 0.14) 40%, transparent 80%),
          radial-gradient(ellipse 70% 50% at 85% 90%, rgba(16, 185, 129, 0.12) 0%, transparent 70%),
          radial-gradient(ellipse 60% 40% at 15% 85%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)
        `,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: 'inherit',
      }}
    >
      <style>{`
        /* Animated Cyber Perspectives */
        @keyframes feeorbitPulseGlow {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.06); }
        }
        @keyframes feeorbitGridDrift {
          0% { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
        @keyframes feeorbitShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .feeorbit-auth-grid-bg {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          mask-image: radial-gradient(ellipse 80% 65% at 50% 50%, black 35%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 65% at 50% 50%, black 35%, transparent 100%);
        }
        .feeorbit-auth-panel {
          background: linear-gradient(145deg, rgba(14, 21, 38, 0.82) 0%, rgba(8, 12, 22, 0.94) 100%);
          border: 1px solid rgba(56, 189, 248, 0.22);
          border-radius: 24px;
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 45px rgba(56, 189, 248, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feeorbit-auth-panel:hover {
          border-color: rgba(56, 189, 248, 0.38);
          box-shadow: 0 35px 90px rgba(0, 0, 0, 0.88), 0 0 55px rgba(56, 189, 248, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }
        .feeorbit-input-group {
          position: relative;
          transition: all 0.2s ease;
        }
        .feeorbit-input {
          width: 100%;
          height: 42px;
          background: rgba(13, 20, 36, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 11px;
          color: #f8fafc;
          font-size: 0.88rem;
          outline: none;
          box-sizing: border-box;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feeorbit-input:focus {
          border-color: rgba(56, 189, 248, 0.65);
          background: rgba(16, 26, 48, 0.85);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.25), inset 0 0 10px rgba(56, 189, 248, 0.08);
        }
        .feeorbit-input::placeholder {
          color: #64748b;
        }
        .feeorbit-btn-submit-cyan {
          background: linear-gradient(135deg, #38bdf8 0%, #2563eb 50%, #4f46e5 100%);
          color: #ffffff;
          font-weight: 800;
          border: 1px solid rgba(255, 255, 255, 0.35);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 26px rgba(37, 99, 235, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4);
          position: relative;
          overflow: hidden;
        }
        .feeorbit-btn-submit-cyan:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 14px 34px rgba(37, 99, 235, 0.65), 0 0 24px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.55);
        }
        .feeorbit-btn-submit-gold {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #ea580c 100%);
          color: #ffffff;
          font-weight: 800;
          border: 1px solid rgba(255, 230, 180, 0.45);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 28px rgba(245, 158, 11, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.5);
          position: relative;
          overflow: hidden;
        }
        .feeorbit-btn-submit-gold:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 14px 36px rgba(245, 158, 11, 0.7), 0 0 28px rgba(251, 191, 36, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.65);
        }
        .feeorbit-title-chrome {
          background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 55%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Scoped High-Specificity Styling to prevent light theme bleed */
        .feeorbit-auth-page .feeorbit-back-btn {
          background: rgba(15, 23, 42, 0.75) !important;
          border: 1px solid rgba(56, 189, 248, 0.28) !important;
          color: #cbd5e1 !important;
        }
        .feeorbit-auth-page .feeorbit-back-btn:hover {
          background: rgba(30, 41, 59, 0.9) !important;
          border-color: rgba(56, 189, 248, 0.6) !important;
          color: #ffffff !important;
        }
        .feeorbit-auth-page .feeorbit-vault-badge {
          background: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(56, 189, 248, 0.35) !important;
          color: #38bdf8 !important;
        }
        .feeorbit-auth-page .feeorbit-role-card {
          background: rgba(13, 20, 36, 0.85) !important;
          border: 1px dashed rgba(56, 189, 248, 0.35) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
        }
        .feeorbit-auth-page .feeorbit-role-btn {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #cbd5e1 !important;
        }
        .feeorbit-auth-page .feeorbit-role-btn:hover {
          background: rgba(56, 189, 248, 0.15) !important;
          border-color: rgba(56, 189, 248, 0.5) !important;
          color: #ffffff !important;
        }
        .feeorbit-auth-page .feeorbit-role-btn.active-superadmin {
          background: rgba(168, 85, 247, 0.25) !important;
          border-color: #c084fc !important;
          color: #f3e8ff !important;
          box-shadow: 0 0 12px rgba(192, 132, 252, 0.35) !important;
        }
        .feeorbit-auth-page .feeorbit-role-btn.active-admin {
          background: rgba(56, 189, 248, 0.25) !important;
          border-color: #38bdf8 !important;
          color: #e0f2fe !important;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.35) !important;
        }
        .feeorbit-auth-page .feeorbit-role-btn.active-member {
          background: rgba(16, 185, 129, 0.25) !important;
          border-color: #34d399 !important;
          color: #d1fae5 !important;
          box-shadow: 0 0 12px rgba(52, 211, 153, 0.35) !important;
        }
        @media (max-width: 900px) {
          .feeorbit-auth-layout {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .feeorbit-auth-showcase {
            display: none !important;
          }
          .feeorbit-auth-panel {
            padding: 28px 20px !important;
          }
        }
      `}</style>

      {/* Cyber Grid Matrix Floor */}
      <div className="feeorbit-auth-grid-bg" />

      {/* Floating Hologram Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-150px',
          left: '15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, transparent 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
          animation: 'feeorbitPulseGlow 8s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-150px',
          right: '10%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
          animation: 'feeorbitPulseGlow 9s ease-in-out infinite reverse',
        }}
      />

      {/* ================= 1. MINIMAL TOP HEADER ================= */}
      <header
        style={{
          width: '100%',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box',
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        <Link
          href="/"
          title="Return to FeeOrbit OS"
          className="feeorbit-back-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#cbd5e1',
            fontSize: '0.82rem',
            fontWeight: 700,
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '9999px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.24)',
            backdropFilter: 'blur(16px)',
            transition: 'all 0.22s ease',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.55)';
            e.currentTarget.style.transform = 'translateX(-3px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(56, 189, 248, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#cbd5e1';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.24)';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
          }}
        >
          <ArrowLeft size={14} style={{ color: '#38bdf8' }} />
          <span>Return to FeeOrbit OS</span>
        </Link>

        {/* Telemetry Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.28)',
            color: '#34d399',
            fontSize: '0.74rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            backdropFilter: 'blur(14px)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981',
            }}
          />
          <span>Cloud Gateway Nominal (0.12ms)</span>
        </div>
      </header>

      {/* ================= 2. MAIN CENTERPIECE CONTENT ================= */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 24px 40px',
          position: 'relative',
          zIndex: 2,
          boxSizing: 'border-box',
        }}
      >
        <div
          className="feeorbit-auth-layout"
          style={{
            width: '100%',
            maxWidth: '1020px',
            display: 'grid',
            gridTemplateColumns: '1.05fr 1fr',
            gap: '42px',
            alignItems: 'center',
          }}
        >
          {/* ================= LEFT COLUMN: FUTURISTIC SHOWCASE & VALUE PROPOSITION ================= */}
          <div className="feeorbit-auth-showcase" style={{ paddingRight: '12px' }}>
            {/* Top Telemetry Eyebrow */}
            <div
              className="feeorbit-vault-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '9999px',
                padding: '5px 14px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#38bdf8',
                boxShadow: '0 0 18px rgba(56, 189, 248, 0.18)',
                marginBottom: '18px',
              }}
            >
              <Zap size={12} style={{ color: '#38bdf8' }} />
              <span>// 256-BIT ISOLATED GYM VAULT //</span>
            </div>

            {/* Brand Logo with Pulsing Energy Halo */}
            <div style={{ marginBottom: '18px' }}>
              <Link href="/" title="FeeOrbit Home" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <FeeOrbitLogo size="xl" variant="full" showBadge={false} animated={true} />
              </Link>
            </div>

            <h1
              className="feeorbit-title-chrome"
              style={{
                fontSize: 'clamp(2rem, 3.2vw, 2.75rem)',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                margin: '0 0 16px 0',
              }}
            >
              The Cybernetic Operating System for Indian Gyms.
            </h1>

            <p style={{ color: '#94a3b8', fontSize: '0.96rem', lineHeight: 1.6, margin: '0 0 28px 0' }}>
              Say goodbye to awkward late-fee phone calls and desktop hardware crashes. FeeOrbit automates cash collection, tablet kiosk attendance, and membership freeze controls in 60 seconds.
            </p>

            {/* Value Highlights Feature Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              {[
                {
                  icon: <MessageSquare size={16} style={{ color: '#10b981' }} />,
                  title: 'WhatsApp 1-Click Fee Chaser',
                  desc: 'Polite reminder notices with direct UPI links recover dues with zero friction.',
                  border: 'rgba(16, 185, 129, 0.28)',
                  glow: 'rgba(16, 185, 129, 0.08)',
                },
                {
                  icon: <QrCode size={16} style={{ color: '#38bdf8' }} />,
                  title: 'Zero-Hardware Front-Desk Kiosk',
                  desc: 'Turn any low-cost tablet or phone into a 0.3-second reception check-in terminal.',
                  border: 'rgba(56, 189, 248, 0.28)',
                  glow: 'rgba(56, 189, 248, 0.08)',
                },
                {
                  icon: <CalendarDays size={16} style={{ color: '#f59e0b' }} />,
                  title: 'Panchang Sync & 15-Day Freezes',
                  desc: 'Indian holiday schedule awareness with automatic membership validity extension.',
                  border: 'rgba(245, 158, 11, 0.28)',
                  glow: 'rgba(245, 158, 11, 0.08)',
                },
              ].map((feat, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'rgba(13, 18, 32, 0.65)',
                    border: `1px solid ${feat.border}`,
                    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 16px ${feat.glow}`,
                    backdropFilter: 'blur(14px)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {feat.icon}
                  </div>
                  <div>
                    <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.86rem', marginBottom: '2px' }}>
                      {feat.title}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.5 }}>
                      {feat.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust Assurance Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '0.75rem',
                color: '#64748b',
                fontWeight: 600,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} style={{ color: '#10b981' }} />
                <span>14-Day Free Trial</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} style={{ color: '#10b981' }} />
                <span>No Credit Card Needed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} style={{ color: '#10b981' }} />
                <span>60-Second Setup</span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: INTERACTIVE CYBER AUTH PANEL ================= */}
          <div
            className="feeorbit-auth-panel"
            style={{
              padding: '36px 32px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Top Holographic Laser Accent */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: mode === 'signup'
                  ? 'linear-gradient(90deg, transparent 0%, #f59e0b 35%, #fbbf24 50%, #f97316 65%, transparent 100%)'
                  : 'linear-gradient(90deg, transparent 0%, #38bdf8 35%, #6366f1 50%, #34d399 65%, transparent 100%)',
              }}
            />

            {/* Mobile Header Logo (Visible only on mobile/tablet) */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: '16px',
                display: 'block',
              }}
              className="feeorbit-mobile-only-logo"
            >
              <Link href="/" title="FeeOrbit Home" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <FeeOrbitLogo size="lg" variant="full" showBadge={false} animated={true} />
              </Link>
            </div>

            {/* Mode Switcher Dock (Sign In vs Register Gym) */}
            {mode !== 'verify' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '4px',
                  background: 'rgba(7, 10, 19, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '4px',
                  marginBottom: '24px',
                }}
              >
                <button
                  type="button"
                  id="tab-btn-signin"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{
                    border: 'none',
                    background: mode === 'login'
                      ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(99, 102, 241, 0.35) 100%)'
                      : 'transparent',
                    border: mode === 'login' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                    color: mode === 'login' ? '#ffffff' : '#94a3b8',
                    fontWeight: mode === 'login' ? 800 : 600,
                    fontSize: '0.82rem',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: mode === 'login' ? '0 4px 18px rgba(0, 0, 0, 0.4), 0 0 14px rgba(56, 189, 248, 0.2)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Lock size={13} style={{ color: mode === 'login' ? '#38bdf8' : '#64748b' }} />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-signup"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{
                    border: 'none',
                    background: mode === 'signup'
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(249, 115, 22, 0.35) 100%)'
                      : 'transparent',
                    border: mode === 'signup' ? '1px solid rgba(245, 158, 11, 0.55)' : '1px solid transparent',
                    color: mode === 'signup' ? '#ffffff' : '#94a3b8',
                    fontWeight: mode === 'signup' ? 800 : 600,
                    fontSize: '0.82rem',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: mode === 'signup' ? '0 4px 18px rgba(0, 0, 0, 0.4), 0 0 16px rgba(245, 158, 11, 0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={13} style={{ color: mode === 'signup' ? '#fbbf24' : '#64748b' }} />
                  <span>Start Free Trial</span>
                </button>
              </div>
            )}

            {/* Error Notification Alert */}
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: '#fca5a5',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, color: '#ef4444' }} />
                <div>{error}</div>
              </div>
            )}

            {/* Success Notification Alert */}
            {successMsg && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: '#6ee7b7',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0, color: '#10b981' }} />
                <div>{successMsg}</div>
              </div>
            )}

            {/* ================= VIEW 1: SIGN IN FORM ================= */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit}>
                {/* 1-Click Role Login Selector for instant testing */}
                <div
                  className="feeorbit-role-card"
                  style={{
                    marginBottom: '18px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.66rem',
                      color: '#94a3b8',
                      fontWeight: 800,
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>⚡ 1-Click Role Login Selector</span>
                    <span style={{ color: '#38bdf8' }}>[DEMO TEST]</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      id="role-btn-superadmin"
                      className={`feeorbit-role-btn ${loginEmail === 'superadmin@feeorbit.com' ? 'active-superadmin' : ''}`}
                      onClick={() => {
                        setLoginEmail('superadmin@feeorbit.com');
                        setLoginPassword('Password@123');
                      }}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      SuperAdmin
                    </button>
                    <button
                      type="button"
                      id="role-btn-admin"
                      className={`feeorbit-role-btn ${loginEmail === 'rahulyo954030@gmail.com' ? 'active-admin' : ''}`}
                      onClick={() => {
                        setLoginEmail('rahulyo954030@gmail.com');
                        setLoginPassword('Password@123');
                      }}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Admin (Rahul)
                    </button>
                    <button
                      type="button"
                      id="role-btn-member"
                      className={`feeorbit-role-btn ${loginEmail === 'member@feeorbit.com' ? 'active-member' : ''}`}
                      onClick={() => {
                        setLoginEmail('member@feeorbit.com');
                        setLoginPassword('Password@123');
                      }}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Member
                    </button>
                  </div>
                </div>

                {/* Email Address */}
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#cbd5e1',
                      marginBottom: '6px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Email Address
                  </label>
                  <div className="feeorbit-input-group">
                    <Mail
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#64748b',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="email"
                      required
                      className="feeorbit-input"
                      style={{ padding: '0 14px 0 38px' }}
                      placeholder="name@gym.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: '#cbd5e1',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Password
                    </label>
                    <span
                      onClick={() => {
                        setLoginEmail('rahulyo954030@gmail.com');
                        setLoginPassword('Password@123');
                      }}
                      style={{
                        fontSize: '0.72rem',
                        color: '#38bdf8',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Auto-fill password?
                    </span>
                  </div>
                  <div className="feeorbit-input-group">
                    <Lock
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#64748b',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="feeorbit-input"
                      style={{ padding: '0 38px 0 38px' }}
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="feeorbit-btn-submit-cyan"
                  style={{
                    width: '100%',
                    height: '44px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Gym Command Deck</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {/* Bottom Switch Note */}
                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Don't have a FeeOrbit account yet?{' '}
                  <span
                    onClick={() => {
                      setMode('signup');
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{ color: '#fbbf24', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Start 14-Day Free Trial
                  </span>
                </div>
              </form>
            )}

            {/* ================= VIEW 2: SIGN UP FORM (REGISTER GYM) ================= */}
            {mode === 'signup' && (
              <form onSubmit={handleSignupSubmit}>
                {/* 14-Day Free Trial Badge */}
                <div
                  style={{
                    marginBottom: '18px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(234, 88, 12, 0.08) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fbbf24',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fef08a' }}>
                      14-Day Instant Free Trial
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#fed7aa', lineHeight: 1.3 }}>
                      Full Pro access • Zero credit card or hardware required to test drive.
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '5px' }}>
                    Your Full Name *
                  </label>
                  <div className="feeorbit-input-group">
                    <User
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#64748b',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="text"
                      required
                      className="feeorbit-input"
                      style={{ padding: '0 14px 0 38px' }}
                      placeholder="e.g. Rahul Singh"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Gym / Fitness Center Name */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '5px' }}>
                    Gym / Club Name *
                  </label>
                  <div className="feeorbit-input-group">
                    <Building2
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#64748b',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="text"
                      required
                      className="feeorbit-input"
                      style={{ padding: '0 14px 0 38px' }}
                      placeholder="e.g. Iron Core Athletic Club"
                      value={signupData.gymName}
                      onChange={(e) => setSignupData({ ...signupData, gymName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email and Phone in 2-Column Split */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '5px' }}>
                      Email Address *
                    </label>
                    <div className="feeorbit-input-group">
                      <Mail
                        size={14}
                        style={{
                          position: 'absolute',
                          left: '11px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#64748b',
                          pointerEvents: 'none',
                        }}
                      />
                      <input
                        type="email"
                        required
                        className="feeorbit-input"
                        style={{ padding: '0 10px 0 34px', fontSize: '0.84rem' }}
                        placeholder="owner@gym.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '5px' }}>
                      Phone (WhatsApp)
                    </label>
                    <div className="feeorbit-input-group">
                      <Phone
                        size={14}
                        style={{
                          position: 'absolute',
                          left: '11px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#64748b',
                          pointerEvents: 'none',
                        }}
                      />
                      <input
                        type="tel"
                        className="feeorbit-input"
                        style={{ padding: '0 10px 0 34px', fontSize: '0.84rem' }}
                        placeholder="9876543210"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '5px' }}>
                    Create Secure Password *
                  </label>
                  <div className="feeorbit-input-group">
                    <Lock
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#64748b',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="feeorbit-input"
                      style={{ padding: '0 38px 0 38px' }}
                      placeholder="At least 6 characters"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Submit Sign Up Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="feeorbit-btn-submit-gold"
                  style={{
                    width: '100%',
                    height: '44px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Provisioning Gym Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Start 14-Day Free Trial &rarr;</span>
                    </>
                  )}
                </button>

                {/* Bottom Switch Note */}
                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Already have an active account?{' '}
                  <span
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{ color: '#38bdf8', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Sign In instead
                  </span>
                </div>
              </form>
            )}

            {/* ================= VIEW 3: 6-DIGIT EMAIL OTP VERIFICATION ================= */}
            {mode === 'verify' && (
              <form onSubmit={handleVerifySubmit}>
                <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      background: 'rgba(56, 189, 248, 0.14)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8',
                      marginBottom: '12px',
                      boxShadow: '0 0 25px rgba(56, 189, 248, 0.25)',
                    }}
                  >
                    <KeyRound size={24} />
                  </div>
                  <h2
                    className="feeorbit-title-chrome"
                    style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0' }}
                  >
                    Enter 6-Digit Cryptographic Code
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    We dispatched a one-time verification PIN to:<br />
                    <strong style={{ color: '#38bdf8' }}>{verificationEmail}</strong>
                  </p>
                </div>

                {/* OTP Input Field */}
                <div style={{ marginBottom: '22px' }}>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{
                      width: '100%',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '1.6rem',
                      fontWeight: 900,
                      letterSpacing: '12px',
                      fontFamily: 'monospace',
                      background: 'rgba(7, 10, 19, 0.9)',
                      border: '2px solid rgba(56, 189, 248, 0.45)',
                      borderRadius: '14px',
                      color: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      boxShadow: '0 0 25px rgba(56, 189, 248, 0.2), inset 0 2px 6px rgba(0, 0, 0, 0.6)',
                    }}
                  />
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  style={{
                    width: '100%',
                    height: '44px',
                    background: otpCode.length === 6
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    border: otpCode.length === 6 ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: otpCode.length === 6 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: otpCode.length === 6 ? '0 8px 24px rgba(16, 185, 129, 0.45)' : 'none',
                    transition: 'all 0.22s ease',
                    marginBottom: '16px',
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Verifying Security Token...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Enter Workspace</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {/* Resend Code & Back */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: cooldown > 0 ? '#64748b' : '#38bdf8',
                      fontWeight: 700,
                      cursor: cooldown > 0 ? 'default' : 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <RefreshCw size={12} className={loading ? 'spin' : ''} />
                    <span>{cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Micro Security & Trust Footer */}
            <div
              style={{
                marginTop: '22px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.7rem',
                color: '#64748b',
              }}
            >
              <ShieldCheck size={14} style={{ color: '#10b981' }} />
              <span>256-Bit SSL Encrypted • India DPDP Act Ready</span>
            </div>
          </div>
        </div>
      </main>

      {/* ================= 3. MINIMAL FOOTER STRIP ================= */}
      <footer
        style={{
          width: '100%',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '0.74rem',
          color: '#64748b',
          position: 'relative',
          zIndex: 10,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>© {new Date().getFullYear()} FeeOrbit OS. Handcrafted for Indian Gym Infrastructure.</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
