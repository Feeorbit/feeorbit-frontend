'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

// Global toast ref so `toast.success(...)` can be called from anywhere
let globalToast = {
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  show: () => {},
  dismiss: () => {},
  clear: () => {},
};

export const toast = {
  success: (msg, opts) => globalToast.success(msg, opts),
  error: (msg, opts) => globalToast.error(msg, opts),
  warning: (msg, opts) => globalToast.warning(msg, opts),
  info: (msg, opts) => globalToast.info(msg, opts),
  show: (opts) => globalToast.show(opts),
  dismiss: (id) => globalToast.dismiss(id),
  clear: () => globalToast.clear(),
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return toast;
  }
  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const lastToastRef = useRef({ key: '', time: 0 });

  const removeToast = useCallback((id) => {
    if (!id) {
      setToasts([]);
      return;
    }
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Give time for exit animation before removing from state
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 280);
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    ({
      type = 'info',
      title,
      message,
      duration = 3000,
      action,
    }) => {
      const msgStr = typeof message === 'string' ? message : String(message || '');
      const toastKey = `${type}:${title || ''}:${msgStr}`;
      const now = Date.now();

      // Deduplicate identical alert triggered within 1.2s to prevent multiple repeated alerts
      if (
        lastToastRef.current.key === toastKey &&
        now - lastToastRef.current.time < 1200
      ) {
        return;
      }
      lastToastRef.current = { key: toastKey, time: now };

      const id = now.toString(36) + Math.random().toString(36).substring(2, 6);
      const newToast = {
        id,
        type,
        title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Attention' : 'Notice'),
        message: msgStr,
        duration,
        action,
        createdAt: now,
        exiting: false,
      };

      // Strict single alert policy: only 1 alert is shown at a time!
      // New alert immediately replaces previous alerts so multiple alerts never stack up.
      setToasts([newToast]);
      return id;
    },
    []
  );

  const success = useCallback((msg, opts = {}) => showToast({ type: 'success', message: msg, ...opts }), [showToast]);
  const error = useCallback((msg, opts = {}) => showToast({ type: 'error', message: msg, ...opts }), [showToast]);
  const warning = useCallback((msg, opts = {}) => showToast({ type: 'warning', message: msg, ...opts }), [showToast]);
  const info = useCallback((msg, opts = {}) => showToast({ type: 'info', message: msg, ...opts }), [showToast]);

  // Bind global toast object
  useEffect(() => {
    globalToast = {
      success,
      error,
      warning,
      info,
      show: showToast,
      dismiss: removeToast,
      clear: clearToasts,
    };
  }, [success, error, warning, info, showToast, removeToast, clearToasts]);

  // Intercept native window.alert to seamlessly upgrade legacy alert() calls
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalAlert = window.alert;

    window.alert = (rawMessage) => {
      if (!rawMessage) return;
      const str = String(rawMessage).trim();
      const lower = str.toLowerCase();

      if (
        lower.includes('error') ||
        lower.includes('failed') ||
        lower.includes('unable') ||
        lower.includes('could not') ||
        lower.includes('invalid') ||
        lower.includes('denied')
      ) {
        error(str, { title: 'Action Failed' });
      } else if (
        lower.includes('warning') ||
        lower.includes('not available') ||
        lower.includes('please') ||
        lower.includes('required') ||
        lower.includes('missing') ||
        lower.includes('does not have')
      ) {
        warning(str, { title: 'Action Required' });
      } else if (
        lower.includes('success') ||
        lower.includes('sent') ||
        lower.includes('saved') ||
        lower.includes('created') ||
        lower.includes('updated') ||
        lower.includes('deleted') ||
        lower.includes('copied') ||
        lower.includes('verified')
      ) {
        success(str, { title: 'Completed' });
      } else {
        info(str, { title: 'Notification' });
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [success, error, warning, info]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        warning,
        info,
        dismiss: removeToast,
        clear: clearToasts,
        toast: { success, error, warning, info, show: showToast, dismiss: removeToast, clear: clearToasts },
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-portal-container" aria-live="polite" role="region">
      {toasts.map((toastItem) => (
        <ToastItem key={toastItem.id} toast={toastItem} onRemove={() => onRemove(toastItem.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t, onRemove }) {
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const remainingRef = useRef(t.duration);
  const startTimeRef = useRef(Date.now());

  const handlePause = () => {
    if (t.duration === Infinity) return;
    setPaused(true);
    clearTimeout(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  };

  const handleResume = () => {
    if (t.duration === Infinity) return;
    setPaused(false);
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onRemove();
    }, remainingRef.current);
  };

  useEffect(() => {
    if (t.duration === Infinity) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onRemove();
    }, t.duration);

    return () => clearTimeout(timerRef.current);
  }, [t.duration, onRemove]);

  const config = {
    success: {
      icon: <CheckCircle2 size={18} />,
      color: '#10b981',
      bgLight: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      glow: '0 8px 30px -4px rgba(16, 185, 129, 0.28)',
      badge: 'SUCCESS',
      badgeBg: 'rgba(16, 185, 129, 0.2)',
      badgeColor: '#34d399',
    },
    error: {
      icon: <AlertCircle size={18} />,
      color: '#f43f5e',
      bgLight: 'rgba(244, 63, 94, 0.15)',
      borderColor: 'rgba(244, 63, 94, 0.35)',
      glow: '0 8px 30px -4px rgba(244, 63, 94, 0.28)',
      badge: 'ERROR',
      badgeBg: 'rgba(244, 63, 94, 0.2)',
      badgeColor: '#fb7185',
    },
    warning: {
      icon: <AlertTriangle size={18} />,
      color: '#f59e0b',
      bgLight: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      glow: '0 8px 30px -4px rgba(245, 158, 11, 0.28)',
      badge: 'NOTICE',
      badgeBg: 'rgba(245, 158, 11, 0.2)',
      badgeColor: '#fbbf24',
    },
    info: {
      icon: <Info size={18} />,
      color: '#6366f1',
      bgLight: 'rgba(99, 102, 241, 0.15)',
      borderColor: 'rgba(99, 102, 241, 0.35)',
      glow: '0 8px 30px -4px rgba(99, 102, 241, 0.28)',
      badge: 'INFO',
      badgeBg: 'rgba(99, 102, 241, 0.2)',
      badgeColor: '#a5b4fc',
    },
  }[t.type] || {
    icon: <Info size={18} />,
    color: '#6366f1',
    bgLight: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
    glow: '0 8px 30px -4px rgba(99, 102, 241, 0.28)',
    badge: 'INFO',
    badgeBg: 'rgba(99, 102, 241, 0.2)',
    badgeColor: '#a5b4fc',
  };

  return (
    <div
      className={`toast-card ${t.exiting ? 'toast-exiting' : 'toast-entering'}`}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      style={{
        borderColor: config.borderColor,
        boxShadow: config.glow,
      }}
    >
      <div className="toast-glow-bar" style={{ backgroundColor: config.color }} />

      <div className="toast-body">
        <div
          className="toast-icon-wrapper"
          style={{
            background: config.bgLight,
            color: config.color,
            border: `1px solid ${config.borderColor}`,
          }}
        >
          {config.icon}
        </div>

        <div className="toast-text-content">
          <div className="toast-header-row">
            <span className="toast-title">{t.title}</span>
            <span
              className="toast-type-tag"
              style={{
                background: config.badgeBg,
                color: config.badgeColor,
              }}
            >
              {config.badge}
            </span>
          </div>
          <p className="toast-message">{t.message}</p>

          {t.action && (
            <button
              onClick={() => {
                t.action.onClick?.();
                onRemove();
              }}
              className="toast-action-btn"
            >
              {t.action.label}
            </button>
          )}
        </div>

        <button
          onClick={onRemove}
          className="toast-close-btn"
          title="Dismiss notification"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>

      {t.duration !== Infinity && (
        <div className="toast-progress-track">
          <div
            className="toast-progress-bar"
            style={{
              backgroundColor: config.color,
              animationDuration: `${t.duration}ms`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        </div>
      )}
    </div>
  );
}
