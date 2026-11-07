'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEME_PRESETS, applyThemeVariables, getThemePreset } from '../utils/themePresets';

const GymContext = createContext();

export function GymProvider({ children }) {
  const [gyms, setGyms] = useState([]);
  const [currentGym, setCurrentGym] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGyms = async (forceAll = false) => {
    try {
      let url = '/api/gyms';
      if (!forceAll && typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('feeorbit_user') || localStorage.getItem('gympulse_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            const ownerId = parsedUser._id || parsedUser.id;
            const userGym = parsedUser.gym;

            if (parsedUser.role === 'admin') {
              if (ownerId && userGym) {
                url = `/api/gyms?owner=${ownerId}&userGymId=${userGym}`;
              } else if (ownerId) {
                url = `/api/gyms?owner=${ownerId}`;
              } else if (userGym) {
                url = `/api/gyms?userGymId=${userGym}`;
              }
            } else if (parsedUser.role === 'staff' || parsedUser.role === 'member') {
              if (userGym) {
                url = `/api/gyms?userGymId=${userGym}`;
              }
            }
          } catch (e) {}
        }
      }

      let res = await fetch(url);
      let data = await res.json();

      // Fallback: If scoped query returned no gyms, fetch all active platform gyms
      if (!data.success || !data.data || data.data.length === 0) {
        res = await fetch('/api/gyms');
        data = await res.json();
      }

      if (data.success && data.data && data.data.length > 0) {
        setGyms(data.data);

        // Check localStorage for saved active gym
        const savedGymId = typeof window !== 'undefined' 
          ? (localStorage.getItem('feeorbit_active_gym') || localStorage.getItem('gympulse_active_gym'))
          : null;
        const matched = data.data.find((g) => g._id === savedGymId) || data.data[0];
        setCurrentGym(matched);

        if (typeof window !== 'undefined' && matched?._id) {
          localStorage.setItem('feeorbit_active_gym', matched._id);
        }

        // Apply full website theme preset and dynamic brand color (preserve user's chosen preset in localStorage)
        if (matched) {
          const savedPreset = typeof window !== 'undefined' ? localStorage.getItem('feeorbit_theme_preset') : null;
          const savedColor = typeof window !== 'undefined' ? localStorage.getItem('feeorbit_theme_color') : null;
          const preset = savedPreset || matched.themePreset || 'midnight';
          const primary = savedColor || matched.primaryColor || null;
          applyThemeVariables(preset, primary);
        }
      }
    } catch (err) {
      console.error('Failed to load gyms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Immediately apply cached theme on mount without waiting for network
    if (typeof window !== 'undefined') {
      const savedPreset = localStorage.getItem('feeorbit_theme_preset') || 'midnight';
      const savedColor = localStorage.getItem('feeorbit_theme_color');
      applyThemeVariables(savedPreset, savedColor);
    }

    fetchGyms();

    const handleSync = () => fetchGyms();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleSync);
      window.addEventListener('feeorbit_auth_changed', handleSync);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleSync);
        window.removeEventListener('feeorbit_auth_changed', handleSync);
      }
    };
  }, []);

  const switchGym = (gymId) => {
    const selected = gyms.find((g) => g._id === gymId);
    if (selected) {
      setCurrentGym(selected);
      if (typeof window !== 'undefined') {
        localStorage.setItem('feeorbit_active_gym', selected._id);
      }
      // Apply full website theme
      const preset = selected.themePreset || 'midnight';
      const primary = selected.primaryColor || null;
      applyThemeVariables(preset, primary);
    }
  };

  const updateCurrentGymSettings = async (updatedFields) => {
    if (!currentGym || !currentGym._id) {
      return { success: false, message: 'No active gym selected. Please select a gym from the top header.' };
    }
    try {
      const res = await fetch(`/api/gyms/${currentGym._id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentGym(data.data);
        const preset = data.data.themePreset || updatedFields.themePreset || 'midnight';
        const primary = data.data.primaryColor || updatedFields.primaryColor || null;
        applyThemeVariables(preset, primary);
        fetchGyms();
        return { success: true, data: data.data, message: data.message || 'Settings updated successfully' };
      } else {
        return { success: false, message: data.message || 'Server rejected settings update.' };
      }
    } catch (err) {
      console.error('Error updating gym settings:', err);
      return { success: false, message: err.message || 'Network connection failed.' };
    }
  };

  const formatCurrency = (amount) => {
    const symbol = currentGym?.currency?.symbol || '₹';
    const num = Number(amount) || 0;
    return `${symbol}${num.toLocaleString('en-IN')}`;
  };

  return (
    <GymContext.Provider
      value={{
        gyms,
        currentGym,
        loading,
        switchGym,
        refreshGyms: fetchGyms,
        updateCurrentGymSettings,
        formatCurrency,
        applyThemeVariables,
        THEME_PRESETS,
      }}
    >
      {children}
    </GymContext.Provider>
  );
}

export function useGym() {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
}
