---
name: production-ui-design
description: Design principles, layout blueprints, micro-interactions, and aesthetics for production-grade EdTech and SaaS web applications. Synthesized from Linear, Stripe, Apple HIG, Google, and Meta design systems. Use when designing, auditing, or refactoring user interfaces to ensure world-class polish and prevent AI design slop.
---

# Production UI Design & Engineering Skill (Tech Giant Standard)

This skill provides concrete blueprints, Tailwind token architectures, and quality checklists synthesized from **Linear, Stripe, Apple HIG, Google web.dev, and Meta**. Use this skill whenever building, refactoring, or auditing UI components across JEE Mock Lab.

---

## 1. Design Token Cheat Sheet (Tailwind CSS)

### A. Surfaces & Backgrounds
* **App Canvas**: `bg-slate-50` or `bg-[#f8fafc]` (subtle slate ground that makes white cards pop)
* **Foreground Container**: `bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.03)]`
* **Subtle Panel / Inset**: `bg-slate-50/70 border border-slate-200/60 rounded-xl`
* **Muted Element / Button Base**: `bg-slate-100 hover:bg-slate-200/80 text-slate-700`

### B. Typography & Scale
* **Display / Hero**: `text-3xl md:text-5xl font-black tracking-tight text-slate-900`
* **Section Heading**: `text-xl md:text-2xl font-extrabold tracking-tight text-slate-900`
* **Card Title**: `text-base font-bold text-slate-900 tracking-tight`
* **Body**: `text-sm text-slate-600 leading-relaxed`
* **Micro-Label / Tag**: `text-[10px] md:text-[11px] font-black uppercase tracking-wider text-slate-500`
* **Numeric / Metric**: `font-mono tabular-nums font-bold tracking-tight text-slate-900`

### C. Status & Functional Accents
* **Positive / Correct**: `text-emerald-700 bg-emerald-50 border-emerald-200/80` (Indicator: `bg-emerald-500`)
* **Negative / Penalty**: `text-rose-700 bg-rose-50 border-rose-200/80` (Indicator: `bg-rose-500`)
* **Warning / Time Critical**: `text-amber-700 bg-amber-50 border-amber-200/80` (Indicator: `bg-amber-500`)
* **Review / Flagged**: `text-purple-700 bg-purple-50 border-purple-200/80` (Indicator: `bg-purple-600`)
* **NTA Candidate Navy**: `bg-[#1a3a5f] text-white border-blue-900`

---

## 2. Component Blueprints

### Blueprint A: Linear-Style Segmented Pill Switcher
When building multi-tab views or slide switchers, never use unstyled buttons or clumsy tabs:
```tsx
import { motion } from 'motion/react';

interface SegmentOption {
  id: string;
  label: string;
  badge?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export const SegmentedControl = ({
  options,
  activeId,
  onChange,
}: {
  options: SegmentOption[];
  activeId: string;
  onChange: (id: string) => void;
}) => {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/70 rounded-xl">
      {options.map((option) => {
        const isActive = activeId === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer ${
              isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activePill"
                className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/60"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon size={13} className={isActive ? 'text-blue-600' : 'text-slate-400'} />}
              {option.label}
              {option.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                  {option.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};
```

---

### Blueprint B: Stripe-Grade Metric Breakdown Ribbon
Avoid vague floating metric cards. Build structured, audit-ready ribbons:
```tsx
import { Target, CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react';

export const ScoreBreakdownRibbon = ({
  correct,
  incorrect,
  unattempted,
  netScore,
  maxMarks = 300,
}: {
  correct: number;
  incorrect: number;
  unattempted: number;
  netScore: number;
  maxMarks?: number;
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
      {/* Net Score */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Net Score</span>
          <Target size={14} className="text-blue-600" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black font-mono tabular-nums text-slate-900">{netScore}</span>
          <span className="text-xs font-semibold text-slate-400">/{maxMarks}</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Official NTA +4 / -1 rules</p>
      </div>

      {/* Correct */}
      <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Correct (+4)</span>
          <CheckCircle2 size={14} className="text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono tabular-nums text-emerald-600">{correct}</span>
          <span className="text-xs font-bold text-emerald-600">+{correct * 4} pts</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Questions answered correctly</p>
      </div>

      {/* Incorrect */}
      <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Penalty (-1)</span>
          <AlertCircle size={14} className="text-rose-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono tabular-nums text-rose-600">{incorrect}</span>
          <span className="text-xs font-bold text-rose-600">-{incorrect * 1} pts</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Negative marks deducted</p>
      </div>

      {/* Unattempted */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Unattempted (0)</span>
          <MinusCircle size={14} className="text-slate-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono tabular-nums text-slate-600">{unattempted}</span>
          <span className="text-xs font-semibold text-slate-400">0 pts</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Zero penalty incurred</p>
      </div>
    </div>
  );
};
```

---

## 3. The Tech Giant Quality Checklist (Audit Before Merging)

Before finalizing any frontend task, verify against this 6-point checklist:

- [ ] **No Emojis as UI Icons**: Every icon is a Lucide SVG with consistent size (13–16px) and stroke weight (1.75–2.0px).
- [ ] **Zero AI Wireframe Slop**: No floating generic white cards without structured hierarchy; uses hairline borders (`border-slate-200/80`) and subtle background elevations (`bg-slate-50`).
- [ ] **Tabular Figures & Accurate Data**: All timers, scorecards, percentages, and question numbers apply `font-mono tabular-nums`.
- [ ] **Spring Micro-Interactions**: Active states include `active:scale-[0.98]` and smooth transitions. Sliding indicators use Framer Motion springs (`stiffness: 450, damping: 35`).
- [ ] **Domain Math & Colors**: All formulas render via `<MarkdownMath />`. Colors precisely map to NTA candidate evaluation protocol (Green = evaluated, Red = not answered, Purple = review, Purple+Green = review & evaluated, Grey = unvisited).
- [ ] **Accessibility & Contrast**: All text conforms to WCAG AA contrast (Slate-900/Slate-700 on light backgrounds), with explicit keyboard focus rings.
