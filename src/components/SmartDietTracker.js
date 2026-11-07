'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Utensils,
  Dumbbell,
  Flame,
  Wallet,
  Plus,
  Trash2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Search,
  Zap,
  Droplets,
  ChevronDown,
  ChevronUp,
  X,
  Sliders,
  Sun,
  Coffee,
  Moon,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGym } from '../context/GymContext';

// Curated categorized quick-add items to keep UI clean and organized (no visual khichdi)
const FOOD_CATALOG = {
  protein: [
    { name: 'Whole Boiled Egg (2 pcs)', calories: 148, protein: 12.6, carbs: 0.8, fats: 10.0, cost: 14, icon: '🥚' },
    { name: 'Soya Chunks (50g raw)', calories: 172, protein: 26.0, carbs: 16.5, fats: 0.5, cost: 12, icon: '🌱' },
    { name: 'Fresh Paneer (100g)', calories: 265, protein: 18.3, carbs: 4.2, fats: 20.8, cost: 40, icon: '🧀' },
    { name: 'Chicken Breast (150g)', calories: 220, protein: 42.0, carbs: 0.0, fats: 4.5, cost: 45, icon: '🍗' },
    { name: 'Chana Sattu Drink (40g)', calories: 164, protein: 10.2, carbs: 25.5, fats: 2.1, cost: 12, icon: '🥤' },
    { name: 'Whey Protein (1 Scoop)', calories: 125, protein: 24.5, carbs: 2.2, fats: 1.5, cost: 75, icon: '⚡' },
  ],
  staple: [
    { name: 'Whole Wheat Roti (2 pcs)', calories: 190, protein: 6.4, carbs: 39.0, fats: 1.2, cost: 8, icon: '🫓' },
    { name: 'Thick Dal (1 Bowl)', calories: 155, protein: 8.5, carbs: 23.0, fats: 3.2, cost: 15, icon: '🍲' },
    { name: 'Steamed Rice (1 Cup)', calories: 195, protein: 4.2, carbs: 43.0, fats: 0.6, cost: 10, icon: '🍚' },
    { name: 'Fresh Curd / Dahi (150g)', calories: 120, protein: 6.2, carbs: 7.5, fats: 6.0, cost: 15, icon: '🥣' },
    { name: 'Moong Sprouts (100g)', calories: 105, protein: 9.0, carbs: 18.0, fats: 0.6, cost: 12, icon: '🥗' },
  ],
  snacks: [
    { name: 'Banana (1 medium)', calories: 105, protein: 1.3, carbs: 27.0, fats: 0.3, cost: 6, icon: '🍌' },
    { name: 'Roasted Chana (50g)', calories: 185, protein: 10.8, carbs: 29.0, fats: 2.8, cost: 15, icon: '🥜' },
    { name: 'Milk Chai with Sugar (1 cup)', calories: 90, protein: 2.2, carbs: 14.0, fats: 2.8, cost: 10, icon: '☕' },
    { name: 'Fried Samosa (1 pc)', calories: 260, protein: 3.8, carbs: 32.0, fats: 14.5, cost: 15, icon: '🥟' },
  ],
  workouts: [
    { activity: 'Strength / Gym Weight Training', durationMinutes: 45, caloriesBurned: 320, intensity: 'moderate', icon: '🏋️‍♂️' },
    { activity: 'Treadmill Jogging / Run', durationMinutes: 25, caloriesBurned: 260, intensity: 'high', icon: '🏃‍♂️' },
    { activity: 'Brisk Walk (Zone-2 Fat Burn)', durationMinutes: 30, caloriesBurned: 150, intensity: 'low', icon: '🚶‍♂️' },
    { activity: 'Stationary Cycling', durationMinutes: 30, caloriesBurned: 250, intensity: 'moderate', icon: '🚴‍♂️' },
    { activity: 'Jump Rope / Skipping', durationMinutes: 15, caloriesBurned: 180, intensity: 'high', icon: '⚡' },
  ],
};

