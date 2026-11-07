'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import FeeOrbitLogo from './FeeOrbitLogo';
import NearbyGymsExplorer from './NearbyGymsExplorer';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Calendar,
  CreditCard,
  Users,
  Dumbbell,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Lock,
  Flame,
  ChevronDown,
  Building2,
  Clock,
  QrCode,
  DollarSign,
  Gift,
  ExternalLink,
  ChevronRight,
  Star,
  RefreshCw,
  Award,
  Volume2,
  VolumeX,
  Play,
  Check,
  Send,
  Sliders,
  Smartphone,
  Info,
  CalendarDays,
  Snowflake,
  ShieldAlert,
  Menu,
  X,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ================= INTERACTIVE MINI-WIDGET STATES =================

  // 1. WhatsApp Simulator State
  const [waPaid, setWaPaid] = useState(false);
  const [waSending, setWaSending] = useState(false);

  // 2. Kiosk Simulator State
  const [kioskStatus, setKioskStatus] = useState('idle'); // 'idle' | 'checking' | 'success'
  const [kioskSoundEnabled, setKioskSoundEnabled] = useState(true);
  const [floorCount, setFloorCount] = useState(42);

  // 3. Membership Pause Simulator State
  const [freezeDays, setFreezeDays] = useState(15);
  const [isFrozen, setIsFrozen] = useState(false);

  // 4. AI Coach Simulator State
  const [aiSplitGoal, setAiSplitGoal] = useState('hypertrophy'); // 'hypertrophy' | 'fatloss' | 'strength'

  // 5. Interactive ROI Calculator State
  const [memberCount, setMemberCount] = useState(280);
  const [avgFee, setAvgFee] = useState(1600);

  // 6. Pricing Interval State
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

  // 7. Active Feature Bento Tab
  const [activeBentoTab, setActiveBentoTab] = useState(0);

  // 8. Active FAQ Accordion
  const [openFaq, setOpenFaq] = useState(null);

  // 9. Interactive Pricing Matrix State
  const [matrixCategory, setMatrixCategory] = useState('all');
  const [matrixSearch, setMatrixSearch] = useState('');

  // 10. Solutions Dropdown State & Mobile Nav State
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const solutionsTimeoutRef = useRef(null);

  const handleSolutionsEnter = () => {
    if (solutionsTimeoutRef.current) clearTimeout(solutionsTimeoutRef.current);
    setSolutionsOpen(true);
  };

  const handleSolutionsLeave = () => {
    if (solutionsTimeoutRef.current) clearTimeout(solutionsTimeoutRef.current);
    solutionsTimeoutRef.current = setTimeout(() => {
      setSolutionsOpen(false);
    }, 250);
  };

  const handleSolutionSelect = (tabIndex) => {
    if (solutionsTimeoutRef.current) clearTimeout(solutionsTimeoutRef.current);
    setSolutionsOpen(false);
    setActiveBentoTab(tabIndex);
    const el = document.getElementById('interactive-lab');
    if (el) {
      const navOffset = 85;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - navOffset,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    return () => {
      if (solutionsTimeoutRef.current) clearTimeout(solutionsTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#whatsapp-demo') setActiveBentoTab(0);
      else if (hash === '#kiosk-demo') setActiveBentoTab(1);
      else if (hash === '#panchang-demo') setActiveBentoTab(2);
      else if (hash === '#freeze-demo') setActiveBentoTab(3);
      else if (hash === '#ai-coach-demo') setActiveBentoTab(4);
    }
  }, []);

  // 11. Sticky Navbar Scroll State
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sound Synthesizer (Zero External Dependencies)
  const playChime = () => {
    if (!kioskSoundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // AudioCtx policy fallback
    }
  };

  // Kiosk Check-In Trigger
  const handleSimulateKiosk = () => {
    if (kioskStatus === 'checking') return;
    setKioskStatus('checking');

    setTimeout(() => {
      setKioskStatus('success');
      setFloorCount((c) => c + 1);
      playChime();

      setTimeout(() => {
        setKioskStatus('idle');
      }, 3500);
    }, 450);
  };

  // WhatsApp Pay Trigger
  const handleSimulateWaPayment = () => {
    setWaSending(true);
    setTimeout(() => {
      setWaSending(false);
      setWaPaid(true);
    }, 700);
  };

  // ROI Calculations (Indian Gym Economics)
  const monthlyRevenue = memberCount * avgFee;
  const estimatedUncollectedLost = Math.round(monthlyRevenue * 0.18); // 18% typical uncollected dues in Indian gyms
  const annualSavedWithFeeOrbit = Math.round(estimatedUncollectedLost * 12 * 0.94); // 94% recovered through automation

  // Protected Feature Navigation (Requires Valid Free Trial or Sign In)
  const handleLaunchProtected = (targetPath = '/') => {
    if (user) {
      router.push(targetPath);
    } else {
      router.push('/signup');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#07090e',
        color: '#f8fafc',
        fontFamily: 'var(--font-primary, system-ui, -apple-system, sans-serif)',
        overflowX: 'clip',
        position: 'relative',
      }}
    >
      {/* ================= BACKGROUND CYBERNETIC MESH & HOLOGRAPHIC LIGHTING ================= */}
      {/* Top Ambient Horizon Halo */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1300px',
          height: '650px',
          background: 'radial-gradient(ellipse 900px 500px at 50% 0%, rgba(30, 58, 138, 0.35) 0%, rgba(14, 165, 233, 0.12) 40%, rgba(7, 10, 19, 0) 75%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Futuristic Cyber Perspective Grid */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1000px',
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 20%, black 15%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 20%, black 15%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Holographic Core Emitter (Behind Left 3D Platform) */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '10%',
          width: '650px',
          height: '650px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(56, 189, 248, 0.14) 40%, transparent 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Warm Ambient Flare (Behind Right Headline) */}
      <div
        style={{
          position: 'absolute',
          top: '120px',
          right: '5%',
          width: '550px',
          height: '550px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(249, 115, 22, 0.06) 35%, transparent 65%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Bottom-Left Organic Cyan/Emerald Glow Curve */}
      <svg
        style={{
          position: 'absolute',
          left: '-20px',
          top: '320px',
          width: '260px',
          height: '460px',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'visible',
        }}
        viewBox="0 0 260 460"
        fill="none"
      >
        <defs>
          <linearGradient id="auroraCurveGrad" x1="0%" y1="100%" x2="60%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="30%" stopColor="#10b981" stopOpacity="0.55" />
            <stop offset="65%" stopColor="#06b6d4" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <filter id="auroraGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="1.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M -20 460 C 70 380 90 280 65 180 C 45 100 20 40 -10 0"
          stroke="url(#auroraCurveGrad)"
          strokeWidth="2.8"
          filter="url(#auroraGlowFilter)"
        />
      </svg>

      {/* Dynamic Keyframes & Responsive Classes */}
      <style>{`
        @keyframes feeorbitFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(0.15deg); }
        }
        @keyframes feeorbitAuraPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.1); }
        }
        @keyframes feeorbitLaserScan {
          0% { top: 6%; opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { top: 92%; opacity: 0; }
        }
        @keyframes feeorbitSparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes feeorbitShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .feeorbit-container {
          max-width: 1240px;
          width: 100%;
          margin-left: auto;
          margin-right: auto;
          padding-left: 24px;
          padding-right: 24px;
          box-sizing: border-box;
        }
        @media (max-width: 640px) {
          .feeorbit-container {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
        .feeorbit-hero-grid {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 52px;
          align-items: center;
          text-align: left;
        }
        .feeorbit-nav-dock {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          padding: 4px 6px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .feeorbit-nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          padding: 8px 18px;
          border-radius: 9999px;
          border: 1px solid transparent;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .feeorbit-nav-link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.14);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4), 0 0 14px rgba(56, 189, 248, 0.12);
        }
        .feeorbit-nav-dashboard-btn {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(56, 189, 248, 0.24);
          color: #e2e8f0;
          border-radius: 9999px;
          padding: 9px 20px;
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(56, 189, 248, 0.06);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feeorbit-nav-dashboard-btn:hover {
          background: rgba(30, 41, 59, 0.85);
          border-color: rgba(56, 189, 248, 0.55);
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 18px rgba(56, 189, 248, 0.25);
          transform: translateY(-2px);
        }
        .feeorbit-nav-login-btn {
          color: #cbd5e1;
          text-decoration: none;
          font-size: 0.86rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          padding: 9px 20px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .feeorbit-nav-login-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(56, 189, 248, 0.45);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 14px rgba(56, 189, 248, 0.15);
          transform: translateY(-2px);
        }
        .feeorbit-nav-cta {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
          color: #070a13 !important;
          font-weight: 800;
          padding: 10px 24px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 22px rgba(245, 158, 11, 0.5), 0 0 18px rgba(251, 191, 36, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.6);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          letter-spacing: 0.01em;
        }
        .feeorbit-nav-cta:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 32px rgba(245, 158, 11, 0.75), 0 0 26px rgba(251, 191, 36, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.75);
        }
        .feeorbit-btn-primary {
          background: linear-gradient(135deg, #ff6b00 0%, #f97316 45%, #ea580c 100%);
          color: #ffffff !important;
          border: 1px solid rgba(255, 200, 150, 0.35);
          box-shadow: 0 10px 32px rgba(249, 115, 22, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.45);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feeorbit-btn-primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 16px 42px rgba(249, 115, 22, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }
        .feeorbit-btn-glass {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(56, 189, 248, 0.28);
          color: #f8fafc;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 0 14px rgba(56, 189, 248, 0.06);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feeorbit-btn-glass:hover {
          background: rgba(30, 41, 59, 0.85);
          border-color: rgba(56, 189, 248, 0.6);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.25);
        }
        .feeorbit-feature-card {
          background: rgba(13, 18, 32, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 22px 20px;
          backdrop-filter: blur(14px);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feeorbit-feature-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.35);
          box-shadow: 0 16px 36px -12px rgba(0, 0, 0, 0.6), 0 0 24px rgba(99, 102, 241, 0.12);
        }

        /* Cyber Chrome Typography & Neon Bloom Accents */
        .feeorbit-title-chrome {
          background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 55%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .feeorbit-glow-emerald {
          background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 28px rgba(52, 211, 153, 0.4);
        }
        .feeorbit-glow-cyan {
          background: linear-gradient(135deg, #38bdf8 0%, #22d3ee 50%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 28px rgba(56, 189, 248, 0.4);
        }
        .feeorbit-glow-gold {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 28px rgba(245, 158, 11, 0.4);
        }
        .feeorbit-glow-purple {
          background: linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 28px rgba(168, 85, 247, 0.4);
        }

        /* Telemetry Eyebrow Badges */
        .feeorbit-telemetry-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(56, 189, 248, 0.28);
          border-radius: 9999px;
          padding: 4px 14px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #38bdf8;
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          margin-bottom: 12px;
        }

        /* Futuristic Cyber Glass Cards */
        .feeorbit-cyber-panel {
          background: linear-gradient(145deg, rgba(13, 20, 36, 0.75) 0%, rgba(8, 12, 22, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 20px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feeorbit-cyber-panel:hover {
          border-color: rgba(56, 189, 248, 0.35);
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.75), 0 0 35px rgba(56, 189, 248, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        /* Interactive Tab Buttons */
        .feeorbit-tab-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .feeorbit-tab-pill-active {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.28) 100%);
          border: 1px solid rgba(56, 189, 248, 0.55);
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        .feeorbit-tab-pill-inactive {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
        }
        .feeorbit-tab-pill-inactive:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.16);
          color: #ffffff;
        }

        /* Cyber Accordion Card */
        .feeorbit-faq-card {
          background: rgba(11, 16, 29, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feeorbit-faq-card:hover {
          border-color: rgba(56, 189, 248, 0.3);
          background: rgba(14, 21, 38, 0.8);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.08);
        }
        .feeorbit-faq-card-open {
          border-color: rgba(56, 189, 248, 0.5) !important;
          background: rgba(15, 23, 42, 0.9) !important;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(56, 189, 248, 0.15) !important;
        }
        @media (max-width: 990px) {
          .feeorbit-hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
          }
          .feeorbit-hero-left,
          .feeorbit-hero-right {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-left: 0 !important;
          }
          .feeorbit-hero-right {
            order: 1;
          }
          .feeorbit-hero-left {
            order: 2;
          }
          .feeorbit-hero-ctas {
            justify-content: center !important;
          }
          .feeorbit-trust-row {
            justify-content: center !important;
          }
        }
        @media (max-width: 860px) {
          .feeorbit-desktop-nav {
            display: none !important;
          }
          .feeorbit-mobile-toggle {
            display: flex !important;
          }
        }
        @media (min-width: 861px) {
          .feeorbit-mobile-toggle {
            display: none !important;
          }
          .feeorbit-mobile-menu {
            display: none !important;
          }
        }
      `}</style>

      {/* ================= 1. CLEAN TOP NAVIGATION BAR (STICKY FUTURISTIC BLADE) ================= */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          width: '100%',
          background: scrolled
            ? 'rgba(6, 9, 18, 0.88)'
            : 'rgba(6, 9, 18, 0.65)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderBottom: scrolled
            ? '1px solid rgba(56, 189, 248, 0.18)'
            : '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: scrolled
            ? '0 16px 40px -10px rgba(0, 0, 0, 0.9), 0 0 25px rgba(56, 189, 248, 0.08)'
            : 'none',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: scrolled ? '11px 0' : '16px 0',
        }}
      >
        {/* Top Holographic Micro-Edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.45) 30%, rgba(99, 102, 241, 0.5) 50%, rgba(52, 211, 153, 0.45) 70%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        <div
          className="feeorbit-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand Logo with Pulsing Halo (Larger, No 12.6 Badge) */}
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              position: 'relative',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-10px',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, rgba(99, 102, 241, 0.12) 50%, transparent 70%)',
                filter: 'blur(12px)',
                pointerEvents: 'none',
              }}
            />
            <FeeOrbitLogo size="lg" variant="full" showBadge={false} animated={true} />
          </Link>

          {/* Desktop Nav Items housed in Futuristic Glass Capsule Dock */}
          <nav className="feeorbit-desktop-nav feeorbit-nav-dock">
            {/* Solutions Dropdown */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={handleSolutionsEnter}
              onMouseLeave={handleSolutionsLeave}
            >
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                className="feeorbit-nav-link"
                style={{
                  background: solutionsOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  borderColor: solutionsOpen ? 'rgba(56, 189, 248, 0.35)' : 'transparent',
                  color: solutionsOpen ? '#ffffff' : '#94a3b8',
                }}
              >
                <span>Solutions</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: solutionsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    color: solutionsOpen ? '#38bdf8' : '#94a3b8',
                  }}
                />
              </button>

              {solutionsOpen && (
                <div
                  onMouseEnter={handleSolutionsEnter}
                  onMouseLeave={handleSolutionsLeave}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    paddingTop: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 110,
                  }}
                >
                  <div
                    style={{
                      width: '330px',
                      background: 'rgba(7, 11, 22, 0.98)',
                      backdropFilter: 'blur(28px)',
                      WebkitBackdropFilter: 'blur(28px)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '18px',
                      padding: '10px',
                      boxShadow: '0 24px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <a
                      href="#interactive-lab"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSolutionSelect(1);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        color: '#cbd5e1',
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                    >
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                        <QrCode size={18} />
                      </div>
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 700 }}>QR Attendance Kiosk</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Hardware-free tablet reception check-in</div>
                      </div>
                    </a>

                    <a
                      href="#interactive-lab"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSolutionSelect(0);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        color: '#cbd5e1',
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                    >
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 700 }}>Automated WhatsApp</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Direct UPI fee chaser & receipts</div>
                      </div>
                    </a>

                    <a
                      href="#interactive-lab"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSolutionSelect(2);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        color: '#cbd5e1',
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                    >
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                        <CalendarDays size={18} />
                      </div>
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 700 }}>Panchang & Freezes</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Indian calendar sync & 15-day hold</div>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a
              href="#find-gyms"
              className="feeorbit-nav-link"
              style={{
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                borderColor: 'rgba(56, 189, 248, 0.3)',
              }}
            >
              📍 Find Gyms Near You
            </a>
            <a href="#why-indian-gyms" className="feeorbit-nav-link">
              Why Indian Gyms
            </a>
            <a href="#pricing" className="feeorbit-nav-link">
              Pricing
            </a>
            <a href="#faq" className="feeorbit-nav-link">
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Authenticated: Go to Dashboard | Unauthenticated: Sign In */}
            {user ? (
              <button
                onClick={() => router.push('/')}
                className="feeorbit-desktop-nav feeorbit-nav-dashboard-btn"
              >
                <span>Go to Dashboard</span>
                <ChevronRight size={14} style={{ color: '#38bdf8' }} />
              </button>
            ) : (
              <Link
                href="/login"
                className="feeorbit-desktop-nav feeorbit-nav-login-btn"
              >
                <span>Sign In</span>
              </Link>
            )}

            {/* Start Free Trial (Hyper-Luminous Cyber Solar Capsule) */}
            <Link
              href="/signup"
              className="feeorbit-nav-cta"
            >
              <Sparkles size={14} style={{ color: '#070a13' }} />
              <span>Start Free Trial</span>
            </Link>

            {/* Mobile Hamburger Toggle Button */}
            <button
              className="feeorbit-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '8px',
                padding: '8px',
                color: '#f8fafc',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div
            className="feeorbit-mobile-menu"
            style={{
              padding: '16px 24px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(7, 10, 19, 0.98)',
              backdropFilter: 'blur(24px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <a href="#why-indian-gyms" onClick={() => setMobileMenuOpen(false)} className="feeorbit-nav-item">Why Indian Gyms</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="feeorbit-nav-item">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="feeorbit-nav-item">FAQ</a>
            {user ? (
              <button
                onClick={() => { setMobileMenuOpen(false); router.push('/'); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>Go to Dashboard</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>Sign In</span>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ================= 2. HERO SECTION ================= */}
      {/* ================= 2. FULL-WIDTH HERO SECTION (Ultra-Futuristic Cyber Cockpit) ================= */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          padding: '44px 0 40px',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse 95% 80% at 26% 50%, #0d1e28 0%, #091320 38%, #070a13 75%, #04060b 100%)',
          zIndex: 1,
        }}
      >
        <div className="feeorbit-container">
          {/* Two-Column Grid: Left 3D Platform + Right Headline & CTAs */}
          <div className="feeorbit-hero-grid" style={{ alignItems: 'center' }}>
            {/* Left Column: Seamless 3D Isometric Motherboard Cockpit with HUD Telemetry */}
            <div
              className="feeorbit-hero-left"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {/* Outer Ambient Glow Pulsing */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-12%',
                  background: 'radial-gradient(circle at 45% 50%, rgba(52, 211, 153, 0.28) 0%, rgba(56, 189, 248, 0.16) 40%, transparent 70%)',
                  filter: 'blur(65px)',
                  pointerEvents: 'none',
                  zIndex: 0,
                  animation: 'feeorbitAuraPulse 7s ease-in-out infinite',
                }}
              />

              {/* Holographic Laser Scanning Line over Cockpit */}
              <div
                style={{
                  position: 'absolute',
                  left: '6%',
                  right: '6%',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.4) 15%, #34d399 50%, rgba(56, 189, 248, 0.4) 85%, transparent 100%)',
                  boxShadow: '0 0 16px rgba(52, 211, 153, 0.9), 0 0 30px rgba(56, 189, 248, 0.6)',
                  zIndex: 2,
                  pointerEvents: 'none',
                  animation: 'feeorbitLaserScan 6s ease-in-out infinite alternate',
                }}
              />

              {/* Floating Cyber Telemetry Card: Top-Left Kernel Status */}
              <div
                style={{
                  position: 'absolute',
                  top: '5%',
                  left: '2%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(7, 12, 24, 0.88)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 16px rgba(56, 189, 248, 0.2)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  zIndex: 3,
                  fontFamily: 'monospace',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 10px #10b981',
                    display: 'inline-block',
                    animation: 'feeorbitSparkle 2s ease-in-out infinite',
                  }}
                />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.08em' }}>SYS::KERNEL_ONLINE</span>
                <span style={{ fontSize: '0.64rem', color: '#64748b' }}>[0.18ms LATENCY]</span>
              </div>

              {/* Floating Cyber Telemetry Card: Top-Right Kiosk QR Ping */}
              <div
                style={{
                  position: 'absolute',
                  top: '3%',
                  right: '3%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '6px 13px',
                  borderRadius: '8px',
                  background: 'rgba(7, 12, 24, 0.88)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 16px rgba(52, 211, 153, 0.2)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  zIndex: 3,
                  fontFamily: 'monospace',
                }}
              >
                <QrCode size={13} style={{ color: '#34d399' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.05em' }}>0.3s QR KIOSK</span>
              </div>

              {/* The 3D Cockpit Image (Frameless, Zero Card, Floating Seamlessly on Left) */}
              <img
                src="/hero-cockpit.png"
                alt="FeeOrbit 3D Cloud Operating System Architecture"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'block',
                  width: '100%',
                  maxWidth: '720px',
                  height: 'auto',
                  mixBlendMode: 'screen',
                  WebkitMaskImage: 'radial-gradient(ellipse 95% 93% at 50% 50%, black 72%, transparent 100%)',
                  maskImage: 'radial-gradient(ellipse 95% 93% at 50% 50%, black 72%, transparent 100%)',
                  filter: 'drop-shadow(0 24px 60px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 45px rgba(52, 211, 153, 0.16))',
                  animation: 'feeorbitFloat 6s ease-in-out infinite',
                }}
              />
            </div>

            {/* Right Column: Heading, Subcopy, CTAs */}
            <div className="feeorbit-hero-right" style={{ maxWidth: '620px', paddingLeft: '16px' }}>
              {/* Cyber HUD Eyebrow Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 18px',
                  borderRadius: '999px',
                  background: 'rgba(10, 16, 32, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  boxShadow: '0 0 25px rgba(56, 189, 248, 0.2), inset 0 0 14px rgba(56, 189, 248, 0.1)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  marginBottom: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#34d399',
                      boxShadow: '0 0 12px #34d399, 0 0 20px #34d399',
                      display: 'inline-block',
                      animation: 'feeorbitSparkle 2s ease-in-out infinite',
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#38bdf8', fontFamily: 'monospace' }}>
                    FEEORBIT KERNEL v12.6
                  </span>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '0.75rem' }}>//</span>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.03em' }}>
                  Next-Gen Indian Gym Infrastructure
                </span>
              </div>

              {/* Hero Headline (Titanium Metallic Chrome + Emerald Laser + Solar Gold Neon) */}
              <h1
                style={{
                  fontSize: 'clamp(3rem, 4.8vw, 4.6rem)',
                  fontWeight: 900,
                  lineHeight: 1.08,
                  letterSpacing: '-0.04em',
                  margin: '0 0 24px 0',
                }}
              >
                <span
                  style={{
                    background: 'linear-gradient(180deg, #FFFFFF 15%, #E2E8F0 60%, #94A3B8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                  }}
                >
                  The Operating System for Gyms
                </span>
                <br />
                <span
                  style={{
                    background: 'linear-gradient(180deg, #FFFFFF 15%, #CBD5E1 65%, #94A3B8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                  }}
                >
                  That
                </span>{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 30px rgba(52, 211, 153, 0.8))',
                    display: 'inline-block',
                  }}
                >
                  Refuse
                </span>{' '}
                <span
                  style={{
                    background: 'linear-gradient(180deg, #FFFFFF 15%, #CBD5E1 65%, #94A3B8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                  }}
                >
                  to
                </span>{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 45%, #fef08a 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 35px rgba(251, 191, 36, 0.85))',
                    display: 'inline-block',
                  }}
                >
                  Lose Money.
                </span>
              </h1>

              {/* Subtitle with High-Tech Highlights */}
              <p
                style={{
                  fontSize: 'clamp(1rem, 1.3vw, 1.12rem)',
                  lineHeight: 1.75,
                  color: '#94a3b8',
                  margin: '0 0 36px 0',
                  fontWeight: 400,
                  maxWidth: '560px',
                }}
              >
                Eliminate paper registers, broken fingerprint machines, and manual UPI chasing. FeeOrbit unites <span style={{ color: '#f1f5f9', fontWeight: 600 }}>Automated WhatsApp fee recovery</span>, <span style={{ color: '#f1f5f9', fontWeight: 600 }}>0.3s tablet QR attendance</span>, <span style={{ color: '#f1f5f9', fontWeight: 600 }}>Hindu Panchang festival calendar sync</span>, and <span style={{ color: '#f1f5f9', fontWeight: 600 }}>15-day membership freeze control</span> in one unified cybernetic dashboard.
              </p>

              {/* Action Buttons */}
              <div
                className="feeorbit-hero-ctas"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  marginBottom: '28px',
                }}
              >
                {/* Primary Glowing Cyber Button */}
                <Link
                  href="/signup"
                  className="feeorbit-btn-primary"
                  style={{
                    padding: '15px 32px',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                  }}
                >
                  <span>Start Free 14-Day Trial</span>
                  <ArrowRight size={18} />
                </Link>

                {/* Secondary Hologram Button */}
                <a
                  href="#cockpit"
                  className="feeorbit-btn-glass"
                  style={{
                    padding: '15px 28px',
                    borderRadius: '12px',
                    fontSize: '0.96rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '9px',
                    cursor: 'pointer',
                    letterSpacing: '0.01em',
                  }}
                >
                  <Play size={13} style={{ fill: '#38bdf8', color: '#38bdf8' }} />
                  <span>Explore Live Cockpit</span>
                </a>
              </div>

              {/* Trust Telemetry Badges */}
              <div
                className="feeorbit-trust-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.82rem',
                    color: '#cbd5e1',
                  }}
                >
                  <Zap size={14} style={{ color: '#38bdf8' }} />
                  <span>14-Day Free Trial</span>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.82rem',
                    color: '#cbd5e1',
                  }}
                >
                  <ShieldCheck size={14} style={{ color: '#34d399' }} />
                  <span>No Card Required</span>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.82rem',
                    color: '#cbd5e1',
                  }}
                >
                  <MessageSquare size={14} style={{ color: '#10b981' }} />
                  <span>Instant WhatsApp Setup</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= NEARBY GYMS & GOOGLE MAPS EXPLORER (FOR NEW USERS) ================= */}
      <NearbyGymsExplorer />

      {/* Feature Highlights Section: "Premium Gym Management, Redefined" */}
      <section
        className="feeorbit-container"
        style={{
          paddingTop: '40px',
          paddingBottom: '0',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            paddingTop: '32px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Section Heading with 4-Point Star */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '32px',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.28rem, 2.4vw, 1.75rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#f8fafc',
                margin: 0,
              }}
            >
              Premium Gym Management, Redefined
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#f59e0b',
                filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.65))',
                lineHeight: 1,
              }}
            >
              ✦
            </span>
          </div>

          {/* 4 Feature Columns Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '18px',
              textAlign: 'left',
            }}
          >
            {/* Card 1: Automated WhatsApp */}
            <div className="feeorbit-feature-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid rgba(16, 185, 129, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                  }}
                >
                  <MessageSquare size={16} />
                </div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Automated WhatsApp
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.55, margin: 0 }}>
                Automated WhatsApp to proactively collect dues, send receipts & renewal payment links.
              </p>
            </div>

            {/* Card 2: QR Attendance */}
            <div className="feeorbit-feature-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.14)',
                    border: '1px solid rgba(56, 189, 248, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <QrCode size={16} />
                </div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  QR Attendance
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.55, margin: 0 }}>
                Frictionless minute-by-minute tablet attendance that never breaks or misreads.
              </p>
            </div>

            {/* Card 3: Calendar */}
            <div className="feeorbit-feature-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.14)',
                    border: '1px solid rgba(245, 158, 11, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                  }}
                >
                  <CalendarDays size={16} />
                </div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Calendar
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.55, margin: 0 }}>
                Accurate Hindu Panchang & holiday sync for precision membership validity calculation.
              </p>
            </div>

            {/* Card 4: 0% Fee UPI */}
            <div className="feeorbit-feature-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.14)',
                    border: '1px solid rgba(139, 92, 246, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a78bfa',
                  }}
                >
                  <Zap size={16} />
                </div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Direct UPI (0% Fees)
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.55, margin: 0 }}>
                Direct member payments instantly to your bank account with zero gateway commissions.
              </p>
            </div>
          </div>
        </div>

        {/* ================= HERO LIVE GYM COCKPIT (CYBERNETIC SYSTEM HUD) ================= */}
        <div
          id="cockpit"
          className="feeorbit-cyber-panel"
          style={{
            marginTop: '64px',
            position: 'relative',
            padding: '2px',
            background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.35) 0%, rgba(99, 102, 241, 0.2) 35%, rgba(15, 23, 42, 0.6) 100%)',
            boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.85), 0 0 50px rgba(56, 189, 248, 0.15)',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(145deg, #070b14 0%, #05080f 100%)',
              borderRadius: '18px',
              overflow: 'hidden',
              padding: '24px',
              textAlign: 'left',
              position: 'relative',
            }}
          >
            {/* Top Scanning Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.6) 50%, transparent 100%)',
              }}
            />

            {/* Window Top Header with Telemetry HUD */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)' }} />
                </div>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, fontFamily: 'monospace' }}>
                  FeeOrbit Cockpit <span style={{ color: '#64748b' }}>//</span> Iron Core Fitness (Bengaluru HQ)
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#34d399',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    letterSpacing: '0.06em',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
                  }}
                >
                  ● KERNEL ONLINE
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.04)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  Floor Occupancy: <strong style={{ color: '#38bdf8' }}>{floorCount} Active Members</strong>
                </span>
                <button
                  onClick={() => handleLaunchProtected('/')}
                  className="feeorbit-nav-login-btn"
                  style={{ padding: '6px 14px', fontSize: '0.74rem', cursor: 'pointer' }}
                >
                  <span>Test-Drive All Modules</span>
                  <ExternalLink size={12} style={{ color: '#38bdf8' }} />
                </button>
              </div>
            </div>

            {/* Quick Cockpit Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  background: 'rgba(13, 20, 36, 0.65)',
                  border: '1px solid rgba(16, 185, 129, 0.22)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(16, 185, 129, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, #10b981, transparent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600 }}>
                  <span>Active Members</span>
                  <Users size={16} style={{ color: '#10b981' }} />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: '6px', letterSpacing: '-0.02em' }}>1,420</div>
                <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>+18 enrolled this week</div>
              </div>

              <div
                style={{
                  background: 'rgba(13, 20, 36, 0.65)',
                  border: '1px solid rgba(56, 189, 248, 0.22)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(56, 189, 248, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600 }}>
                  <span>Monthly Fee Collected</span>
                  <TrendingUp size={16} style={{ color: '#38bdf8' }} />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: '6px', letterSpacing: '-0.02em' }}>₹8,42,500</div>
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '4px', fontWeight: 600 }}>99.4% automated recovery</div>
              </div>

              <div
                style={{
                  background: 'rgba(13, 20, 36, 0.65)',
                  border: '1px solid rgba(245, 158, 11, 0.22)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(245, 158, 11, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600 }}>
                  <span>Upcoming Festival Off</span>
                  <Calendar size={16} style={{ color: '#f59e0b' }} />
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f59e0b', marginTop: '6px' }}>20 Oct (Dussehra)</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>Panchang Calendar Auto-Synced</div>
              </div>

              <div
                style={{
                  background: 'rgba(13, 20, 36, 0.65)',
                  border: '1px solid rgba(168, 85, 247, 0.22)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(168, 85, 247, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600 }}>
                  <span>Frozen Passes Active</span>
                  <Snowflake size={16} style={{ color: '#a855f7' }} />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>8 Members</div>
                <div style={{ fontSize: '0.7rem', color: '#c084fc', marginTop: '4px', fontWeight: 600 }}>15-day paused (Auto-extends)</div>
              </div>
            </div>

            {/* Hardware Photography & Module Control */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '18px',
                marginBottom: '18px',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  height: '220px',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.1)',
                }}
              >
                <img
                  src="/images/hero_tablet_kiosk.jpg"
                  alt="FeeOrbit Kiosk Terminal on Front Desk"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    right: '10px',
                    background: 'rgba(7, 11, 22, 0.9)',
                    backdropFilter: 'blur(12px)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                  }}
                >
                  <span style={{ color: '#ffffff', fontWeight: 800 }}>Front-Desk Kiosk Terminal</span>
                  <span style={{ color: '#10b981', fontWeight: 800, textShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}>
                    ● 0.3s Instant QR Verification
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(13, 20, 36, 0.55)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  height: '220px',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  Zero Expensive Biometric Hardware Required
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.55, margin: 0 }}>
                  Place any inexpensive Android tablet, phone, or iPad on your reception counter. Members check in using QR or phone number with real audio chimes in 0.3 seconds.
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    onClick={() => handleLaunchProtected('/kiosk')}
                    className="feeorbit-btn-primary"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <QrCode size={14} />
                    <span>Launch Live Kiosk &rarr;</span>
                  </button>
                  <button
                    onClick={() => handleLaunchProtected('/events')}
                    className="feeorbit-btn-glass"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Dussehra (20 Oct) Off
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated Live Activity Feed (Monospace Terminal Ticker) */}
            <div
              style={{
                background: 'rgba(5, 8, 15, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '10px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                <span style={{ color: '#cbd5e1' }}>
                  <strong style={{ color: '#38bdf8' }}>[LIVE EVENT]:</strong> Rohan Verma checked in via Kiosk QR (0.3s) • Floor count updated
                </span>
              </div>
              <div style={{ color: '#818cf8', fontWeight: 700 }}>
                12 WhatsApp receipt PDFs dispatched today
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. INTERACTIVE LAB: TACTILE PRODUCT SIMULATORS ================= */}
      <section
        id="interactive-lab"
        className="feeorbit-container"
        style={{
          marginTop: '50px',
          marginBottom: '90px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="feeorbit-telemetry-badge">
            <Sparkles size={12} />
            <span>// 02 // TACTILE PRODUCT LAB</span>
          </div>
          <h2
            className="feeorbit-title-chrome"
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              marginTop: '4px',
            }}
          >
            Touch, Test & <span className="feeorbit-glow-cyan">Play With FeeOrbit</span> Right Here
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.96rem', maxWidth: '640px', margin: '12px auto 0', lineHeight: 1.6 }}>
            No sales calls. No fake video recordings. Click the interactive tabs below to experience live simulated modules right in your browser.
          </p>
        </div>

        {/* Tab Buttons for the 5 Simulators */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '28px',
          }}
        >
          {[
            { id: 0, label: '💬 WhatsApp Fee Chaser', badge: 'Revenue' },
            { id: 1, label: '📱 Tablet QR Kiosk', badge: 'Front Desk' },
            { id: 2, label: '🕉️ Panchang Calendar', badge: 'Accurate' },
            { id: 3, label: '❄️ 15-Day Freeze Control', badge: 'Retention' },
            { id: 4, label: '⚡ Gemini AI Workout Split', badge: 'Intelligence' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveBentoTab(tab.id)}
              className={`feeorbit-tab-pill ${activeBentoTab === tab.id ? 'feeorbit-tab-pill-active' : 'feeorbit-tab-pill-inactive'}`}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  background: activeBentoTab === tab.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  color: activeBentoTab === tab.id ? '#38bdf8' : '#94a3b8',
                  border: activeBentoTab === tab.id ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                }}
              >
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        {/* SIMULATOR CONTAINER (Bento Cyber Panel) */}
        <div
          className="feeorbit-cyber-panel"
          style={{
            padding: '36px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Glow Orb */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '320px',
              height: '320px',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
              filter: 'blur(50px)',
              pointerEvents: 'none',
            }}
          />
          {/* SIMULATOR 0: WHATSAPP FEE RECOVERY CHAT SIMULATION */}
          {activeBentoTab === 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '36px',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#22c55e',
                    background: 'rgba(34, 197, 94, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                  }}
                >
                  <MessageSquare size={12} />
                  <span>99.4% Automated Recovery</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25, marginBottom: '12px' }}>
                  Zero Awkward Phone Calls. Polite WhatsApp Notices with Direct UPI Payment Links.
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '20px' }}>
                  Indian gym owners lose an average of ₹40,000 every month simply because staff feels hesitant to call members asking for pending dues. FeeOrbit detects expiring memberships 3 days prior and sends courteous, automated WhatsApp messages with 1-click UPI links.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Includes member’s pending balance & customized package name</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Direct UPI deep-links: Google Pay, PhonePe, Paytm, or BHIM</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Instant automated GST tax receipt PDF dispatched immediately upon payment</span>
                  </div>
                </div>

                <button
                  onClick={() => handleLaunchProtected('/billing')}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 22px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.35)',
                  }}
                >
                  <span>Test Live Billing & Dues Module &rarr;</span>
                </button>
              </div>

              {/* Real WhatsApp Phone Mockup */}
              <div
                style={{
                  background: '#0b141a',
                  border: '2px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
                  maxWidth: '380px',
                  margin: '0 auto',
                  width: '100%',
                }}
              >
                {/* WhatsApp Chat Header */}
                <div
                  style={{
                    background: '#202c33',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                      }}
                    >
                      IC
                    </div>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#e9edef', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Iron Core Gym</span>
                        <CheckCircle2 size={12} style={{ color: '#22c55e' }} />
                      </div>
                      <div style={{ fontSize: '0.64rem', color: '#8696a0' }}>Official Verified Business</div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Messages Area */}
                <div style={{ padding: '16px', minHeight: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Incoming Gym Message */}
                  <div
                    style={{
                      background: '#202c33',
                      borderRadius: '10px 10px 10px 2px',
                      padding: '12px',
                      maxWidth: '90%',
                      fontSize: '0.78rem',
                      color: '#d1d7db',
                      lineHeight: 1.5,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div>
                      Namaste <strong>Vikram Ji</strong>! 🙏<br />
                      Quick reminder from <em>Iron Core Fitness Club</em>. Your <strong>Gold Annual Plan</strong> is due for renewal on <strong>15 Oct</strong>.
                    </div>
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '6px 8px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: '6px',
                        borderLeft: '3px solid #22c55e',
                      }}
                    >
                      Pending Amount: <strong style={{ color: '#22c55e' }}>₹2,800</strong><br />
                      Dussehra Early Renewal Perk: <strong>+15 Days Bonus Free</strong>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.62rem', color: '#8696a0', marginTop: '6px' }}>
                      10:42 AM ✓✓
                    </div>
                  </div>

                  {/* Interactive Pay Button inside WhatsApp */}
                  {!waPaid ? (
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                      <button
                        onClick={handleSimulateWaPayment}
                        disabled={waSending}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#00a884',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#111b21',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(0, 168, 132, 0.4)',
                        }}
                      >
                        <Zap size={14} />
                        <span>{waSending ? 'Simulating UPI Transaction...' : 'Tap to Simulate UPI Pay (₹2,800)'}</span>
                      </button>
                      <div style={{ fontSize: '0.64rem', color: '#8696a0', marginTop: '4px' }}>
                        Click to simulate member instant phone payment
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid #22c55e',
                        borderRadius: '8px',
                        padding: '10px',
                        textAlign: 'center',
                        fontSize: '0.74rem',
                        color: '#22c55e',
                        animation: 'fadeIn 0.3s ease',
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>✓ Payment of ₹2,800 Confirmed!</div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.68rem', marginTop: '2px' }}>
                        Automated Tax Invoice #INV-4921 dispatched with new expiry: <strong>15 Nov 2027</strong>.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SIMULATOR 1: FRONT DESK TABLET KIOSK & FAST-LANE QR */}
          {activeBentoTab === 1 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '36px',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                  }}
                >
                  <QrCode size={12} />
                  <span>0.4-Second Velocity</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25, marginBottom: '12px' }}>
                  Turn Any ₹6,000 Tablet or Phone Into a Front Desk Kiosk. Zero Hardware.
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '20px' }}>
                  No more ₹30,000 biometric fingerprint sensors that fail when members have sweaty gym hands. Members simply type their last 4 digits, phone number, or flash their dynamic QR code. Features instant audio greeting chimes!
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Works offline if gym broadband drops momentarily</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Voice greeting: &quot;Welcome back, Rahul! Valid till 20 Dec.&quot;</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Real-time gym floor headcount tracker (Prevent overcrowding)</span>
                  </div>
                </div>

                <button
                  onClick={() => handleLaunchProtected('/kiosk')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 22px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  <span>Launch Live Fullscreen Kiosk Mode &rarr;</span>
                </button>
              </div>

              {/* Tablet Front-Desk Interactive Simulator */}
              <div
                style={{
                  background: '#0f172a',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
                  maxWidth: '400px',
                  margin: '0 auto',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <QrCode size={16} style={{ color: '#10b981' }} />
                    <span>Tablet Kiosk Check-In</span>
                  </div>
                  <button
                    onClick={() => setKioskSoundEnabled(!kioskSoundEnabled)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: kioskSoundEnabled ? '#10b981' : '#64748b',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.66rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {kioskSoundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                    <span>Sound {kioskSoundEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Real Front-Desk Hardware Stand Photo */}
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', height: '140px', marginBottom: '12px' }}>
                  <img
                    src="/images/hero_tablet_kiosk.jpg"
                    alt="Tablet Front Desk Stand"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.62rem', color: '#34d399', fontWeight: 700 }}>
                    ✓ Physical iPad/Tablet Stand on Reception Desk
                  </div>
                </div>

                {/* Simulated Kiosk Screen */}
                <div
                  style={{
                    background: '#070a12',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  {kioskStatus === 'idle' && (
                    <>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '12px' }}>
                        Enter phone or tap below to simulate:
                      </div>
                      <div
                        style={{
                          height: '42px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'monospace',
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          letterSpacing: '3px',
                          color: '#38bdf8',
                          marginBottom: '16px',
                        }}
                      >
                        +91 98450-XXXXX
                      </div>
                      <button
                        onClick={handleSimulateKiosk}
                        style={{
                          width: '100%',
                          padding: '11px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Zap size={14} />
                        <span>Simulate 0.4s Check-In Tap</span>
                      </button>
                    </>
                  )}

                  {kioskStatus === 'checking' && (
                    <div style={{ padding: '20px 0', color: '#818cf8', fontSize: '0.82rem', fontWeight: 600 }}>
                      <RefreshCw size={22} className="spin" style={{ margin: '0 auto 8px' }} />
                      Verifying Gym Membership ID...
                    </div>
                  )}

                  {kioskStatus === 'success' && (
                    <div style={{ padding: '10px 0', animation: 'fadeIn 0.2s ease' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          margin: '0 auto 10px',
                        }}
                      >
                        <Check size={24} />
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                        Welcome, Priya Verma!
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>
                        ✓ Gold Membership Active (Valid till 28 Nov 2026)
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '6px' }}>
                        Live Floor Occupancy: <strong style={{ color: '#38bdf8' }}>{floorCount} Athletes</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SIMULATOR 2: HINDU PANCHANG & DUSSEHRA CALENDAR */}
          {activeBentoTab === 2 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '36px',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#f59e0b',
                    background: 'rgba(245, 158, 11, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                  }}
                >
                  <CalendarDays size={12} />
                  <span>100% Panchang Accurate</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25, marginBottom: '12px' }}>
                  Accurate Hindu Panchang Dates (Dussehra 20 Oct) & Automated Member Birthdays.
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '20px' }}>
                  Never get Indian festival dates wrong again. Built-in Government of India gazetted calendar and Hindu Panchang (Dussehra precisely on 20 October 2026, Diwali on 8 November 2026). Broadcast holiday gym closures and wish members on their birthdays with 1 click.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Dussehra (Vijayadashami) mapped accurately to 20 Oct 2026</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Schedule partial gym maintenance or festival off-days in 10 seconds</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Auto-detect member birthdays and send WhatsApp discount vouchers</span>
                  </div>
                </div>

                <button
                  onClick={() => handleLaunchProtected('/events')}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 22px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                  }}
                >
                  <span>Explore Events & Panchang Calendar &rarr;</span>
                </button>
              </div>

              {/* Festive Card Interactive Preview */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                  maxWidth: '380px',
                  margin: '0 auto',
                  width: '100%',
                }}
              >
                {/* Real Dussehra Festive Gym Setup Photo */}
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(245, 158, 11, 0.3)', height: '140px', marginBottom: '14px' }}>
                  <img
                    src="/images/dussehra_festive_gym.jpg"
                    alt="Dussehra Celebration in Indian Gym"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.62rem', color: '#fbbf24', fontWeight: 700 }}>
                    🪔 Shubh Vijayadashami • Front-Desk Festive Puja
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: '#f59e0b' }}>
                    <span>🪔</span>
                    <span>Upcoming Major Festival</span>
                  </div>
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    GYM CLOSED
                  </span>
                </div>

                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  Dussehra (Vijayadashami)
                </div>
                <div style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 600, marginBottom: '14px' }}>
                  Tuesday, 20 October 2026
                </div>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '0.74rem',
                    color: '#cbd5e1',
                    lineHeight: 1.5,
                    marginBottom: '14px',
                  }}
                >
                  Gym will remain closed for Shubh Shastra Puja in the evening. Morning batch open: 6:00 AM – 11:00 AM.
                </div>

                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px dashed rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.72rem',
                    color: '#a5b4fc',
                  }}
                >
                  <Gift size={16} style={{ color: '#ec4899', flexShrink: 0 }} />
                  <span>3 Members celebrate birthdays this week! 1-click WhatsApp wish ready.</span>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATOR 3: 15-DAY MEMBERSHIP PAUSE & FREEZE */}
          {activeBentoTab === 3 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '36px',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                  }}
                >
                  <Snowflake size={12} />
                  <span>Zero Member Disputes</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25, marginBottom: '12px' }}>
                  Traveling or Medical Rest? Freeze Memberships & Auto-Extend Expiry Dates.
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '20px' }}>
                  When members travel for work or recover from an injury, don’t let them lose paid days or argue at your front desk. Pause their membership for 7, 15, or 30 days. When they return, FeeOrbit automatically restores their active status and moves the expiry date forward by the exact frozen days!
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Instant status flip to &quot;Frozen&quot; (Prevents attendance turnstile access)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>1-click resume automatically computes new valid-till date</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Complete audit log with medical certificates or travel proof</span>
                  </div>
                </div>

                <button
                  onClick={() => handleLaunchProtected('/members')}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 22px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
                  }}
                >
                  <span>Inspect Member CRM & Freeze Engine &rarr;</span>
                </button>
              </div>

              {/* Interactive Freeze Slider Card */}
              <div
                style={{
                  background: isFrozen
                    ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)'
                    : 'rgba(15, 23, 42, 0.7)',
                  border: isFrozen ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: isFrozen ? '0 0 30px rgba(56, 189, 248, 0.25)' : 'none',
                  maxWidth: '380px',
                  margin: '0 auto',
                  width: '100%',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff' }}>Aman Malhotra</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Platinum Annual Pass #IC-902</div>
                  </div>
                  <span
                    style={{
                      background: isFrozen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                      border: isFrozen ? '1px solid #38bdf8' : '1px solid rgba(16, 185, 129, 0.3)',
                      color: isFrozen ? '#38bdf8' : '#34d399',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {isFrozen ? '❄️ FROZEN' : '● ACTIVE'}
                  </span>
                </div>

                {/* Freeze Duration Slider */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '6px' }}>
                    <span style={{ color: '#cbd5e1' }}>Simulate Pause Duration:</span>
                    <strong style={{ color: '#38bdf8' }}>{freezeDays} Days</strong>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="45"
                    step="1"
                    value={freezeDays}
                    onChange={(e) => setFreezeDays(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                  />
                </div>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '0.74rem',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#94a3b8' }}>
                    <span>Original Expiry Date:</span>
                    <span style={{ textDecoration: isFrozen ? 'line-through' : 'none' }}>20 Nov 2026</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399', fontWeight: 700 }}>
                    <span>Auto-Extended Expiry:</span>
                    <span>{isFrozen ? `05 Dec 2026 (+${freezeDays}d)` : '20 Nov 2026'}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsFrozen(!isFrozen)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: isFrozen ? '#ef4444' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {isFrozen ? (
                    <>
                      <Play size={14} />
                      <span>Resume Membership (Restore Validity)</span>
                    </>
                  ) : (
                    <>
                      <Snowflake size={14} />
                      <span>Simulate {freezeDays}-Day Pause Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SIMULATOR 4: GEMINI AI ATHLETIC COACH */}
          {activeBentoTab === 4 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '36px',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#a855f7',
                    background: 'rgba(168, 85, 247, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                  }}
                >
                  <Sparkles size={12} />
                  <span>Google Gemini 2.5 Flash</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25, marginBottom: '12px' }}>
                  AI Nutrition, Indian Macros & Personalized Workout Splits in 5 Seconds.
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '20px' }}>
                  Give every single member a high-tier personal trainer experience. Calibrated for Indian diets (Paneer, Soya Chunks, Dal, Eggs, Chicken) with affordable grocery budgets from ₹150 to ₹500/day.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'hypertrophy', label: 'Vegetarian Muscle Gain' },
                    { id: 'fatloss', label: 'Fat Loss (High Protein)' },
                    { id: 'strength', label: 'Powerlifting 5x5' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setAiSplitGoal(btn.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: aiSplitGoal === btn.id ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: aiSplitGoal === btn.id ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: aiSplitGoal === btn.id ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleLaunchProtected('/ai-coach')}
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 22px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)',
                  }}
                >
                  <span>Open Full AI Coach Module &rarr;</span>
                </button>
              </div>

              {/* AI Split Live Preview Card */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                  maxWidth: '380px',
                  margin: '0 auto',
                  width: '100%',
                }}
              >
                {/* Real Athlete with AI Nutrition & Workout Engine Photo */}
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.3)', height: '140px', marginBottom: '14px' }}>
                  <img
                    src="/images/ai_nutrition_coach.jpg"
                    alt="AI Nutrition Coach & Split Generator"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.62rem', color: '#c084fc', fontWeight: 700 }}>
                    ⚡ Google Gemini 2.5 Flash Nutrition Engine
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>
                    {aiSplitGoal === 'hypertrophy' && 'Push-Pull-Legs (Vegetarian)'}
                    {aiSplitGoal === 'fatloss' && 'Upper / Lower (Calorie Deficit)'}
                    {aiSplitGoal === 'strength' && 'Compound Heavy (5x5 Peak)'}
                  </div>
                  <span style={{ fontSize: '0.64rem', color: '#a855f7', fontWeight: 700 }}>AI Generated</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Calories</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                      {aiSplitGoal === 'hypertrophy' ? '2,450' : aiSplitGoal === 'fatloss' ? '1,850' : '2,800'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Protein</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>150g</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Cost/Day</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>₹210</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>🏋️ <strong>Key Lifts:</strong> Incline Barbell Press (4x8), Weighted Dips (3x10), Romanian Deadlift (4x10)</div>
                  <div>🥗 <strong>Indian Meal:</strong> 200g Paneer Bhurji + Soya Chunks Stir-fry + 1 Scoop Whey</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================= 4. WHY INDIAN GYMS SWITCH (COMPARISON TABLE) ================= */}
      <section
        id="why-indian-gyms"
        className="feeorbit-container"
        style={{
          marginBottom: '100px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="feeorbit-telemetry-badge">
            <ShieldCheck size={12} />
            <span>// 03 // ARCHITECTURAL BENCHMARK</span>
          </div>
          <h2
            className="feeorbit-title-chrome"
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              marginTop: '4px',
            }}
          >
            Why Old Softwares & Paper Registers <span className="feeorbit-glow-gold">Fail Indian Gyms</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.96rem', maxWidth: '640px', margin: '12px auto 0', lineHeight: 1.6 }}>
            Legacy 2012 desktop softwares and physical paper registers are silently bleeding revenue, slowing down reception counters, and frustrating members.
          </p>
        </div>

        {/* Real Gym Owner Story Banner */}
        <div
          className="feeorbit-cyber-panel"
          style={{
            overflow: 'hidden',
            marginBottom: '36px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative', height: '280px' }}>
            <img
              src="/images/gym_owner_analytics.jpg"
              alt="Elite Fitness Club Owner with FeeOrbit Analytics"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(7, 11, 22, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
              }}
            >
              ● Verified Commercial Gym Case Study
            </div>
          </div>
          <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginBottom: '12px', fontSize: '1rem', textShadow: '0 0 10px rgba(251, 191, 36, 0.4)' }}>
              {'★★★★★'.split('').map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
            <p style={{ fontSize: '0.94rem', color: '#f8fafc', lineHeight: 1.65, fontStyle: 'italic', marginBottom: '18px' }}>
              &quot;Before FeeOrbit, our reception was a daily headache. Members argued about missed days, our biometric scanner had lines during peak 7 PM hours, and fee reminders were awkward. With FeeOrbit’s tablet kiosk and 1-click WhatsApp recovery, we recovered ₹1,42,000 in overdue fees in our first 45 days.&quot;
            </p>
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.94rem' }}>Siddharth Narang</div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Founder & Managing Director • Elite Fitness Club (Connaught Place & Gurgaon)</div>
            </div>
          </div>
        </div>

        {/* Futuristic Comparison Matrix Table */}
        <div
          className="feeorbit-cyber-panel"
          style={{
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr',
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.09)',
              padding: '16px 24px',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#94a3b8',
              fontFamily: 'monospace',
            }}
          >
            <div>// CAPABILITY MATRIX</div>
            <div style={{ color: '#ef4444' }}>❌ TRADITIONAL / EXCEL</div>
            <div style={{ color: '#38bdf8' }}>⚡ FEEORBIT CYBER OS</div>
          </div>

          {[
            {
              feat: 'Fee Dues Recovery',
              old: 'Manual awkward calling; members ignore calls',
              feeorbit: 'Automated 1-click WhatsApp with direct UPI links (99.4% recovery)',
            },
            {
              feat: 'Attendance Hardware',
              old: '₹25,000+ Biometric machine; breaks with sweaty fingers',
              feeorbit: '₹0 Hardware required. Works on any tablet, phone or laptop QR kiosk (0.3s)',
            },
            {
              feat: 'Indian Festival Calendar',
              old: 'Hardcoded Western calendar; wrong Dussehra/Diwali dates',
              feeorbit: '100% accurate Hindu Panchang (Dussehra 20 Oct) & automated off notices',
            },
            {
              feat: 'Member Vacation / Illness',
              old: 'Manual scribbles in a register; members argue about dates',
              feeorbit: '15-Day 1-click freeze with auto-extended expiry dates and audit log',
            },
            {
              feat: 'Member Nutrition & Training',
              old: 'Generic Google printouts or zero guidance',
              feeorbit: 'Google Gemini 2.5 AI Coach with Indian vegetarian/non-veg splits',
            },
          ].map((row, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr',
                padding: '18px 24px',
                borderBottom: idx < 4 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                fontSize: '0.84rem',
                alignItems: 'center',
                gap: '16px',
                background: idx % 2 === 1 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
              }}
            >
              <div style={{ fontWeight: 800, color: '#f8fafc' }}>{row.feat}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>❌ {row.old}</div>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.82rem', textShadow: '0 0 14px rgba(52, 211, 153, 0.3)' }}>
                ✓ {row.feeorbit}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 5. INTERACTIVE ROI CALCULATOR ================= */}
      <section
        id="calculator"
        className="feeorbit-container"
        style={{
          marginBottom: '100px',
        }}
      >
        <div
          className="feeorbit-cyber-panel"
          style={{
            padding: '42px 36px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '15%',
              transform: 'translateY(-50%)',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(56, 189, 248, 0.08) 40%, transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ textAlign: 'center', marginBottom: '36px', position: 'relative' }}>
            <div className="feeorbit-telemetry-badge">
              <DollarSign size={12} />
              <span>// 04 // REVENUE LEAK AUDIT</span>
            </div>
            <h2
              className="feeorbit-title-chrome"
              style={{
                fontSize: 'clamp(2rem, 3.8vw, 3rem)',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                marginTop: '4px',
              }}
            >
              How Much Revenue is Your Gym <span className="feeorbit-glow-gold">Leaking Every Month?</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.96rem', maxWidth: '620px', margin: '10px auto 0', lineHeight: 1.6 }}>
              Drag the telemetry sliders below to audit uncollected gym dues and see how automated WhatsApp recovery pays for itself within days.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '36px',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {/* Sliders Input Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
              {/* Slider 1: Member Count */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#e2e8f0' }}>
                    Active Gym Members:
                  </label>
                  <span
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#818cf8',
                      background: 'rgba(99, 102, 241, 0.15)',
                      padding: '3px 12px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    {memberCount} members
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={memberCount}
                  onChange={(e) => setMemberCount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer', height: '6px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginTop: '6px' }}>
                  <span>50 Members (Studio)</span>
                  <span>1,500 Members (Commercial Chain)</span>
                </div>
              </div>

              {/* Slider 2: Average Monthly Fee */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#e2e8f0' }}>
                    Avg Monthly Membership Fee:
                  </label>
                  <span
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.15)',
                      padding: '3px 12px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    ₹{avgFee.toLocaleString('en-IN')} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="600"
                  max="5000"
                  step="100"
                  value={avgFee}
                  onChange={(e) => setAvgFee(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0ea5e9', cursor: 'pointer', height: '6px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginTop: '6px' }}>
                  <span>₹600 / mo (Tier 2/3)</span>
                  <span>₹5,000 / mo (Luxury Crossfit)</span>
                </div>
              </div>
            </div>

            {/* Calculations Output Card (Financial Cockpit) */}
            <div
              style={{
                background: 'linear-gradient(145deg, #070b14 0%, #05080f 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '18px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.1)',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                  Estimated Monthly Dues Slipping Away
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#f87171', marginTop: '4px', letterSpacing: '-0.02em' }}>
                  ₹{estimatedUncollectedLost.toLocaleString('en-IN')}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}> / month</span>
                </div>
              </div>

              <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%)' }} />

              <div>
                <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  Extra Revenue Captured with FeeOrbit
                </div>
                <div
                  style={{
                    fontSize: '2.4rem',
                    fontWeight: 900,
                    color: '#34d399',
                    marginTop: '4px',
                    letterSpacing: '-0.02em',
                    textShadow: '0 0 25px rgba(52, 211, 153, 0.35)',
                  }}
                >
                  +₹{annualSavedWithFeeOrbit.toLocaleString('en-IN')}
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#94a3b8' }}> / year</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '6px', lineHeight: 1.5 }}>
                  Based on automated WhatsApp reminders with 94% on-time recovery.
                </div>
              </div>

              <button
                onClick={() => handleLaunchProtected('/billing')}
                className="feeorbit-btn-primary"
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                <span>Recover Your Unpaid Dues Now &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 6. PRICING SECTION ================= */}
      <section id="pricing" className="feeorbit-container" style={{ marginBottom: '100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="feeorbit-telemetry-badge">
            <CreditCard size={12} />
            <span>// 05 // TRANSPARENT INVESTMENT TIERS</span>
          </div>
          <h2
            className="feeorbit-title-chrome"
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              marginTop: '4px',
            }}
          >
            Simple Plans with <span className="feeorbit-glow-cyan">Zero Hidden Hardware Fees</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.96rem', maxWidth: '580px', margin: '10px auto 22px', lineHeight: 1.6 }}>
            No surprise setup fees. No vendor hardware lock-in. Upgrade, downgrade or cancel anytime with 1 click.
          </p>

          {/* Billing Switcher (Futuristic Glass Capsule) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              padding: '5px 8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                background: billingCycle === 'monthly' ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
                color: billingCycle === 'monthly' ? '#ffffff' : '#94a3b8',
                border: billingCycle === 'monthly' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                padding: '7px 18px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              style={{
                background: billingCycle === 'annual' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(56, 189, 248, 0.2) 100%)' : 'transparent',
                color: billingCycle === 'annual' ? '#ffffff' : '#94a3b8',
                border: billingCycle === 'annual' ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid transparent',
                padding: '7px 18px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>Annual Billing</span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em',
                }}
              >
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '28px',
            alignItems: 'stretch',
            marginBottom: '56px',
          }}
        >
          {/* Plan 1: Starter */}
          <div
            className="feeorbit-cyber-panel"
            style={{
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>Starter Club</h3>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>
                  Up to 150 Members
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '8px 0 20px', lineHeight: 1.5 }}>
                Perfect for boutique fitness studios, CrossFit boxes, and new single-location gyms.
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  ₹{billingCycle === 'annual' ? '1,199' : '1,499'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>/ month</span>
              </div>

              {/* What's Included */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px', marginBottom: '18px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Included Core Capabilities:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    'Up to 150 Active Members Database',
                    '15-Day Flexible Membership Freeze Engine',
                    'Front-Desk Tablet Kiosk & QR Check-In (0.3s)',
                    '1-Click WhatsApp Fee Recovery Reminders',
                    'Hindu Panchang Calendar (Dussehra 20 Oct)',
                    'Member Birthday Radar & WhatsApp Wishes',
                    'GST Tax Invoicing & Downloadable PDF Receipts',
                    'Live Gym Floor Occupancy Counter',
                    'Excel & CSV Member Data Export',
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                      <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What's Locked in Starter */}
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '14px', marginBottom: '26px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  Available in Pro Growth:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'Google Gemini AI Coach & Nutrition splits',
                    'Staff & Trainer Commission Payroll',
                    'Equipment Maintenance & AMC Service Tracker',
                    'Operational P&L Expense & Net Profit Ledger',
                    'Multi-Branch Central Franchise HQ',
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.78rem', color: '#64748b' }}>
                      <X size={14} style={{ color: '#ef4444', opacity: 0.6, flexShrink: 0 }} />
                      <span style={{ textDecoration: 'line-through' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/signup"
              className="feeorbit-btn-glass"
              style={{
                textAlign: 'center',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'block',
              }}
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Plan 2: Pro Growth (Featured Laser Border) */}
          <div
            className="feeorbit-cyber-panel"
            style={{
              padding: '34px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              background: 'linear-gradient(155deg, rgba(16, 26, 48, 0.95) 0%, rgba(8, 14, 28, 0.98) 100%)',
              border: '2px solid rgba(56, 189, 248, 0.6)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              transform: 'scale(1.02)',
              zIndex: 2,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-13px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                color: '#070a13',
                fontSize: '0.68rem',
                fontWeight: 900,
                padding: '4px 16px',
                borderRadius: '9999px',
                letterSpacing: '0.06em',
                boxShadow: '0 4px 18px rgba(245, 158, 11, 0.6), 0 0 12px rgba(251, 191, 36, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                whiteSpace: 'nowrap',
              }}
            >
              ⚡ MOST POPULAR FOR COMMERCIAL GYMS
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>Pro Growth</h3>
                <span style={{ fontSize: '0.68rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '3px 10px', borderRadius: '6px', fontWeight: 800 }}>
                  Unlimited Members
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '8px 0 20px', lineHeight: 1.5 }}>
                The complete ERP operating system for serious commercial fitness clubs and performance centres.
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  ₹{billingCycle === 'annual' ? '1,999' : '2,499'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>/ month</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Full Commercial Operating Suite:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    'Unlimited Active Members Database',
                    'Google Gemini 2.5 Flash AI Workout & Diet Split',
                    'Automated WhatsApp UPI Fee Recovery & Reminders',
                    'Tablet Front-Desk Kiosk with Studio Voice Chimes',
                    '15-Day Flexible Membership Freeze & Auto-Extend',
                    'Staff & Trainer Commission Payroll with Salary Slips',
                    'Gym Equipment Maintenance & AMC Service Tracker',
                    'Operational P&L Expense & Profit Ledger Analytics',
                    'High-Risk Member Churn Inactivity Radar',
                    'Member Self-Service Web Portal Access',
                    '1-Click Hindu Panchang Festive WhatsApp Broadcasts',
                    'Priority WhatsApp & Email Support',
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.82rem', color: '#f8fafc' }}>
                      <CheckCircle2 size={15} style={{ color: '#38bdf8', flexShrink: 0 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/signup"
              className="feeorbit-btn-primary"
              style={{
                textAlign: 'center',
                padding: '13px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'block',
              }}
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Plan 3: Franchise */}
          <div
            className="feeorbit-cyber-panel"
            style={{
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>Franchise HQ</h3>
                <span style={{ fontSize: '0.68rem', color: '#f59e0b', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', padding: '3px 10px', borderRadius: '6px', fontWeight: 800 }}>
                  Multi-Branch Chains
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '8px 0 20px', lineHeight: 1.5 }}>
                Multi-branch gym chains, fitness franchises, and multi-location athletic complexes.
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  ₹{billingCycle === 'annual' ? '4,799' : '5,999'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>/ month</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Enterprise Multi-Branch Power:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    'Everything in Pro Growth Included',
                    'Multi-Branch Central Cloud HQ Dashboard',
                    'Cross-Branch Member Roaming Check-In',
                    'Consolidated Multi-Branch P&L & Profit Analytics',
                    'Custom Gym Subdomain & Full White-Label',
                    'Dedicated VIP WhatsApp Official Sender ID',
                    'Role-Based Staff Hierarchy & Branch Scopes',
                    'Automated Nightly Database Cloud Backups',
                    '24/7 Dedicated Account Manager & Direct Phone',
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                      <CheckCircle2 size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/signup?plan=enterprise"
              className="feeorbit-btn-glass"
              style={{
                textAlign: 'center',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'block',
              }}
            >
              Start Franchise 14-Day Trial
            </Link>
          </div>
        </div>

        {/* ================= DETAILED FEATURE COMPARISON MATRIX ================= */}
        <div
          id="feature-matrix"
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '36px 28px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Matrix Header */}
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 28px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '4px 14px',
                borderRadius: '100px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              <Sparkles size={13} /> COMPLETE FEATURE COMPARISON MATRIX
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
              Compare All Features Across Every Plan
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.55 }}>
              Har ek module, automation aur capability ki transparent detail — dekhiye konsa plan aapke gym ke scale ke mutabik sabse zyada value deta hai.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '28px',
            }}
          >
            {[
              { id: 'all', label: 'All Features (33)' },
              { id: 'members', label: '👥 Member & Freeze' },
              { id: 'kiosk', label: '📱 Tablet Kiosk' },
              { id: 'billing', label: '💬 WhatsApp & Billing' },
              { id: 'panchang', label: '🕉️ Panchang & Dussehra' },
              { id: 'ai', label: '⚡ Gemini AI Coach' },
              { id: 'staff', label: '🏋️ Staff & AMC Ledger' },
              { id: 'franchise', label: '🏢 Franchise HQ' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMatrixCategory(tab.id)}
                style={{
                  background: matrixCategory === tab.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                  border: matrixCategory === tab.id ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: matrixCategory === tab.id ? '#ffffff' : '#94a3b8',
                  padding: '7px 14px',
                  borderRadius: '100px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Feature Table */}
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
              {/* Sticky Header */}
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '16px 20px', width: '38%', color: '#f8fafc', fontSize: '0.84rem', fontWeight: 800 }}>
                    Feature & Capabilities
                  </th>
                  <th style={{ padding: '16px 16px', width: '20%', textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1' }}>Starter Club</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>₹1,499 / mo</div>
                  </th>
                  <th
                    style={{
                      padding: '16px 16px',
                      width: '22%',
                      textAlign: 'center',
                      background: 'rgba(99, 102, 241, 0.12)',
                      borderLeft: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRight: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, fontSize: '0.88rem', color: '#818cf8' }}>
                      Pro Growth
                      <span style={{ fontSize: '0.55rem', background: '#6366f1', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>POPULAR</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#a5b4fc', marginTop: '2px' }}>₹2,499 / mo</div>
                  </th>
                  <th style={{ padding: '16px 16px', width: '20%', textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1' }}>Franchise HQ</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>₹5,999 / mo</div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {[
                  {
                    category: 'members',
                    catTitle: '👥 Member Management & Retention Engine',
                    catDesc: 'Member registration, 15-day membership freeze, churn radar, and profiles',
                    items: [
                      {
                        name: 'Active Member Capacity',
                        desc: 'Total concurrent active members stored in your database',
                        starter: 'Up to 150 Members',
                        starterType: 'text',
                        pro: 'Unlimited Members',
                        proType: 'highlight',
                        franchise: 'Unlimited Members',
                        franchiseType: 'highlight',
                      },
                      {
                        name: '15-Day Flexible Membership Freeze',
                        desc: 'Pause membership for travel or sickness; auto-resumes and extends expiry date',
                        starter: '✓ 15 Days / Year',
                        starterType: 'check',
                        pro: '✓ 15 Days / Year (Auto-Resume)',
                        proType: 'check',
                        franchise: '✓ Custom Days / Multi-Freeze',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Member Birthday Radar & Wishes',
                        desc: 'Automated 9 AM radar finding member birthdays with 1-click WhatsApp greetings',
                        starter: '✓ Included',
                        starterType: 'check',
                        pro: '✓ Automated 9 AM Broadcast',
                        proType: 'check',
                        franchise: '✓ Automated VIP Radar',
                        franchiseType: 'check',
                      },
                      {
                        name: 'High-Risk Member Churn Radar',
                        desc: 'Identifies members absent for 7+ consecutive days to trigger retention outreach',
                        starter: '✕ Not Included',
                        starterType: 'locked',
                        pro: '✓ AI Churn Score & Alerts',
                        proType: 'highlight',
                        franchise: '✓ Multi-Branch Churn Radar',
                        franchiseType: 'highlight',
                      },
                      {
                        name: 'Member Self-Service Web Portal',
                        desc: 'Athletes can check dues, attendance history, QR pass, and workout plans',
                        starter: 'Basic Dues & Pass',
                        starterType: 'text',
                        pro: '✓ Full Workouts & Diet Portal',
                        proType: 'check',
                        franchise: '✓ Custom Branded Portal',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Excel / CSV Member Data Export',
                        desc: 'One-click full member directory and payment ledger export',
                        starter: '✓ Included',
                        starterType: 'check',
                        pro: '✓ Included',
                        proType: 'check',
                        franchise: '✓ Included + API Sync',
                        franchiseType: 'check',
                      },
                    ],
                  },
                  {
                    category: 'kiosk',
                    catTitle: '📱 Front-Desk Tablet Kiosk & Attendance',
                    catDesc: 'Hardware kiosk stand mode, QR scanner, audio voice chimes, and floor occupancy',
                    items: [
                      {
                        name: 'Tablet Kiosk Stand Mode with Pin Lock',
                        desc: 'Dedicated iPad/Android tablet kiosk interface with locked member attendance screen',
                        starter: '✓ Included',
                        starterType: 'check',
                        pro: '✓ Included (Pin Lock & Standby)',
                        proType: 'check',
                        franchise: '✓ Multi-Tablet Network Sync',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Dynamic QR Code & Barcode Scanner',
                        desc: 'Camera or physical laser barcode scanner check-in in under 400 milliseconds',
                        starter: '✓ Included',
                        starterType: 'check',
                        pro: '✓ Included',
                        proType: 'check',
                        franchise: '✓ Included + Turnstile Gate API',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Studio Audio Voice Chimes ("Welcome Rahul!")',
                        desc: 'Real audio feedback with sound chimes and synthesized greeting on check-in',
                        starter: '✕ Silent Mode Only',
                        starterType: 'locked',
                        pro: '✓ Studio Audio Voice Feedback',
                        proType: 'highlight',
                        franchise: '✓ Studio Audio Voice Feedback',
                        franchiseType: 'highlight',
                      },
                      {
                        name: 'Live Gym Floor Occupancy Counter',
                        desc: 'Live real-time counter of current active athletes working out on the gym floor',
                        starter: '✓ Included',
                        starterType: 'check',
                        pro: '✓ With Peak-Hours Heatmap',
                        proType: 'check',
                        franchise: '✓ Cross-Branch Floor Heatmap',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Trainer & Staff Shift Attendance',
                        desc: 'Biometric and shift check-in / check-out tracker for personal trainers and staff',
                        starter: '✕ Not Included',
                        starterType: 'locked',
                        pro: '✓ Included',
                        proType: 'check',
                        franchise: '✓ Multi-Branch Shift Sync',
                        franchiseType: 'check',
                      },
                    ],
                  },
                  {
                    category: 'billing',
                    catTitle: '💬 WhatsApp Automation, Fees & Billing',
                    catDesc: 'Automated fee recovery reminders, UPI click-to-pay links, and GST tax receipts',
                    items: [
                      {
                        name: 'Automated WhatsApp Fee Recovery Reminders',
                        desc: 'Send WhatsApp dues alerts with direct UPI payment links (GPay, PhonePe, Paytm)',
                        starter: '1-Click Manual Send',
                        starterType: 'text',
                        pro: '✓ Automated Smart Scheduler',
                        proType: 'highlight',
                        franchise: '✓ Automated VIP Gateway',
                        franchiseType: 'highlight',
                      },
                      {
                        name: 'Pre-Expiry Membership Alerts',
                        desc: 'Notify members 3 days and 1 day prior to plan expiry to maximize renewals',
                        starter: '✓ 3 Days Prior',
                        starterType: 'check',
                        pro: '✓ 7, 3 & 1 Day Prior Sequence',
                        proType: 'check',
                        franchise: '✓ Custom Multi-Stage Sequences',
                        franchiseType: 'check',
                      },
                      {
                        name: 'GST Tax Invoicing & PDF Receipts',
                        desc: 'Generate GST-compliant invoices with downloadable PDF receipts and tax splits',
                        starter: '✓ Included (Standard GST)',
                        starterType: 'check',
                        pro: '✓ Custom Logo & Tax Splits',
                        proType: 'check',
                        franchise: '✓ Multi-GSTIN Branch Support',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Direct UPI Payment Links & QR Code',
                        desc: 'One-click pay UPI links and dynamic QR embedded inside WhatsApp dues alerts',
                        starter: '✓ Included',
                        starterType: 'check',
                        pro: '✓ Included',
                        proType: 'check',
                        franchise: '✓ Dynamic Razorpay & UPI QR',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Dedicated VIP WhatsApp Sender ID',
                        desc: 'Send messages directly from your gym official verified business sender name',
                        starter: '✕ Shared Gateway',
                        starterType: 'locked',
                        pro: '✕ Shared Gateway',
                        proType: 'locked',
                        franchise: '✓ Custom Official Sender ID',
                        franchiseType: 'highlight',
                      },
                    ],
                  },
                  {
                    category: 'panchang',
                    catTitle: '🕉️ Indian Panchang, Festivals & Calendar',
                    catDesc: '100% accurate Hindu Panchang calendar, gym holiday notices, and festival wishes',
                    items: [
                      {
                        name: '100% Accurate Hindu Panchang Calendar',
                        desc: 'Real Indian Panchang engine with exact dates (Dussehra 20 Oct, Diwali, Holi, Navratri)',
                        starter: '✓ Included',
                        starterType: 'check',
                        pro: '✓ Included',
                        proType: 'check',
                        franchise: '✓ Included',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Gym Holiday & Closure Notices on Kiosk',
                        desc: 'Display scheduled gym off-days and festive timings across front-desk kiosk',
                        starter: '✓ Included',
                        starterType: 'check',
                        pro: '✓ Included',
                        proType: 'check',
                        franchise: '✓ Multi-Branch Holiday Sync',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Festive WhatsApp Greeting Broadcasts',
                        desc: 'Send festive greetings to all gym members in one click',
                        starter: '✓ Standard Templates',
                        starterType: 'check',
                        pro: '✓ Rich Festive Media Cards',
                        proType: 'check',
                        franchise: '✓ Brand-Customized Media',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Gym Events & Competitions Scheduler',
                        desc: 'Organize powerlifting meets, CrossFit challenges, and gym anniversary events',
                        starter: '✓ Included',
                        starterType: 'check',
                        pro: '✓ Included',
                        proType: 'check',
                        franchise: '✓ Inter-Branch Championship',
                        franchiseType: 'check',
                      },
                    ],
                  },
                  {
                    category: 'ai',
                    catTitle: '⚡ Google Gemini AI Athletic Coach',
                    catDesc: 'Hypertrophy workout planner and personalized Indian diet & macro splits',
                    items: [
                      {
                        name: 'Google Gemini 2.5 Flash AI Workout Planner',
                        desc: 'Custom Push-Pull-Legs, Upper-Lower, and Bro-Split workout builder',
                        starter: '✕ Not Included',
                        starterType: 'locked',
                        pro: '✓ Unlimited AI Generations',
                        proType: 'highlight',
                        franchise: '✓ Unlimited AI Generations',
                        franchiseType: 'highlight',
                      },
                      {
                        name: 'Indian Macro Diet & Nutrition Splits',
                        desc: 'Vegetarian, Eggetarian, and Non-Veg high-protein Indian diet plans (Paneer, Soya, Chicken, Dal)',
                        starter: '✕ Not Included',
                        starterType: 'locked',
                        pro: '✓ Tailored Indian Macros',
                        proType: 'highlight',
                        franchise: '✓ Tailored Indian Macros',
                        franchiseType: 'highlight',
                      },
                      {
                        name: 'Printable AI Workout & Diet PDF Cards',
                        desc: 'Generate beautifully styled PDF workout cards to hand over or WhatsApp to athletes',
                        starter: '✕ Not Included',
                        starterType: 'locked',
                        pro: '✓ 1-Click PDF Generation',
                        proType: 'check',
                        franchise: '✓ Branded Gym PDF Cards',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Trainer AI Prescription & Routine Tuning',
                        desc: 'Allow personal trainers to tweak Gemini AI routines before sending to members',
                        starter: '✕ Not Included',
                        starterType: 'locked',
                        pro: '✓ Included',
                        proType: 'check',
                        franchise: '✓ Included',
                        franchiseType: 'check',
                      },
                    ],
                  },
                  {
                    category: 'staff',
                    catTitle: '🏋️ Staff, Equipment AMC & Operations',
                    catDesc: 'Trainer payroll, commission calculations, equipment AMC, and operational P&L',
                    items: [
                      {
                        name: 'Staff & Trainer Directory',
                        desc: 'Directory of personal trainers, floor managers, and front-desk staff',
                        starter: 'Up to 2 Staff Members',
                        starterType: 'text',
                        pro: 'Unlimited Staff',
                        proType: 'highlight',
                        franchise: 'Unlimited Staff (Role-Based)',
                        franchiseType: 'highlight',
                      },
                      {
                        name: 'Trainer PT Commission & Salary Slips',
                        desc: 'Automated personal training commission tracking and monthly payslips',
                        starter: '✕ Not Included',
                        starterType: 'locked',
                        pro: '✓ Included',
                        proType: 'check',
                        franchise: '✓ Multi-Branch Payroll',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Equipment Maintenance & AMC Service Tracker',
                        desc: 'Track cable pulleys, treadmills, AMC contracts, service due dates, and breakdowns',
                        starter: '✕ Not Included',
                        starterType: 'locked',
                        pro: '✓ Included',
                        proType: 'check',
                        franchise: '✓ Multi-Branch Asset Ledger',
                        franchiseType: 'check',
                      },
                      {
                        name: 'Gym Operational P&L Ledger (Rent, Power, Net Profit)',
                        desc: 'Track gym expenses like rent, electricity, maintenance against incoming fee revenue',
                        starter: '✕ Not Included',
                        starterType: 'locked',
                        pro: '✓ Real-Time Monthly P&L',
                        proType: 'highlight',
                        franchise: '✓ Consolidated Branch P&L',
                        franchiseType: 'highlight',
                      },
                    ],
                  },
                  {
                    category: 'franchise',
                    catTitle: '🏢 Franchise, Multi-Branch & Enterprise Support',
                    catDesc: 'Multi-branch cloud control, roaming check-in, white-label subdomain, and dedicated support',
                    items: [
                      {
                        name: 'Multi-Branch Central Cloud Dashboard',
                        desc: 'Manage multiple gym locations from a single unified superadmin cockpit',
                        starter: '✕ Single Branch Only',
                        starterType: 'locked',
                        pro: '✕ Single Branch Only',
                        proType: 'locked',
                        franchise: '✓ Unlimited Branches',
                        franchiseType: 'highlight',
                      },
                      {
                        name: 'Cross-Branch Member Roaming Check-In',
                        desc: 'Allow premium members to check in at any branch in your city or network',
                        starter: '✕ Not Included',
                        starterType: 'locked',
                        pro: '✕ Not Included',
                        proType: 'locked',
                        franchise: '✓ Instant Cloud Roaming',
                        franchiseType: 'highlight',
                      },
                      {
                        name: 'Custom Gym Subdomain (yourgym.feeorbit.com)',
                        desc: 'Full white-label branding with custom URL and gym colors',
                        starter: '✕ Not Included',
                        starterType: 'locked',
                        pro: '✕ FeeOrbit Branding',
                        proType: 'locked',
                        franchise: '✓ Full White-Label Subdomain',
                        franchiseType: 'highlight',
                      },
                      {
                        name: 'Automated Cloud Database Backups',
                        desc: 'Nightly encrypted cloud backups with one-click restore',
                        starter: 'Weekly Backups',
                        starterType: 'text',
                        pro: 'Daily Nightly Backups',
                        proType: 'check',
                        franchise: 'Real-Time Cloud Replication',
                        franchiseType: 'highlight',
                      },
                      {
                        name: 'Customer Support & Onboarding SLA',
                        desc: 'Direct access to technical engineers and onboarding account manager',
                        starter: 'Standard Email (24h)',
                        starterType: 'text',
                        pro: 'Priority WhatsApp Support',
                        proType: 'check',
                        franchise: '24/7 Dedicated Account Manager',
                        franchiseType: 'highlight',
                      },
                    ],
                  },
                ]
                  .filter((section) => matrixCategory === 'all' || section.category === matrixCategory)
                  .map((section, sIdx) => (
                    <React.Fragment key={sIdx}>
                      {/* Category Header Row */}
                      <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <td
                          colSpan={4}
                          style={{
                            padding: '12px 20px',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            color: '#38bdf8',
                            letterSpacing: '0.02em',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{section.catTitle}</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>{section.catDesc}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Item Rows */}
                      {section.items.map((item, iIdx) => (
                        <tr
                          key={iIdx}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Feature Name & Description */}
                          <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f1f5f9' }}>{item.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.4 }}>{item.desc}</div>
                          </td>

                          {/* Starter Value */}
                          <td style={{ padding: '14px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                            {item.starterType === 'locked' ? (
                              <span style={{ fontSize: '0.74rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <X size={12} /> {item.starter.replace('✕ ', '')}
                              </span>
                            ) : item.starterType === 'check' ? (
                              <span style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={14} /> {item.starter.replace('✓ ', '')}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 600 }}>{item.starter}</span>
                            )}
                          </td>

                          {/* Pro Growth Value (Highlighted) */}
                          <td
                            style={{
                              padding: '14px 16px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              background: 'rgba(99, 102, 241, 0.05)',
                              borderLeft: '1px solid rgba(99, 102, 241, 0.15)',
                              borderRight: '1px solid rgba(99, 102, 241, 0.15)',
                            }}
                          >
                            {item.proType === 'locked' ? (
                              <span style={{ fontSize: '0.74rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <X size={12} /> {item.pro.replace('✕ ', '')}
                              </span>
                            ) : item.proType === 'highlight' ? (
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  color: '#38bdf8',
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  border: '1px solid rgba(56, 189, 248, 0.25)',
                                  padding: '3px 10px',
                                  borderRadius: '100px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Check size={13} style={{ color: '#38bdf8' }} /> {item.pro.replace('✓ ', '')}
                              </span>
                            ) : item.proType === 'check' ? (
                              <span style={{ fontSize: '0.76rem', color: '#818cf8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={14} /> {item.pro.replace('✓ ', '')}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.76rem', color: '#f8fafc', fontWeight: 700 }}>{item.pro}</span>
                            )}
                          </td>

                          {/* Franchise Value */}
                          <td style={{ padding: '14px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                            {item.franchiseType === 'highlight' ? (
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  color: '#f59e0b',
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  padding: '3px 10px',
                                  borderRadius: '100px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Check size={13} style={{ color: '#f59e0b' }} /> {item.franchise.replace('✓ ', '')}
                              </span>
                            ) : item.franchiseType === 'check' ? (
                              <span style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={14} /> {item.franchise.replace('✓ ', '')}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 600 }}>{item.franchise}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Matrix Footer Guarantee Banner */}
          <div
            style={{
              marginTop: '28px',
              padding: '20px 24px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: '#10b981' }} />
                <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.88rem' }}>
                  All Plans Include 14-Day Free Trial & Zero Setup Fees
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '4px 0 0 26px', maxWidth: '600px' }}>
                Unlimited staff logins, automatic encrypted cloud database backups, and free member data migration from Excel or other gym software.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                href="/login"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Sign In to Workspace
              </Link>
              <Link
                href="/signup"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                }}
              >
                Start Risk-Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 7. FAQ ACCORDION ================= */}
      <section id="faq" className="feeorbit-container" style={{ marginBottom: '100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="feeorbit-telemetry-badge">
            <HelpCircle size={12} />
            <span>// 06 // KNOWLEDGE BASE PROTOCOL</span>
          </div>
          <h2
            className="feeorbit-title-chrome"
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              marginTop: '4px',
            }}
          >
            Frequently Asked <span className="feeorbit-glow-cyan">Questions</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.96rem', maxWidth: '580px', margin: '10px auto 0', lineHeight: 1.6 }}>
            Everything you need to know about setting up FeeOrbit in your gym within minutes.
          </p>
        </div>

        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            {
              q: 'How does the 14-Day Free Trial work for new gym owners?',
              a: 'Every new gym owner receives an instant 14-day free trial with zero upfront credit card or hardware requirements. You can register your gym in 60 seconds, test WhatsApp automated reminders, set up biometric QR attendance, manage member billing, and explore all Pro tier capabilities risk-free.',
            },
            {
              q: 'How does the 15-Day Membership Pause & Freeze feature work?',
              a: 'When a member takes vacation or medical rest, click "Pause" on their profile for 15, 30, or custom days. Their status changes to "Frozen". When they return, clicking "Resume" automatically recalculates their valid-till date and extends expiration forward by the exact number of days they were paused, so they never lose paid time.',
            },
            {
              q: 'Do I need to buy expensive biometric fingerprint hardware?',
              a: 'No! FeeOrbit runs directly in the browser on any smartphone, cheap Android tablet, touch laptop, or iPad. Place an inexpensive tablet at your front desk in Kiosk Mode, and members can check in by typing their phone number or scanning their personal QR code in 0.3 seconds with real audio chimes.',
            },
            {
              q: 'Are the Hindu Panchang and Indian festival dates accurate?',
              a: '100% accurate. We calibrated our festival engine with the official Government of India gazette and Hindu Panchang calendar. Dussehra 2026 is precisely on 20 October 2026, Diwali on 8 November 2026, and all major regional holidays are mapped with zero errors.',
            },
          ].map((faq, fidx) => {
            const isOpen = openFaq === fidx;
            return (
              <div
                key={fidx}
                className={`feeorbit-faq-card ${isOpen ? 'feeorbit-faq-card-open' : ''}`}
                style={{
                  borderLeft: isOpen ? '3px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : fidx)}
                  style={{
                    width: '100%',
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: isOpen ? '#ffffff' : '#e2e8f0' }}>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      color: isOpen ? '#38bdf8' : '#64748b',
                      flexShrink: 0,
                    }}
                  />
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 22px 20px',
                      color: '#94a3b8',
                      fontSize: '0.86rem',
                      lineHeight: 1.65,
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      paddingTop: '14px',
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= 8. BOTTOM HERO ACTION BANNER (GALACTIC CYBER WARP) ================= */}
      <section className="feeorbit-container" style={{ marginBottom: '90px' }}>
        <div
          className="feeorbit-cyber-panel"
          style={{
            background: 'radial-gradient(ellipse 110% 130% at 50% 0%, #1e1b4b 0%, #0f172a 55%, #05080f 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 50px rgba(99, 102, 241, 0.25)',
            padding: '52px 32px',
            textAlign: 'center',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Cyber Perspective Grid Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(to right, rgba(56, 189, 248, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(56, 189, 248, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '36px 36px',
              maskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 80%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px', margin: '0 auto' }}>
            <div className="feeorbit-telemetry-badge" style={{ marginBottom: '16px' }}>
              <Zap size={12} />
              <span>// READY FOR DEPLOYMENT //</span>
            </div>
            <h2
              className="feeorbit-title-chrome"
              style={{
                fontSize: 'clamp(2.1rem, 4.2vw, 3.2rem)',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                marginBottom: '14px',
              }}
            >
              Elevate Your Gym to the <span className="feeorbit-glow-gold">Next-Gen Operating System</span>
            </h2>
            <p style={{ fontSize: '1rem', color: '#cbd5e1', maxWidth: '620px', margin: '0 auto 28px', lineHeight: 1.6 }}>
              Join forward-thinking gym owners across India running entirely on FeeOrbit OS. Zero credit card or hardware required to test drive.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <Link
                href="/signup"
                className="feeorbit-nav-cta"
                style={{ padding: '13px 30px', fontSize: '0.94rem' }}
              >
                <Sparkles size={16} style={{ color: '#070a13' }} />
                <span>Start 14-Day Free Trial</span>
              </Link>
              <Link
                href="/login"
                className="feeorbit-btn-glass"
                style={{ padding: '13px 26px', fontSize: '0.92rem' }}
              >
                <span>Sign In to Workspace &rarr;</span>
              </Link>
            </div>

            {/* Trust Telemetry Chips */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#94a3b8' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} style={{ color: '#10b981' }} /> No Credit Card Required
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} style={{ color: '#10b981' }} /> 60-Second Instant Setup
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} style={{ color: '#10b981' }} /> 0% Gateway Commissions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 9. COMPACT ARTISANAL FOOTER ================= */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(5, 7, 13, 0.98)',
          padding: '52px 0 28px',
          position: 'relative',
          width: '100%',
        }}
      >
        {/* Top Holographic Hairline */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.4) 30%, rgba(99, 102, 241, 0.4) 50%, rgba(16, 185, 129, 0.4) 70%, transparent 100%)',
          }}
        />

        <div
          className="feeorbit-container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '36px',
            marginBottom: '36px',
          }}
        >
          <div>
            <Link href="/" title="FeeOrbit Home" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <FeeOrbitLogo size="lg" variant="full" showBadge={false} animated={true} />
            </Link>
            <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.6, marginTop: '12px' }}>
              The cybernetic operating system for Indian gyms and fitness clubs. Handcrafted for velocity, automated cash collection, and zero-hardware attendance.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Live Modules
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.78rem', color: '#94a3b8' }}>
              <span onClick={() => handleLaunchProtected('/billing')} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                WhatsApp Fee Recovery
              </span>
              <span onClick={() => handleLaunchProtected('/kiosk')} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                Front-Desk Kiosk Terminal (0.3s)
              </span>
              <span onClick={() => handleLaunchProtected('/events')} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                Panchang Calendar (Dussehra 20 Oct)
              </span>
              <span onClick={() => handleLaunchProtected('/members')} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                15-Day Membership Freeze
              </span>
              <span onClick={() => handleLaunchProtected('/ai-coach')} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                Google Gemini 2.5 AI Coach
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Direct Access
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.78rem', color: '#94a3b8' }}>
              <Link href="/signup" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 700 }}>
                ✨ Start 14-Day Free Trial
              </Link>
              <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
                Workspace Sign In
              </Link>
              <Link href="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>
                Register Commercial Gym
              </Link>
              <Link href="/kiosk" style={{ color: 'inherit', textDecoration: 'none' }}>
                Front Desk Kiosk Mode
              </Link>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Telemetry & Trust
            </div>
            <p style={{ color: '#64748b', fontSize: '0.76rem', lineHeight: 1.5, marginBottom: '12px' }}>
              256-Bit SSL Encrypted • India DPDP Act Ready • Automatic Encrypted Backups
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '5px 10px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                fontSize: '0.72rem',
                color: '#34d399',
                fontWeight: 700,
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span>All Cloud Nodes Nominal (0.12ms)</span>
            </div>
          </div>
        </div>

        <div className="feeorbit-container">
          <div
            style={{
              paddingTop: '18px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: '#64748b',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>© {new Date().getFullYear()} FeeOrbit OS. Handcrafted for Indian Gym Infrastructure.</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security Architecture</span>
              <span>Help & Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
