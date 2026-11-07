'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import FeeOrbitLoadingScreen from '../../components/FeeOrbitLoadingScreen';
import {
  Megaphone,
  Plus,
  AlertTriangle,
  Info,
  Sparkles,
  Calendar,
  Clock,
  Share2,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Pin,
  Send,
  X,
  Check,
  Building2,
  ShieldCheck,
  ExternalLink,
  Users,
  Flame,
  ArrowRight,
  ChevronRight,
  Eye,
  MessageCircle,
} from 'lucide-react';

const CATEGORY_MAP = {
  holiday: {
    label: 'Holiday / Gym Closed',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.28)',
    icon: AlertTriangle,
  },
  trainer_leave: {
    label: 'Trainer Update / Leave',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.28)',
    icon: Info,
  },
  maintenance: {
    label: 'Maintenance & Service',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.28)',
    icon: Clock,
  },
  offer: {
    label: 'Special Offer & Event',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.28)',
    icon: Sparkles,
  },
  feature_update: {
    label: 'Platform Feature Update',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.28)',
    icon: ShieldCheck,
  },
  general: {
    label: 'General Notice',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.28)',
    icon: Megaphone,
  },
};

const TEMPLATES = [
  {
    id: 'holiday_tomorrow',
    title: '⚠️ Important: Gym Will Remain Closed Tomorrow',
    category: 'holiday',
    priority: 'urgent',
    message:
      'Dear members, please note that our gym will remain completely closed tomorrow due to scheduled facility maintenance and deep sanitization. Regular training workouts will resume the next day as per normal timings. Stay hydrated and rest well! 💪',
    validDays: 1,
    tag: 'Gym Closed',
  },
  {
    id: 'trainer_leave',
    title: 'Trainer Schedule & Shift Update',
    category: 'trainer_leave',
    priority: 'info',
    message:
      'Coach is on planned leave today. Morning floor training sessions will be assisted by our head instructor. Evening batch sessions will proceed as usual. Please check in with the reception desk for routine queries.',
    validDays: 1,
    tag: 'Trainer Leave',
  },
  {
    id: 'machine_maintenance',
    title: 'Cardio & Strength Equipment Servicing Today',
    category: 'maintenance',
    priority: 'info',
    message:
      'Routine technical inspection and lubrication servicing of treadmills and cable machines is scheduled between 1:00 PM and 4:00 PM today. Other workout areas will remain fully open without disturbance.',
    validDays: 1,
    tag: 'Facility Maintenance',
  },
  {
    id: 'festive_offer',
    title: '🎉 Special Celebration Fitness Offer - Extra Month Free!',
    category: 'offer',
    priority: 'event',
    message:
      'Limited Time Celebration! Renew or upgrade your quarterly or annual gym membership this week and get +1 Month Free extension plus a personalized diet chart consultation. Ask at front desk or pay directly online!',
    validDays: 7,
    tag: 'Special Offer',
  },
  {
    id: 'platform_feature',
    title: '🚀 New Platform Features Live: Direct UPI & Notice Board',
    category: 'feature_update',
    priority: 'info',
    targetType: 'superadmin_broadcast',
    message:
      'SuperAdmin Update: FeeOrbit now features Instant Member Notice Board, 0% Fee Direct Gym UPI QR Code, and Equipment inventory tracking! Check the new updates in your navigation sidebar.',
    validDays: 14,
    tag: 'Platform Broadcast',
  },
];

