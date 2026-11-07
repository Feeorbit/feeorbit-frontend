'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  Compass,
  Search,
  Star,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Dumbbell,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  X,
  CreditCard,
  Building2,
  Send,
  Zap,
  Copy,
  Check,
  Filter,
  Layers,
  SlidersHorizontal,
  Award,
  LocateFixed,
  Eye,
  Calendar,
  User,
  ArrowUpRight,
} from 'lucide-react';

// Helper to determine if gym is currently open based on local time
function getLiveOpenStatus(openingHours) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeDec = currentHour + currentMinute / 60;

  if (!openingHours || openingHours.toLowerCase().includes('24 hour') || openingHours.includes('24/7')) {
    return { isOpen: true, text: 'Open 24/7 • Access Anytime', color: '#10b981' };
  }

  // Typical Indian gym timings: 06:00 to 22:30
  if (currentTimeDec >= 5.5 && currentTimeDec < 22.5) {
    return { isOpen: true, text: 'Open Now • Closes 10:30 PM', color: '#10b981' };
  } else {
    return { isOpen: false, text: 'Closed Now • Opens 06:00 AM', color: '#f59e0b' };
  }
}

export default function NearbyGymsExplorer() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Filters & Sorting
  const [selectedCity, setSelectedCity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGymId, setSelectedGymId] = useState(null);
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'distance' | 'price_low' | 'price_high'
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'grid'
  const [showDossier, setShowDossier] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // VIP Pass / Join Modal State
  const [joinModalGym, setJoinModalGym] = useState(null);
  const [joinForm, setJoinForm] = useState({ name: '', phone: '', email: '', planType: 'trial', timeSlot: 'morning' });
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [generatedPassId, setGeneratedPassId] = useState('');

  // Fetch gyms from backend
  const fetchGyms = async (coords = null) => {
    setLoading(true);
    try {
      let url = '/api/gyms/explore?';
      if (coords?.lat && coords?.lng) {
        url += `lat=${coords.lat}&lng=${coords.lng}&`;
      }
      if (selectedCity !== 'all') {
        url += `city=${encodeURIComponent(selectedCity)}&`;
      }
      if (searchQuery.trim()) {
        url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setGyms(data.data);
        if (data.data.length > 0 && !selectedGymId) {
          setSelectedGymId(data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error exploring gyms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGyms(userLocation);
  }, [selectedCity, searchQuery]);

  // Request browser geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setLocating(false);
        setSortBy('distance');
        fetchGyms(coords);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocating(false);
        setLocationError('Location permission denied or unavailable. You can still search by city.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Selected Gym for spotlight & interactive map
  const activeGym = useMemo(() => {
    if (!gyms.length) return null;
    return gyms.find((g) => g._id === selectedGymId) || gyms[0];
  }, [gyms, selectedGymId]);

  // Extract cities with accurate counts
  const cityCounts = useMemo(() => {
    const counts = { all: gyms.length };
    gyms.forEach((g) => {
      const c = g.city || 'Other';
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [gyms]);

  // Filtered and Sorted Gyms
  const processedGyms = useMemo(() => {
    let list = [...gyms];

    // Feature filter
    if (activeFeatureFilter === 'open') {
      list = list.filter((g) => getLiveOpenStatus(g.openingHours).isOpen);
    } else if (activeFeatureFilter === 'crossfit') {
      list = list.filter((g) =>
        (g.facilityType + (g.amenitiesList?.join(' ') || '')).toLowerCase().includes('crossfit') ||
        (g.facilityType + (g.amenitiesList?.join(' ') || '')).toLowerCase().includes('turf') ||
        (g.facilityType + (g.amenitiesList?.join(' ') || '')).toLowerCase().includes('power')
      );
    } else if (activeFeatureFilter === 'parking') {
      list = list.filter((g) =>
        (g.amenitiesList?.join(' ') || '').toLowerCase().includes('parking')
      );
    } else if (activeFeatureFilter === 'steam') {
      list = list.filter((g) =>
        (g.amenitiesList?.join(' ') || '').toLowerCase().includes('steam') ||
        (g.amenitiesList?.join(' ') || '').toLowerCase().includes('sauna') ||
        (g.amenitiesList?.join(' ') || '').toLowerCase().includes('bath')
      );
    } else if (activeFeatureFilter === '24_7') {
      list = list.filter((g) =>
        (g.openingHours || '').includes('24') || (g.amenitiesList?.join(' ') || '').includes('24/7')
      );
    }

    // Sorting
    if (sortBy === 'distance') {
      list.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'price_low') {
      list.sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0));
    } else if (sortBy === 'price_high') {
      list.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
    }

    return list;
  }, [gyms, activeFeatureFilter, sortBy]);

  // Current active gym index for quick cycling on the big map
  const currentIndex = useMemo(() => {
    if (!processedGyms.length || !activeGym) return 0;
    const idx = processedGyms.findIndex((g) => g._id === activeGym._id);
    return idx >= 0 ? idx : 0;
  }, [processedGyms, activeGym]);

  const handlePrevGym = () => {
    if (!processedGyms.length) return;
    const newIdx = (currentIndex - 1 + processedGyms.length) % processedGyms.length;
    setSelectedGymId(processedGyms[newIdx]._id);
  };

  const handleNextGym = () => {
    if (!processedGyms.length) return;
    const newIdx = (currentIndex + 1) % processedGyms.length;
    setSelectedGymId(processedGyms[newIdx]._id);
  };

  // Copy address to clipboard
  const handleCopyAddress = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit VIP Guest Pass
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinForm.name || !joinForm.phone) return;
    const passCode = `FO-VIP-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedPassId(passCode);
    setJoinSuccess(true);
  };

  return (
    <section
      id="find-gyms"
      style={{
        position: 'relative',
        padding: '90px 0 110px',
        background: '#070a13',
        color: '#f8fafc',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Background Ambience & Cyber Grid */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1200px',
          height: '500px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.14) 0%, rgba(99, 102, 241, 0.08) 45%, transparent 75%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="feeorbit-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* ================= 1. HEADER SECTION ================= */}
        <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto 42px' }}>
          {/* Eyebrow Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
              borderRadius: '999px',
              padding: '6px 16px',
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '16px',
              boxShadow: '0 2px 12px rgba(56, 189, 248, 0.15)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'inline-block',
              }}
            />
            <span>VERIFIED FITNESS NETWORK & GOOGLE MAPS DIRECTORY</span>
          </div>

          {/* Master Heading */}
          <h2
            style={{
              fontSize: 'clamp(2.1rem, 4.5vw, 3rem)',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 16px 0',
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
            }}
          >
            Find The Nearest Gym &{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Start Training Today
            </span>
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: '#94a3b8',
              margin: '0 auto 24px',
              lineHeight: 1.6,
              maxWidth: '720px',
            }}
          >
            Browse certified partner clubs across Delhi NCR, Gurugram, and Noida. Inspect verified equipment,
            check live operating hours, and navigate directly with 1-click Google Maps GPS turn-by-turn routing.
          </p>

          {/* Quick Value Metrics Ribbon */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '20px',
              paddingTop: '8px',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <Building2 size={16} style={{ color: '#38bdf8' }} />
              <span><strong>{gyms.length || 10}+ Verified</strong> Fitness Clubs</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <Star size={16} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
              <span><strong>4.9/5.0</strong> Top Rated Experience</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <Navigation size={16} style={{ color: '#10b981' }} />
              <span><strong>Live Distance & Directions</strong> (Google Maps)</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <Sparkles size={16} style={{ color: '#a855f7' }} />
              <span><strong>Free 1-Day Trial Passes</strong></span>
            </div>
          </div>
        </div>

        {/* ================= 2. COMMAND BAR: LOCATION, SEARCH & SMART FILTERS ================= */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '18px 22px',
            marginBottom: '32px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Top Row: Detect GPS + Live Search Input + View Toggle */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            {/* Geolocation Detect Button */}
            <button
              onClick={handleDetectLocation}
              disabled={locating}
              style={{
                background: userLocation
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.25))'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: userLocation
                  ? '1.5px solid rgba(16, 185, 129, 0.55)'
                  : '1px solid rgba(56, 189, 248, 0.4)',
                color: userLocation ? '#34d399' : '#ffffff',
                borderRadius: '12px',
                padding: '11px 18px',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: locating ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: userLocation ? '0 0 15px rgba(16, 185, 129, 0.2)' : '0 4px 14px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              {locating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Pinpointing Location...</span>
                </>
              ) : userLocation ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>GPS Active • Sorted by Proximity</span>
                </>
              ) : (
                <>
                  <LocateFixed size={16} />
                  <span>Detect My Location</span>
                </>
              )}
            </button>

            {/* Instant Search Bar */}
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                }}
              />
              <input
                type="text"
                placeholder="Search by gym name, area, facility (e.g. Connaught Place, CrossFit, Pool)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '11px 38px 11px 38px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* View Mode Toggle (Big Screen Map vs All Cards) */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '3px',
              }}
            >
              <button
                onClick={() => setViewMode('map')}
                title="Big Screen Google Map"
                style={{
                  background: viewMode === 'map' ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
                  border: viewMode === 'map' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                  color: viewMode === 'map' ? '#38bdf8' : '#94a3b8',
                  borderRadius: '7px',
                  padding: '7px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Compass size={14} />
                <span>🗺️ Big Screen Map</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                title="Grid Cards View"
                style={{
                  background: viewMode === 'grid' ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
                  border: viewMode === 'grid' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                  color: viewMode === 'grid' ? '#38bdf8' : '#94a3b8',
                  borderRadius: '7px',
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Layers size={14} />
                <span>All Cards ({processedGyms.length})</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: City Selector Tabs & Quick Feature Filters & Sorting */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.07)',
              paddingTop: '12px',
            }}
          >
            {/* City Hub Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'all', label: 'All Regions', count: cityCounts.all || gyms.length },
                { id: 'Delhi NCR', label: 'Delhi NCR', count: cityCounts['Delhi NCR'] || 5 },
                { id: 'Gurugram', label: 'Gurugram', count: cityCounts['Gurugram'] || 2 },
                { id: 'Noida', label: 'Noida', count: cityCounts['Noida'] || 3 },
              ].map((c) => {
                const active = selectedCity.toLowerCase() === c.id.toLowerCase();
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCity(c.id)}
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.22))'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: active ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: active ? '#ffffff' : '#94a3b8',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{c.label}</span>
                    <span
                      style={{
                        background: active ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                        color: active ? '#070a13' : '#cbd5e1',
                        borderRadius: '999px',
                        padding: '1px 6px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                      }}
                    >
                      {c.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Feature Pills & Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Feature Chips */}
              <div style={{ display: 'flex', gap: '5px' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'open', label: '⚡ Open Now' },
                  { id: 'crossfit', label: '🏋️ CrossFit / Turf' },
                  { id: 'parking', label: '🅿️ Parking' },
                  { id: 'steam', label: '❄️ Steam & Spa' },
                ].map((f) => {
                  const isSel = activeFeatureFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setActiveFeatureFilter(f.id)}
                      style={{
                        background: isSel ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSel ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.07)',
                        color: isSel ? '#34d399' : '#94a3b8',
                        borderRadius: '6px',
                        padding: '5px 9px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {/* Sort By Select */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={13} style={{ color: '#64748b' }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    color: '#e2e8f0',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="rating">⭐️ Highest Rated</option>
                  <option value="distance">📍 Distance (Nearest First)</option>
                  <option value="price_low">💰 Price: Low to High</option>
                  <option value="price_high">💎 Price: Premium First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Location Error Notice if any */}
        {locationError && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '10px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.84rem',
              color: '#fcd34d',
            }}
          >
            <span>⚠️ {locationError}</span>
            <button
              onClick={() => setLocationError(null)}
              style={{ background: 'none', border: 'none', color: '#fcd34d', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ================= 3. GYMS DISPLAY: SPLIT VIEW OR FULL GRID ================= */}
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px', color: '#38bdf8' }} />
            <h3 style={{ color: '#ffffff', fontSize: '1.2rem', margin: '0 0 6px 0' }}>
              Scanning Verified Fitness Centers...
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
              Calculating distances and fetching certified club profiles
            </p>
          </div>
        ) : processedGyms.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '70px 20px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '20px',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
            }}
          >
            <MapPin size={48} style={{ color: '#64748b', margin: '0 auto 14px' }} />
            <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 800 }}>
              No fitness clubs found matching your criteria
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '18px' }}>
              Try searching for a different area, clearing filters, or switching to "All Regions".
            </p>
            <button
              onClick={() => {
                setSelectedCity('all');
                setSearchQuery('');
                setActiveFeatureFilter('all');
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                padding: '9px 18px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ================= FULL 3-COLUMN GRID VIEW ================= */
          <div>
            <div style={{ marginBottom: '16px', fontSize: '0.86rem', color: '#94a3b8' }}>
              Showing <strong>{processedGyms.length}</strong> premier fitness centers in network
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '24px',
              }}
            >
              {processedGyms.map((gym) => renderGymCard(gym, false))}
            </div>
          </div>
        ) : (
          /* ================= 2-COLUMN SPLIT VIEW: CARDS (LEFT) + STICKY MAP & SPOTLIGHT (RIGHT) ================= */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '28px',
              alignItems: 'start',
            }}
          >
            {/* LEFT COLUMN: All Gym Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 4px',
                }}
              >
                <span style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                  Showing <strong style={{ color: '#ffffff' }}>{processedGyms.length} Verified Clubs</strong>
                  {selectedCity !== 'all' && <span> in {selectedCity}</span>}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Click any club to preview on Google Maps
                </span>
              </div>

              {processedGyms.map((gym) => renderGymCard(gym, true))}
            </div>

            {/* RIGHT COLUMN: Interactive Google Map + Spotlight Club Dossier */}
            {activeGym && (
              <div
                style={{
                  position: 'sticky',
                  top: '90px',
                  background: 'rgba(11, 16, 29, 0.95)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.12)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Embedded Interactive Google Map */}
                <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                  <iframe
                    title={`${activeGym.name} Map`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={activeGym.embedMapUrl}
                  />

                  {/* Floating Google Maps Direct App Button */}
                  <a
                    href={activeGym.directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      position: 'absolute',
                      bottom: '14px',
                      right: '14px',
                      background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      borderRadius: '999px',
                      padding: '9px 18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <ExternalLink size={14} />
                    <span>Open in Google Maps App</span>
                  </a>

                  {/* Active Pin Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(8px)',
                      color: '#38bdf8',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      borderRadius: '8px',
                      padding: '4px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <MapPin size={13} />
                    <span>{activeGym.area || activeGym.city}</span>
                  </div>
                </div>

                {/* Spotlight Club Detailed Dossier */}
                <div style={{ padding: '24px' }}>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#10b981',
                          background: 'rgba(16, 185, 129, 0.14)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ShieldCheck size={13} />
                        SPOTLIGHT CLUB
                      </span>
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        {activeGym.city}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        color: '#f59e0b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Star size={14} fill="#f59e0b" />
                      {activeGym.rating} ({activeGym.totalReviews} verified reviews)
                    </span>
                  </div>

                  {/* Club Name */}
                  <h3
                    style={{
                      fontSize: '1.45rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      margin: '0 0 6px 0',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.25,
                    }}
                  >
                    {activeGym.name}
                  </h3>

                  {/* Tagline */}
                  <p
                    style={{
                      fontSize: '0.86rem',
                      fontStyle: 'italic',
                      color: '#38bdf8',
                      margin: '0 0 12px 0',
                    }}
                  >
                    "{activeGym.tagline}"
                  </p>

                  {/* Full Address with Copy */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <MapPin size={16} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                        {activeGym.address}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyAddress(activeGym._id, activeGym.address)}
                      title="Copy Address"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: copiedId === activeGym._id ? '#10b981' : '#cbd5e1',
                        borderRadius: '6px',
                        padding: '5px 8px',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                      }}
                    >
                      {copiedId === activeGym._id ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedId === activeGym._id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Operating Hours Box */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                      <Clock size={16} style={{ color: '#10b981' }} />
                      <span>{activeGym.openingHours || 'Mon - Sat: 06:00 AM - 10:00 PM'}</span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: getLiveOpenStatus(activeGym.openingHours).color,
                        background: `${getLiveOpenStatus(activeGym.openingHours).color}15`,
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      {getLiveOpenStatus(activeGym.openingHours).isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>

                  {/* Amenities Highlights */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      VERIFIED FACILITIES & EQUIPMENT:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {activeGym.amenitiesList?.map((am, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.09)',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '0.76rem',
                            color: '#cbd5e1',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={12} style={{ color: '#38bdf8' }} />
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '14px',
                      marginBottom: '20px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        Regular Membership
                      </span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>
                        ₹{activeGym.startingPrice?.toLocaleString('en-IN')}{' '}
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>/ month</span>
                      </div>
                    </div>

                    <span
                      style={{
                        background: '#10b981',
                        color: '#070a13',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Free 1-Day Trial Pass
                    </span>
                  </div>

                  {/* Primary Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <a
                      href={`tel:${activeGym.phone}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        borderRadius: '12px',
                        padding: '12px',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                    >
                      <Phone size={15} style={{ color: '#38bdf8' }} />
                      <span>Call Front Desk</span>
                    </a>

                    <a
                      href={activeGym.directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        color: '#ffffff',
                        borderRadius: '12px',
                        padding: '12px',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)',
                      }}
                    >
                      <Navigation size={15} />
                      <span>Directions</span>
                    </a>
                  </div>

                  {/* Big Pass Reservation Button */}
                  <button
                    onClick={() => {
                      setJoinModalGym(activeGym);
                      setJoinSuccess(false);
                    }}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '13px',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                  >
                    <Dumbbell size={17} />
                    <span>Claim Free 1-Day VIP Workout Pass</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= 4. HELPER FUNCTION TO RENDER INDIVIDUAL GYM CARDS ================= */}
      {/* (Rendered directly in return flow) */}

      {/* ================= 5. VIP PASS & MEMBERSHIP RESERVATION MODAL ================= */}
      {joinModalGym && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setJoinModalGym(null)}
        >
          <div
            style={{
              background: '#0c101d',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              padding: '32px 30px',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.2)',
              position: 'relative',
              color: '#ffffff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setJoinModalGym(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            {joinSuccess ? (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    border: '2px solid rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <CheckCircle2 size={38} />
                </div>

                <div
                  style={{
                    display: 'inline-block',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '3px 12px',
                    borderRadius: '999px',
                    marginBottom: '10px',
                  }}
                >
                  PASS RESERVED & SENT VIA WHATSAPP
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0' }}>
                  1-Day VIP Guest Pass Confirmed!
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                  Hey <strong>{joinForm.name}</strong>, your free workout pass has been registered for{' '}
                  <strong style={{ color: '#ffffff' }}>{joinModalGym.name}</strong>. Simply show this digital pass
                  at the front reception kiosk.
                </p>

                {/* Digital Ticket Pass Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))',
                    border: '1.5px dashed rgba(56, 189, 248, 0.5)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '22px',
                    textAlign: 'left',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                      FeeOrbit VIP Access Card
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#10b981', color: '#070a13', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                      ACTIVE
                    </span>
                  </div>

                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                    {joinModalGym.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '12px' }}>
                    📍 {joinModalGym.address}
                  </div>

                  <div
                    style={{
                      borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                      paddingTop: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>PASS CODE</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.06em' }}>
                        {generatedPassId}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>GUEST NAME</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                        {joinForm.name}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <a
                    href={joinModalGym.directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '12px',
                      padding: '13px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                    }}
                  >
                    <Navigation size={16} />
                    <span>Start Google Maps Navigation</span>
                  </a>

                  <button
                    onClick={() => setJoinModalGym(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      borderRadius: '12px',
                      padding: '13px 20px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Dumbbell size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      Claim Free 1-Day Pass
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                      {joinModalGym.name}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.86rem', color: '#94a3b8', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                  Enter your details to generate an instant VIP guest pass and receive reception check-in instructions.
                </p>

                <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={joinForm.name}
                      onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '10px',
                        padding: '11px 14px',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      WhatsApp Mobile Number (for instant QR Pass) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9811223344"
                      value={joinForm.phone}
                      onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '10px',
                        padding: '11px 14px',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                        Pass / Plan Type
                      </label>
                      <select
                        value={joinForm.planType}
                        onChange={(e) => setJoinForm({ ...joinForm, planType: e.target.value })}
                        style={{
                          width: '100%',
                          background: '#151b2e',
                          border: '1px solid rgba(255, 255, 255, 0.14)',
                          borderRadius: '10px',
                          padding: '11px 12px',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="trial">🎟️ Free 1-Day Trial Pass</option>
                        <option value="monthly">Monthly Membership (₹{joinModalGym.startingPrice}/mo)</option>
                        <option value="quarterly">Quarterly 3-Month Plan</option>
                        <option value="annual">Annual VIP Membership</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                        Preferred Time Slot
                      </label>
                      <select
                        value={joinForm.timeSlot}
                        onChange={(e) => setJoinForm({ ...joinForm, timeSlot: e.target.value })}
                        style={{
                          width: '100%',
                          background: '#151b2e',
                          border: '1px solid rgba(255, 255, 255, 0.14)',
                          borderRadius: '10px',
                          padding: '11px 12px',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="morning">Morning (06:00 AM - 10:00 AM)</option>
                        <option value="afternoon">Afternoon (12:00 PM - 04:00 PM)</option>
                        <option value="evening">Evening (05:00 PM - 09:30 PM)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '13px',
                      fontWeight: 800,
                      fontSize: '0.94rem',
                      cursor: 'pointer',
                      marginTop: '6px',
                      boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    Generate Free Pass & Open Google Maps
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );

  // Helper function to render a Gym Card (used in both split and grid views)
  function renderGymCard(gym, isSplit) {
    const isSelected = activeGym?._id === gym._id;
    const openStatus = getLiveOpenStatus(gym.openingHours);

    return (
      <div
        key={gym._id}
        onClick={() => {
          setSelectedGymId(gym._id);
        }}
        style={{
          background: isSelected
            ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(20, 30, 55, 0.95))'
            : 'rgba(13, 18, 32, 0.72)',
          border: isSelected
            ? '1.5px solid #38bdf8'
            : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isSelected
            ? '0 14px 34px rgba(0, 0, 0, 0.65), 0 0 25px rgba(56, 189, 248, 0.25)'
            : '0 4px 18px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: isSplit ? 'row' : 'column',
          position: 'relative',
        }}
      >
        {/* Left / Top Image Thumbnail */}
        <div
          style={{
            width: isSplit ? '190px' : '100%',
            height: isSplit ? 'auto' : '180px',
            minHeight: isSplit ? '170px' : '180px',
            position: 'relative',
            flexShrink: 0,
            overflow: 'hidden',
            background: '#0a0d18',
          }}
        >
          <img
            src={gym.coverImageUrl}
            alt={gym.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
            }}
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {/* Distance Badge if GPS available */}
          {gym.distanceKm !== null && (
            <span
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#ffffff',
                background: 'rgba(14, 165, 233, 0.92)',
                backdropFilter: 'blur(6px)',
                padding: '3px 9px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Navigation size={11} />
              <span>{gym.distanceKm} km</span>
            </span>
          )}

          {/* Live Open / Closed Pill on Image */}
          <span
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              fontSize: '0.7rem',
              fontWeight: 800,
              color: '#ffffff',
              background: openStatus.isOpen ? 'rgba(16, 185, 129, 0.9)' : 'rgba(245, 158, 11, 0.9)',
              backdropFilter: 'blur(4px)',
              padding: '2px 8px',
              borderRadius: '6px',
            }}
          >
            {openStatus.isOpen ? '● Open Now' : '● Closed'}
          </span>
        </div>

        {/* Card Content Area */}
        <div
          style={{
            padding: '16px 20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {/* Area & Rating Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#38bdf8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {gym.area || gym.city}
              </span>

              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#f59e0b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Star size={13} fill="#f59e0b" />
                {gym.rating} ({gym.totalReviews})
              </span>
            </div>

            {/* Gym Name - High Contrast White */}
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 4px 0',
                letterSpacing: '-0.015em',
                lineHeight: 1.3,
              }}
            >
              {gym.name}
            </h3>

            {/* Tagline */}
            <div
              style={{
                fontSize: '0.76rem',
                color: '#38bdf8',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              {gym.facilityType} • {gym.tagline}
            </div>

            {/* Address */}
            <p
              style={{
                fontSize: '0.82rem',
                color: '#cbd5e1',
                margin: '0 0 10px 0',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              📍 {gym.address}
            </p>

            {/* Top Amenities Pills */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {gym.amenitiesList?.slice(0, 3).map((am, i) => (
                <span
                  key={i}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '5px',
                    padding: '2px 7px',
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                  }}
                >
                  ✓ {am}
                </span>
              ))}
              {gym.amenitiesList?.length > 3 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#64748b',
                    padding: '2px 4px',
                    alignSelf: 'center',
                  }}
                >
                  +{gym.amenitiesList.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Bottom Bar: Price & Action Buttons */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
                Plans from
              </span>
              <div style={{ fontSize: '1.12rem', fontWeight: 900, color: '#34d399' }}>
                ₹{gym.startingPrice}
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>/mo</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={gym.directionsUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Open Turn-by-Turn Directions in Google Maps"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '8px 13px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
                }}
              >
                <Navigation size={13} />
                <span>Maps</span>
              </a>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setJoinModalGym(gym);
                  setJoinSuccess(false);
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.16)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  borderRadius: '9px',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.16)')}
              >
                <Dumbbell size={13} />
                <span>Free Pass</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
