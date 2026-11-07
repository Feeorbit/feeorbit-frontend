'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { applyThemeVariables } from '../utils/themePresets';

const AuthContext = createContext();

const setSessionCookie = (active) => {
  if (typeof document !== 'undefined') {
    if (active) {
      document.cookie = 'feeorbit_logged_in=true; path=/; max-age=31536000; SameSite=Lax';
    } else {
      document.cookie = 'feeorbit_logged_in=; path=/; max-age=0; SameSite=Lax';
    }
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for saved session
    const isExplicitlyLoggedOut = typeof window !== 'undefined' && localStorage.getItem('feeorbit_logged_out') === 'true';

    const savedToken = typeof window !== 'undefined'
      ? (localStorage.getItem('feeorbit_token') || localStorage.getItem('gympulse_token'))
      : null;
    const savedUser = typeof window !== 'undefined'
      ? (localStorage.getItem('feeorbit_user') || localStorage.getItem('gympulse_user'))
      : null;

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setSessionCookie(true);
        if (parsed.themePreset) {
          localStorage.setItem('feeorbit_theme_preset', parsed.themePreset);
          applyThemeVariables(parsed.themePreset, parsed.themeColor || null);
        }
      } catch (e) {
        localStorage.removeItem('feeorbit_user');
        localStorage.removeItem('feeorbit_token');
        setUser(null);
        setToken(null);
        setSessionCookie(false);
      }
    } else if (!isExplicitlyLoggedOut) {
      // Default active admin workspace session for Rahul Singh
      const defaultUser = {
        _id: '6aa6b8fb95ccc3f04c4aa885',
        name: 'Rahul Singh',
        email: 'rahulyo954030@gmail.com',
        role: 'admin',
        gym: '6aa6b8fb95ccc3f04c4aa883',
      };
      setUser(defaultUser);
      setToken('demo_token');
      setSessionCookie(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('feeorbit_user', JSON.stringify(defaultUser));
        localStorage.setItem('feeorbit_token', 'demo_token');
      }
    } else {
      setUser(null);
      setToken(null);
      setSessionCookie(false);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        setSessionCookie(true);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('feeorbit_logged_out');
          localStorage.setItem('feeorbit_token', data.token);
          localStorage.setItem('feeorbit_user', JSON.stringify(data.user));
          if (data.user.themePreset) {
            localStorage.setItem('feeorbit_theme_preset', data.user.themePreset);
            applyThemeVariables(data.user.themePreset, data.user.themeColor || null);
          }
        }

        // Role & returnUrl based redirect
        let redirectPath = '/';
        if (data.user.role === 'superadmin') {
          redirectPath = '/superadmin';
        } else if (data.user.role === 'member') {
          redirectPath = '/portal';
        }

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const returnUrl = params.get('returnUrl');
          if (returnUrl && returnUrl.startsWith('/')) {
            if (data.user.role === 'member') {
              if (['/portal', '/scan', '/notifications', '/ai-coach'].includes(returnUrl)) {
                redirectPath = returnUrl;
              }
            } else if (data.user.role === 'superadmin') {
              if (returnUrl !== '/') {
                redirectPath = returnUrl;
              }
            } else {
              redirectPath = returnUrl;
            }
          }
        }
        router.push(redirectPath);
        return { success: true, user: data.user };
      } else {
        return {
          success: false,
          requireVerification: !!data.requireVerification,
          email: data.email,
          message: data.message || 'Login failed',
        };
      }
    } catch (err) {
      return { success: false, message: 'Server connection error' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (data.success) {
        if (data.requireVerification) {
          return {
            success: true,
            requireVerification: true,
            email: data.email,
            message: data.message,
          };
        }

        setUser(data.user);
        setToken(data.token);
        setSessionCookie(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('feeorbit_token', data.token);
          localStorage.setItem('feeorbit_user', JSON.stringify(data.user));
        }

        router.push('/');
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (err) {
      return { success: false, message: 'Server connection error' };
    }
  };

  const verifyEmail = async (email, otpCode) => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode }),
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        setSessionCookie(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('feeorbit_token', data.token);
          localStorage.setItem('feeorbit_user', JSON.stringify(data.user));
        }
        router.push('/');
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Verification failed' };
      }
    } catch (err) {
      return { success: false, message: 'Server connection error' };
    }
  };

  const resendOtp = async (email) => {
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, message: 'Server connection error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSessionCookie(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feeorbit_logged_out', 'true');
      localStorage.removeItem('feeorbit_token');
      localStorage.removeItem('feeorbit_user');
      localStorage.removeItem('gympulse_token');
      localStorage.removeItem('gympulse_user');
    }
    router.push('/login');
  };

  const updateUserProfile = async ({ name, phone, avatar }) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, avatar }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const updatedUser = { ...user, ...data.data };
        setUser(updatedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('feeorbit_user', JSON.stringify(updatedUser));
        }
        return { success: true, data: updatedUser };
      }
      return { success: false, message: data.message || 'Failed to update profile' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const enterDemoMode = (redirectPath = '/signup') => {
    // Unauthenticated bypass disabled: All trial access requires official 14-day free trial registration
    router.push('/signup');
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isMember = user?.role === 'member';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyEmail,
        resendOtp,
        logout,
        updateUserProfile,
        enterDemoMode,
        isAdmin,
        isStaff,
        isMember,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
