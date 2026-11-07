'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGym } from '../context/GymContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Home,
  QrCode,
  Users,
  CreditCard,
  UserCog,
  Dumbbell,
  TrendingDown,
  Sliders,
  Sparkles,
  PlusCircle,
  Building2,
  FileBarChart,
  ShieldCheck,
  UserCheck,
  Crown,
  X,
  Bell,
  GitBranch,
  CalendarDays,
  Globe,
  Megaphone,
  MessageSquare,
  Star,
  ShoppingBag,
} from 'lucide-react';

export default function Sidebar({ mobileOpen = false, onClose }) {
  const pathname = usePathname();
  const { currentGym } = useGym();
  const { user, token } = useAuth();
  const { t } = useLanguage();

  const currentRole = user?.role || 'admin';
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  // Sync real unread notification count & chat unread count
  useEffect(() => {
    const updateUnread = () => {
      try {
        const storedRead = localStorage.getItem('feeorbit_read_notifs');
        const readSet = new Set(storedRead ? JSON.parse(storedRead) : []);
        const storedDeleted = localStorage.getItem('feeorbit_deleted_notifs');
        const delSet = new Set(storedDeleted ? JSON.parse(storedDeleted) : []);

        let url = '/api/dashboard/stats';
        if (currentGym?._id) url += `?gymId=${currentGym._id}`;
        fetch(url)
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              let count = 0;
              data.recentActivity?.checkIns?.forEach((ci) => {
                const id = `ci-${ci._id}`;
                if (!readSet.has(id) && !delSet.has(id)) count++;
              });
              data.recentActivity?.payments?.forEach((p) => {
                const id = `pay-${p._id}`;
                if (!readSet.has(id) && !delSet.has(id)) count++;
              });
              data.expiringSoonList?.forEach((m) => {
                const id = `exp-${m._id}`;
                if (!readSet.has(id) && !delSet.has(id)) count++;
              });
              setUnreadCount(count);
            }
          })
          .catch(() => {});

        // Fetch chat unread count
        const authToken = token || localStorage.getItem('feeorbit_token') || 'demo_token';
        fetch('/api/chat/conversations', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success && Array.isArray(data.data)) {
              const totalUnread = data.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
              setChatUnread(totalUnread);
            }
          })
          .catch(() => {});
      } catch (e) {}
    };

    updateUnread();
    window.addEventListener('feeorbit-notifications-updated', updateUnread);
    window.addEventListener('gympulse-chat-updated', updateUnread);
    window.addEventListener('storage', updateUnread);
    const interval = setInterval(updateUnread, 30000);
    return () => {
      window.removeEventListener('feeorbit-notifications-updated', updateUnread);
      window.removeEventListener('gympulse-chat-updated', updateUnread);
      window.removeEventListener('storage', updateUnread);
      clearInterval(interval);
    };
  }, [currentGym, token]);

  // Navigation Items matching the exact FeeOrbit Target Reference Mockup
  const adminNavItems = [
    {
      label: t('nav_dashboard', 'Dashboard'),
      href: '/',
      icon: Home,
      desc: t('desc_dashboard', 'Overview & Insights'),
    },
    {
      label: t('nav_ai_coach', 'AI Fitness Coach'),
      href: '/ai-coach',
      icon: Sparkles,
      desc: t('desc_ai_coach', 'Workouts & Diet Plans'),
      badge: 'AI',
    },
    {
      label: 'Gym Chat & Groups',
      href: '/chat',
      icon: MessageSquare,
      desc: 'Members, Trainers & Community',
      badge: chatUnread > 0 ? `${chatUnread}` : 'LIVE',
      badgeColor: '#10b981',
    },
    {
      label: t('nav_kiosk', 'Attendance Kiosk'),
      href: '/kiosk',
      icon: QrCode,
      desc: t('desc_kiosk', 'QR & Desk Check-In'),
      badge: 'LIVE',
    },
    {
      label: t('nav_members', 'Gym Members'),
      href: '/members',
      icon: Users,
      desc: t('desc_members', 'All Members & Plans'),
    },
    {
      label: t('nav_events', 'Events & Holidays'),
      href: '/events',
      icon: CalendarDays,
      desc: t('desc_events', 'Gym Off, Festivals & Birthdays'),
    },
    {
      label: t('nav_announcements', 'Notice Board & Alerts'),
      href: '/announcements',
      icon: Megaphone,
      desc: t('desc_announcements', 'Gym Broadcasts & Member Notices'),
      badge: 'NEW',
      badgeColor: '#f59e0b',
    },
    {
      label: t('nav_billing', 'Fees & Payments'),
      href: '/billing',
      icon: CreditCard,
      desc: t('desc_billing', 'Collect Fee & Receipts'),
    },
    {
      label: t('nav_staff', 'Staff & Trainers'),
      href: '/staff',
      icon: UserCog,
      desc: t('desc_staff', 'Team & Salaries'),
    },
    {
      label: t('nav_inventory', 'Gym Equipment'),
      href: '/inventory',
      icon: Dumbbell,
      desc: t('desc_inventory', 'Machines & Repairs'),
    },
    {
      label: t('nav_expenses', 'Gym Expenses'),
      href: '/expenses',
      icon: TrendingDown,
      desc: t('desc_expenses', 'Rent, Bills & Profit'),
    },
    {
      label: t('nav_notifications', 'Notifications'),
      href: '/notifications',
      icon: Bell,
      desc: t('desc_notifications', 'Activity & Alerts'),
      badge: unreadCount > 0 ? `${unreadCount}` : null,
      badgeColor: '#ef4444',
    },
    {
      label: t('nav_subscription', 'Subscription Plan'),
      href: '/subscription',
      icon: Crown,
      desc: t('desc_subscription', 'App Plan & Billing'),
      badge: 'PRO',
    },
    {
      label: t('nav_branches', 'Gym Branches'),
      href: '/branches',
      icon: GitBranch,
      desc: t('desc_branches', 'Locations & Expansion'),
    },
    {
      label: t('nav_settings', 'Gym Settings'),
      href: '/settings',
      icon: Sliders,
      desc: t('desc_settings', 'Profile, Logo & Settings'),
    },
    {
      label: t('nav_showcase', 'Public Showcase Site'),
      href: '/home',
      icon: Globe,
      desc: t('desc_showcase', 'Marketing & Landing Page'),
      badge: 'VISIT',
    },
  ];

  const superadminNavItems = [
    {
      label: 'SuperAdmin Hub',
      href: '/superadmin',
      icon: ShieldCheck,
      desc: 'Platform Overview',
      badge: 'SUPER',
    },
    {
      label: 'All Gyms Directory',
      href: '/superadmin/gyms',
      icon: Building2,
      desc: 'Gym Accounts & Status',
    },
    {
      label: 'SaaS Pricing Plans',
      href: '/superadmin/plans',
      icon: CreditCard,
      desc: 'Manage Pricing Tiers',
    },
    {
      label: 'Consolidated Reports',
      href: '/superadmin/reports',
      icon: FileBarChart,
      desc: 'All Gym Analytics',
    },
    ...adminNavItems.filter((item) => item.href !== '/subscription' && item.href !== '/onboarding'),
  ];

  const memberNavItems = [
    {
      label: t('nav_my_portal', 'My Dashboard'),
      href: '/portal',
      icon: UserCheck,
      desc: t('desc_dashboard', 'My Pass & Receipts'),
    },
    {
      label: t('nav_scan_qr', 'Scan Attendance'),
      href: '/scan',
      icon: QrCode,
      desc: t('desc_kiosk', 'Self Check-In / Out'),
    },
    {
      label: t('nav_notifications', 'Notifications'),
      href: '/notifications',
      icon: Bell,
      desc: t('desc_notifications', 'Activity & Alerts'),
      badge: unreadCount > 0 ? `${unreadCount}` : null,
      badgeColor: '#ef4444',
    },
    {
      label: 'Gym Chat & Community',
      href: '/chat',
      icon: MessageSquare,
      desc: 'Connect with Members & Trainers',
      badge: chatUnread > 0 ? `${chatUnread}` : 'LIVE',
      badgeColor: '#10b981',
    },
    {
      label: t('nav_ai_coach', 'AI Fitness Coach'),
      href: '/ai-coach',
      icon: Sparkles,
      desc: t('desc_ai_coach', 'Diet & Exercise Guide'),
      badge: 'AI',
    },
  ];

  // Grouped Navigation for Elite Human SaaS UI
  const adminSections = [
    {
      title: t('sec_platform', 'PLATFORM'),
      items: [
        { label: t('nav_dashboard', 'Dashboard'), href: '/', icon: Home },
        { label: 'Gym Chat', href: '/chat', icon: MessageSquare, badge: chatUnread > 0 ? `${chatUnread}` : 'LIVE', badgeColor: 'rgba(16, 185, 129, 0.2)', badgeTextColor: '#34d399', badgeBorder: 'rgba(16, 185, 129, 0.35)' },
        { label: t('nav_ai_coach', 'AI Coach'), href: '/ai-coach', icon: Sparkles, badge: 'AI', badgeColor: 'rgba(99, 102, 241, 0.2)', badgeTextColor: '#a5b4fc', badgeBorder: 'rgba(99, 102, 241, 0.35)' },
        { label: t('nav_kiosk_checkin', 'Kiosk Check-In'), href: '/kiosk', icon: QrCode, isLive: true },
      ],
    },
    {
      title: t('sec_operations', 'OPERATIONS'),
      items: [
        { label: t('nav_members', 'Members'), href: '/members', icon: Users },
        { label: 'Gym Pro Shop', href: '/store', icon: ShoppingBag, badge: 'SHOP', badgeColor: 'rgba(16, 185, 129, 0.18)', badgeTextColor: '#10b981', badgeBorder: 'rgba(16, 185, 129, 0.35)' },
        { label: 'Member Feedback', href: '/feedback', icon: Star, badge: 'REVIEWS', badgeColor: 'rgba(245, 158, 11, 0.18)', badgeTextColor: '#f59e0b', badgeBorder: 'rgba(245, 158, 11, 0.35)' },
        { label: t('nav_events', 'Events & Holidays'), href: '/events', icon: CalendarDays },
        { label: t('nav_billing', 'Fees & Payments'), href: '/billing', icon: CreditCard },
        { label: 'Staff & Payroll', href: '/staff', icon: UserCog, badge: 'PAYROLL', badgeColor: 'rgba(99, 102, 241, 0.18)', badgeTextColor: '#a5b4fc', badgeBorder: 'rgba(99, 102, 241, 0.35)' },
        { label: t('nav_inventory', 'Gym Equipment'), href: '/inventory', icon: Dumbbell },
        { label: 'Floor Machines & AI Guide', href: '/machines', icon: Dumbbell, badge: 'AI', badgeColor: 'rgba(99, 102, 241, 0.18)', badgeTextColor: '#a5b4fc', badgeBorder: 'rgba(99, 102, 241, 0.35)' },
      ],
    },
    {
      title: t('sec_finance', 'FINANCE & SYSTEM'),
      items: [
        { label: t('nav_expenses', 'Gym Expenses'), href: '/expenses', icon: TrendingDown },
        { label: t('nav_notifications', 'Notifications'), href: '/notifications', icon: Bell, count: unreadCount },
        { label: t('nav_subscription', 'Subscription'), href: '/subscription', icon: Crown, badge: 'PRO', badgeColor: 'rgba(168, 85, 247, 0.18)', badgeTextColor: '#d8b4fe', badgeBorder: 'rgba(168, 85, 247, 0.3)' },
        { label: t('nav_branches', 'Gym Branches'), href: '/branches', icon: GitBranch },
        { label: t('nav_settings', 'Settings'), href: '/settings', icon: Sliders },
        { label: t('nav_showcase', 'Showcase Site'), href: '/home', icon: Globe, badge: 'WEB', badgeColor: 'rgba(56, 189, 248, 0.15)', badgeTextColor: '#38bdf8', badgeBorder: 'rgba(56, 189, 248, 0.3)' },
      ],
    },
  ];

  const superadminSections = [
    {
      title: t('sec_superadmin', 'SUPERADMIN HQ'),
      items: [
        { label: t('nav_superadmin', 'SuperAdmin Hub'), href: '/superadmin', icon: ShieldCheck, badge: 'HQ' },
        { label: t('superadmin_all_gyms', 'All Gyms Directory'), href: '/superadmin/gyms', icon: Building2 },
        { label: t('superadmin_plans', 'SaaS Pricing Plans'), href: '/superadmin/plans', icon: CreditCard },
        { label: t('superadmin_reports', 'Consolidated Reports'), href: '/superadmin/reports', icon: FileBarChart },
      ],
    },
    ...adminSections,
  ];

  const memberSections = [
    {
      title: t('sec_member_portal', 'MEMBER PORTAL'),
      items: [
        { label: t('nav_my_portal', 'My Dashboard'), href: '/portal', icon: UserCheck },
        { label: 'Gym Chat & Groups', href: '/chat', icon: MessageSquare, badge: chatUnread > 0 ? `${chatUnread}` : 'LIVE', badgeColor: 'rgba(16, 185, 129, 0.2)', badgeTextColor: '#34d399', badgeBorder: 'rgba(16, 185, 129, 0.35)' },
        { label: 'Gym Pro Shop', href: '/store', icon: ShoppingBag, badge: 'SHOP', badgeColor: 'rgba(16, 185, 129, 0.18)', badgeTextColor: '#10b981', badgeBorder: 'rgba(16, 185, 129, 0.35)' },
        { label: 'Gym Details & Machines', href: '/machines', icon: Dumbbell, badge: 'GUIDE', badgeColor: 'rgba(56, 189, 248, 0.18)', badgeTextColor: '#38bdf8', badgeBorder: 'rgba(56, 189, 248, 0.35)' },
        { label: 'Give Gym Feedback', href: '/feedback', icon: Star },
        { label: t('nav_scan_qr', 'Scan Attendance'), href: '/scan', icon: QrCode },
        { label: t('nav_events', 'Events & Holidays'), href: '/events', icon: CalendarDays },
        { label: t('nav_notifications', 'Notifications'), href: '/notifications', icon: Bell, count: unreadCount },
        { label: t('nav_ai_coach', 'AI Workout Coach'), href: '/ai-coach', icon: Sparkles, badge: 'AI' },
      ],
    },
  ];

  let displaySections = adminSections;
  if (currentRole === 'superadmin') displaySections = superadminSections;
  else if (currentRole === 'member') displaySections = memberSections;

  return (
    <aside className={`sidebar no-print ${mobileOpen ? 'mobile-open' : ''}`}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Top Header: FeeOrbit Modern Architectural Brand Logo Tile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 6px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '12px',
          }}
        >
          <Link
            href={currentRole === 'superadmin' ? '/superadmin' : currentRole === 'member' ? '/portal' : '/'}
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              minWidth: 0,
              flex: 1,
            }}
          >
            {/* Bespoke Handcrafted App Brand Tile */}
            {currentRole !== 'superadmin' && currentGym?.logoUrl ? (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--bg-input, #ffffff)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}
              >
                <img
                  src={currentGym.logoUrl}
                  alt={currentGym.name || 'Gym Logo'}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => (e.target.style.display = 'none')}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--brand-primary, #6366f1) 0%, var(--brand-primary-hover, #4f46e5) 100%)',
                  boxShadow: '0 4px 14px var(--brand-primary-light, rgba(99, 102, 241, 0.25)), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                  transition: 'all 0.25s ease',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="24" cy="24" rx="17.5" ry="8" transform="rotate(-28 24 24)" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeDasharray="80 28" />
                  <ellipse cx="24" cy="24" rx="16.5" ry="7.5" transform="rotate(38 24 24)" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="64 36" strokeOpacity="0.8" />
                  <circle cx="37.5" cy="16.5" r="2.8" fill="#ffffff" />
                  <circle cx="10.5" cy="31.5" r="2" fill="#ffffff" />
                  <path d="M24 16.5L28.5 24L24 31.5L19.5 24Z" fill="#ffffff" />
                  <circle cx="24" cy="24" r="2.2" fill="var(--brand-primary, #6366f1)" />
                </svg>
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 900,
                    fontSize: '1.08rem',
                    lineHeight: 1.1,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.025em',
                  }}
                >
                  Fee<span style={{ color: currentRole === 'superadmin' ? '#c084fc' : 'var(--brand-primary)' }}>Orbit</span>
                </span>
                <span
                  style={{
                    fontSize: '0.56rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: 'var(--brand-primary)',
                    background: 'var(--brand-primary-light)',
                    border: '1px solid var(--border-glow)',
                    padding: '1.5px 5px',
                    borderRadius: '4px',
                    lineHeight: 1.1,
                  }}
                >
                  {currentRole === 'superadmin' ? 'HQ' : currentRole === 'member' ? 'VIP' : 'OS'}
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                <span>{currentRole === 'superadmin' ? 'Cloud Operations HQ' : (currentGym?.name || 'FeeOrbit Fitness Club')}</span>
              </div>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close Navigation Menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Grouped Navigation Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
          {displaySections.map((section, sIdx) => (
            <div key={section.title || sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {section.title && (
                <div
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '4px 8px 4px',
                  }}
                >
                  {section.title}
                </div>
              )}

              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '7px 9px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      transition: 'all 0.14s ease',
                      background: isActive ? 'var(--brand-primary-light)' : 'transparent',
                      border: isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
                      boxShadow: isActive ? '0 0 12px var(--brand-primary-light, transparent)' : 'none',
                    }}
                  >
                    {/* Active Accent Bar on Left */}
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          left: '-2px',
                          top: '6px',
                          bottom: '6px',
                          width: '3.5px',
                          borderRadius: '2px',
                          background: 'var(--brand-primary)',
                          boxShadow: '0 0 8px var(--brand-primary)',
                        }}
                      />
                    )}

                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        flexShrink: 0,
                        transition: 'color 0.14s ease',
                      }}
                    >
                      <Icon size={15} strokeWidth={isActive ? 2.3 : 1.8} />
                    </div>

                    <span
                      style={{
                        flex: 1,
                        fontSize: '0.78rem',
                        fontWeight: isActive ? 800 : 600,
                        color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.label}
                    </span>

                    {/* Live Indicator Chip */}
                    {item.isLive && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: 'rgba(16, 185, 129, 0.14)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#34d399',
                          fontSize: '0.56rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          letterSpacing: '0.02em',
                        }}
                      >
                        <span
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: '#10b981',
                            boxShadow: '0 0 4px #10b981',
                          }}
                        />
                        Live
                      </span>
                    )}

                    {/* AI or PRO Badges */}
                    {item.badge && !item.isLive && (
                      <span
                        style={{
                          background: item.badgeColor || 'rgba(99, 102, 241, 0.18)',
                          border: `1px solid ${item.badgeBorder || 'rgba(99, 102, 241, 0.35)'}`,
                          color: item.badgeTextColor || '#a5b4fc',
                          fontSize: '0.56rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Unread Notifications Count */}
                    {item.count > 0 && (
                      <span
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#fca5a5',
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                        }}
                      >
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Profile Card with Refined Human SaaS Style */}
      <div
        style={{
          background: 'var(--bg-input, rgba(17, 23, 38, 0.6))',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.07))',
          borderRadius: '8px',
          padding: '8px 10px',
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {user?.avatar || user?.profileImage ? (
            <img
              src={user.avatar || user.profileImage}
              alt={user?.name || 'User'}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand-primary-hover, #4f46e5), var(--brand-primary, #6366f1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                flexShrink: 0,
              }}
            >
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'RS'}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background:
                    user?.role === 'superadmin' ? '#f59e0b' : user?.role === 'member' ? '#38bdf8' : '#10b981',
                }}
              />
              <span
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  color:
                    user?.role === 'superadmin' ? '#f59e0b' : user?.role === 'member' ? '#38bdf8' : '#10b981',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {user?.role === 'superadmin' ? 'SUPERADMIN' : user?.role === 'member' ? t('role_member', 'MEMBER') : t('role_admin', 'ADMIN')}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--text-primary, #f8fafc)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name || 'Gym Admin'}
            </div>
          </div>
        </div>

        <Link
          href={user?.role === 'member' ? '/portal' : '/settings'}
          style={{ color: '#64748b', display: 'flex', alignItems: 'center', textDecoration: 'none', padding: '2px' }}
          title={user?.role === 'member' ? 'Member Portal' : 'Settings'}
        >
          <Sliders size={13} />
        </Link>
      </div>
    </aside>
  );
}
