'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useGym } from '../context/GymContext';
import Sidebar from './Sidebar';
import GymHeader from './GymHeader';
import FeeOrbitLoadingScreen from './FeeOrbitLoadingScreen';
import { Orbit, Lock, ShieldAlert, Zap, Sparkles, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

const PUBLIC_ROUTES = ['/home', '/login', '/signup', '/onboarding', '/register-gym', '/scan'];
const ADMIN_ONLY_ROUTES = ['/expenses', '/settings', '/subscription', '/billing', '/staff', '/branches'];

export default function AppShell({ children }) {
  const { user, loading, logout } = useAuth();
  const { currentGym } = useGym();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatically close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const isMarketingHome = pathname === '/' && mounted && !loading && !user;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || isMarketingHome;
  const isSuperAdminRoute = pathname.startsWith('/superadmin');

  // Subscription & Free Trial calculations for logged in gym
  const sub = currentGym?.subscription;
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isTrial = sub?.status === 'trialing' || sub?.plan === 'trial' || !sub?.status;
  const endDate = sub?.endDate ? new Date(sub.endDate) : new Date(Date.now() + 14 * 86400000);
  const daysLeft = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));
  const isTrialExpired = isTrial && daysLeft <= 0;
  const isPastDue = sub?.status === 'past_due' || sub?.status === 'cancelled';
  const isSubscriptionLocked = isAdmin && (isTrialExpired || isPastDue);

  // Plan level feature gating for Starter Club (Admin only)
  const isStarterPlan = sub?.plan === 'starter' && sub?.status === 'active';
  const isProFeature = ['/expenses', '/inventory', '/branches'].some((p) => pathname.startsWith(p));
  const isFeatureLockedOnStarter = isAdmin && isStarterPlan && isProFeature;

  useEffect(() => {
    if (loading || !mounted) return;

    // 1. Not logged in -> Immediately redirect to login for all protected routes
    if (!user) {
      if (!isPublicRoute) {
        const returnUrl = encodeURIComponent(pathname);
        router.replace(`/login?returnUrl=${returnUrl}`);
      }
    } else {
      // 2. Logged in user visiting login/signup page -> Redirect to their home
      if (pathname === '/login' || pathname === '/signup') {
        if (user.role === 'superadmin') {
          router.replace('/superadmin');
        } else if (user.role === 'member') {
          router.replace('/portal');
        } else {
          router.replace('/');
        }
      }

      // 3. Superadmin Route Protection -> Only superadmin can access /superadmin/*
      if (isSuperAdminRoute && user.role !== 'superadmin') {
        router.replace(user.role === 'member' ? '/portal' : '/');
      }

      // 4. Member role restrictions -> Member can access member routes
      const MEMBER_ALLOWED_ROUTES = ['/portal', '/scan', '/notifications', '/ai-coach', '/chat', '/feedback', '/store', '/machines'];
      if (user.role === 'member' && !MEMBER_ALLOWED_ROUTES.includes(pathname) && !isPublicRoute) {
        router.replace('/portal');
      }

      // 5. Staff role restrictions -> Staff cannot access financial & system admin routes
      if (user.role === 'staff' && (ADMIN_ONLY_ROUTES.includes(pathname) || isSuperAdminRoute)) {
        router.replace('/');
      }
    }
  }, [user, loading, pathname, isPublicRoute, isSuperAdminRoute, router, mounted]);

  // Loading Screen while resolving session from storage/server for protected routes only
  if ((loading || !mounted) && !isPublicRoute) {
    return <FeeOrbitLoadingScreen message="Verifying secure workspace session..." />;
  }

  // If user is NOT logged in:
  if (!user) {
    // Only render children if on a public route (home, login, signup, onboarding)
    if (isPublicRoute) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
          {children}
        </div>
      );
    }

    // On protected route and not logged in: Safe redirection screen (NO demo bypass!)
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main, #070a12)',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8',
            marginBottom: '16px',
            boxShadow: '0 0 32px rgba(99, 102, 241, 0.25)',
          }}
        >
          <Lock size={26} />
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)', marginBottom: '6px' }}>
          Workspace Sign In Required
        </div>
        <div style={{ fontSize: '0.86rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '24px', textAlign: 'center', maxWidth: '420px', lineHeight: 1.5 }}>
          Access to this feature requires an active gym account with a valid 14-day free trial or subscription. Please sign in or register to continue.
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`)}
            style={{
              padding: '11px 22px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            Sign In with Email
          </button>
          <button
            onClick={() => router.push('/signup')}
            style={{
              padding: '11px 20px',
              borderRadius: '9px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Start 14-Day Free Trial
          </button>
        </div>
      </div>
    );
  }

  // If on a public route while logged in (or explicitly running standalone tablet kiosk mode)
  const isStandaloneKiosk =
    pathname === '/kiosk' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mode') === 'standalone';

  if (isPublicRoute || isStandaloneKiosk) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
        {children}
      </div>
    );
  }

  // Authenticated Workspace Layout
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ================= POST-LOGIN SUBSCRIPTION & TRIAL STATUS BANNER ================= */}
      {/* Shown ONLY TO GYM ADMIN to communicate legitimate trial/subscription status */}
      {isAdmin && isTrial && daysLeft > 0 && (
        <div
          style={{
            background: 'linear-gradient(90deg, #1e1b4b 0%, #172554 50%, #064e3b 100%)',
            borderBottom: '1px solid rgba(99, 102, 241, 0.35)',
            color: '#ffffff',
            padding: '7px 20px',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            zIndex: 1000,
            position: 'relative',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: 'rgba(99, 102, 241, 0.3)',
                border: '1px solid rgba(99, 102, 241, 0.5)',
                color: '#a5b4fc',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.66rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              ⏳ 14-Day Free Trial Active
            </span>
            <span>
              You are on Day {Math.min(14, 14 - daysLeft + 1)} of 14 for <strong>{currentGym?.name || 'your gym'}</strong>. Test all features freely! ({daysLeft} days remaining)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/subscription"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                padding: '3px 12px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              }}
            >
              Upgrade Subscription
            </Link>
          </div>
        </div>
      )}

      {/* Starter Club Notice Banner (Admin only) */}
      {isAdmin && isStarterPlan && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#cbd5e1',
            padding: '5px 20px',
            fontSize: '0.74rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            zIndex: 1000,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            <span>Active Plan: <strong>Starter Club (Single Branch • Up to 150 Members)</strong></span>
          </div>
          <Link
            href="/subscription"
            style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 700, fontSize: '0.72rem' }}
          >
            Upgrade to Pro Growth (Unlock AI Coach & AMC) &rarr;
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Responsive Mobile Drawer Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <main className="main-content">
          <GymHeader onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

          {/* ================= SUBSCRIPTION & FREE TRIAL PAYWALL LOCK ================= */}
          {/* If free trial has expired and gym hasn't paid: block feature access except /subscription and /settings */}
          {isSubscriptionLocked && !['/subscription', '/settings'].includes(pathname) ? (
            <div
              style={{
                minHeight: '75vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1.5px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  marginBottom: '20px',
                  boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)',
                }}
              >
                <Lock size={30} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                14-Day Free Trial Expired
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: '520px', lineHeight: 1.6, marginBottom: '24px' }}>
                Your 14-day free trial period for <strong>{currentGym?.name}</strong> has concluded. To protect your gym data and continue utilizing FeeOrbit's attendance kiosk, WhatsApp recovery, and AI Coach, please activate an official subscription.
              </p>
              <Link
                href="/subscription"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)',
                }}
              >
                Activate Subscription (From ₹1,499/mo) &rarr;
              </Link>
            </div>
          ) : isFeatureLockedOnStarter ? (
            /* Starter Club Plan Feature Gate: AI Coach, Expenses, Inventory */
            <div
              style={{
                minHeight: '75vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1.5px solid rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                  marginBottom: '20px',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.25)',
                }}
              >
                <Sparkles size={30} />
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#a5b4fc',
                  padding: '3px 12px',
                  borderRadius: '100px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  marginBottom: '10px',
                }}
              >
                PRO GROWTH FEATURE
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                This Module is Available on Pro Growth
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: '500px', lineHeight: 1.6, marginBottom: '24px' }}>
                Your current plan (<strong>Starter Club</strong>) includes Member Management, Tablet Kiosk & WhatsApp Dues. Upgrade to <strong>Pro Growth (₹2,499/mo)</strong> to unlock Google Gemini AI Coach, Staff Payroll & Equipment AMC.
              </p>
              <Link
                href="/subscription"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)',
                }}
              >
                Upgrade to Pro Growth (₹2,499/mo) &rarr;
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
