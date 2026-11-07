'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import {
  Sparkles,
  Dumbbell,
  Utensils,
  TrendingUp,
  MessageSquare,
  Bot,
  Copy,
  Check,
  Printer,
  Zap,
  ShieldCheck,
  RefreshCw,
  Send,
  Building2,
  Calendar,
  HeartPulse,
  AlertCircle,
  Wallet,
  Banknote,
  Flame,
  Award,
  Scale,
  Target,
  Layers,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Activity,
  Smile,
  Leaf,
  Egg,
} from 'lucide-react';
import AIBlueprintViewer from '../../components/AIBlueprintViewer';
import SmartDietTracker from '../../components/SmartDietTracker';

function renderChatMessageText(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lIdx) => {
    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
    const cleanLine = isBullet ? line.trim().slice(2) : line;

    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const content = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '3px 0' }}>
          <span style={{ color: '#818cf8', fontWeight: 900 }}>•</span>
          <div>{content}</div>
        </div>
      );
    }

    if (line.trim().startsWith('### ')) {
      return (
        <div key={lIdx} style={{ fontWeight: 800, fontSize: '0.92rem', color: '#818cf8', margin: '8px 0 4px' }}>
          {line.replace('### ', '')}
        </div>
      );
    }

    return (
      <div key={lIdx} style={{ minHeight: line.trim() ? 'auto' : '6px' }}>
        {content}
      </div>
    );
  });
}