export default function SmartDietTracker({ onPlanApplied }) {
  const { user, token } = useAuth();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [loading, setLoading] = useState(true);
  const [logData, setLogData] = useState(null);
  const [adviceData, setAdviceData] = useState(null);

  // Clean UI toggles & state
  const [activeCatalogTab, setActiveCatalogTab] = useState('protein'); // 'protein' | 'staple' | 'snacks' | 'workouts'
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');

  // Natural Language input
  const [naturalFoodInput, setNaturalFoodInput] = useState('');
  const [naturalLoading, setNaturalLoading] = useState(false);

  // Forms
  const [mealForm, setMealForm] = useState({
    name: '',
    mealType: 'breakfast',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    cost: '',
    portion: '1 serving',
  });

  const [workoutForm, setWorkoutForm] = useState({
    activity: '',
    durationMinutes: '30',
    caloriesBurned: '',
    intensity: 'moderate',
  });

  const [goalsForm, setGoalsForm] = useState({
    dailyBudget: '150',
    targetCalories: '2200',
    targetProtein: '130',
    targetCarbs: '250',
    targetFats: '60',
  });

  const [waterMl, setWaterMl] = useState(2000);

  // Fetch or init daily log
  const fetchLog = useCallback(async () => {
    setLoading(true);
    const localKey = `feeorbit_diet_log_${selectedDate}`;

    try {
      if (token) {
        const res = await fetch(`/api/ai/diet-log?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setLogData(data.data.log);
          setAdviceData(data.data.advice);
          setGoalsForm({
            dailyBudget: (data.data.log.dailyBudget || 150).toString(),
            targetCalories: (data.data.log.targetCalories || 2200).toString(),
            targetProtein: (data.data.log.targetProtein || 130).toString(),
            targetCarbs: (data.data.log.targetCarbs || 250).toString(),
            targetFats: (data.data.log.targetFats || 60).toString(),
          });
          if (data.data.log.waterMl) setWaterMl(data.data.log.waterMl);
          try {
            localStorage.setItem(localKey, JSON.stringify(data.data));
          } catch (e) {}
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend fetch failed, using local fallback:', err.message);
    }

    try {
      const saved = localStorage.getItem(localKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLogData(parsed.log || parsed);
        setAdviceData(parsed.advice || null);
        if (parsed.log?.waterMl) setWaterMl(parsed.log.waterMl);
      } else {
        const defaultLog = {
          date: selectedDate,
          dailyBudget: 150,
          targetCalories: 2200,
          targetProtein: 130,
          targetCarbs: 250,
          targetFats: 60,
          waterMl: 2500,
          meals: [],
          workouts: [],
        };
        setLogData(defaultLog);
      }
    } catch (e) {}
    setLoading(false);
  }, [selectedDate, token]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const meals = logData?.meals || [];
    const workouts = logData?.workouts || [];

    const dailyBudget = parseFloat(goalsForm.dailyBudget) || logData?.dailyBudget || 150;
    const targetCalories = parseFloat(goalsForm.targetCalories) || logData?.targetCalories || 2200;
    const targetProtein = parseFloat(goalsForm.targetProtein) || logData?.targetProtein || 130;
    const targetCarbs = parseFloat(goalsForm.targetCarbs) || logData?.targetCarbs || 250;
    const targetFats = parseFloat(goalsForm.targetFats) || logData?.targetFats || 60;

    const caloriesEaten = meals.reduce((acc, m) => acc + (parseFloat(m.calories) || 0), 0);
    const proteinEaten = meals.reduce((acc, m) => acc + (parseFloat(m.protein) || 0), 0);
    const carbsEaten = meals.reduce((acc, m) => acc + (parseFloat(m.carbs) || 0), 0);
    const fatsEaten = meals.reduce((acc, m) => acc + (parseFloat(m.fats) || 0), 0);
    const costSpent = meals.reduce((acc, m) => acc + (parseFloat(m.cost) || 0), 0);

    const caloriesBurned = workouts.reduce((acc, w) => acc + (parseFloat(w.caloriesBurned) || 0), 0);
    const totalWorkoutMins = workouts.reduce((acc, w) => acc + (parseFloat(w.durationMinutes) || 0), 0);

    const netCalories = caloriesEaten - caloriesBurned;
    const caloriesRemaining = Math.max(0, Math.round(targetCalories - netCalories));
    const proteinRemaining = Math.max(0, parseFloat((targetProtein - proteinEaten).toFixed(1)));
    const budgetRemaining = Math.max(0, Math.round(dailyBudget - costSpent));

    const proteinPercent = Math.min(100, Math.round((proteinEaten / targetProtein) * 100));
    const caloriePercent = Math.min(100, Math.round((netCalories / targetCalories) * 100));
    const budgetPercent = Math.min(100, Math.round((costSpent / dailyBudget) * 100));

    let isSurplus = false;
    let surplusKcal = 0;
    if (netCalories > targetCalories + 50) {
      isSurplus = true;
      surplusKcal = Math.round(netCalories - targetCalories);
    }

    return {
      dailyBudget,
      costSpent,
      budgetRemaining,
      budgetPercent,
      targetCalories,
      caloriesEaten,
      caloriesBurned,
      netCalories,
      caloriesRemaining,
      caloriePercent,
      targetProtein,
      proteinEaten: parseFloat(proteinEaten.toFixed(1)),
      proteinRemaining,
      proteinPercent,
      targetCarbs,
      carbsEaten: parseFloat(carbsEaten.toFixed(1)),
      targetFats,
      fatsEaten: parseFloat(fatsEaten.toFixed(1)),
      totalWorkoutMins,
      isSurplus,
      surplusKcal,
    };
  }, [logData, goalsForm]);

  // Log Meal
  const handleAddMeal = async (mealPayload) => {
    const payload = {
      date: selectedDate,
      ...mealPayload,
    };

    try {
      if (token) {
        const res = await fetch('/api/ai/diet-log/meal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setLogData(data.data.log);
          setAdviceData(data.data.advice);
          setShowAddMealModal(false);
          resetMealForm();
          return;
        }
      }
    } catch (err) {}

    // Local Fallback
    const fallbackMeal = {
      _id: `local_${Date.now()}`,
      name: payload.name,
      mealType: payload.mealType || selectedMealType,
      calories: parseFloat(payload.calories) || 150,
      protein: parseFloat(payload.protein) || 6,
      carbs: parseFloat(payload.carbs) || 20,
      fats: parseFloat(payload.fats) || 5,
      cost: parseFloat(payload.cost) || 15,
      portion: payload.portion || '1 serving',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setLogData((prev) => {
      const next = {
        ...prev,
        meals: [...(prev?.meals || []), fallbackMeal],
      };
      try {
        localStorage.setItem(`feeorbit_diet_log_${selectedDate}`, JSON.stringify({ log: next }));
      } catch (e) {}
      return next;
    });

    setShowAddMealModal(false);
    resetMealForm();
  };

  // Delete Meal
  const handleDeleteMeal = async (mealId) => {
    try {
      if (token) {
        const res = await fetch(`/api/ai/diet-log/meal/${mealId}?date=${selectedDate}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setLogData(data.data.log);
          setAdviceData(data.data.advice);
          return;
        }
      }
    } catch (e) {}

    setLogData((prev) => {
      const next = {
        ...prev,
        meals: (prev?.meals || []).filter((m) => m._id !== mealId),
      };
      try {
        localStorage.setItem(`feeorbit_diet_log_${selectedDate}`, JSON.stringify({ log: next }));
      } catch (err) {}
      return next;
    });
  };

  // Log Workout
  const handleAddWorkout = async (workoutPayload) => {
    const payload = {
      date: selectedDate,
      ...workoutPayload,
    };

    try {
      if (token) {
        const res = await fetch('/api/ai/diet-log/workout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setLogData(data.data.log);
          setAdviceData(data.data.advice);
          setShowAddWorkoutModal(false);
          resetWorkoutForm();
          return;
        }
      }
    } catch (err) {}

    const mins = parseInt(payload.durationMinutes, 10) || 30;
    const fallbackWorkout = {
      _id: `local_w_${Date.now()}`,
      activity: payload.activity,
      durationMinutes: mins,
      caloriesBurned: parseFloat(payload.caloriesBurned) || Math.round(mins * 7.5),
      intensity: payload.intensity || 'moderate',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setLogData((prev) => {
      const next = {
        ...prev,
        workouts: [...(prev?.workouts || []), fallbackWorkout],
      };
      try {
        localStorage.setItem(`feeorbit_diet_log_${selectedDate}`, JSON.stringify({ log: next }));
      } catch (e) {}
      return next;
    });

    setShowAddWorkoutModal(false);
    resetWorkoutForm();
  };

  // Delete Workout
  const handleDeleteWorkout = async (workoutId) => {
    try {
      if (token) {
        const res = await fetch(`/api/ai/diet-log/workout/${workoutId}?date=${selectedDate}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setLogData(data.data.log);
          setAdviceData(data.data.advice);
          return;
        }
      }
    } catch (e) {}

    setLogData((prev) => {
      const next = {
        ...prev,
        workouts: (prev?.workouts || []).filter((w) => w._id !== workoutId),
      };
      try {
        localStorage.setItem(`feeorbit_diet_log_${selectedDate}`, JSON.stringify({ log: next }));
      } catch (err) {}
      return next;
    });
  };

  // AI Natural Language Input
  const handleNaturalEstimate = async () => {
    if (!naturalFoodInput.trim()) return;
    setNaturalLoading(true);

    try {
      if (token) {
        const res = await fetch('/api/ai/analyze-food', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: naturalFoodInput }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          const item = data.data;
          await handleAddMeal({
            name: item.name,
            mealType: selectedMealType,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fats,
            cost: item.cost,
            portion: item.portion,
          });
          setNaturalFoodInput('');
          setNaturalLoading(false);
          return;
        }
      }
    } catch (e) {}

    // Fallback
    await handleAddMeal({
      name: naturalFoodInput,
      mealType: selectedMealType,
      calories: 210,
      protein: 8,
      carbs: 30,
      fats: 6,
      cost: 20,
    });
    setNaturalFoodInput('');
    setNaturalLoading(false);
  };

  const handleSaveGoals = async (e) => {
    if (e) e.preventDefault();
    try {
      if (token) {
        const res = await fetch('/api/ai/diet-log/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: selectedDate,
            dailyBudget: parseFloat(goalsForm.dailyBudget),
            targetCalories: parseFloat(goalsForm.targetCalories),
            targetProtein: parseFloat(goalsForm.targetProtein),
            targetCarbs: parseFloat(goalsForm.targetCarbs),
            targetFats: parseFloat(goalsForm.targetFats),
            waterMl,
          }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setLogData(data.data.log);
          setAdviceData(data.data.advice);
        }
      }
    } catch (err) {}
    setShowSettingsModal(false);
  };

  const handleAddWater = (ml) => {
    const next = Math.min(6000, waterMl + ml);
    setWaterMl(next);
    try {
      localStorage.setItem(`feeorbit_water_${selectedDate}`, next.toString());
    } catch (e) {}
  };

  const resetMealForm = () => {
    setMealForm({
      name: '',
      mealType: selectedMealType,
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
      cost: '',
      portion: '1 serving',
    });
  };

  const resetWorkoutForm = () => {
    setWorkoutForm({
      activity: '',
      durationMinutes: '30',
      caloriesBurned: '',
      intensity: 'moderate',
    });
  };

  // Grouped meals
  const mealSections = [
    { key: 'breakfast', label: 'Breakfast', icon: Sun, color: '#f59e0b', items: (logData?.meals || []).filter((m) => m.mealType === 'breakfast') },
    { key: 'lunch', label: 'Lunch', icon: Utensils, color: '#10b981', items: (logData?.meals || []).filter((m) => m.mealType === 'lunch') },
    { key: 'snack', label: 'Snacks & Fuel', icon: Coffee, color: '#f59e0b', items: (logData?.meals || []).filter((m) => m.mealType === 'snack') },
    { key: 'dinner', label: 'Dinner', icon: Moon, color: '#818cf8', items: (logData?.meals || []).filter((m) => m.mealType === 'dinner') },
  ];

  const workouts = logData?.workouts || [];

  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. TOP CONTROL BAR (Date, Edit Goal, Refresh) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.7))',
          padding: '12px 18px',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Utensils size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Daily Diet & Activity
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Clean tracking • Budget-matched
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Compact Date Picker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-input, rgba(0, 0, 0, 0.3))',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '4px 8px',
            }}
          >
            <Calendar size={13} style={{ color: 'var(--brand-primary, #6366f1)' }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.76rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                style={{
                  background: 'var(--brand-primary-light, rgba(99, 102, 241, 0.2))',
                  color: 'var(--brand-primary, #6366f1)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Today
              </button>
            )}
          </div>

          {/* Quick Edit Goal Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              background: 'var(--bg-input, rgba(0, 0, 0, 0.3))',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Sliders size={13} />
            <span>Target: ₹{metrics.dailyBudget}/day</span>
          </button>

          {onPlanApplied && (
            <button
              onClick={onPlanApplied}
              style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: 'var(--brand-primary, #6366f1)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title="Open AI Coach to calibrate calories & routine"
            >
              <Sparkles size={13} />
              <span>AI Coach</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. UNIFIED MACRO & CALORIE HERO STRIP (Zero Visual Khichdi!) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Metric 1: Calories Balance */}
        <div
          style={{
            background: 'var(--bg-card, rgba(15, 23, 42, 0.6))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: '14px',
            padding: '14px 16px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Net Calories
            </span>
            <Flame size={14} style={{ color: metrics.isSurplus ? '#ef4444' : '#6366f1' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {metrics.netCalories}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              / {metrics.targetCalories} kcal
            </span>
          </div>

          {/* Mini Clean Progress Bar */}
          <div style={{ height: '5px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', margin: '6px 0 4px' }}>
            <div
              style={{
                height: '100%',
                width: `${metrics.caloriePercent}%`,
                background: metrics.isSurplus ? '#ef4444' : 'linear-gradient(90deg, #6366f1, #0ea5e9)',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Eaten: {metrics.caloriesEaten}</span>
            <span style={{ color: metrics.isSurplus ? '#ef4444' : '#34d399', fontWeight: 700 }}>
              {metrics.isSurplus ? `+${metrics.surplusKcal} surplus` : `${metrics.caloriesRemaining} left`}
            </span>
          </div>
        </div>

        {/* Metric 2: Protein Recovery Goal */}
        <div
          style={{
            background: 'var(--bg-card, rgba(15, 23, 42, 0.6))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: '14px',
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Protein Target
            </span>
            <Zap size={14} style={{ color: '#818cf8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#818cf8' }}>
              {metrics.proteinEaten}g
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              / {metrics.targetProtein}g goal
            </span>
          </div>

          <div style={{ height: '5px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', margin: '6px 0 4px' }}>
            <div
              style={{
                height: '100%',
                width: `${metrics.proteinPercent}%`,
                background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{metrics.proteinPercent}% achieved</span>
            <span style={{ color: metrics.proteinRemaining > 0 ? '#f59e0b' : '#34d399', fontWeight: 700 }}>
              {metrics.proteinRemaining > 0 ? `${metrics.proteinRemaining}g needed` : 'Goal hit!'}
            </span>
          </div>
        </div>

        {/* Metric 3: Food Budget Spend */}
        <div
          style={{
            background: 'var(--bg-card, rgba(15, 23, 42, 0.6))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: '14px',
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Food Budget Spent
            </span>
            <Wallet size={14} style={{ color: '#f59e0b' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f59e0b' }}>
              ₹{metrics.costSpent}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              / ₹{metrics.dailyBudget} limit
            </span>
          </div>

          <div style={{ height: '5px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', margin: '6px 0 4px' }}>
            <div
              style={{
                height: '100%',
                width: `${metrics.budgetPercent}%`,
                background: metrics.budgetPercent > 90 ? '#ef4444' : 'linear-gradient(90deg, #10b981, #f59e0b)',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Spent: {metrics.budgetPercent}%</span>
            <span style={{ color: metrics.budgetRemaining > 0 ? '#34d399' : '#ef4444', fontWeight: 700 }}>
              {metrics.budgetRemaining > 0 ? `₹${metrics.budgetRemaining} left` : 'Exhausted'}
            </span>
          </div>
        </div>

        {/* Metric 4: Workout Burn & Hydration */}
        <div
          style={{
            background: 'var(--bg-card, rgba(15, 23, 42, 0.6))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Burn & Water
            </span>
            <button
              onClick={() => handleAddWater(250)}
              style={{
                background: 'rgba(6, 182, 212, 0.12)',
                color: '#06b6d4',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '2px 6px',
                borderRadius: '6px',
                fontSize: '0.66rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              +250ml 💧
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '4px 0' }}>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f87171' }}>
                -{metrics.caloriesBurned}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}> kcal</span>
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>
                {(waterMl / 1000).toFixed(1)}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>L water</span>
            </div>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Workout: <strong>{metrics.totalWorkoutMins} mins</strong> • Carbs: {metrics.carbsEaten}g
          </div>
        </div>
      </div>

      {/* 3. SLEEK AI COACH CAPSULE (1 Clean Line + Expandable Drawer) */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.05))',
          border: '1px solid rgba(99, 102, 241, 0.22)',
          borderRadius: '14px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={14} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {adviceData?.coachSummary?.english ||
                adviceData?.coachSummary?.hinglish ||
                (metrics.isSurplus
                  ? `⚠️ +${metrics.surplusKcal} kcal surplus: Offset this with a 25-minute brisk walk or keep dinner light on carbs.`
                  : metrics.proteinRemaining > 15
                  ? `You need ${metrics.proteinRemaining}g more protein today (₹${metrics.budgetRemaining} budget remaining): Add eggs, soya chunks, or sattu to your next meal.`
                  : `Great job! Your nutrition and daily food budget are perfectly balanced.`)}
            </div>
          </div>

          {metrics.proteinRemaining > 5 && (
            <button
              onClick={() => setShowAiSuggestions(!showAiSuggestions)}
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818cf8',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{showAiSuggestions ? 'Hide Suggestions' : '💡 View Smart Food Options'}</span>
              {showAiSuggestions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* Collapsible Smart Meal Options */}
        {showAiSuggestions && metrics.proteinRemaining > 5 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '8px',
              marginTop: '4px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Soya option */}
            <div
              style={{
                background: 'var(--bg-input, rgba(0, 0, 0, 0.3))',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  🌱 50g Soya Chunks
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  +26g Protein • ₹12 cost
                </div>
              </div>
              <button
                onClick={() =>
                  handleAddMeal({
                    name: 'Soya Chunks (50g raw)',
                    mealType: 'lunch',
                    calories: 172,
                    protein: 26,
                    carbs: 16.5,
                    fats: 0.5,
                    cost: 12,
                  })
                }
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>

            {/* Eggs option */}
            <div
              style={{
                background: 'var(--bg-input, rgba(0, 0, 0, 0.3))',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  🥚 3 Boiled Eggs
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  +19g Protein • ₹21 cost
                </div>
              </div>
              <button
                onClick={() =>
                  handleAddMeal({
                    name: 'Whole Boiled Egg (3 pcs)',
                    mealType: 'snack',
                    calories: 222,
                    protein: 19,
                    carbs: 1.2,
                    fats: 15,
                    cost: 21,
                  })
                }
                style={{
                  background: 'var(--brand-primary, #6366f1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>

            {/* Sattu option */}
            <div
              style={{
                background: 'var(--bg-input, rgba(0, 0, 0, 0.3))',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  🥤 Chana Sattu (45g)
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  +12g Protein • ₹14 cost
                </div>
              </div>
              <button
                onClick={() =>
                  handleAddMeal({
                    name: 'Chana Sattu Drink (40g powder)',
                    mealType: 'snack',
                    calories: 164,
                    protein: 10.2,
                    carbs: 25.5,
                    fats: 2.1,
                    cost: 12,
                  })
                }
                style={{
                  background: '#f59e0b',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. CLEAN COMMAND STRIP: SEARCH + LOG BUTTONS */}
      <div
        style={{
          background: 'var(--bg-card, rgba(15, 23, 42, 0.6))',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Smart AI Search Input */}
          <div
            style={{
              flex: 1,
              minWidth: '220px',
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-input, rgba(0, 0, 0, 0.3))',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '4px 10px',
              gap: '8px',
            }}
          >
            <Search size={14} style={{ color: 'var(--brand-primary, #6366f1)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder='Type what you ate or workout, e.g. "4 eggs & 2 roti", "100g paneer"...'
              value={naturalFoodInput}
              onChange={(e) => setNaturalFoodInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNaturalEstimate();
              }}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
              }}
            />
            <button
              onClick={handleNaturalEstimate}
              disabled={naturalLoading || !naturalFoodInput.trim()}
              style={{
                background: 'var(--brand-primary, #6366f1)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: naturalFoodInput.trim() ? 'pointer' : 'not-allowed',
                opacity: naturalFoodInput.trim() ? 1 : 0.6,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={11} />
              <span>{naturalLoading ? '...' : 'AI Log'}</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => {
                setSelectedMealType('breakfast');
                setShowAddMealModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Plus size={13} />
              <span>Log Food</span>
            </button>

            <button
              onClick={() => setShowAddWorkoutModal(true)}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Dumbbell size={13} />
              <span>Log Workout</span>
            </button>
          </div>
        </div>

        {/* Segmented Category Filter (Prevents 25-button clutter!) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'protein', label: '⚡ High Protein' },
              { id: 'staple', label: '🫓 Desi Staples' },
              { id: 'snacks', label: '🍎 Snacks' },
              { id: 'workouts', label: '🏋️ Workouts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCatalogTab(tab.id)}
                style={{
                  background: activeCatalogTab === tab.id ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.2))' : 'transparent',
                  color: activeCatalogTab === tab.id ? 'var(--brand-primary, #818cf8)' : 'var(--text-muted)',
                  border: activeCatalogTab === tab.id ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            1-click add to today's log
          </span>
        </div>

        {/* 4-6 Clean Filtered Quick Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {activeCatalogTab === 'workouts' ? (
            FOOD_CATALOG.workouts.map((w, idx) => (
              <button
                key={idx}
                onClick={() => handleAddWorkout(w)}
                style={{
                  background: 'var(--bg-input, rgba(0, 0, 0, 0.3))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span>{w.icon}</span>
                <span>{w.activity} ({w.durationMinutes}m)</span>
                <span style={{ color: '#f87171', fontWeight: 700 }}>-{w.caloriesBurned} kcal</span>
              </button>
            ))
          ) : (
            (FOOD_CATALOG[activeCatalogTab] || []).map((item, idx) => (
              <button
                key={idx}
                onClick={() =>
                  handleAddMeal({
                    name: item.name,
                    mealType: activeCatalogTab === 'protein' ? 'lunch' : activeCatalogTab === 'snacks' ? 'snack' : 'dinner',
                    calories: item.calories,
                    protein: item.protein,
                    carbs: item.carbs,
                    fats: item.fats,
                    cost: item.cost,
                  })
                }
                style={{
                  background: 'var(--bg-input, rgba(0, 0, 0, 0.3))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
                <span style={{ color: '#818cf8', fontWeight: 700 }}>₹{item.cost} • {item.protein}g P</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 5. CLEAN TIMELINE JOURNAL (NO HUGE EMPTY BOXES!) */}
      <div
        style={{
          background: 'var(--bg-card, rgba(15, 23, 42, 0.6))',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Today's Logged Items
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Total {logData?.meals?.length || 0} meals • {workouts.length} workouts
          </div>
        </div>

        {/* 4 Meal Sections (Compact & Clean) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mealSections.map((sec) => {
            const IconComponent = sec.icon;
            const secCalories = sec.items.reduce((acc, m) => acc + (m.calories || 0), 0);
            const secCost = sec.items.reduce((acc, m) => acc + (m.cost || 0), 0);

            return (
              <div
                key={sec.key}
                style={{
                  background: 'var(--bg-input, rgba(0, 0, 0, 0.25))',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.05))',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sec.items.length > 0 ? '8px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconComponent size={14} style={{ color: sec.color }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {sec.label}
                    </span>
                    {sec.items.length > 0 && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ({secCalories} kcal • ₹{secCost})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedMealType(sec.key);
                      setShowAddMealModal(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--brand-primary, #818cf8)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>

                {sec.items.length === 0 ? (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Nothing logged for {sec.label.toLowerCase()} yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sec.items.map((m) => (
                      <div
                        key={m._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 0',
                          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {m.name}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                            {m.portion || '1 serving'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 700 }}>
                            {m.protein}g P
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {m.calories} kcal
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>
                            ₹{m.cost}
                          </span>
                          <button
                            onClick={() => handleDeleteMeal(m._id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                            title="Remove"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Workouts Subsection */}
          {workouts.length > 0 && (
            <div
              style={{
                background: 'var(--bg-input, rgba(0, 0, 0, 0.25))',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.05))',
                borderRadius: '10px',
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Dumbbell size={14} style={{ color: '#6366f1' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Completed Workouts
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700 }}>
                    (-{metrics.caloriesBurned} kcal)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {workouts.map((w) => (
                  <div
                    key={w._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {w.activity}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        ({w.durationMinutes} mins)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700 }}>
                        -{w.caloriesBurned} kcal
                      </span>
                      <button
                        onClick={() => handleDeleteWorkout(w._id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: LOG MEAL */}
      {showAddMealModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card-solid, #0f1423)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '22px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Log Food / Meal
              </div>
              <button
                onClick={() => setShowAddMealModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddMeal(mealForm);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Food Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4 Boiled Eggs, 2 Rotis + Dal"
                  value={mealForm.name}
                  onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input, #0a0d18)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Meal Period
                  </label>
                  <select
                    value={mealForm.mealType}
                    onChange={(e) => setMealForm({ ...mealForm, mealType: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input, #0a0d18)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      marginTop: '4px',
                    }}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snack">Snack</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Auto if empty"
                    value={mealForm.cost}
                    onChange={(e) => setMealForm({ ...mealForm, cost: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input, #0a0d18)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      marginTop: '4px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Calories
                  </label>
                  <input
                    type="number"
                    placeholder="Auto"
                    value={mealForm.calories}
                    onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      marginTop: '3px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Protein
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Auto"
                    value={mealForm.protein}
                    onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      marginTop: '3px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Carbs
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Auto"
                    value={mealForm.carbs}
                    onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      marginTop: '3px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Fats
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Auto"
                    value={mealForm.fats}
                    onChange={(e) => setMealForm({ ...mealForm, fats: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      marginTop: '3px',
                    }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                💡 Leave calories/macros blank for automatic AI clinical calculation.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddMealModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--brand-primary, #6366f1)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG WORKOUT */}
      {showAddWorkoutModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card-solid, #0f1423)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '22px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Log Workout
              </div>
              <button
                onClick={() => setShowAddWorkoutModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddWorkout(workoutForm);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Activity Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest & Triceps, Treadmill 20m, Cycling"
                  value={workoutForm.activity}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, activity: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    required
                    value={workoutForm.durationMinutes}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, durationMinutes: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      marginTop: '4px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Calories Burned (kcal)
                  </label>
                  <input
                    type="number"
                    placeholder="Auto if empty"
                    value={workoutForm.caloriesBurned}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, caloriesBurned: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      marginTop: '4px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddWorkoutModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--brand-primary, #6366f1)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TARGET & BUDGET SETTINGS */}
      {showSettingsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card-solid, #0f1423)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '22px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Target Goals & Daily Budget
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveGoals} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Daily Food Budget (₹ INR)
                </label>
                <div style={{ display: 'flex', gap: '6px', margin: '4px 0 6px' }}>
                  {['100', '150', '250', '400'].map((tier) => (
                    <button
                      type="button"
                      key={tier}
                      onClick={() => setGoalsForm({ ...goalsForm, dailyBudget: tier })}
                      style={{
                        flex: 1,
                        background: goalsForm.dailyBudget === tier ? 'var(--brand-primary, #6366f1)' : 'var(--bg-input)',
                        color: goalsForm.dailyBudget === tier ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '4px 0',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ₹{tier}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={goalsForm.dailyBudget}
                  onChange={(e) => setGoalsForm({ ...goalsForm, dailyBudget: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Target Calories
                  </label>
                  <input
                    type="number"
                    value={goalsForm.targetCalories}
                    onChange={(e) => setGoalsForm({ ...goalsForm, targetCalories: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      marginTop: '4px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Target Protein (g)
                  </label>
                  <input
                    type="number"
                    value={goalsForm.targetProtein}
                    onChange={(e) => setGoalsForm({ ...goalsForm, targetProtein: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      marginTop: '4px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--brand-primary, #6366f1)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Goals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
