'use client';

import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Printer,
  Download,
  Utensils,
  Dumbbell,
  ShieldCheck,
  Flame,
  Wallet,
  Sparkles,
  Layers,
  Award,
  Scale,
} from 'lucide-react';

/**
 * Parses raw text into inline formatted JSX (bold, highlighted values, code, etc.)
 */
function formatInlineText(text) {
  if (!text) return null;

  // Split by bold (**bold**)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      // Highlight macros, currencies, or metrics
      const isMetric =
        /(kcal|protein|carbs|fats|₹|\b\d+g\b|\brpe\b|\bsets?\b|\breps?\b)/i.test(inner);

      return (
        <strong
          key={index}
          style={{
            color: isMetric ? 'var(--brand-primary, #6366f1)' : 'var(--text-primary)',
            fontWeight: 700,
            background: isMetric ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            padding: isMetric ? '1px 5px' : '0',
            borderRadius: '4px',
          }}
        >
          {inner}
        </strong>
      );
    }
    return part;
  });
}

/**
 * Formats a block of markdown lines into rich JSX
 */
function MarkdownBlockRenderer({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let tableRows = [];
  let inTable = false;

  const flushTable = (key) => {
    if (tableRows.length > 0) {
      // Find separator row (contains ---)
      let separatorIdx = tableRows.findIndex((row) =>
        row.some((cell) => cell.includes('---'))
      );

      let headerRow = [];
      let dataRows = [];

      if (separatorIdx > 0) {
        headerRow = tableRows[0];
        dataRows = tableRows.slice(separatorIdx + 1);
      } else {
        headerRow = tableRows[0];
        dataRows = tableRows.slice(1);
      }

      elements.push(
        <div
          key={`table-${key}`}
          className="ai-blueprint-table-wrapper"
        >
          <table
            className="ai-blueprint-table"
          >
            <thead>
              <tr style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#e0e7ff' }}>
                {headerRow.map((cell, cIdx) => (
                  <th
                    key={cIdx}
                    style={{
                      padding: '9px 12px',
                      borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatInlineText(cell.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    background: rIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  {row.map((cell, cIdx) => {
                    const cellText = cell.trim();
                    const isNumeric = /(?:₹|\d+g|\d+kcal|\d+m?l)/i.test(cellText);
                    return (
                      <td
                        key={cIdx}
                        style={{
                          padding: '8px 12px',
                          color: isNumeric ? '#38bdf8' : 'var(--text-primary)',
                          fontWeight: isNumeric ? 600 : 400,
                        }}
                      >
                        {formatInlineText(cellText)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table detection: line with | and at least one other |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      const cells = line
        .trim()
        .slice(1, -1)
        .split('|');
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // Horizontal Rule
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(
        <hr
          key={`hr-${i}`}
          style={{
            border: 'none',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.35), transparent)',
            margin: '18px 0',
          }}
        />
      );
      continue;
    }

    // H1
    if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '16px 0 8px 0',
            letterSpacing: '-0.02em',
          }}
        >
          {formatInlineText(line.replace('# ', ''))}
        </h1>
      );
      continue;
    }

    // H2 (Major Section)
    if (line.startsWith('## ')) {
      elements.push(
        <div
          key={`h2-${i}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1.05rem',
            fontWeight: 800,
            color: 'var(--brand-primary, #6366f1)',
            margin: '20px 0 10px 0',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span>{formatInlineText(line.replace('## ', ''))}</span>
        </div>
      );
      continue;
    }

    // H3 (Sub-section / Daily Split / Meal Name)
    if (line.startsWith('### ')) {
      const headingContent = line.replace('### ', '');
      const isMealOrDay = /(?:meal|day\s*\d|warmup|split)/i.test(headingContent);

      elements.push(
        <div
          key={`h3-${i}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: isMealOrDay ? 'var(--brand-primary, #0284c7)' : 'var(--text-primary)',
            margin: '14px 0 8px 0',
            background: isMealOrDay ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
            padding: isMealOrDay ? '4px 12px' : '0',
            borderRadius: '6px',
            border: isMealOrDay ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <span>{formatInlineText(headingContent)}</span>
        </div>
      );
      continue;
    }

    // H4
    if (line.startsWith('#### ')) {
      elements.push(
        <h4
          key={`h4-${i}`}
          style={{
            fontSize: '0.84rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '10px 0 4px 0',
          }}
        >
          {formatInlineText(line.replace('#### ', ''))}
        </h4>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <div
          key={`quote-${i}`}
          style={{
            background: 'var(--bg-main, rgba(99, 102, 241, 0.08))',
            borderLeft: '3px solid var(--brand-primary, #6366f1)',
            padding: '10px 14px',
            borderRadius: '0 6px 6px 0',
            margin: '10px 0',
            fontSize: '0.84rem',
            color: 'var(--text-primary)',
            lineHeight: 1.55,
          }}
        >
          {formatInlineText(line.replace('> ', ''))}
        </div>
      );
      continue;
    }

    // Bullet points / numbered lists
    if (/^\s*([*-]|\d+\.)\s+/.test(line)) {
      const match = line.match(/^\s*([*-]|\d+\.)\s+(.*)/);
      const isNumbered = /\d+\./.test(match[1]);
      const content = match[2];

      elements.push(
        <div
          key={`li-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.84rem',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            margin: '4px 0',
            paddingLeft: line.startsWith('   ') || line.startsWith('\t') ? '20px' : '4px',
          }}
        >
          <span
            style={{
              color: 'var(--brand-primary, #6366f1)',
              fontWeight: 700,
              flexShrink: 0,
              fontSize: isNumbered ? '0.78rem' : '0.9rem',
              marginTop: isNumbered ? '1px' : '-1px',
            }}
          >
            {isNumbered ? match[1] : '•'}
          </span>
          <span style={{ flex: 1 }}>{formatInlineText(content)}</span>
        </div>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={`space-${i}`} style={{ height: '8px' }} />);
    } else {
      elements.push(
        <p
          key={`p-${i}`}
          style={{
            fontSize: '0.84rem',
            lineHeight: 1.65,
            color: 'var(--text-primary)',
            margin: '4px 0',
          }}
        >
          {formatInlineText(line)}
        </p>
      );
    }
  }

  // Flush any open table
  if (inTable) {
    flushTable(lines.length);
  }

  return <div>{elements}</div>;
}

export default function AIBlueprintViewer({
  content,
  athleteName = 'Athlete',
  goal = '',
  budgetTier = 'moderate',
  dailyBudget = '',
  onSyncToTracker,
  syncingTracker = false,
  trackerSynced = false,
  onOpenTracker,
}) {
  const [activeTab, setActiveTab] = useState('workout'); // 'workout' | 'diet' | 'recovery' | 'all'
  const [copied, setCopied] = useState(false);

  // Rock-Solid Sequential Section Parser
  // Splits by document progression into 4 major sections:
  // Section 1: Overview & Targets
  // Section 2: Diet & Grocery Blueprint (contains all meals, costs, and grocery list)
  // Section 3: Workout Split (contains all 7 days of training, exercises, cues)
  // Section 4: Recovery, Hydration & Supplements
  const parsedSections = useMemo(() => {
    if (!content) return { overview: '', diet: '', workout: '', recovery: '', all: '' };

    const lines = content.split('\n');
    let currentSection = 'overview';
    const sectionBuffers = {
      overview: [],
      diet: [],
      workout: [],
      recovery: [],
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();

      // Check for Major Section Header Transitions
      // A major section starts with ## (or # or **Section) and has clear section markers
      const isHeader = /^#{1,2}\s+/.test(trimmed) || /^(\*\*|__)?(?:section\s*[1-4]|##\s*[1-4])/i.test(trimmed);

      if (isHeader) {
        // Test Section 4: Recovery & Supplements
        if (
          /(?:^#{1,2}\s*4\b|recovery|hydration|supplement|sleep\s*protocol)/i.test(lower) &&
          !/(?:meal|food|diet|calor|carb|protein|split|exercise|day\s*\d)/i.test(lower)
        ) {
          currentSection = 'recovery';
        }
        // Test Section 3: Workout Split
        else if (
          /(?:^#{1,2}\s*3\b|workout\s*split|precision\s*workout|7-day|training\s*split|complete\s*\d+-day)/i.test(lower) &&
          !/(?:meal|snack|fuel|breakfast|lunch|dinner|diet|grocery|nutrition)/i.test(lower)
        ) {
          currentSection = 'workout';
        }
        // Test Section 2: Diet & Grocery Blueprint
        else if (
          /(?:^#{1,2}\s*2\b|nutrition|diet|grocery|budget-calibrated)/i.test(lower) &&
          !/(?:workout\s*split|precision\s*workout|exercise\s*table|training\s*split)/i.test(lower)
        ) {
          currentSection = 'diet';
        }
        // Test Section 1: Overview & Targets
        else if (
          /(?:^#{1,2}\s*1\b|strategic\s*overview|macro\s*target|caloric\s*target)/i.test(lower) &&
          !/(?:meal\s*\d|day\s*\d)/i.test(lower)
        ) {
          currentSection = 'overview';
        }
      }

      sectionBuffers[currentSection].push(line);
    }

    const overviewText = sectionBuffers.overview.join('\n').trim();
    const dietText = sectionBuffers.diet.join('\n').trim();
    const workoutText = sectionBuffers.workout.join('\n').trim();
    const recoveryText = sectionBuffers.recovery.join('\n').trim();

    return {
      overview: overviewText,
      diet: dietText,
      workout: workoutText,
      recovery: recoveryText,
      all: content,
    };
  }, [content]);

  // Robust KPI extraction specifically from overview/macro target section
  // Always ensures daily calories (>1000 kcal) are extracted, never a single meal's calories
  const kpis = useMemo(() => {
    if (!content) return null;

    const sourceText = parsedSections.overview || content;

    // 1. Daily Caloric Target (e.g. 2,400–2,600 kcal)
    let cal = null;
    const calMatch =
      sourceText.match(/(?:daily\s*calor(?:ies|ic)|calor(?:ies|ic)\s*target|tdee|intake)[^\n]*?(\b[1-4][,\.]?\s*\d{3}(?:\s*[-–—to]\s*[1-4][,\.]?\s*\d{3})?\s*kcal)/i) ||
      sourceText.match(/(\b[1-4][,\.]?\s*\d{3}(?:\s*[-–—to]\s*[1-4][,\.]?\s*\d{3})?\s*kcal)/i) ||
      content.match(/(?:daily\s*calor(?:ies|ic)|calor(?:ies|ic)\s*target|tdee)[^\n]*?(\b[1-4][,\.]?\s*\d{3}(?:\s*[-–—to]\s*[1-4][,\.]?\s*\d{3})?\s*kcal)/i);
    cal = calMatch ? calMatch[1] : '2,400–2,600 kcal';

    // 2. Daily Protein Target (e.g. 140g - 160g)
    let protein = null;
    const proteinMatch =
      sourceText.match(/(?:daily\s*protein|protein\s*target)[^\n]*?(\b\d{2,3}(?:\s*[-–—to]\s*\d{2,3})?\s*g\b)/i) ||
      sourceText.match(/(?:protein)[^\n]*?(\b\d{2,3}(?:\s*[-–—to]\s*\d{2,3})?\s*g\b)/i);
    protein = proteinMatch ? proteinMatch[1] : '140–160g';

    // 3. Daily Carbs Target
    let carbs = null;
    const carbsMatch =
      sourceText.match(/(?:daily\s*carb|carb(?:ohydrate)?s?\s*target)[^\n]*?(\b\d{2,3}(?:\s*[-–—to]\s*\d{2,3})?\s*g\b)/i) ||
      sourceText.match(/(?:carb(?:ohydrate)?s?)[^\n]*?(\b\d{2,3}(?:\s*[-–—to]\s*\d{2,3})?\s*g\b)/i);
    carbs = carbsMatch ? carbsMatch[1] : '260–290g';

    // 4. Daily Healthy Fats Target
    let fats = null;
    const fatsMatch =
      sourceText.match(/(?:daily\s*fat|fat[s]?\s*target)[^\n]*?(\b\d{2,3}(?:\s*[-–—to]\s*\d{2,3})?\s*g\b)/i) ||
      sourceText.match(/(?:fat[s]?)[^\n]*?(\b\d{2,3}(?:\s*[-–—to]\s*\d{2,3})?\s*g\b)/i);
    fats = fatsMatch ? fatsMatch[1] : '55–65g';

    // 5. Estimated Daily Food Cost Target
    let cost = null;
    const costMatch =
      sourceText.match(/(?:daily\s*(?:food\s*)?cost|spend|budget)[^\n]*?(₹\s*\d+(?:\s*[-–—to]\s*₹?\s*\d+)?(?:\s*\/\s*day)?)/i) ||
      content.match(/(?:daily\s*(?:food\s*)?cost|spend|budget)[^\n]*?(₹\s*\d+(?:\s*[-–—to]\s*₹?\s*\d+)?(?:\s*\/\s*day)?)/i);
    cost = costMatch
      ? costMatch[1]
      : dailyBudget || (budgetTier === 'student' ? '₹100–150 / day' : budgetTier === 'premium' ? '₹500+ / day' : '₹250–350 / day');

    return {
      calories: cal,
      protein,
      carbs,
      fats,
      cost,
    };
  }, [content, parsedSections, dailyBudget, budgetTier]);

  // Selected content to render
  const contentToRender = useMemo(() => {
    if (activeTab === 'workout') return parsedSections.workout || content;
    if (activeTab === 'diet') return parsedSections.diet || content;
    if (activeTab === 'recovery') return parsedSections.recovery || content;
    return parsedSections.all;
  }, [activeTab, parsedSections, content]);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${athleteName.replace(/\s+/g, '_')}_FeeOrbit_Blueprint.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!content) return null;

  return (
    <div className="printable-routine" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* 1. Header Action Bar: Plan Meta on Left + Quick Action Buttons on Right */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'var(--bg-card-solid, rgba(15, 23, 42, 0.65))',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#e2e8f0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {athleteName}&apos;s Blueprint
          </span>
          {goal && (
            <span
              style={{
                fontSize: '0.64rem',
                color: '#818cf8',
                background: 'rgba(99, 102, 241, 0.12)',
                padding: '1px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              {goal}
            </span>
          )}
        </div>

        {/* Compact Quick Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {onSyncToTracker && (
            <button
              type="button"
              onClick={() => onSyncToTracker(kpis)}
              disabled={syncingTracker}
              className="btn btn-primary btn-sm"
              style={{
                fontSize: '0.68rem',
                height: '26px',
                padding: '0 10px',
                background: trackerSynced ? 'linear-gradient(135deg, #10b981, #059669)' : undefined,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Apply calculated target calories, protein & daily budget into your Daily Tracker"
            >
              {syncingTracker ? (
                <span className="spin" style={{ display: 'inline-block' }}>⚡</span>
              ) : trackerSynced ? (
                <Check size={12} />
              ) : (
                <Sparkles size={12} />
              )}
              <span>{trackerSynced ? 'Synced to Tracker' : 'Sync to Tracker'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.68rem', height: '26px', padding: '0 8px' }}
            title="Copy entire blueprint to clipboard"
          >
            {copied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.68rem', height: '26px', padding: '0 8px' }}
            title="Download Plan as TXT"
          >
            <Download size={12} />
            <span>TXT</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.68rem', height: '26px', padding: '0 8px' }}
            title="Print Routine / Save PDF"
          >
            <Printer size={12} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {trackerSynced && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            fontSize: '0.76rem',
            color: '#34d399',
            fontWeight: 700,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={14} />
            <span>Target Goals Synced: {kpis.calories} • {kpis.protein} Protein • {kpis.cost}</span>
          </div>
          {onOpenTracker && (
            <button
              type="button"
              onClick={onOpenTracker}
              style={{
                background: 'none',
                border: 'none',
                color: '#10b981',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '0.74rem',
                textDecoration: 'underline',
              }}
            >
              Open Live Tracker →
            </button>
          )}
        </div>
      )}

      {/* 2. Clean Segmented Tabs (Workout Split is Primary) */}
      <div
        className="no-print ai-blueprint-nav-tabs"
        style={{
          background: 'var(--bg-card-solid, rgba(10, 15, 30, 0.8))',
          padding: '5px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('workout')}
          style={{
            background: activeTab === 'workout' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
            color: activeTab === 'workout' ? '#ffffff' : 'var(--text-primary)',
            border: 'none',
            padding: '8px 6px',
            borderRadius: '7px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'workout' ? '0 2px 10px rgba(99, 102, 241, 0.35)' : 'none',
          }}
        >
          <Dumbbell size={14} />
          <span>Workout Split</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diet')}
          style={{
            background: activeTab === 'diet' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
            color: activeTab === 'diet' ? '#ffffff' : 'var(--text-primary)',
            border: 'none',
            padding: '8px 6px',
            borderRadius: '7px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'diet' ? '0 2px 10px rgba(16, 185, 129, 0.35)' : 'none',
          }}
        >
          <Utensils size={14} />
          <span>Diet & Grocery</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recovery')}
          style={{
            background: activeTab === 'recovery' ? 'linear-gradient(135deg, #38bdf8, #0284c7)' : 'transparent',
            color: activeTab === 'recovery' ? '#ffffff' : 'var(--text-primary)',
            border: 'none',
            padding: '8px 6px',
            borderRadius: '7px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'recovery' ? '0 2px 10px rgba(56, 189, 248, 0.35)' : 'none',
          }}
        >
          <ShieldCheck size={14} />
          <span>Recovery</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          style={{
            background: activeTab === 'all' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
            color: activeTab === 'all' ? '#ffffff' : 'var(--text-primary)',
            border: 'none',
            padding: '8px 6px',
            borderRadius: '7px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'all' ? '0 2px 10px rgba(99, 102, 241, 0.35)' : 'none',
          }}
        >
          <Layers size={14} />
          <span>Full Plan</span>
        </button>
      </div>

      {/* 3. Clean 3-Pillar Highlight Summary (Spacious & No Clutter) */}
      <div className="ai-blueprint-kpi-grid">
        {/* Pillar 1: Calories */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              flexShrink: 0,
            }}
          >
            <Flame size={18} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.66rem', color: '#ef4444', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
              Daily Calories
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {kpis.calories}
            </div>
          </div>
        </div>

        {/* Pillar 2: Protein & Macro Split */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.66rem', color: '#0284c7', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
              Target Protein
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {kpis.protein}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                ({kpis.carbs} C • {kpis.fats} F)
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Grocery Budget */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0,
            }}
          >
            <Wallet size={18} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.66rem', color: '#059669', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
              Daily Budget
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {kpis.cost}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Rich Markdown Formatted Content Area */}
      <div
        style={{
          background: 'var(--bg-card-solid, rgba(7, 10, 20, 0.75))',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          maxHeight: '680px',
          overflowY: 'auto',
          boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.2)',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <MarkdownBlockRenderer text={contentToRender} />
      </div>
    </div>
  );
}