export default function AICoachPage() {
  const { user, token } = useAuth();
  const { currentGym, formatCurrency } = useGym();

  // Mode Tabs: 'coach' (interactive wizard & coach) | 'tracker' (daily diet/workout) | 'blueprint' (full routine viewer) | 'business' (staff)
  const [activeTab, setActiveTab] = useState('coach');

  // Progressive Interactive Step:
  // 0: Minimal Welcome + 4 Goal Cards
  // 1: Fitness Experience Level
  // 2: Training Days / Schedule
  // 3: Diet Preference
  // 4: Grocery Budget & Personal Stats
  // 5: Revealed Blueprint & Target KPIs + Chat
  const [interactiveStep, setInteractiveStep] = useState(0);

  // Workout & Diet State (Athletic & Budget Calibration)
  const [workoutForm, setWorkoutForm] = useState({
    name: user?.name || '',
    age: '24',
    gender: 'Male',
    bodyWeight: '72',
    goal: 'Lean Muscle Hypertrophy',
    fitnessLevel: 'Intermediate',
    daysPerWeek: 4,
    trainingLocation: 'Full Commercial Gym',
    dietaryPreference: 'Non-Vegetarian',
    budgetTier: 'student', // 'student' | 'moderate' | 'premium' | 'custom'
    dailyBudget: '₹150 / day',
    mealFrequency: '4 Meals (Standard Athletic)',
    healthNotes: '',
    customInstructions: '',
  });

  const [generatingWorkout, setGeneratingWorkout] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [workoutResult, setWorkoutResult] = useState('');
  const [workoutError, setWorkoutError] = useState('');
  const [syncingTracker, setSyncingTracker] = useState(false);
  const [trackerSynced, setTrackerSynced] = useState(false);
  const [syncNotification, setSyncNotification] = useState('');

  // Business Insights State
  const [generatingBusiness, setGeneratingBusiness] = useState(false);
  const [businessResult, setBusinessResult] = useState(null);
  const [businessError, setBusinessError] = useState('');
  const [copiedBusiness, setCopiedBusiness] = useState(false);

  // Inline Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am your FeeOrbit AI Coach. Ask me anything about workout routines, nutrition plans, meal swaps, or calorie goals!`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  React.useEffect(() => {
    if (user?.name) {
      setWorkoutForm((prev) => ({ ...prev, name: user.name }));
    }
  }, [user]);

  // Resilient API Caller
  const callAiEndpoint = async (endpoint, payload) => {
    const candidates = [
      process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}${endpoint}` : null,
      `http://localhost:5000/api${endpoint}`,
      `http://127.0.0.1:5000/api${endpoint}`,
      `/api${endpoint}`,
    ].filter(Boolean);

    const uniqueUrls = Array.from(new Set(candidates));
    let lastError = null;

    for (const url of uniqueUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for Gemini

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let data;
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (jsonErr) {
          throw new Error(`Server responded with non-JSON (${res.status}): ${text.slice(0, 100)}`);
        }

        if (!res.ok || !data.success) {
          throw new Error(data?.message || `Server returned status ${res.status}`);
        }

        return data;
      } catch (err) {
        lastError = err;
        console.warn(`[FeeOrbit AI] Attempt to ${url} failed:`, err.message);
      }
    }

    throw lastError || new Error('Network error connecting to FeeOrbit AI');
  };

  // Generate Personalized Workout & Diet Plan
  const handleGenerateWorkout = async (e, formOverride = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const activeForm = formOverride || workoutForm;
    setGeneratingWorkout(true);
    setWorkoutError('');
    setWorkoutResult('');
    setTrackerSynced(false);
    setGenerationStep(1);

    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < 4 ? prev + 1 : 4));
    }, 1800);

    try {
      const data = await callAiEndpoint('/ai/workout-plan', {
        ...activeForm,
        prompt: activeForm.customInstructions,
        customInstructions: activeForm.customInstructions,
      });
      if (data && data.success) {
        setWorkoutResult(data.data.plan);
        setGenerationStep(4);
        setInteractiveStep(5); // Smoothly show the Plan Reveal Hub
      } else {
        setWorkoutError(data?.message || 'Failed to generate workout plan');
      }
    } catch (err) {
      console.error('AI Workout Error:', err);
      setWorkoutError(err.message || 'Network error connecting to FeeOrbit AI. Check backend server.');
    } finally {
      clearInterval(stepInterval);
      setGeneratingWorkout(false);
    }
  };

  // Handle Business Insights for Gym Admins
  const handleGenerateBusiness = async () => {
    setGeneratingBusiness(true);
    setBusinessError('');
    try {
      const data = await callAiEndpoint('/ai/business-insights', { gymId: currentGym?._id });
      if (data && data.success) {
        setBusinessResult(data.data);
      } else {
        setBusinessError(data?.message || 'Failed to generate business insights');
      }
    } catch (err) {
      console.error('AI Business Error:', err);
      setBusinessError(err.message || 'Network error connecting to FeeOrbit AI');
    } finally {
      setGeneratingBusiness(false);
    }
  };

  // Handle Conversational Chat
  const handleChatSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const data = await callAiEndpoint('/ai/chat', {
        message: userMsg,
        context: {
          gymName: currentGym?.name,
          userGoal: workoutForm.goal,
          diet: workoutForm.dietaryPreference,
          budget: workoutForm.dailyBudget,
        },
      });
      if (data && data.success) {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: data.data.reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `⚠️ Error: ${data?.message || 'Could not get response.'}` },
        ]);
      }
    } catch (err) {
      console.error('AI Chat Error:', err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `⚠️ ${err.message || 'Connection error with FeeOrbit AI server.'}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Dynamically calculate or parse target KPIs from plan or user selections
  const targetKpis = useMemo(() => {
    let cal = 2100;
    let prot = 125;
    let water = '3.0 - 3.5 L';
    let cost = workoutForm.dailyBudget || '₹150 / day';

    const weight = Number(workoutForm.bodyWeight) || 70;
    if (workoutForm.goal?.toLowerCase().includes('fat loss') || workoutForm.goal?.toLowerCase().includes('shred')) {
      cal = Math.round(weight * 26);
      prot = Math.round(weight * 1.8);
    } else if (workoutForm.goal?.toLowerCase().includes('muscle') || workoutForm.goal?.toLowerCase().includes('strength')) {
      cal = Math.round(weight * 33);
      prot = Math.round(weight * 2.0);
    } else {
      cal = Math.round(weight * 29);
      prot = Math.round(weight * 1.6);
    }

    if (workoutResult) {
      const calMatch = workoutResult.match(/(?:target\s*calories|calories|daily\s*energy)[:\s*~*]*([\d,]+)\s*(?:kcal|calories)/i);
      if (calMatch) {
        const parsedCal = parseInt(calMatch[1].replace(/,/g, ''), 10);
        if (parsedCal >= 1200 && parsedCal <= 4500) cal = parsedCal;
      }

      const protMatch = workoutResult.match(/(?:target\s*protein|protein)[:\s*~*]*(\d+)\s*g/i);
      if (protMatch) {
        const parsedProt = parseInt(protMatch[1], 10);
        if (parsedProt >= 40 && parsedProt <= 250) prot = parsedProt;
      }

      const costMatch = workoutResult.match(/₹\s*(\d+)/i);
      if (costMatch) {
        cost = `₹${costMatch[1]} / day`;
      }
    }

    return { calories: cal, protein: prot, water, cost };
  }, [workoutResult, workoutForm]);

  // Sync Generated Targets to Daily Tracker & Switch to Tracker Tab
  const handleSyncBlueprintToTracker = async (kpis = null) => {
    setSyncingTracker(true);
    try {
      const targetCalories = kpis?.calories || targetKpis.calories || 2200;
      const targetProtein = kpis?.protein || targetKpis.protein || 130;

      let dailyBudget = 150;
      const rawCost = kpis?.cost || targetKpis.cost || workoutForm.dailyBudget || '';
      const costMatch = String(rawCost).replace(/,/g, '').match(/\d+/);
      if (costMatch) dailyBudget = parseInt(costMatch[0], 10);

      await callAiEndpoint('/ai/diet-log/settings', {
        targetCalories,
        targetProtein,
        dailyBudget,
        dietaryPreference: workoutForm.dietaryPreference,
      });

      setTrackerSynced(true);
      setSyncNotification(`Targets Synced: ${targetCalories} kcal • ${targetProtein}g protein • ₹${dailyBudget}/day!`);
      setTimeout(() => {
        setSyncNotification('');
        setActiveTab('tracker');
      }, 900);
    } catch (err) {
      console.error('Sync Error:', err);
      alert('Could not sync to Daily Tracker: ' + err.message);
    } finally {
      setSyncingTracker(false);
    }
  };

  const copyToClipboard = (text, setCopied) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 4 Catchy Primary Goals for Step 0
  const GOAL_CARDS = [
    {
      id: 'fat_loss',
      icon: '🔥',
      title: 'Burn Fat & Get Lean',
      tag: 'Most Popular',
      tagColor: '#ef4444',
      tagBg: 'rgba(239, 68, 68, 0.12)',
      desc: 'Shred belly fat, tone muscles, and boost stamina with a calorie-deficit Indian diet.',
      goalValue: 'Aggressive Fat Loss & Shred',
      defaultDays: 5,
      defaultBudget: '₹150 / day',
      budgetTier: 'student',
    },
    {
      id: 'muscle_gain',
      icon: '💪',
      title: 'Build Muscle & Strength',
      tag: 'Hypertrophy',
      tagColor: '#3b82f6',
      tagBg: 'rgba(59, 130, 246, 0.12)',
      desc: 'Pack on lean dense muscle, hit your personal lifting records, and fuel recovery.',
      goalValue: 'Lean Muscle Hypertrophy',
      defaultDays: 4,
      defaultBudget: '₹180 / day',
      budgetTier: 'student',
    },
    {
      id: 'general_fitness',
      icon: '⚡',
      title: 'All-Round Fitness & Stamina',
      tag: 'Vitality & Health',
      tagColor: '#10b981',
      tagBg: 'rgba(16, 185, 129, 0.12)',
      desc: 'Feel active all day, improve posture, build stamina, and create a sustainable gym habit.',
      goalValue: 'Beginner Full-Body Foundation',
      defaultDays: 3,
      defaultBudget: '₹150 / day',
      budgetTier: 'student',
    },
    {
      id: 'pure_veg',
      icon: '🧀',
      title: '100% Pure Veg Transformation',
      tag: 'Pure Vegetarian',
      tagColor: '#f59e0b',
      tagBg: 'rgba(245, 158, 11, 0.12)',
      desc: 'Hit 100g+ daily protein using paneer, chana sattu, curd, and dal without eggs or meat.',
      goalValue: 'Body Recomposition (Lose Fat + Build Muscle)',
      dietaryPreference: 'Vegetarian (Paneer/Dahi/Milk/Whey)',
      defaultDays: 4,
      defaultBudget: '₹200 / day',
      budgetTier: 'moderate',
    },
  ];

  // Helper to choose a goal card and advance to Question 1
  const selectGoalAndProceed = (goalCard) => {
    setWorkoutForm((prev) => ({
      ...prev,
      goal: goalCard.goalValue,
      daysPerWeek: goalCard.defaultDays || prev.daysPerWeek,
      dailyBudget: goalCard.defaultBudget || prev.dailyBudget,
      budgetTier: goalCard.budgetTier || prev.budgetTier,
      ...(goalCard.dietaryPreference ? { dietaryPreference: goalCard.dietaryPreference } : {}),
      customInstructions: `Goal: ${goalCard.title}. ${goalCard.desc}`,
    }));
    setInteractiveStep(1); // Move to Step 1: Fitness Level
  };

  return (
    <div className="ai-coach-container">
      {/* 1. TOP HEADER & HIGH-LEVEL MODE TABS */}
      <div className="ai-coach-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            }}
          >
            <Sparkles size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                FeeOrbit <span style={{ color: 'var(--brand-primary, #6366f1)' }}>AI Coach</span>
              </h1>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                Smart Assistant
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
              Your friendly guide for workouts, Indian budget diets, and daily nutrition
            </p>
          </div>
        </div>

        {/* Clean Top Navigation Tabs */}
        <div className="ai-coach-tabs-nav">
          <button
            onClick={() => setActiveTab('coach')}
            style={{
              background: activeTab === 'coach' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: activeTab === 'coach' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Bot size={14} />
            <span>AI Coach</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            style={{
              background: activeTab === 'tracker' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: activeTab === 'tracker' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Utensils size={14} />
            <span>Daily Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprint')}
            style={{
              background: activeTab === 'blueprint' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: activeTab === 'blueprint' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={14} />
            <span>My Blueprint</span>
          </button>

          {user?.role !== 'member' && (
            <button
              onClick={() => setActiveTab('business')}
              style={{
                background: activeTab === 'business' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                color: activeTab === 'business' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <TrendingUp size={14} />
              <span>Gym Advisor</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: INTERACTIVE AI COACH (PROGRESSIVE, USER-FRIENDLY & ENGAGING)
          ========================================================================= */}
      {activeTab === 'coach' && (
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Sync Success Notification Toast */}
          {syncNotification && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10b981',
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '10px 16px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2)',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{syncNotification}</span>
            </div>
          )}

          {/* Error Banner */}
          {workoutError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#ef4444', marginBottom: '2px' }}>
                  Unable to Generate Blueprint
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {workoutError}
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateWorkout()}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.74rem' }}
                >
                  <RefreshCw size={12} /> Try Again
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              GENERATING ANIMATION (Multi-Step Neural Synthesis)
              ------------------------------------------------------------------- */}
          {generatingWorkout && (
            <div
              className="glass-card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.9))',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '22px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(16, 185, 129, 0.2))',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-primary, #6366f1)',
                  margin: '0 auto 16px auto',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.35)',
                }}
              >
                <RefreshCw size={30} className="spin" />
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                Crafting Your Custom Fitness &amp; Diet Plan...
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 26px 0' }}>
                FeeOrbit AI is calculating your macros, weekly split, and Indian grocery budget
              </p>

              <div style={{ maxWidth: '460px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: generationStep >= 1 ? 'rgba(99, 102, 241, 0.12)' : 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid',
                    borderColor: generationStep >= 1 ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-subtle)',
                  }}
                >
                  {generationStep > 1 ? (
                    <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #6366f1', borderTopColor: 'transparent' }} className="spin" />
                  )}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      1. Calculating Daily Calories &amp; Protein Target
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Metabolic balance for {workoutForm.name || 'athlete'} ({workoutForm.bodyWeight || '70'} kg)
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: generationStep >= 2 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid',
                    borderColor: generationStep >= 2 ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)',
                    opacity: generationStep >= 2 ? 1 : 0.5,
                  }}
                >
                  {generationStep > 2 ? (
                    <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                  ) : generationStep === 2 ? (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #10b981', borderTopColor: 'transparent' }} className="spin" />
                  ) : (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid var(--text-muted)' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      2. Matching Pocket-Friendly Grocery Budget
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Calibrating egg/paneer/sattu sources within {workoutForm.dailyBudget}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: generationStep >= 3 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid',
                    borderColor: generationStep >= 3 ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-subtle)',
                    opacity: generationStep >= 3 ? 1 : 0.5,
                  }}
                >
                  {generationStep > 3 ? (
                    <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                  ) : generationStep === 3 ? (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #38bdf8', borderTopColor: 'transparent' }} className="spin" />
                  ) : (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid var(--text-muted)' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      3. Engineering {workoutForm.daysPerWeek}-Day Workout Routine
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Structuring exercises, sets, reps &amp; progressive overload tables
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: generationStep >= 4 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid',
                    borderColor: generationStep >= 4 ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)',
                    opacity: generationStep >= 4 ? 1 : 0.5,
                  }}
                >
                  {generationStep >= 4 ? (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #f59e0b', borderTopColor: 'transparent' }} className="spin" />
                  ) : (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid var(--text-muted)' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      4. Assembling Blueprint &amp; Daily Action Targets
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Preparing 1-click sync to your Daily Diet Tracker
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              STEP 0: CLEAN & CATCHY WELCOME HUB (Minimal Options, High Appeal)
              ------------------------------------------------------------------- */}
          {!generatingWorkout && interactiveStep === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Catchy Hero Banner */}
              <div
                className="glass-card"
                style={{
                  padding: '28px 24px',
                  borderRadius: '16px',
                  background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  textAlign: 'center',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--brand-primary, #6366f1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginBottom: '14px',
                  }}
                >
                  <Sparkles size={13} />
                  <span>Interactive 1-Minute Assessment</span>
                </div>

                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                  Hi {user?.name ? user.name.split(' ')[0] : 'there'}! What is your main fitness goal?
                </h2>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 24px auto', lineHeight: 1.55 }}>
                  Choose an objective below. Your AI coach will ask just 3 quick questions to build your customized routine and budget-friendly grocery guide.
                </p>

                {/* The 4 Catchy Goal Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '14px',
                    textAlign: 'left',
                  }}
                >
                  {GOAL_CARDS.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => selectGoalAndProceed(card)}
                      style={{
                        background: 'var(--bg-main, rgba(255, 255, 255, 0.03))',
                        border: '1.5px solid var(--border-subtle)',
                        borderRadius: '14px',
                        padding: '18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '135px',
                        position: 'relative',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = card.tagColor;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 8px 24px ${card.tagBg}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '1.6rem' }}>{card.icon}</span>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              color: card.tagColor,
                              background: card.tagBg,
                              padding: '2px 8px',
                              borderRadius: '999px',
                            }}
                          >
                            {card.tag}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {card.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          {card.desc}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '12px', gap: '4px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: card.tagColor }}>Select &amp; Start</span>
                        <ChevronRight size={14} style={{ color: card.tagColor }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Prompt Bar for Custom Needs */}
              <div
                className="glass-card"
                style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    Have specific requirements in mind?
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', height: '36px', fontSize: '0.8rem', padding: '0 12px' }}
                    placeholder="e.g. 'College student, 4 days/week gym, need fat loss under ₹120/day with eggs & sattu...'"
                    value={workoutForm.customInstructions}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, customInstructions: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setInteractiveStep(1);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setInteractiveStep(1)}
                  className="btn btn-primary"
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '18px',
                  }}
                >
                  <span>Continue Consultation</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              STEP 1: FITNESS EXPERIENCE LEVEL (Question 1 of 4)
              ------------------------------------------------------------------- */}
          {!generatingWorkout && interactiveStep === 1 && (
            <div
              className="glass-card"
              style={{
                padding: '28px 24px',
                borderRadius: '16px',
                background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {/* Step Navigation Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setInteractiveStep(0)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem' }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Question <span style={{ color: 'var(--brand-primary, #6366f1)' }}>1 of 4</span>
                </div>
              </div>

              {/* Progress Bar (25%) */}
              <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '999px', marginBottom: '22px', overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: '999px' }} />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  What is your workout experience level?
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  This helps the AI tune exercise complexity, set volume, and injury prevention cues.
                </p>
              </div>

              {/* 3 Selectable Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: '0 auto 24px auto' }}>
                {[
                  {
                    level: 'Beginner (0-6 months)',
                    badge: '🌱 Beginner',
                    subtitle: 'New to the gym or restarting after a long break',
                    details: 'Focus on proper exercise form, safe machine setups, and building joint stamina without soreness.',
                  },
                  {
                    level: 'Intermediate (6-24 months)',
                    badge: '🏋️ Intermediate',
                    subtitle: 'Workout consistently and know compound movements',
                    details: 'Focus on progressive overload, barbell lifts (squats/bench), and breaking through strength plateaus.',
                  },
                  {
                    level: 'Advanced (2+ years)',
                    badge: '🏆 Advanced Athlete',
                    subtitle: 'Experienced lifter looking for precision stimulus',
                    details: 'Focus on periodization, high volume hypertrophy, RPE 8-10 intensity, and specialized isolation angles.',
                  },
                ].map((opt) => {
                  const isSelected = workoutForm.fitnessLevel === opt.level;
                  return (
                    <div
                      key={opt.level}
                      onClick={() => {
                        setWorkoutForm({ ...workoutForm, fitnessLevel: opt.level });
                        setInteractiveStep(2); // Auto-advance!
                      }}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-main, rgba(255, 255, 255, 0.02))',
                        border: '2px solid',
                        borderColor: isSelected ? 'var(--brand-primary, #6366f1)' : 'var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {opt.badge}
                        </div>
                        {isSelected && <CheckCircle2 size={18} style={{ color: 'var(--brand-primary, #6366f1)' }} />}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                        {opt.subtitle}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {opt.details}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setInteractiveStep(2)}
                  className="btn btn-primary"
                  style={{ padding: '9px 24px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Next Question</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              STEP 2: TRAINING DAYS / SCHEDULE (Question 2 of 4)
              ------------------------------------------------------------------- */}
          {!generatingWorkout && interactiveStep === 2 && (
            <div
              className="glass-card"
              style={{
                padding: '28px 24px',
                borderRadius: '16px',
                background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setInteractiveStep(1)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem' }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Question <span style={{ color: 'var(--brand-primary, #6366f1)' }}>2 of 4</span>
                </div>
              </div>

              {/* Progress Bar (50%) */}
              <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '999px', marginBottom: '22px', overflow: 'hidden' }}>
                <div style={{ width: '50%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: '999px' }} />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  How many days a week can you train?
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Consistency beats intensity. Pick a routine that comfortably fits your job, studies, and life.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: '0 auto 24px auto' }}>
                {[
                  {
                    days: 3,
                    title: '🗓️ 3 Days / Week (Full Body Split)',
                    badge: 'Busy Schedule & Beginner Friendly',
                    desc: 'Full-body workout every other day (e.g. Mon / Wed / Fri). 4 complete rest days for optimal muscle repair.',
                  },
                  {
                    days: 4,
                    title: '⚡ 4 - 5 Days / Week (Upper / Lower or PPL)',
                    badge: 'Golden Standard for Muscle & Fat Loss',
                    desc: 'Dedicated push/pull/legs sessions. Ideal volume and frequency for rapid physique transformation.',
                  },
                  {
                    days: 6,
                    title: '🔥 6 Days / Week (Push-Pull-Legs × 2)',
                    badge: 'High Discipline & Rapid Gains',
                    desc: 'Strict 6-day rotation with 1 rest day. Designed for dedicated lifters wanting daily gym energy.',
                  },
                ].map((opt) => {
                  const isSelected = workoutForm.daysPerWeek === opt.days;
                  return (
                    <div
                      key={opt.days}
                      onClick={() => {
                        setWorkoutForm({ ...workoutForm, daysPerWeek: opt.days });
                        setInteractiveStep(3); // Auto-advance!
                      }}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-main, rgba(255, 255, 255, 0.02))',
                        border: '2px solid',
                        borderColor: isSelected ? 'var(--brand-primary, #6366f1)' : 'var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {opt.title}
                        </div>
                        {isSelected && <CheckCircle2 size={18} style={{ color: 'var(--brand-primary, #6366f1)' }} />}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#10b981', marginBottom: '3px' }}>
                        {opt.badge}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {opt.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setInteractiveStep(3)}
                  className="btn btn-primary"
                  style={{ padding: '9px 24px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Next Question</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              STEP 3: DIET PREFERENCE (Question 3 of 4)
              ------------------------------------------------------------------- */}
          {!generatingWorkout && interactiveStep === 3 && (
            <div
              className="glass-card"
              style={{
                padding: '28px 24px',
                borderRadius: '16px',
                background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setInteractiveStep(2)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem' }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Question <span style={{ color: 'var(--brand-primary, #6366f1)' }}>3 of 4</span>
                </div>
              </div>

              {/* Progress Bar (75%) */}
              <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '999px', marginBottom: '22px', overflow: 'hidden' }}>
                <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: '999px' }} />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  What dietary style do you prefer?
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  FeeOrbit AI recommends meal items that match your everyday kitchen and lifestyle.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: '0 auto 24px auto' }}>
                {[
                  {
                    value: 'Non-Vegetarian (Chicken/Eggs/Fish)',
                    title: '🍗 Non-Vegetarian',
                    badge: 'Chicken, Eggs, Fish & Dairy',
                    desc: 'High protein options including whole boiled eggs, egg whites, chicken breast, fish, paneer, and lentils.',
                  },
                  {
                    value: 'Eggetarian (Eggs + Dairy + Plants)',
                    title: '🥚 Eggetarian',
                    badge: 'Eggs + Dairy + Pulses (No Meat)',
                    desc: 'Whole eggs, omelettes, fresh paneer, dahi, milk, chana sattu, and dal (strictly no chicken or fish).',
                  },
                  {
                    value: 'Vegetarian (Paneer/Dahi/Milk/Whey)',
                    title: '🧀 100% Pure Vegetarian',
                    badge: 'Paneer, Curd, Sattu, Dal & Soya',
                    desc: 'No eggs, no meat. High protein engineered from fresh paneer, Greek curd, soya chunks, sattu, and whey.',
                  },
                ].map((opt) => {
                  const isSelected = workoutForm.dietaryPreference === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => {
                        setWorkoutForm({ ...workoutForm, dietaryPreference: opt.value });
                        setInteractiveStep(4); // Auto-advance!
                      }}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-main, rgba(255, 255, 255, 0.02))',
                        border: '2px solid',
                        borderColor: isSelected ? 'var(--brand-primary, #6366f1)' : 'var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {opt.title}
                        </div>
                        {isSelected && <CheckCircle2 size={18} style={{ color: 'var(--brand-primary, #6366f1)' }} />}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--brand-primary, #6366f1)', marginBottom: '3px' }}>
                        {opt.badge}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {opt.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setInteractiveStep(4)}
                  className="btn btn-primary"
                  style={{ padding: '9px 24px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Next Question</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              STEP 4: BUDGET & PERSONAL STATS (Final Question 4 of 4)
              ------------------------------------------------------------------- */}
          {!generatingWorkout && interactiveStep === 4 && (
            <div
              className="glass-card"
              style={{
                padding: '28px 24px',
                borderRadius: '16px',
                background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setInteractiveStep(3)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem' }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Question <span style={{ color: 'var(--brand-primary, #6366f1)' }}>4 of 4</span>
                </div>
              </div>

              {/* Progress Bar (100%) */}
              <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '999px', marginBottom: '22px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '999px' }} />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  Daily Food Budget &amp; Quick Stats
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  We ensure your grocery plan stays affordable and calculated accurately for your weight.
                </p>
              </div>

              <form onSubmit={handleGenerateWorkout} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* 1. Daily Grocery Budget Selector */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Select Your Daily Food Budget:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      {
                        tier: 'student',
                        badge: '🎓 Student Saver',
                        cost: '₹100–150 / day',
                        desc: 'Eggs, Sattu, Soya, Peanut Butter',
                      },
                      {
                        tier: 'moderate',
                        badge: '⚖️ Balanced',
                        cost: '₹150–250 / day',
                        desc: 'Paneer, Chicken, Curd, Fruits',
                      },
                      {
                        tier: 'premium',
                        badge: '👑 Premium',
                        cost: '₹250+ / day',
                        desc: 'Whey Isolate, Chicken, Nuts',
                      },
                    ].map((b) => {
                      const isSel = workoutForm.budgetTier === b.tier;
                      return (
                        <button
                          key={b.tier}
                          type="button"
                          onClick={() => setWorkoutForm({ ...workoutForm, budgetTier: b.tier, dailyBudget: b.cost })}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '10px',
                            background: isSel ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-main, rgba(255, 255, 255, 0.02))',
                            border: '2px solid',
                            borderColor: isSel ? 'var(--brand-primary, #6366f1)' : 'var(--border-subtle)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isSel ? 'var(--brand-primary, #6366f1)' : 'var(--text-primary)' }}>
                            {b.badge}
                          </div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isSel ? '#10b981' : 'var(--text-muted)', margin: '3px 0' }}>
                            {b.cost}
                          </div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: 1.25 }}>
                            {b.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Personal Metrics (Weight, Age, Location) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    background: 'var(--bg-main, rgba(0, 0, 0, 0.02))',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Body Weight (kg)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ fontSize: '0.8rem', height: '36px' }}
                      value={workoutForm.bodyWeight}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, bodyWeight: e.target.value })}
                      placeholder="e.g. 72"
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Age
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ fontSize: '0.8rem', height: '36px' }}
                      value={workoutForm.age}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, age: e.target.value })}
                      placeholder="e.g. 24"
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Gender
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.8rem', height: '36px' }}
                      value={workoutForm.gender}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Athlete">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Gym Setup
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.8rem', height: '36px' }}
                      value={workoutForm.trainingLocation}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, trainingLocation: e.target.value })}
                    >
                      <option value="Full Commercial Gym">Full Commercial Gym</option>
                      <option value="Home Gym (Dumbbells)">Home Gym (Dumbbells)</option>
                      <option value="Calisthenics Only">Calisthenics &amp; Bodyweight</option>
                    </select>
                  </div>
                </div>

                {/* Optional Injury Notes */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                    Any injury or special dietary note? (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.78rem', height: '34px' }}
                    placeholder="e.g. Mild lower back sensitivity, avoid heavy deadlifts"
                    value={workoutForm.healthNotes}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, healthNotes: e.target.value })}
                  />
                </div>

                {/* Big Action Button */}
                <button
                  type="submit"
                  disabled={generatingWorkout}
                  className="btn btn-primary"
                  style={{
                    padding: '13px',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                    marginTop: '6px',
                  }}
                >
                  <Sparkles size={18} />
                  <span>Generate My Personalized AI Blueprint</span>
                </button>
              </form>
            </div>
          )}

          {/* -------------------------------------------------------------------
              STEP 5: REVEALED BLUEPRINT & ACTION HUB (Target KPIs, Sync & Chat)
              ------------------------------------------------------------------- */}
          {!generatingWorkout && interactiveStep === 5 && workoutResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Success Celebration Banner */}
              <div
                className="glass-card"
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.08))',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: '0 6px 24px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px' }}>
                    <CheckCircle2 size={16} />
                    <span>Blueprint Generated Successfully</span>
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    Your Custom Plan is Ready, {workoutForm.name || 'Athlete'}!
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Targeted for <strong>{workoutForm.goal}</strong> • {workoutForm.daysPerWeek} Days/Week • {workoutForm.dailyBudget}
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSyncBlueprintToTracker()}
                    disabled={syncingTracker}
                    className="btn btn-primary"
                    style={{
                      padding: '9px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    {syncingTracker ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        <span>Syncing Targets...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        <span>Sync Targets &amp; Open Tracker</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('blueprint')}
                    className="btn btn-secondary"
                    style={{ padding: '9px 16px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Layers size={14} />
                    <span>View 7-Day Routine</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInteractiveStep(0)}
                    className="btn btn-secondary"
                    style={{ padding: '9px 12px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Change goals or restart consultation"
                  >
                    <RotateCcw size={14} />
                    <span>Restart</span>
                  </button>
                </div>
              </div>

              {/* 4 Crisp Key Target KPI Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                {/* Calories */}
                <div
                  className="glass-card"
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daily Calories</span>
                    <Flame size={16} style={{ color: '#ef4444' }} />
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {targetKpis.calories} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>kcal</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                    Calculated for your weight
                  </div>
                </div>

                {/* Protein */}
                <div
                  className="glass-card"
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Protein Goal</span>
                    <Dumbbell size={16} style={{ color: '#3b82f6' }} />
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {targetKpis.protein} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>g / day</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 600, marginTop: '2px' }}>
                    Optimal muscle recovery
                  </div>
                </div>

                {/* Water */}
                <div
                  className="glass-card"
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daily Water</span>
                    <Utensils size={16} style={{ color: '#06b6d4' }} />
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {targetKpis.water}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: 600, marginTop: '2px' }}>
                    Hydration &amp; digestion
                  </div>
                </div>

                {/* Budget */}
                <div
                  className="glass-card"
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Budget</span>
                    <Wallet size={16} style={{ color: '#f59e0b' }} />
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {targetKpis.cost}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600, marginTop: '2px' }}>
                    Indian grocery economics
                  </div>
                </div>
              </div>

              {/* Inline Conversational AI Coach Follow-Up Chat */}
              <div
                className="glass-card"
                style={{
                  borderRadius: '16px',
                  background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={18} style={{ color: 'var(--brand-primary, #6366f1)' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Have questions about this plan? Ask your AI Coach
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Real-time guidance
                  </span>
                </div>

                {/* Chat Log */}
                <div
                  style={{
                    padding: '18px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {chatMessages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          alignSelf: isUser ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                        }}
                      >
                        {!isUser && (
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            AI
                          </div>
                        )}

                        <div
                          style={{
                            background: isUser ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--bg-main, rgba(255, 255, 255, 0.04))',
                            border: '1px solid',
                            borderColor: isUser ? 'transparent' : 'var(--border-subtle)',
                            borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                            padding: '10px 14px',
                            color: isUser ? '#ffffff' : 'var(--text-primary)',
                            fontSize: '0.82rem',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {isUser ? msg.text : renderChatMessageText(msg.text)}
                        </div>
                      </div>
                    );
                  })}

                  {chatLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      <RefreshCw size={13} className="spin" style={{ color: 'var(--brand-primary)' }} />
                      <span>FeeOrbit AI Coach is thinking...</span>
                    </div>
                  )}
                </div>

                {/* Quick Suggestion Chips */}
                <div
                  style={{
                    padding: '8px 16px',
                    background: 'var(--bg-main, rgba(0, 0, 0, 0.02))',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setChatInput('Can I swap eggs with paneer on Tuesdays and Thursdays?');
                    }}
                    style={{
                      background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.05))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Swap eggs with paneer? 🧀
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChatInput('What is the best pocket-friendly pre-workout meal?');
                    }}
                    style={{
                      background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.05))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Best pre-workout snack? 🍌
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChatInput('What should I do if I miss a workout day?');
                    }}
                    style={{
                      background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.05))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    What if I miss a day? 🗓️
                  </button>
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleChatSubmit}
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Ask your AI coach anything about this routine or nutrition..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{
                      flex: 1,
                      height: '38px',
                      padding: '0 12px',
                      fontSize: '0.82rem',
                      background: 'var(--bg-main, rgba(255, 255, 255, 0.04))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="btn btn-primary"
                    style={{ height: '38px', padding: '0 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Send</span>
                    <Send size={13} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: DAILY DIET & WORKOUT TRACKER
          ========================================================================= */}
      {activeTab === 'tracker' && (
        <SmartDietTracker onPlanApplied={() => setActiveTab('coach')} />
      )}

      {/* =========================================================================
          TAB 3: MY BLUEPRINT (7-Day Workout & Diet Plan Viewer)
          ========================================================================= */}
      {activeTab === 'blueprint' && (
        <div>
          {workoutResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={18} style={{ color: 'var(--brand-primary, #6366f1)' }} />
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Personalized 7-Day Athletic Routine
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Customized for {workoutForm.name || 'athlete'} • {workoutForm.goal} • {workoutForm.dailyBudget}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('coach')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem' }}
                  >
                    ← AI Coach Hub
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSyncBlueprintToTracker()}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.74rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    Sync to Daily Tracker →
                  </button>
                </div>
              </div>

              <AIBlueprintViewer
                content={workoutResult}
                athleteName={workoutForm.name}
                goal={workoutForm.goal}
                budgetTier={workoutForm.budgetTier}
                dailyBudget={workoutForm.dailyBudget}
                onSyncToTracker={handleSyncBlueprintToTracker}
                syncingTracker={syncingTracker}
                trackerSynced={trackerSynced}
                onOpenTracker={() => setActiveTab('tracker')}
              />
            </div>
          ) : (
            <div
              className="glass-card"
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                borderRadius: '16px',
                background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.85))',
                border: '1px solid var(--border-subtle)',
                maxWidth: '560px',
                margin: '20px auto',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-primary, #6366f1)',
                  margin: '0 auto 16px auto',
                }}
              >
                <Layers size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                No Blueprint Generated Yet
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                Take 1 minute with the FeeOrbit AI Coach to answer 4 quick questions. We will engineer your 7-day workout split, macro targets, and pocket-friendly Indian diet.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('coach');
                  setInteractiveStep(0);
                }}
                className="btn btn-primary"
                style={{ padding: '10px 22px', fontSize: '0.84rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={15} />
                <span>Start 1-Minute AI Assessment</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: GYM BUSINESS GROWTH ADVISOR (Admin/Staff Only)
          ========================================================================= */}
      {activeTab === 'business' && user?.role !== 'member' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            className="glass-card"
            style={{
              padding: '24px',
              background: 'var(--bg-card-solid, rgba(15, 21, 37, 0.8))',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Autonomous Gym Business Diagnostic
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  FeeOrbit AI scans your MongoDB database members, renewals, and revenue trends to pinpoint growth opportunities.
                </p>
              </div>

              <button
                onClick={handleGenerateBusiness}
                disabled={generatingBusiness}
                className="btn btn-primary"
                style={{
                  padding: '9px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                }}
              >
                {generatingBusiness ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <RefreshCw size={14} className="spin" /> Scanning Gym Pulse...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Zap size={14} /> Run Real-Time AI Business Audit
                  </span>
                )}
              </button>
            </div>

            {businessError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#fca5a5', marginBottom: '3px' }}>
                    Business Audit Error
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                    {businessError}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateBusiness}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', height: '28px', padding: '0 10px' }}
                  >
                    <RefreshCw size={12} /> Try Again
                  </button>
                </div>
              </div>
            )}

            {businessResult?.stats && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ background: 'var(--bg-main, rgba(255, 255, 255, 0.03))', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Enrolled</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{businessResult.stats.totalMembers}</div>
                </div>
                <div style={{ background: 'var(--bg-main, rgba(255, 255, 255, 0.03))', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active Members</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>{businessResult.stats.activeMembers}</div>
                </div>
                <div style={{ background: 'var(--bg-main, rgba(255, 255, 255, 0.03))', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expiring in 7 Days</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>{businessResult.stats.expiringThisWeek}</div>
                </div>
                <div style={{ background: 'var(--bg-main, rgba(255, 255, 255, 0.03))', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Monthly Collected</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#818cf8' }}>
                    {businessResult.stats.currency} {businessResult.stats.monthlyRevenue.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {generatingBusiness ? (
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <RefreshCw size={26} className="spin" style={{ color: 'var(--brand-primary)', marginBottom: '10px' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Analyzing metrics &amp; drafting high-conversion renewal scripts...
                </div>
              </div>
            ) : businessResult?.insights ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <button
                    onClick={() => copyToClipboard(businessResult.insights, setCopiedBusiness)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', height: '26px' }}
                  >
                    {copiedBusiness ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                    <span>{copiedBusiness ? 'Copied' : 'Copy Report'}</span>
                  </button>
                </div>
                <div
                  style={{
                    background: 'var(--bg-card-solid, rgba(7, 10, 19, 0.7))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '18px',
                    fontSize: '0.84rem',
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {businessResult.insights}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <TrendingUp size={34} style={{ color: 'var(--brand-primary, #6366f1)', marginBottom: '8px', opacity: 0.6 }} />
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Click &quot;Run Real-Time AI Business Audit&quot; to generate immediate tactical advice
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
