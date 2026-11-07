'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import {
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Dumbbell,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  HelpCircle,
  ThumbsUp,
  User,
  Shield,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronRight,
  Trash2,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: Layers },
  { id: 'equipment', label: 'Equipment & Machines', icon: Dumbbell },
  { id: 'cleanliness', label: 'Cleanliness & Hygiene', icon: Sparkles },
  { id: 'trainers', label: 'Trainers & Coaching', icon: User },
  { id: 'ambience', label: 'Ambience & AC', icon: Flame },
  { id: 'facilities', label: 'Lockers & Washrooms', icon: Shield },
  { id: 'general', label: 'General Suggestions', icon: HelpCircle },
];

const FEEDBACK_TYPES = [
  { id: 'suggestion', label: '💡 Suggestion / Idea', color: '#06b6d4' },
  { id: 'maintenance', label: '🛠️ Maintenance Request', color: '#f59e0b' },
  { id: 'complaint', label: '⚠️ Issue / Complaint', color: '#ef4444' },
  { id: 'appreciation', label: '👏 Appreciation / Praise', color: '#10b981' },
];

export default function FeedbackPage() {
  const { user, token } = useAuth();
  const { currentGym } = useGym();

  const isGymAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'staff';

  // Admin View States
  const [feedbacks, setFeedbacks] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCount: 0,
    pendingCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
    averageRating: '5.0',
    categoryBreakdown: {},
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'in_progress' | 'resolved'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution Editing for Admin
  const [respondingFeedbackId, setRespondingFeedbackId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('in_progress');
  const [savingResolution, setSavingResolution] = useState(false);

  // Member View States
  const [memberTab, setMemberTab] = useState('submit'); // 'submit' | 'history'
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loadingMy, setLoadingMy] = useState(false);

  // Member Submission Form
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('equipment');
  const [type, setType] = useState('suggestion');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Auth header helper
  const getAuthHeader = () => {
    const rawToken = token || (typeof window !== 'undefined' ? localStorage.getItem('feeorbit_token') : '') || 'demo_token';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawToken}`,
    };
  };

  // 1. Fetch Admin Feedbacks
  const fetchGymFeedbacks = async () => {
    try {
      setLoading(true);
      let url = '/api/feedback/gym?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (categoryFilter !== 'all') url += `category=${categoryFilter}&`;
      if (ratingFilter !== 'all') url += `rating=${ratingFilter}&`;
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`;

      const res = await fetch(url, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.data || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('fetchGymFeedbacks error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Member's Own Submissions
  const fetchMyFeedbacks = async () => {
    try {
      setLoadingMy(true);
      const res = await fetch('/api/feedback/my', { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMyFeedbacks(data.data);
      }
    } catch (err) {
      console.error('fetchMyFeedbacks error:', err);
    } finally {
      setLoadingMy(false);
    }
  };

  useEffect(() => {
    if (isGymAdmin) {
      fetchGymFeedbacks();
    } else {
      fetchMyFeedbacks();
    }
  }, [isGymAdmin, statusFilter, categoryFilter, ratingFilter, currentGym]);

  // Handle Search Debounce
  useEffect(() => {
    if (!isGymAdmin) return;
    const timer = setTimeout(() => {
      fetchGymFeedbacks();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. Member Submit Feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please fill out both the title and message fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          category,
          type,
          rating,
          isAnonymous,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitSuccess(true);
        setTitle('');
        setMessage('');
        setRating(5);
        setIsAnonymous(false);
        fetchMyFeedbacks();
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        alert(data.message || 'Submission failed');
      }
    } catch (err) {
      alert('Error submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Admin Update Status & Add Resolution
  const handleSaveResolution = async (feedbackId) => {
    setSavingResolution(true);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({
          status: newStatus,
          adminResponse: responseText,
        }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setFeedbacks((prev) =>
          prev.map((f) => (f._id === feedbackId ? data.data : f))
        );
        setRespondingFeedbackId(null);
        setResponseText('');
        fetchGymFeedbacks(); // Refresh metrics
      } else {
        alert(data.message || 'Could not update feedback status');
      }
    } catch (err) {
      alert('Network error updating feedback');
    } finally {
      setSavingResolution(false);
    }
  };

  // 5. Admin Delete Feedback
  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback entry?')) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbacks((prev) => prev.filter((f) => f._id !== id));
        fetchGymFeedbacks();
      }
    } catch (err) {}
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return { label: 'Resolved & Addressed', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.35)' };
      case 'in_progress':
        return { label: 'Under Action', bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.35)' };
      case 'dismissed':
        return { label: 'Dismissed', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.35)' };
      case 'pending':
      default:
        return { label: 'Pending Review', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.35)' };
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 72px)',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        padding: '24px 32px 48px',
      }}
    >
      {/* ========================================================
          TOP HEADER
      ======================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              }}
            >
              <Star size={22} fill="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {isGymAdmin ? 'Member Feedback & Suggestions' : 'Gym Feedback & Ideas'}
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {isGymAdmin
                  ? `Review member feedback, fix equipment issues, and elevate ${currentGym?.name || 'gym'} standards.`
                  : `Help ${currentGym?.name || 'your gym'} improve. Share your honest suggestions, repairs, and reviews.`}
              </p>
            </div>
          </div>
        </div>

        {/* Member View Header Tabs */}
        {!isGymAdmin && (
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setMemberTab('submit')}
              style={{
                padding: '8px 18px',
                borderRadius: '9px',
                border: 'none',
                background: memberTab === 'submit' ? 'var(--brand-primary, #6366f1)' : 'transparent',
                color: memberTab === 'submit' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              ✍️ Submit Feedback
            </button>
            <button
              onClick={() => {
                setMemberTab('history');
                fetchMyFeedbacks();
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '9px',
                border: 'none',
                background: memberTab === 'history' ? 'var(--brand-primary, #6366f1)' : 'transparent',
                color: memberTab === 'history' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              📜 My History ({myFeedbacks.length})
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          ADMIN VIEW: OWNER FEEDBACK COMMAND CENTER
      ======================================================== */}
      {isGymAdmin && (
        <div>
          {/* 1. Analytics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {/* Average Rating Card */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Star size={26} fill="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Gym Satisfaction
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {metrics.averageRating}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700 }}>/ 5.0 ⭐</span>
                </div>
              </div>
            </div>

            {/* Total Submissions Card */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--brand-primary, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={26} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total Received
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {metrics.totalCount}
                </div>
              </div>
            </div>

            {/* Pending Action Card */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Clock size={26} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Pending Review
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
                  {metrics.pendingCount}
                </div>
              </div>
            </div>

            {/* Resolved Card */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={26} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Resolved & Fixed
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                  {metrics.resolvedCount}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Filters & Search Bar */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Search + Status Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search feedbacks by title, member, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '10px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Status' },
                  { id: 'pending', label: '⏳ Pending' },
                  { id: 'in_progress', label: '🛠️ Under Action' },
                  { id: 'resolved', label: '✅ Resolved' },
                ].map((tab) => {
                  const isSelected = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '100px',
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 800 : 600,
                        background: isSelected ? 'var(--brand-primary, #6366f1)' : 'var(--bg-input)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {CATEGORIES.map((cat) => {
                const isSelected = categoryFilter === cat.id;
                const count = cat.id === 'all' ? metrics.totalCount : metrics.categoryBreakdown?.[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: isSelected ? 800 : 600,
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: isSelected ? 'var(--brand-primary, #6366f1)' : 'var(--text-muted)',
                      border: isSelected ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>{cat.label}</span>
                    <span style={{ opacity: 0.75, fontSize: '0.7rem' }}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Feedbacks Feed */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading member feedback...
            </div>
          ) : feedbacks.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                padding: '60px 24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                No Feedbacks in this Filter!
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
                All member inquiries are clear or no submissions match the current status and category.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {feedbacks.map((item) => {
                const statusBadge = getStatusBadge(item.status);
                const isResponding = respondingFeedbackId === item._id;

                return (
                  <div
                    key={item._id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      boxShadow: 'var(--shadow-card)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Member Avatar */}
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: item.isAnonymous ? '#64748b' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                          }}
                        >
                          {item.isAnonymous ? '?' : item.memberName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                              {item.memberName}
                            </span>
                            {item.isAnonymous && (
                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(100, 116, 139, 0.2)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                ANONYMOUS
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: 'rgba(6, 182, 212, 0.15)',
                                color: '#06b6d4',
                              }}
                            >
                              {item.category}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {new Date(item.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {!item.isAnonymous && item.memberPhone && ` • +91 ${item.memberPhone}`}
                          </div>
                        </div>
                      </div>

                      {/* Right: Stars + Status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Stars */}
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={16}
                              fill={s <= item.rating ? '#f59e0b' : 'none'}
                              color={s <= item.rating ? '#f59e0b' : 'var(--border-subtle)'}
                            />
                          ))}
                        </div>

                        {/* Status Badge */}
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`,
                          }}
                        >
                          {statusBadge.label}
                        </span>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteFeedback(item._id)}
                          title="Delete entry"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Content Box */}
                    <div style={{ marginBottom: '14px' }}>
                      <h4 style={{ fontSize: '1.02rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                        {item.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {item.message}
                      </p>
                    </div>

                    {/* Official Owner Response (if exists) */}
                    {item.adminResponse && !isResponding && (
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: 'rgba(99, 102, 241, 0.08)',
                          borderLeft: '4px solid var(--brand-primary, #6366f1)',
                          marginBottom: '14px',
                        }}
                      >
                        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--brand-primary, #6366f1)', marginBottom: '3px' }}>
                          👑 GYM OWNER RESOLUTION / RESPONSE:
                        </div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {item.adminResponse}
                        </div>
                        {item.resolvedAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Addressed on {new Date(item.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Owner Action Buttons / Reply Drawer */}
                    {isResponding ? (
                      <div
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '12px',
                          padding: '16px',
                          marginTop: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Update Feedback Status & Resolution Note
                          </span>
                          <button
                            onClick={() => setRespondingFeedbackId(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Status Radio options */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          {[
                            { id: 'in_progress', label: '🛠️ Mark Under Action' },
                            { id: 'resolved', label: '✅ Mark Resolved & Fixed' },
                            { id: 'dismissed', label: '❌ Dismiss' },
                          ].map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setNewStatus(st.id)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: newStatus === st.id ? 800 : 600,
                                background: newStatus === st.id ? 'var(--brand-primary, #6366f1)' : 'var(--bg-card)',
                                color: newStatus === st.id ? '#fff' : 'var(--text-secondary)',
                                border: '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                              }}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>

                        {/* Note textarea */}
                        <textarea
                          rows={2}
                          placeholder="Write official resolution for the member (e.g. 'Cable attachment replaced today. Thanks for pointing it out!')..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: '0.88rem',
                            outline: 'none',
                            resize: 'none',
                            fontFamily: 'inherit',
                            marginBottom: '10px',
                          }}
                        />

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setRespondingFeedbackId(null)}
                            style={{
                              padding: '7px 14px',
                              borderRadius: '8px',
                              background: 'transparent',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveResolution(item._id)}
                            disabled={savingResolution}
                            style={{
                              padding: '7px 18px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                              color: '#fff',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {savingResolution ? 'Saving...' : 'Save Resolution'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                        <button
                          onClick={() => {
                            setRespondingFeedbackId(item._id);
                            setNewStatus(item.status === 'pending' ? 'in_progress' : item.status);
                            setResponseText(item.adminResponse || '');
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--brand-primary, #6366f1)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <MessageCircle size={14} />
                          <span>{item.adminResponse ? 'Edit Owner Response' : 'Respond & Take Action'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MEMBER VIEW: FEEDBACK SUBMISSION & HISTORY
      ======================================================== */}
      {!isGymAdmin && (
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          {memberTab === 'submit' ? (
            /* Submit Feedback Form */
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                padding: '32px 36px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {submitSuccess && (
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#10b981',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <CheckCircle2 size={20} />
                  <span>Your feedback has been sent directly to the Gym Owner! Thank you for helping us improve.</span>
                </div>
              )}

              <form onSubmit={handleSubmitFeedback}>
                {/* 1. Rating Selector */}
                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                    How would you rate your overall gym experience?
                  </label>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          transition: 'transform 0.15s',
                        }}
                      >
                        <Star
                          size={34}
                          fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'}
                          color={(hoverRating || rating) >= star ? '#f59e0b' : 'var(--border-subtle)'}
                        />
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                    {rating === 5 && '🌟 Exceptional / 5-Star Club'}
                    {rating === 4 && '👍 Very Good, Minor Tweaks Needed'}
                    {rating === 3 && '😐 Average Experience'}
                    {rating <= 2 && '⚠️ Needs Urgent Attention'}
                  </div>
                </div>

                {/* 2. Category & Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    >
                      <option value="equipment">🏋️ Equipment & Machines</option>
                      <option value="cleanliness">🧼 Cleanliness & Hygiene</option>
                      <option value="trainers">👟 Trainers & Coaching</option>
                      <option value="ambience">❄️ AC / Music / Ambience</option>
                      <option value="facilities">🚿 Lockers & Washroom</option>
                      <option value="pricing">💳 Fees & Membership Plans</option>
                      <option value="general">💡 General Suggestion</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Feedback Type *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    >
                      <option value="suggestion">💡 Suggestion / Idea</option>
                      <option value="maintenance">🛠️ Maintenance Request / Repair</option>
                      <option value="complaint">⚠️ Issue / Complaint</option>
                      <option value="appreciation">👏 Trainer or Gym Appreciation</option>
                    </select>
                  </div>
                </div>

                {/* 3. Title */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Subject / Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Broken cable on lat pulldown machine, Request for fresh water dispenser"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      borderRadius: '10px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* 4. Description */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Detailed Feedback / Message *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe what happened or what we can improve in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                {/* 5. Anonymous Checkbox */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '24px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsAnonymous(!isAnonymous)}
                >
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Submit Anonymously
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Your name and contact details will not be shared with the gym owner or staff.
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !message.trim()}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.96rem',
                    cursor: submitting || !title.trim() || !message.trim() ? 'default' : 'pointer',
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Send size={18} />
                  <span>{submitting ? 'Submitting to Gym Owner...' : 'Send Feedback to Owner'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Member Feedback History */
            <div>
              {loadingMy ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading your submissions...
                </div>
              ) : myFeedbacks.length === 0 ? (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '20px',
                    padding: '60px 24px',
                    textAlign: 'center',
                  }}
                >
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                    No Feedback Submitted Yet
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Have suggestions or noticed an issue in the gym? Submit your first feedback!
                  </p>
                  <button
                    onClick={() => setMemberTab('submit')}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Submit Feedback
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {myFeedbacks.map((item) => {
                    const statusBadge = getStatusBadge(item.status);

                    return (
                      <div
                        key={item._id}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '16px',
                          padding: '20px 24px',
                          boxShadow: 'var(--shadow-card)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: 'rgba(6, 182, 212, 0.15)',
                                color: '#06b6d4',
                              }}
                            >
                              {item.category}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: statusBadge.bg,
                              color: statusBadge.color,
                              border: `1px solid ${statusBadge.border}`,
                            }}
                          >
                            {statusBadge.label}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                          {item.title}
                        </h4>
                        <p style={{ margin: '0 0 14px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {item.message}
                        </p>

                        {/* Owner Response Box */}
                        {item.adminResponse ? (
                          <div
                            style={{
                              padding: '12px 16px',
                              borderRadius: '10px',
                              background: 'rgba(99, 102, 241, 0.08)',
                              borderLeft: '4px solid var(--brand-primary, #6366f1)',
                            }}
                          >
                            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--brand-primary, #6366f1)', marginBottom: '3px' }}>
                              👑 GYM OWNER RESPONSE:
                            </div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                              {item.adminResponse}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            ⏳ Gym Owner has received this and will review it shortly.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
