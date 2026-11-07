'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import {
  Dumbbell,
  Sparkles,
  Bot,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  X,
  Send,
  Building2,
  MapPin,
  Phone,
  Mail,
  Shield,
  Zap,
  Layers,
  Activity,
  Heart,
  Award,
  ArrowRight,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

const MUSCLE_GROUPS = [
  { id: 'all', label: 'All Machines' },
  { id: 'Chest', label: 'Chest' },
  { id: 'Back', label: 'Back & Lats' },
  { id: 'Legs', label: 'Legs & Glutes' },
  { id: 'Shoulders', label: 'Shoulders' },
  { id: 'Arms', label: 'Arms (Biceps/Triceps)' },
  { id: 'Cardio & Core', label: 'Cardio & Stamina' },
  { id: 'Full Body', label: 'Full Body' },
];

const PRESET_MACHINE_IMAGES = [
  {
    name: 'Chest Press',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Lat Pulldown',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Leg Press',
    url: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Cable Tower',
    url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Treadmill',
    url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Preacher Bench',
    url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=700&q=80',
  },
];

export default function GymMachinesPage() {
  const { user, token } = useAuth();
  const { currentGym } = useGym();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'staff';

  // Navigation tab: 'machines' | 'gym_info'
  const [activeTab, setActiveTab] = useState('machines');

  // Machines state
  const [equipmentList, setEquipmentList] = useState([]);
  const [gymDetails, setGymDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState(null);

  // AI Coach Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedMachineForAI, setSelectedMachineForAI] = useState(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Admin Add / Edit Machine Modal
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [machineForm, setMachineForm] = useState({
    name: '',
    category: 'Strength',
    primaryMuscle: 'Chest',
    targetMuscles: '',
    difficulty: 'Beginner',
    brand: '',
    imageUrl: '',
    description: '',
    setupGuide: '',
    executionSteps: '',
    commonMistakes: '',
    alternativeExercises: '',
  });
  const [generatingAI, setGeneratingAI] = useState(false);
  const [savingMachine, setSavingMachine] = useState(false);

  // Fetch Equipment & Gym Details
  const fetchData = async () => {
    setLoading(true);
    try {
      const gymId = currentGym?._id || user?.gym;
      const equipUrl = gymId ? `/api/equipment?gymId=${gymId}` : '/api/equipment';
      const gymUrl = gymId ? `/api/equipment/gym-details?gymId=${gymId}` : '/api/equipment/gym-details';

      const [equipRes, gymRes] = await Promise.all([
        fetch(equipUrl),
        fetch(gymUrl),
      ]);

      const [equipData, gymData] = await Promise.all([
        equipRes.json(),
        gymRes.json(),
      ]);

      if (equipData.success) {
        setEquipmentList(equipData.data || []);
      }
      if (gymData.success) {
        setGymDetails(gymData.data);
      }
    } catch (err) {
      console.error('Error fetching gym equipment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentGym, token]);

  // Filtered Machines
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((item) => {
      const matchMuscle = selectedMuscle === 'all' || item.primaryMuscle === selectedMuscle;
      const matchDiff = difficultyFilter === 'all' || item.difficulty === difficultyFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.primaryMuscle?.toLowerCase().includes(q) ||
        item.brand?.toLowerCase().includes(q) ||
        item.targetMuscles?.some((m) => m.toLowerCase().includes(q));
      return matchMuscle && matchDiff && matchSearch;
    });
  }, [equipmentList, selectedMuscle, difficultyFilter, searchQuery]);

  // Open AI Coach for Machine
  const openAICoach = (machine, initialQuery = '') => {
    setSelectedMachineForAI(machine);
    setAiQuestion(initialQuery);
    setAiResponse('');
    setAiModalOpen(true);

    if (initialQuery) {
      askAICoach(machine, initialQuery);
    }
  };

  // Ask AI Coach API
  const askAICoach = async (machine, queryText) => {
    const targetQ = queryText || aiQuestion;
    if (!targetQ.trim() || !machine) return;

    setAiLoading(true);
    setAiResponse('');
    try {
      const res = await fetch('/api/equipment/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineName: machine.name,
          primaryMuscle: machine.primaryMuscle,
          targetMuscles: machine.targetMuscles,
          query: targetQ,
          userGoal: 'Muscle Hypertrophy & Clean Posture',
          fitnessLevel: 'Beginner to Intermediate',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiResponse(data.data?.reply || 'No response received.');
      } else {
        setAiResponse('AI Coach temporary unavailable. Please check your network.');
      }
    } catch (err) {
      console.error('Error querying AI Coach:', err);
      setAiResponse('Could not connect to AI Coach. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Admin: Auto-fill machine form using AI
  const handleAutoFillAI = async () => {
    if (!machineForm.name.trim()) {
      alert('Please enter a Machine Name first (e.g. "Hammer Strength Chest Press" or "Hack Squat").');
      return;
    }

    setGeneratingAI(true);
    try {
      const res = await fetch('/api/equipment/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: machineForm.name,
          category: machineForm.category,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setMachineForm((prev) => ({
          ...prev,
          primaryMuscle: d.primaryMuscle || prev.primaryMuscle,
          targetMuscles: Array.isArray(d.targetMuscles) ? d.targetMuscles.join(', ') : d.targetMuscles || '',
          difficulty: d.difficulty || 'Beginner',
          description: d.description || prev.description,
          setupGuide: Array.isArray(d.setupGuide) ? d.setupGuide.join('\n') : '',
          executionSteps: Array.isArray(d.executionSteps) ? d.executionSteps.join('\n') : '',
          commonMistakes: Array.isArray(d.commonMistakes) ? d.commonMistakes.join('\n') : '',
          alternativeExercises: Array.isArray(d.alternativeExercises) ? d.alternativeExercises.join(', ') : '',
        }));
      } else {
        alert(data.message || 'AI generation failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while generating machine guide.');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Admin: Save / Update Machine
  const handleSaveMachine = async (e) => {
    e.preventDefault();
    if (!machineForm.name.trim()) return;

    setSavingMachine(true);
    try {
      const payload = {
        name: machineForm.name.trim(),
        category: machineForm.category,
        primaryMuscle: machineForm.primaryMuscle,
        targetMuscles: machineForm.targetMuscles.split(',').map((s) => s.trim()).filter(Boolean),
        difficulty: machineForm.difficulty,
        brand: machineForm.brand.trim(),
        imageUrl: machineForm.imageUrl.trim(),
        description: machineForm.description.trim(),
        setupGuide: machineForm.setupGuide.split('\n').map((s) => s.trim()).filter(Boolean),
        executionSteps: machineForm.executionSteps.split('\n').map((s) => s.trim()).filter(Boolean),
        commonMistakes: machineForm.commonMistakes.split('\n').map((s) => s.trim()).filter(Boolean),
        alternativeExercises: machineForm.alternativeExercises.split(',').map((s) => s.trim()).filter(Boolean),
      };

      const url = editingMachine ? `/api/equipment/${editingMachine._id}` : '/api/equipment';
      const method = editingMachine ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowMachineModal(false);
        setEditingMachine(null);
        await fetchData();
      } else {
        alert(data.message || 'Failed to save machine');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving machine');
    } finally {
      setSavingMachine(false);
    }
  };

  // Admin: Delete Machine
  const handleDeleteMachine = async (id) => {
    if (!confirm('Are you sure you want to remove this machine from the gym guide?')) return;
    try {
      const res = await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEquipmentList((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (machine) => {
    setEditingMachine(machine);
    setMachineForm({
      name: machine.name || '',
      category: machine.category || 'Strength',
      primaryMuscle: machine.primaryMuscle || 'Chest',
      targetMuscles: Array.isArray(machine.targetMuscles) ? machine.targetMuscles.join(', ') : '',
      difficulty: machine.difficulty || 'Beginner',
      brand: machine.brand || '',
      imageUrl: machine.imageUrl || '',
      description: machine.description || '',
      setupGuide: Array.isArray(machine.setupGuide) ? machine.setupGuide.join('\n') : '',
      executionSteps: Array.isArray(machine.executionSteps) ? machine.executionSteps.join('\n') : '',
      commonMistakes: Array.isArray(machine.commonMistakes) ? machine.commonMistakes.join('\n') : '',
      alternativeExercises: Array.isArray(machine.alternativeExercises) ? machine.alternativeExercises.join(', ') : '',
    });
    setShowMachineModal(true);
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* 1. HERO HEADER */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px',
          padding: '28px 32px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '3px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Dumbbell size={12} />
              GYM FLOOR & MACHINE DIRECTORY
            </span>

            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '3px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Bot size={12} />
              AI Form Coach Enabled
            </span>
          </div>

          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            {gymDetails?.name || 'Gym'} Floor & Machine Guide
          </h1>
          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            Explore every machine and workout station on your gym floor. Learn exact seat adjustments,
            step-by-step movement form, and get instant posture coaching with our Biomechanics AI Assistant!
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingMachine(null);
                setMachineForm({
                  name: '',
                  category: 'Strength',
                  primaryMuscle: 'Chest',
                  targetMuscles: '',
                  difficulty: 'Beginner',
                  brand: '',
                  imageUrl: '',
                  description: '',
                  setupGuide: '',
                  executionSteps: '',
                  commonMistakes: '',
                  alternativeExercises: '',
                });
                setShowMachineModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '11px 18px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
              }}
            >
              <Plus size={18} />
              Add Gym Machine
            </button>
          )}

          <div
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#10b981',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span>Open Today: 06:00 AM - 10:00 PM</span>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => setActiveTab('machines')}
          style={{
            background: activeTab === 'machines' ? 'var(--bg-card)' : 'transparent',
            border: activeTab === 'machines' ? '1px solid var(--border-subtle)' : 'none',
            color: activeTab === 'machines' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            padding: '10px 20px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <Dumbbell size={17} />
          <span>Gym Machines & Form Guide</span>
          <span
            style={{
              fontSize: '0.72rem',
              background: 'var(--bg-input)',
              color: 'var(--text-muted)',
              padding: '2px 8px',
              borderRadius: '999px',
            }}
          >
            {equipmentList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('gym_info')}
          style={{
            background: activeTab === 'gym_info' ? 'var(--bg-card)' : 'transparent',
            border: activeTab === 'gym_info' ? '1px solid var(--border-subtle)' : 'none',
            color: activeTab === 'gym_info' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            padding: '10px 20px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <Building2 size={17} />
          <span>Gym Details & Floor Rules</span>
        </button>
      </div>

      {/* 3. TAB 1: MACHINES & FORM GUIDE */}
      {activeTab === 'machines' && (
        <div>
          {/* Search & Muscle Group Filter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search lat pulldown, leg press, chest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '10px 14px 10px 38px',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
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
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Muscle Group Pills */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '4px',
                maxWidth: '100%',
              }}
            >
              {MUSCLE_GROUPS.map((m) => {
                const isSelected = selectedMuscle === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMuscle(m.id)}
                    style={{
                      background: isSelected ? 'var(--brand-primary, #38bdf8)' : 'var(--bg-card)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      border: isSelected ? '1px solid transparent' : '1px solid var(--border-subtle)',
                      borderRadius: '999px',
                      padding: '7px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Machine Cards Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p>Loading gym machines catalog...</p>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px dashed var(--border-subtle)',
              }}
            >
              <Dumbbell size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
                No machines found
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {searchQuery
                  ? `No machines match "${searchQuery}" in this category.`
                  : 'No machines listed in this muscle group.'}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '22px',
              }}
            >
              {filteredEquipment.map((machine) => {
                const isExpanded = expandedCardId === machine._id;
                const diffColors = {
                  Beginner: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
                  Intermediate: { bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' },
                  Advanced: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
                };
                const diffCfg = diffColors[machine.difficulty] || diffColors.Beginner;

                return (
                  <div
                    key={machine._id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    {/* Header Image */}
                    <div
                      style={{
                        height: '190px',
                        background: 'var(--bg-input)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {machine.imageUrl ? (
                        <img
                          src={machine.imageUrl}
                          alt={machine.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          <Dumbbell size={42} style={{ margin: '0 auto 6px' }} />
                          <span style={{ fontSize: '0.74rem' }}>{machine.category}</span>
                        </div>
                      )}

                      {/* Difficulty Badge */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: diffCfg.color,
                          background: diffCfg.bg,
                          border: `1px solid ${diffCfg.border}`,
                          backdropFilter: 'blur(6px)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {machine.difficulty || 'Beginner'}
                      </span>

                      {/* Muscle Category Tag */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          background: 'rgba(0, 0, 0, 0.65)',
                          backdropFilter: 'blur(6px)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {machine.primaryMuscle || 'Strength'}
                      </span>
                    </div>

                    {/* Content Section */}
                    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {machine.brand && (
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '4px',
                          }}
                        >
                          {machine.brand}
                        </div>
                      )}

                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          margin: '0 0 6px 0',
                        }}
                      >
                        {machine.name}
                      </h3>

                      {machine.description && (
                        <p
                          style={{
                            fontSize: '0.84rem',
                            color: 'var(--text-secondary)',
                            margin: '0 0 12px 0',
                            lineHeight: '1.45',
                          }}
                        >
                          {machine.description}
                        </p>
                      )}

                      {/* Target Muscle Chips */}
                      {machine.targetMuscles?.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                          {machine.targetMuscles.map((t, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'var(--bg-input)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '6px',
                                padding: '2px 8px',
                              }}
                            >
                              🎯 {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Quick Setup Preview */}
                      {machine.setupGuide?.length > 0 && (
                        <div
                          style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            marginBottom: '14px',
                            fontSize: '0.82rem',
                          }}
                        >
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} style={{ color: '#38bdf8' }} />
                            <span>Quick Seat & Pin Setup:</span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                            {machine.setupGuide[0]}
                          </div>
                        </div>
                      )}

                      {/* Expandable Execution & Form Details */}
                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                          {/* Movement Execution */}
                          {machine.executionSteps?.length > 0 && (
                            <div
                              style={{
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                              }}
                            >
                              <div style={{ fontWeight: 800, color: '#10b981', marginBottom: '8px', fontSize: '0.82rem' }}>
                                🎯 Step-by-Step Form & Execution:
                              </div>
                              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {machine.executionSteps.map((step, idx) => (
                                  <li key={idx} style={{ marginBottom: '4px' }}>
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Common Mistakes */}
                          {machine.commonMistakes?.length > 0 && (
                            <div
                              style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                              }}
                            >
                              <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangle size={14} />
                                <span>Mistakes to Avoid:</span>
                              </div>
                              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                                {machine.commonMistakes.map((m, idx) => (
                                  <li key={idx} style={{ marginBottom: '4px' }}>
                                    {m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Alternatives If Occupied */}
                          {machine.alternativeExercises?.length > 0 && (
                            <div
                              style={{
                                background: 'rgba(245, 158, 11, 0.08)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                              }}
                            >
                              <div style={{ fontWeight: 800, color: '#f59e0b', marginBottom: '6px', fontSize: '0.82rem' }}>
                                🔄 If Machine Is Busy (Alternative Exercises):
                              </div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                {machine.alternativeExercises.join(' • ')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => setExpandedCardId(isExpanded ? null : machine._id)}
                          style={{
                            flex: 1,
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            padding: '9px 12px',
                            borderRadius: '10px',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{isExpanded ? 'Less Info' : 'View Full Guide'}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <button
                          onClick={() => openAICoach(machine)}
                          style={{
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '9px 16px',
                            borderRadius: '10px',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 3px 10px rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          <Sparkles size={15} />
                          <span>Ask AI Coach</span>
                        </button>

                        {/* Admin Controls */}
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => openEditModal(machine)}
                              title="Edit Machine"
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                padding: '8px',
                              }}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteMachine(machine._id)}
                              title="Delete Machine"
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#ef4444',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                padding: '8px',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: GYM DETAILS, TIMINGS & FLOOR RULES */}
      {activeTab === 'gym_info' && gymDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Gym Profile & Contact Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                  }}
                >
                  VERIFIED FACILITY
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {gymDetails.facilityType}
                </span>
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                {gymDetails.name}
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
                {gymDetails.tagline}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
                  <span>{gymDetails.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>{gymDetails.openingHours}</span>
                </div>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={`tel:${gymDetails.phone}`}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Phone size={16} style={{ color: '#10b981' }} />
                <span>Call Desk: {gymDetails.phone}</span>
              </a>

              <a
                href={`https://wa.me/${gymDetails.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                }}
              >
                <MessageSquare size={16} />
                <span>WhatsApp Helpdesk</span>
              </a>
            </div>
          </div>

          {/* Peak Hours & Rush Schedule */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Flame size={18} style={{ color: '#f59e0b' }} />
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Morning Peak Hours
                </h4>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', marginBottom: '4px' }}>
                {gymDetails.peakHours?.morningPeak}
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                High energy workout music, crossfit turf active, maximum member attendance.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Flame size={18} style={{ color: '#ef4444' }} />
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Evening Rush Hours
                </h4>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444', marginBottom: '4px' }}>
                {gymDetails.peakHours?.eveningPeak}
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Busiest session. Plan ahead or use AI alternative exercises if free weights are occupied.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={18} style={{ color: '#10b981' }} />
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Peaceful Training Hours
                </h4>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginBottom: '4px' }}>
                01:00 PM - 04:30 PM
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Best time for zero waiting time on machines, calm ambient music & personal training focus.
              </p>
            </div>
          </div>

          {/* Floor Amenities */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
              Gym Amenities & Floor Facilities
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              {gymDetails.amenities?.map((am, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{am.icon}</span>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                      {am.name}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      {am.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floor Rules & Etiquette */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} style={{ color: '#38bdf8' }} />
              <span>Gym Etiquette & Floor Rules</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {gymDetails.floorRules?.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'var(--bg-input)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                  }}
                >
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {r.rule}:
                    </span>{' '}
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                      {r.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floor Trainers */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
              Certified Coaches & Trainers on the Floor
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {gymDetails.trainers?.map((tr, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '2px' }}>
                    {tr.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                    {tr.role}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Specialization: <strong>{tr.spec}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE AI MACHINE COACH MODAL */}
      {aiModalOpen && selectedMachineForAI && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-input)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    AI Machine Coach: {selectedMachineForAI.name}
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Biomechanics & Form Specialist • Hindi & English Friendly
                  </div>
                </div>
              </div>

              <button
                onClick={() => setAiModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quick Prompt Chips */}
              <div>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Tap a quick coaching question:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    'Explain step-by-step form for beginners',
                    'Machine is busy! Give 3 alternative exercises',
                    'How to prevent lower back & shoulder pain on this?',
                    'Best reps & sets for muscle growth (hypertrophy)',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => {
                        setAiQuestion(chip);
                        askAICoach(selectedMachineForAI, chip);
                      }}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '999px',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      ⚡ {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Response Box */}
              {aiLoading ? (
                <div
                  style={{
                    background: 'var(--bg-input)',
                    borderRadius: '16px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 10px', color: '#6366f1' }} />
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>AI Coach is analyzing biomechanics and form tips...</p>
                </div>
              ) : aiResponse ? (
                <div
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '20px',
                    fontSize: '0.88rem',
                    lineHeight: '1.6',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {aiResponse}
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--bg-input)',
                    borderRadius: '16px',
                    padding: '24px 20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.86rem',
                  }}
                >
                  Ask any question about {selectedMachineForAI.name} — e.g. seat height, foot placement, pain troubleshooting, or rep ranges!
                </div>
              )}
            </div>

            {/* Modal Input Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                display: 'flex',
                gap: '10px',
              }}
            >
              <input
                type="text"
                placeholder="Ask in Hindi or English (e.g. Isme pair kahan rakhein?)..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') askAICoach(selectedMachineForAI);
                }}
                style={{
                  flex: 1,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '11px 16px',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
              <button
                disabled={aiLoading || !aiQuestion.trim()}
                onClick={() => askAICoach(selectedMachineForAI)}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '11px 18px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: aiLoading || !aiQuestion.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Send size={16} />
                <span>Ask</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADMIN ADD / EDIT MACHINE MODAL */}
      {showMachineModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {editingMachine ? 'Edit Gym Machine' : 'Add New Floor Machine'}
                </h3>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Members will see this guide and AI coaching immediately
                </div>
              </div>
              <button
                onClick={() => setShowMachineModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMachine} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Machine Name *
                  </label>
                  <button
                    type="button"
                    disabled={generatingAI}
                    onClick={handleAutoFillAI}
                    style={{
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.25))',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#a5b4fc',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles size={12} />
                    <span>{generatingAI ? 'AI Writing...' : '✨ Auto-Fill with AI'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hammer Strength Incline Press"
                  value={machineForm.name}
                  onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Primary Muscle Target
                  </label>
                  <select
                    value={machineForm.primaryMuscle}
                    onChange={(e) => setMachineForm({ ...machineForm, primaryMuscle: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Chest">Chest</option>
                    <option value="Back">Back & Lats</option>
                    <option value="Legs">Legs & Glutes</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Arms">Arms (Biceps/Triceps)</option>
                    <option value="Cardio & Core">Cardio & Core</option>
                    <option value="Full Body">Full Body</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Difficulty Level
                  </label>
                  <select
                    value={machineForm.difficulty}
                    onChange={(e) => setMachineForm({ ...machineForm, difficulty: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Beginner">Beginner-Friendly</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Target Muscles (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Upper Chest, Triceps, Anterior Delts"
                  value={machineForm.targetMuscles}
                  onChange={(e) => setMachineForm({ ...machineForm, targetMuscles: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={machineForm.imageUrl}
                  onChange={(e) => setMachineForm({ ...machineForm, imageUrl: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    marginBottom: '6px',
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_MACHINE_IMAGES.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => setMachineForm({ ...machineForm, imageUrl: img.url })}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {img.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Step-by-Step Execution Guide (one per line)
                </label>
                <textarea
                  rows="3"
                  placeholder="Sit with chest upright...&#10;Press smoothly along guided track...&#10;Squeeze target muscle for 1 sec..."
                  value={machineForm.executionSteps}
                  onChange={(e) => setMachineForm({ ...machineForm, executionSteps: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Common Mistakes to Avoid (one per line)
                </label>
                <textarea
                  rows="2"
                  placeholder="Locking elbows aggressively...&#10;Arching lower back off the pad..."
                  value={machineForm.commonMistakes}
                  onChange={(e) => setMachineForm({ ...machineForm, commonMistakes: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={savingMachine}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: savingMachine ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingMachine ? 'Saving...' : editingMachine ? 'Update Machine Guide' : 'Add to Gym Floor'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMachineModal(false)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
