'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Sparkles,
  Flame,
  ArrowRight,
  ArrowLeft,
  Home,
  RefreshCw,
  Camera,
  UserCheck,
  Building,
  Lock,
} from 'lucide-react';
import QRScannerModal from '../../components/QRScannerModal';
import FeeOrbitLoadingScreen from '../../components/FeeOrbitLoadingScreen';

function MobileScanAttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const gymIdParam = searchParams.get('gym') || searchParams.get('gymId') || '';

  const handleBack = () => {
    if (user?.role === 'member') {
      router.push('/portal');
    } else if (user?.role === 'superadmin') {
      router.push('/superadmin');
    } else if (user?.role === 'admin' || user?.role === 'staff') {
      router.push('/');
    } else {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push('/portal');
      }
    }
  };

  const [identifier, setIdentifier] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [gymData, setGymData] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState(0);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [workoutDurationLive, setWorkoutDurationLive] = useState(0);

  const inputRef = useRef(null);

  // Load saved member credentials from localStorage & load gym details
  useEffect(() => {
    const saved = localStorage.getItem('feeorbit_saved_identifier');
    if (saved) {
      setIdentifier(saved);
    }

    const fetchGymInfo = async () => {
      try {
        const id = gymIdParam || 'default';
        const res = await fetch(`/api/attendance/gym-qr/${id}`);
        const data = await res.json();
        if (data.success && data.gym) {
          setGymData(data.gym);
        }
      } catch (e) {
        console.log('Error fetching gym:', e);
      }
    };

    fetchGymInfo();
  }, [gymIdParam]);

  // Handle countdown timer when cooldown is active
  useEffect(() => {
    if (cooldownTimeRemaining <= 0) return;

    const interval = setInterval(() => {
      setCooldownTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownTimeRemaining]);

  // Live timer for active workout
  useEffect(() => {
    if (result?.action === 'check-in' && result?.attendance?.checkIn) {
      const interval = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(result.attendance.checkIn).getTime()) / 1000);
        setWorkoutDurationLive(diff);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [result]);

  const handleAttendanceScan = async (idToUse) => {
    const targetId = (idToUse || identifier).trim();
    if (!targetId) {
      setError('Please enter your Member ID or phone number');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('feeorbit_saved_identifier', targetId);
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/attendance/qr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetId,
          gymId: gymIdParam || gymData?._id,
        }),
      });

      const data = await res.json();

      if (data.action === 'cooldown') {
        // Cooldown active (< 5 minutes)
        setResult(data);
        setCooldownTimeRemaining(data.remainingSeconds || 300);
      } else if (data.success) {
        setResult(data);
        setCooldownTimeRemaining(0);

        if (data.action === 'check-in') {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#10b981', '#38bdf8', '#fbbf24'],
          });
        }
      } else {
        setError(data.message || 'Verification failed. Please try again.');
        setResult(null);
      }
    } catch (err) {
      setError('Connection to gym server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScannerSuccess = (scannedText) => {
    setShowScannerModal(false);
    // Parse if it is a JSON payload or URL
    try {
      if (scannedText.includes('gym=')) {
        const urlParams = new URLSearchParams(scannedText.split('?')[1]);
        const gId = urlParams.get('gym');
        if (gId) {
          // If member ID is already filled, submit
          if (identifier) {
            handleAttendanceScan(identifier);
          }
        }
      } else if (scannedText.startsWith('{') && scannedText.includes('GYM_ATTENDANCE')) {
        const parsed = JSON.parse(scannedText);
        if (parsed.gymId && identifier) {
          handleAttendanceScan(identifier);
        }
      } else {
        // Assume scannedText is a member ID or token
        setIdentifier(scannedText);
        handleAttendanceScan(scannedText);
      }
    } catch (e) {
      if (identifier) {
        handleAttendanceScan(identifier);
      }
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #141b2e 0%, #080b14 100%)',
        color: '#f8fafc',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Top Floating Navigation Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          id="btn-scan-back-top"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#f8fafc',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
            e.currentTarget.style.borderColor = '#818cf8';
            e.currentTarget.style.transform = 'translateX(-3px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <ArrowLeft size={16} /> Back to {user?.role === 'member' ? 'Member Portal' : user?.role === 'superadmin' ? 'SuperAdmin' : 'Dashboard'}
        </button>

        <button
          type="button"
          onClick={handleBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 14px',
            borderRadius: '10px',
            color: '#94a3b8',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <Home size={14} />
          <span>{user?.role === 'member' ? 'Portal' : 'Home'}</span>
        </button>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '20px',
          padding: '24px 20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)',
        }}
      >
        {/* Card Header Top Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              fontSize: '0.76rem',
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
              e.currentTarget.style.borderColor = '#818cf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#cbd5e1';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {user?.role === 'member' ? 'Athlete Access' : 'Touchless Kiosk'}
          </span>
        </div>

        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
              marginBottom: '10px',
            }}
          >
            <QrCode size={26} color="#fff" />
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            {gymData?.name || 'Smart Attendance'}
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {gymData?.tagline || 'Contactless Mobile Check-In & Check-Out'}
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '0.72rem',
              color: '#818cf8',
              fontWeight: 700,
              marginTop: '8px',
            }}
          >
            <ShieldCheck size={14} /> 5-Minute Accidental Exit Protection Active
          </div>
        </div>

        {/* Cooldown Protection Alert Banner */}
        {result?.action === 'cooldown' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.25))',
              border: '1.5px solid rgba(245, 158, 11, 0.5)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                marginBottom: '8px',
              }}
            >
              <AlertTriangle size={22} />
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fef3c7', marginBottom: '4px' }}>
              Already Checked In!
            </div>
            <div style={{ fontSize: '0.82rem', color: '#fde68a', lineHeight: 1.4, marginBottom: '12px' }}>
              You recently checked in at{' '}
              <strong>
                {new Date(result.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
              . To prevent accidental double-tap checkout, checkout is unlocked after 5 minutes.
            </div>

            {/* Countdown Badge */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '10px',
                padding: '10px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Clock size={18} color="#fbbf24" />
              <div>
                <div style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase' }}>
                  Checkout Available In
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>
                  {formatSeconds(cooldownTimeRemaining)}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: '12px' }}>
              Enjoy your workout! Scan again once your training is done.
            </div>

            <button
              type="button"
              onClick={handleBack}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fef3c7',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)')}
            >
              <ArrowLeft size={15} /> Return to {user?.role === 'member' ? 'Member Portal' : 'Dashboard'}
            </button>
          </div>
        )}

        {/* Check-In Success Display */}
        {result?.action === 'check-in' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))',
              border: '1.5px solid rgba(16, 185, 129, 0.5)',
              borderRadius: '14px',
              padding: '18px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                marginBottom: '8px',
              }}
            >
              <CheckCircle2 size={24} />
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ecfdf5' }}>
              Check-In Successful!
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
              Welcome, {result.member?.fullName}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Entry Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {result.member?.plan || 'Active Membership'}
            </div>

            {/* Live Workout Elapsed Counter */}
            <div
              style={{
                marginTop: '14px',
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Flame size={16} color="#fbbf24" />
              <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>Workout Session Active:</span>
              <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#38bdf8' }}>
                {formatSeconds(workoutDurationLive)}
              </span>
            </div>

            {result.warning && (
              <div style={{ fontSize: '0.74rem', color: '#f87171', marginTop: '8px' }}>
                {result.warning}
              </div>
            )}

            <button
              type="button"
              onClick={handleBack}
              style={{
                marginTop: '14px',
                width: '100%',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)')}
            >
              <ArrowLeft size={15} /> Return to {user?.role === 'member' ? 'Member Portal' : 'Dashboard'}
            </button>
          </div>
        )}

        {/* Check-Out Success Display */}
        {result?.action === 'check-out' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(56, 189, 248, 0.2))',
              border: '1.5px solid rgba(99, 102, 241, 0.5)',
              borderRadius: '14px',
              padding: '18px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#6366f1',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
                marginBottom: '8px',
              }}
            >
              <Sparkles size={22} />
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff' }}>
              Checked Out Successfully!
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#a5b4fc', marginTop: '2px' }}>
              Great job today, {result.member?.fullName}!
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginTop: '14px',
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '0.8rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Total Session</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#38bdf8' }}>
                  {result.durationMinutes} mins
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Exit Time</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                  {new Date(result.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBack}
              style={{
                marginTop: '14px',
                width: '100%',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.25)',
                border: '1px solid rgba(99, 102, 241, 0.5)',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)')}
            >
              <ArrowLeft size={15} /> Return to {user?.role === 'member' ? 'Member Portal' : 'Dashboard'}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '12px 14px',
              color: '#f87171',
              fontSize: '0.84rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Member Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAttendanceScan();
          }}
        >
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Enter Member ID or Registered Phone
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. TF-1001 or 9876543210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{
                width: '100%',
                padding: '13px 16px',
                fontSize: '1.05rem',
                fontWeight: 600,
                background: '#0b0f19',
                border: '1.5px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '12px',
                color: '#ffffff',
                outline: 'none',
                letterSpacing: '0.02em',
              }}
              required
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              fontSize: '0.8rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
              />
              Remember me on this device
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 800,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin-animation" /> Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Mark Check-In / Check-Out
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowScannerModal(true)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.88rem',
                fontWeight: 600,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Camera size={16} /> Open Camera Scanner
            </button>
          </div>
        </form>

        {/* Footer info & Back Button */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={12} />
            <span>FeeOrbit Touchless Attendance System</span>
          </div>

          <button
            type="button"
            onClick={handleBack}
            id="btn-scan-back-footer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#c7d2fe',
              padding: '8px 18px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#818cf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
              e.currentTarget.style.color = '#c7d2fe';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
            }}
          >
            <ArrowLeft size={14} /> Back to {user?.role === 'member' ? 'Member Portal' : user?.role === 'superadmin' ? 'SuperAdmin' : 'Dashboard'}
          </button>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      <QRScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanSuccess={handleScannerSuccess}
      />
    </div>
  );
}

export default function MobileScanAttendancePage() {
  return (
    <Suspense
      fallback={<FeeOrbitLoadingScreen message="Initializing FeeOrbit Smart Attendance..." />}
    >
      <MobileScanAttendanceContent />
    </Suspense>
  );
}