export default function AnnouncementsPage() {
  const { user, token } = useAuth();
  const { currentGym } = useGym();
  const { t } = useLanguage();
  const toast = useToast();

  const isSuperAdmin = user?.role === 'superadmin';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showExpired, setShowExpired] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetType: 'gym_notice',
    category: 'holiday',
    priority: 'urgent',
    validUntilDate: '',
    targetAudience: 'all',
    isPinned: false,
  });

  // Calculate default expiration date (tomorrow 23:59)
  const defaultValidDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 0, 0);
    return d.toISOString().slice(0, 16);
  }, []);

  const fetchAnnouncements = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      let url = `/api/announcements?`;
      if (currentGym?._id && !isSuperAdmin) {
        url += `gymId=${currentGym._id}&`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data || []);
      } else {
        toast.error(data.message || 'Failed to load announcements');
      }
    } catch (err) {
      toast.error('Network error loading announcements');
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnnouncements();
    }
  }, [token, currentGym]);

  const handleOpenCreateModal = (presetTemplate = null) => {
    if (presetTemplate) {
      const d = new Date();
      d.setDate(d.getDate() + (presetTemplate.validDays || 1));
      d.setHours(23, 59, 0, 0);

      setFormData({
        title: presetTemplate.title,
        message: presetTemplate.message,
        targetType: presetTemplate.targetType || 'gym_notice',
        category: presetTemplate.category,
        priority: presetTemplate.priority,
        validUntilDate: d.toISOString().slice(0, 16),
        targetAudience: 'all',
        isPinned: presetTemplate.priority === 'urgent',
      });
    } else {
      setFormData({
        title: '',
        message: '',
        targetType: isSuperAdmin ? 'superadmin_broadcast' : 'gym_notice',
        category: 'holiday',
        priority: 'urgent',
        validUntilDate: defaultValidDate,
        targetAudience: 'all',
        isPinned: false,
      });
    }
    setShowModal(true);
  };

  const handleSubmitAnnouncement = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      return toast.warning('Please enter both title and announcement details');
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        targetType: formData.targetType,
        category: formData.category,
        priority: formData.priority,
        validUntil: formData.validUntilDate ? new Date(formData.validUntilDate).toISOString() : null,
        targetAudience: formData.targetAudience,
        isPinned: formData.isPinned,
        gym: formData.targetType === 'superadmin_broadcast' ? null : currentGym?._id,
      };

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          formData.targetType === 'superadmin_broadcast'
            ? '🚀 Platform Broadcast published to all Gym Admins!'
            : '📢 Announcement published to Gym Notice Board!'
        );
        setShowModal(false);
        fetchAnnouncements();
      } else {
        toast.error(data.message || 'Could not publish announcement');
      }
    } catch (err) {
      toast.error('Network connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to remove announcement:\n"${title}"?`)) return;

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Announcement removed');
        setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Network error deleting notice');
    }
  };

  const handleTogglePin = async (item) => {
    try {
      const res = await fetch(`/api/announcements/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPinned: !item.isPinned }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(item.isPinned ? 'Unpinned' : 'Pinned to top');
        fetchAnnouncements();
      }
    } catch (err) {}
  };

  const handleWhatsAppShare = (item) => {
    const gymName = item.gym?.name || currentGym?.name || 'FeeOrbit Fitness Club';
    const author = item.authorName || 'Gym Management';
    const dateFormatted = item.validUntil
      ? new Date(item.validUntil).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

    let text = `📢 *IMPORTANT NOTICE FROM ${gymName.toUpperCase()}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📌 *${item.title}*\n\n`;
    text += `${item.message}\n\n`;
    if (dateFormatted) {
      text += `🗓 *Valid Until:* ${dateFormatted}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `— *${author}*`;

    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    const now = new Date();
    return announcements.filter((item) => {
      // Expiry filter
      if (!showExpired && item.validUntil) {
        const exp = new Date(item.validUntil);
        if (exp < now) return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Priority filter
      if (selectedPriority !== 'all' && item.priority !== selectedPriority) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = (item.title || '').toLowerCase();
        const m = (item.message || '').toLowerCase();
        const a = (item.authorName || '').toLowerCase();
        return t.includes(q) || m.includes(q) || a.includes(q);
      }
      return true;
    });
  }, [announcements, searchQuery, selectedCategory, selectedPriority, showExpired]);

  // Stats computation
  const stats = useMemo(() => {
    const now = new Date();
    let urgent = 0;
    let broadcasts = 0;
    let active = 0;

    announcements.forEach((a) => {
      const isExp = a.validUntil && new Date(a.validUntil) < now;
      if (!isExp && a.isActive) active++;
      if (a.priority === 'urgent' && !isExp) urgent++;
      if (a.targetType === 'superadmin_broadcast') broadcasts++;
    });

    return {
      total: announcements.length,
      active,
      urgent,
      broadcasts,
    };
  }, [announcements]);

  if (loading && !announcements.length) {
    return <FeeOrbitLoadingScreen variant="inline" message="Loading Notice Board & Broadcasts..." />;
  }

  return (
    <div style={{ paddingBottom: '40px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* 1. TOP HEADER & QUICK ACTION BAR */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              }}
            >
              <Megaphone size={22} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Notice Board & Broadcasts
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {isSuperAdmin
                  ? 'Broadcast platform updates to Gym Admins & manage gym notices'
                  : 'Broadcast urgent alerts, holiday notices, and schedule updates to gym members & staff'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => fetchAnnouncements(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              background: 'var(--bg-input, rgba(255,255,255,0.05))',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Plus size={16} />
            {isSuperAdmin ? 'New Broadcast / Notice' : 'Post Gym Announcement'}
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Active Notices
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {stats.active}
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Urgent / Gym Closed
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
              {stats.urgent}
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={20} />
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Platform Broadcasts
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
              {stats.broadcasts}
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={20} />
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total Published
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {stats.total}
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Megaphone size={20} />
          </div>
        </div>
      </div>

      {/* 3. ONE-CLICK QUICK TEMPLATE SHORTCUTS */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '18px 22px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={16} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            1-Click Fast Templates:
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {TEMPLATES.map((tmpl) => {
            const isPlatform = tmpl.targetType === 'superadmin_broadcast';
            if (isPlatform && !isSuperAdmin) return null;

            return (
              <button
                key={tmpl.id}
                onClick={() => handleOpenCreateModal(tmpl)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: 'var(--bg-input, rgba(255,255,255,0.03))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--bg-input, rgba(255,255,255,0.03))';
                }}
              >
                <span>{tmpl.tag}</span>
                <ArrowRight size={13} style={{ opacity: 0.7 }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SEARCH & FILTER CONTROLS */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '260px' }}>
          <div
            style={{
              position: 'relative',
              flex: '1',
              maxWidth: '380px',
            }}
          >
            <Search
              size={15}
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
              placeholder="Search announcements by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Categories</option>
            <option value="holiday">Holiday / Closed</option>
            <option value="trainer_leave">Trainer Updates</option>
            <option value="maintenance">Maintenance</option>
            <option value="offer">Offers & Events</option>
            <option value="feature_update">Platform Updates</option>
            <option value="general">General Notices</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent Only</option>
            <option value="info">🔵 Info Only</option>
            <option value="event">🟢 Events Only</option>
          </select>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={showExpired}
            onChange={(e) => setShowExpired(e.target.checked)}
            style={{ cursor: 'pointer', accentColor: '#f59e0b' }}
          />
          Show Expired Notices
        </label>
      </div>

      {/* 5. ANNOUNCEMENTS LIST */}
      {filteredAnnouncements.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: '16px',
            padding: '50px 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Megaphone size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            No Announcements Found
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px' }}>
            No announcements published yet. Click the button above to broadcast your first gym notice or schedule update.
          </p>
          <button
            onClick={() => handleOpenCreateModal()}
            style={{
              padding: '9px 18px',
              background: '#f59e0b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Create First Notice
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAnnouncements.map((item) => {
            const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.general;
            const CatIcon = cat.icon;
            const isExpired = item.validUntil && new Date(item.validUntil) < new Date();
            const isSuperBroadcast = item.targetType === 'superadmin_broadcast';

            return (
              <div
                key={item._id}
                style={{
                  background: isSuperBroadcast
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.04))'
                    : 'var(--bg-card)',
                  border: isSuperBroadcast
                    ? '1px solid rgba(139, 92, 246, 0.35)'
                    : item.priority === 'urgent'
                    ? '1px solid rgba(239, 68, 68, 0.35)'
                    : '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '22px 24px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  opacity: isExpired ? 0.75 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Superadmin Broadcast Tag */}
                    {isSuperBroadcast && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: '#8b5cf6',
                          background: 'rgba(139, 92, 246, 0.14)',
                          border: '1px solid rgba(139, 92, 246, 0.35)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        <ShieldCheck size={12} />
                        PLATFORM BROADCAST (ALL GYMS)
                      </span>
                    )}

                    {/* Category Tag */}
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: cat.color,
                        background: cat.bg,
                        border: `1px solid ${cat.border}`,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <CatIcon size={12} />
                      {cat.label}
                    </span>

                    {/* Priority Badge */}
                    {item.priority === 'urgent' && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: '#ef4444',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <AlertTriangle size={12} />
                        URGENT ALERT
                      </span>
                    )}

                    {/* Pinned Badge */}
                    {item.isPinned && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.12)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Pin size={11} />
                        PINNED
                      </span>
                    )}

                    {/* Status Badge */}
                    {isExpired ? (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          background: 'rgba(255, 255, 255, 0.06)',
                          padding: '2px 7px',
                          borderRadius: '6px',
                        }}
                      >
                        EXPIRED
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#10b981',
                          background: 'rgba(16, 185, 129, 0.12)',
                          padding: '2px 7px',
                          borderRadius: '6px',
                        }}
                      >
                        LIVE / ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Actions right */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* WhatsApp share button */}
                    <button
                      onClick={() => handleWhatsAppShare(item)}
                      title="Share Notice to WhatsApp"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 11px',
                        background: 'rgba(37, 211, 102, 0.12)',
                        border: '1px solid rgba(37, 211, 102, 0.3)',
                        borderRadius: '8px',
                        color: '#25D366',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <MessageCircle size={14} />
                      Share WhatsApp
                    </button>

                    {/* Pin toggle */}
                    <button
                      onClick={() => handleTogglePin(item)}
                      title={item.isPinned ? 'Unpin' : 'Pin to top'}
                      style={{
                        padding: '6px 9px',
                        background: 'var(--bg-input, rgba(255,255,255,0.05))',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: item.isPinned ? '#f59e0b' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <Pin size={14} />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(item._id, item.title)}
                      title="Delete Announcement"
                      style={{
                        padding: '6px 9px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h2
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: '0 0 10px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.title}
                </h2>

                {/* Content Message */}
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    margin: '0 0 16px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {item.message}
                </p>

                {/* Footer meta */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 size={13} style={{ opacity: 0.7 }} />
                      {item.gym?.name || (isSuperBroadcast ? 'FeeOrbit Network' : 'Your Gym')}
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} style={{ opacity: 0.7 }} />
                      Posted{' '}
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>

                    <span>By: {item.authorName || 'Management'}</span>
                  </div>

                  {item.validUntil && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: isExpired ? '#ef4444' : '#f59e0b',
                        fontWeight: 600,
                      }}
                    >
                      <Clock size={13} />
                      {isExpired ? 'Expired on: ' : 'Auto-expires: '}
                      {new Date(item.validUntil).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. CREATE ANNOUNCEMENT MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card, #0f172a)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
              borderRadius: '20px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
              padding: '28px',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {isSuperAdmin ? 'Publish Announcement / Broadcast' : 'Create Gym Notice'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Broadcast instant updates to members and staff
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAnnouncement}>
              {/* If Superadmin: choose target type */}
              {isSuperAdmin && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Target Audience Scope:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, targetType: 'superadmin_broadcast' })}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border:
                          formData.targetType === 'superadmin_broadcast'
                            ? '2px solid #8b5cf6'
                            : '1px solid var(--border-subtle)',
                        background:
                          formData.targetType === 'superadmin_broadcast'
                            ? 'rgba(139, 92, 246, 0.15)'
                            : 'var(--bg-input)',
                        color: formData.targetType === 'superadmin_broadcast' ? '#8b5cf6' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      🚀 Platform Broadcast (All Gym Admins)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, targetType: 'gym_notice' })}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border:
                          formData.targetType === 'gym_notice'
                            ? '2px solid #f59e0b'
                            : '1px solid var(--border-subtle)',
                        background:
                          formData.targetType === 'gym_notice'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'var(--bg-input)',
                        color: formData.targetType === 'gym_notice' ? '#f59e0b' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      🏢 Gym Notice (Gym Members & Staff)
                    </button>
                  </div>
                </div>
              )}

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                  Notice Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gym Closed Tomorrow / Trainer Schedule Update"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Category & Priority in 2 Columns */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="holiday">Holiday / Gym Closed</option>
                    <option value="trainer_leave">Trainer Schedule / Leave</option>
                    <option value="maintenance">Maintenance & Service</option>
                    <option value="offer">Special Offer / Event</option>
                    <option value="feature_update">Platform / Feature Update</option>
                    <option value="general">General Notice</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="urgent">🔴 Urgent (High Priority Alert)</option>
                    <option value="info">🔵 Info (Standard Notice)</option>
                    <option value="event">🟢 Event / Special Offer</option>
                  </select>
                </div>
              </div>

              {/* Message Details */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                  Detailed Notice Content *
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed announcement for members... (e.g. Facility will undergo deep sanitization tomorrow morning. Regular evening workouts resume at 5:00 PM)"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    lineHeight: '1.5',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Expiration date & Target audience */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Auto-Expire Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validUntilDate}
                    onChange={(e) => setFormData({ ...formData, validUntilDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                    Notice will automatically hide after this date
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Pin to Top
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      style={{ accentColor: '#f59e0b' }}
                    />
                    Pin to the top of Notice Board
                  </label>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                  }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Publish Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
