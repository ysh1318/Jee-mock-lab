# JEE Mock Lab — Project Guidelines & UI Architecture

## 1. UI/UX Standards (Mandatory Tech Giant Benchmarks)
Every frontend component in this repository must strictly adhere to the standards outlined in [`.agents/rules/ui-design-standards.md`](./.agents/rules/ui-design-standards.md) and [`.agents/skills/production-ui-design/SKILL.md`](./.agents/skills/production-ui-design/SKILL.md):
- **Zero AI Slop**: Strict ban on emoji-as-icon patterns, fake URL bars, and generic floating card templates.
- **Linear / Stripe SaaS Benchmarks**: Hairline borders (`border-slate-200/80`), subtle diffused shadows, letter-tracking discipline (`tracking-tight` on headers, `tracking-wider` on micro-badges), and Framer Motion spring-physics segmented controls (`layoutId="activePill"`).
- **Domain Fidelity**: Exact NTA candidate colors, Section B integer virtual keypads, and KaTeX mathematical rendering via `<MarkdownMath />`.
- **Financial-Grade Data Presentation**: `font-mono tabular-nums` for all scores, timers, percentiles, and transparent audit breakdowns.

## 2. Core Architecture Overview
- **Framework**: React 19 + TypeScript + Tailwind CSS + Framer Motion (`motion/react`).
- **Server**: Express + Vite SSR development bridge (`server.ts`).
- **Diagram Engine**: Gemini 2.5 Flash bounding box detection (`diagramBox: [ymin, xmin, ymax, xmax]`) + Client-side HTML5 Canvas Retina 2.0x cropper (`src/utils/diagramCropper.ts`).
- **Scoring System**: Standard NTA JEE Main (+4 for correct, -1 for incorrect, 0 for unattempted) + Allen percentile calibration curve.
