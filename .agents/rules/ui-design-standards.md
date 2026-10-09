---
trigger: always_on
description: Production-grade UI/UX design standards and frontend engineering rules synthesized from Google, Meta, Apple HIG, Linear, and Stripe.
---

# Production-Grade UI/UX Design Standards (Tech Giant Benchmark)

This document establishes the mandatory design rules for all frontend engineering across JEE Mock Lab. Synthesized from the engineering benchmarks of **Linear, Stripe, Apple HIG, Google (Material/web.dev), and Meta**, every component, page, and feature created or modified must strictly adhere to these standards.

---

## 1. Zero AI Slop Policy (Absolute Ban)

LLMs by default output repetitive, generic, and unpolished design artifacts. The following are strictly prohibited:

### ❌ Strict Prohibitions
1. **Never use emojis as icons**:
   - 🚫 Do NOT use `🖥️`, `⚡`, `📊`, `📖`, `🎯`, `🎉`, `🔥`, `🚀`, `💡`, `✨` inside buttons, cards, headers, or metric boxes.
   - ✅ Always use optical vector SVG icons from `lucide-react` with matched stroke widths and sizes (e.g., `<Target size={14} className="text-indigo-600" strokeWidth={2} />`).
2. **Never use fake browser chrome or OS gimmicks**:
   - 🚫 Do NOT render fake macOS traffic lights (garish red/yellow/green dots) or fake URL bars (`protocol://fake-address-path`).
   - ✅ When showing previews or mocks, use authentic product frames, genuine candidate headers, or clean hairline border shells.
3. **Never build floating wireframe card grids**:
   - 🚫 Do NOT wrap every single feature in an isolated white box floating in empty space with excessive padding.
   - ✅ Build structured, cohesive layouts: dense informational ribbons, segmented pill navigation, data-dense comparison rows, and subtle tonal background layers.
4. **Never write generic marketing fluff**:
   - 🚫 Do NOT write filler copy like "Supercharge your learning with cutting-edge AI power!".
   - ✅ Use domain-accurate, precise technical copy: "Standard NTA +4 / -1 Scoring Scheme", "Attempt 5 of 10 in Section B", "0% Server CPU • 2.0x Retina Crop".

---

## 2. Tech Giant Engineering Benchmarks

### A. Linear Design Philosophy (Clarity, Density, Speed)
* **Zero Visual Fluff**: Every pixel must communicate state, value, or affordance. Avoid decorative gradients that don't convey meaning.
* **Surface Layering**: Establish strict visual hierarchy via background elevation:
  * Canvas/Shell: `bg-slate-50` or `bg-[#f8fafc]`
  * Raised Surfaces: `bg-white` with hairline border `border border-slate-200/80`
  * Active/Muted Elements: `bg-slate-100` or `bg-slate-100/70`
* **Segmented Controls**: Always use fluid pill switchers with `p-1 bg-slate-100/90 rounded-xl` and Framer Motion spring layout animations (`layoutId="activeIndicator"`, `transition={{ type: "spring", stiffness: 450, damping: 35 }}`).
* **High Information Density**: Compact vertical rhythm without feeling cramped. Default to `px-3 py-2` or `px-4 py-2.5` on controls.

### B. Stripe Dashboard Standards (Precision, Trust, Auditability)
* **Numeric Presentation**: All scores, percentages, timers, and statistics MUST use `font-mono tabular-nums`.
* **Explicit Audit Traces**: Never show ambiguous metrics. Always show the underlying formula or breakdown (e.g. `Correct: 12 (+48 marks)`, `Incorrect: 4 (-4 marks)`, `Net Score: 44/300`).
* **Micro-Badges**: Status tags must use `text-[10px]` or `text-[11px]`, `font-bold tracking-wider uppercase px-2 py-0.5 rounded-md`.
* **Hairline Separators**: Use 1px hairline borders (`border-slate-200/70` or `border-slate-100`). Never use 2px+ thick borders unless depicting a keyboard focus state.

### C. Apple Human Interface Guidelines (Depth, Fluidity, Content-First)
* **Content is the Hero**: Exam questions, formulas, and performance data must stand out; navigation and frames should be de-emphasized.
* **Ambient Multi-Layer Shadows**: Never use harsh single-drop shadows. Use diffused multi-layer elevations:
  * Subtle card: `shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.03)]`
  * Elevated modal: `shadow-[0_20px_50px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]`
* **Spring-Physics Micro-Interactions**: Interactive elements must provide immediate physical feedback:
  * Clickable cards/buttons: `active:scale-[0.98] transition-transform duration-100 cursor-pointer`
  * Smooth state switches: zero abrupt pop-ins; animate layout changes with Framer Motion.

### D. Google web.dev & Material Standards (Performance, A11y, Contrast)
* **Contrast Compliance**: Minimum 4.5:1 WCAG AA contrast ratio for all text against backgrounds:
  * Primary text: `#0f172a` (Slate-900)
  * Secondary text: `#334155` (Slate-700) or `#475569` (Slate-600)
  * Muted captions: `#64748b` (Slate-500)
* **Focus Visible**: All interactive controls must support clear, keyboard-accessible focus rings (`focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1`).
* **Zero Cumulative Layout Shift (CLS)**: Skeletons and placeholder containers must match the exact dimensions of loaded content.
* **Optical Stroke Balance**: Pair 14px–16px icons with `strokeWidth={1.75}` or `strokeWidth={2}` to match the weight of adjacent text.

### E. Meta / Modern React Architecture (Atomic, State-Driven, Resilient)
* **Component Encapsulation**: Keep UI components pure and defensive; handle empty states, loading states, and edge cases gracefully.
* **Progressive Disclosure**: Show high-signal summary metrics first, with expandable audit trails and deep-dive analytics accessible on demand.

---

## 3. JEE / NTA Domain Accuracy (Mandatory Protocol)

* **Official 5-Color Candidate Evaluation Protocol**:
  1. `Answered`: Green (`bg-emerald-600 text-white`) — Evaluated for score.
  2. `Not Answered`: Red (`bg-rose-600 text-white`) — Visited but skipped (0 marks).
  3. `Marked for Review`: Purple (`bg-purple-600 text-white`) — Visited, flagged, unanswered (0 marks).
  4. `Answered & Marked for Review`: Purple with small green dot — **Evaluated by NTA**.
  5. `Not Visited`: Grey (`bg-slate-200 text-slate-600`) — Unvisited (0 marks).
* **Mathematical Rendering**:
  * ALL formulas, equations, and scientific units must be rendered through KaTeX using `<MarkdownMath text={...} />`.
  * Never display raw LaTeX syntax (`\frac{a}{b}`, `$$...$$`, `\int`) to the student.
* **High-Res Diagrams**:
  * All question figures must be displayed in responsive, framed containers with zoom/retina clarity.
* **Authentic Keypads**:
  * Section B (Numerical Questions) must feature on-screen integer/decimal virtual keypads mirroring NTA TCS iON terminals.
