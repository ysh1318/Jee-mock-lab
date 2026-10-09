import React, { useState, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { UserProfile, TestState, Subject, Section } from "../types";
import { isAnswerCorrect } from "../utils/answerEvaluator";
import { 
  TrendingUp, Award, Target, Calendar, ArrowRight, Sparkles, 
  BarChart2, PlayCircle, Clock, CheckCircle2, XCircle, 
  Search, ArrowUpRight, Minus, FileText, Layers
} from "lucide-react";

interface ResultsPageProps {
  completedAttempts: Array<{
    id: string;
    testName: string;
    date: string;
    score: number;
    maxScore: number;
    testState: TestState;
  }>;
  userProfile: UserProfile;
  onSelectAttempt: (testState: TestState) => void;
  onSetStep: (step: "LANDING" | "UPLOAD" | "CBT" | "ANALYTICS" | "ADMIN" | "RESULTS" | "PREDICTOR" | "PRIVACY") => void;
}

/**
 * Standardized NTA / Allen / MathonGo JEE Main Percentile Calibrator
 * Normalizes any test's max score to the 300-mark JEE Main scale.
 */
export function calculateJeePercentile(score: number, maxScore: number = 300): number {
  if (!maxScore || maxScore <= 0) maxScore = 300;
  const normalized = (score / maxScore) * 300;

  if (normalized >= 250) return 99.9;
  if (normalized >= 200) return Number((99.0 + ((normalized - 200) / 50) * 0.9).toFixed(2));
  if (normalized >= 160) return Number((97.5 + ((normalized - 160) / 40) * 1.5).toFixed(2));
  if (normalized >= 120) return Number((93.0 + ((normalized - 120) / 40) * 4.5).toFixed(2));
  if (normalized >= 80)  return Number((82.0 + ((normalized - 80) / 40) * 11.0).toFixed(2));
  if (normalized >= 50)  return Number((65.0 + ((normalized - 50) / 30) * 17.0).toFixed(2));
  if (normalized >= 20)  return Number((40.0 + ((normalized - 20) / 30) * 25.0).toFixed(2));
  if (normalized > 0)    return Number((15.0 + (normalized / 20) * 25.0).toFixed(1));
  if (normalized === 0)  return 15.0;
  // Negative score penalty (scales between 1.0%ile and 14.9%ile)
  return Number(Math.max(1.0, 15.0 + (normalized / 30) * 14.0).toFixed(1));
}

export function ResultsPage({ completedAttempts, userProfile, onSelectAttempt, onSetStep }: ResultsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartMetric, setChartMetric] = useState<"percentile" | "accuracy" | "score">("percentile");

  // Compute stats based on real completed attempts
  // Note: completedAttempts has newest test at index 0.
  // attemptIndex is total - index so Attempt #1 is oldest and Attempt #N is newest.
  const displayData = useMemo(() => {
    const total = completedAttempts.length;
    return completedAttempts.map((attempt, index) => {
      const attemptIndex = total - index;
      const isLatest = index === 0;

      const qs = attempt.testState?.questions || [];
      const ur = attempt.testState?.userResponses || {};
      const totalQs = qs.length;
      
      let correct = 0;
      let incorrect = 0;
      let unattempted = 0;
      let totalTime = 0;

      const subjectBreakdown = {
        [Subject.PHYSICS]: { score: 0, correct: 0, incorrect: 0, unattempted: 0, total: 0 },
        [Subject.CHEMISTRY]: { score: 0, correct: 0, incorrect: 0, unattempted: 0, total: 0 },
        [Subject.MATHEMATICS]: { score: 0, correct: 0, incorrect: 0, unattempted: 0, total: 0 }
      };

      qs.forEach((q) => {
        const spent = attempt.testState?.timeSpent?.[q.id] || 0;
        totalTime += spent;

        const sub = q.subject;
        if (subjectBreakdown[sub]) {
          subjectBreakdown[sub].total++;
        }

        const userAns = ur[q.id];
        if (userAns && userAns.trim() !== "") {
          const isCorrect = isAnswerCorrect(userAns, q.correctAnswer, q.section);
          if (isCorrect) {
            correct++;
            if (subjectBreakdown[sub]) {
              subjectBreakdown[sub].correct++;
              subjectBreakdown[sub].score += 4;
            }
          } else {
            incorrect++;
            if (subjectBreakdown[sub]) {
              subjectBreakdown[sub].incorrect++;
              subjectBreakdown[sub].score -= 1;
            }
          }
        } else {
          unattempted++;
          if (subjectBreakdown[sub]) {
            subjectBreakdown[sub].unattempted++;
          }
        }
      });

      const accuracy = (correct + incorrect) > 0 
        ? Math.round((correct / (correct + incorrect)) * 100) 
        : 0;
      
      const isLegacy90 = qs.length === 90 || qs.some((q) => q.section === Section.B && q.questionNumber > 25);
      const effectiveMaxScore = isLegacy90 ? 300 : (attempt.maxScore || 300);
      const percentile = calculateJeePercentile(attempt.score, effectiveMaxScore);

      return {
        id: attempt.id,
        attemptIndex,
        isLatest,
        testName: attempt.testName || `JEE Mock Paper ${attemptIndex}`,
        date: attempt.date || "Recent Test",
        score: attempt.score,
        maxScore: effectiveMaxScore,
        correct,
        incorrect,
        unattempted,
        totalQs,
        totalTime,
        accuracy,
        percentile,
        subjectBreakdown,
        testState: attempt.testState
      };
    });
  }, [completedAttempts]);

  // Chronological array (oldest to newest: Attempt #1 -> Attempt #N) for trajectory charts
  const chronologicalData = useMemo(() => {
    return [...displayData].reverse();
  }, [displayData]);

  // Overall trajectory stats (comparing first attempt to latest attempt)
  const stats = useMemo(() => {
    if (chronologicalData.length === 0) {
      return {
        totalAttempts: 0,
        bestScore: 0,
        avgAccuracy: 0,
        firstAccuracy: 0,
        latestAccuracy: 0,
        accuracyDiff: 0,
        firstPercentile: 0,
        latestPercentile: 0,
        percentileDiff: 0,
        latestScore: 0,
        maxScore: 300
      };
    }

    const first = chronologicalData[0];
    const latest = chronologicalData[chronologicalData.length - 1];
    const accuracyDiff = latest.accuracy - first.accuracy;
    const percentileDiff = Number((latest.percentile - first.percentile).toFixed(1));
    const bestScore = Math.max(...chronologicalData.map(d => d.score));
    const avgAccuracy = Math.round(chronologicalData.reduce((acc, d) => acc + d.accuracy, 0) / chronologicalData.length);

    return {
      totalAttempts: chronologicalData.length,
      bestScore,
      avgAccuracy,
      firstAccuracy: first.accuracy,
      latestAccuracy: latest.accuracy,
      accuracyDiff,
      firstPercentile: first.percentile,
      latestPercentile: latest.percentile,
      percentileDiff,
      latestScore: latest.score,
      maxScore: latest.maxScore
    };
  }, [chronologicalData]);

  const targetDiff = useMemo(() => {
    const current = stats.latestPercentile;
    const target = userProfile.targetPercentile || 99.0;
    const diff = Number((target - current).toFixed(1));
    return {
      met: diff <= 0,
      value: Math.abs(diff)
    };
  }, [stats, userProfile]);

  const filteredAttempts = useMemo(() => {
    if (!searchTerm.trim()) return displayData;
    const lower = searchTerm.toLowerCase();
    return displayData.filter(d => 
      d.testName.toLowerCase().includes(lower) || 
      d.date.toLowerCase().includes(lower)
    );
  }, [displayData, searchTerm]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans relative" id="results_page_container">
      {/* Subtle Atmospheric Depth Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-gradient-to-b from-blue-100/40 via-indigo-50/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* ----------------- CLEAN MINIMALIST HEADER & METRICS ----------------- */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200/70 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Performance Dashboard
              </span>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-200/70 px-2.5 py-0.5 rounded-full">
                Target: {userProfile.targetPercentile || 99.0}%ile
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Mock Exam Results & Progression
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onSetStep("UPLOAD")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-xs transition flex items-center gap-2 shadow-[0_10px_25px_rgba(37,99,235,0.22)] hover:shadow-[0_14px_28px_rgba(37,99,235,0.32)] cursor-pointer active:scale-95"
            >
              <PlayCircle size={15} />
              <span>Launch Mock Test</span>
            </button>
          </div>
        </div>

        {/* 4-PILLAR STATS RIBBON (ELEVATED HIGH-CRAFT CARDS) */}
        {displayData.length > 0 && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CARD 1: TOTAL ATTEMPTS */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center shrink-0">
                      <Layers size={15} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attempts</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100/80">
                    CBT Tests
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-3">
                  {stats.totalAttempts} <span className="text-xs font-semibold text-slate-400 font-sans">Papers</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium block mt-2">
                  Completed CBT mocks
                </span>
              </div>

              {/* CARD 2: LATEST STANDING WITH PROGRESS TRACK */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80 flex items-center justify-center shrink-0">
                      <Award size={15} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Standing</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/80">
                    Allen Scale
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-heading tracking-tight mt-3">
                  {stats.latestPercentile}%ile
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>Goal: {userProfile.targetPercentile || 98.5}%ile</span>
                    <span className="font-bold text-indigo-600">{Math.round((stats.latestPercentile / (userProfile.targetPercentile || 98.5)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(5, (stats.latestPercentile / (userProfile.targetPercentile || 98.5)) * 100))}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* CARD 3: PEAK SCORE */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80 flex items-center justify-center shrink-0">
                      <Target size={15} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Peak Score</span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100/80">
                    / {stats.maxScore}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-3">
                  {stats.bestScore} <span className="text-xs font-semibold text-slate-400 font-sans">Marks</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium block mt-2">
                  Highest mock session marks
                </span>
              </div>

              {/* CARD 4: MEAN ACCURACY WITH COLORED METER */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center shrink-0">
                      <TrendingUp size={15} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/80">
                    Safe &gt;85%
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-heading tracking-tight mt-3">
                  {stats.avgAccuracy}%
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>Precision Quality</span>
                    <span className="font-bold text-emerald-700">
                      {stats.avgAccuracy >= 85 ? "Optimal" : stats.avgAccuracy >= 60 ? "Developing" : "Needs Review"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${stats.avgAccuracy >= 80 ? "bg-emerald-500" : stats.avgAccuracy >= 50 ? "bg-amber-500" : "bg-rose-500"}`} 
                      style={{ width: `${Math.max(5, stats.avgAccuracy)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* INTEGRATED ADMISSION COMPASS & PERFORMANCE DEBRIEF */}
            <div className="mt-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5 text-left">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Target Compass • {userProfile.targetPercentile || 98.5}%ile Benchmark
                  </span>
                </div>
                <h4 className="text-base font-extrabold font-heading text-white tracking-tight">
                  IIT Bombay & NIT Trichy CSE Eligibility Trajectory
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {stats.latestScore < 0 
                    ? "Your baseline test encountered negative marking penalties. In JEE Main, eliminating wrong guesses immediately recovers +10 to +25 marks. Attempt only high-confidence MCQs in Section A before numericals."
                    : stats.latestPercentile >= 98
                    ? "Exceptional standing! Maintain consistency across 180-minute mocks and focus on speed in Section B numerical calculations."
                    : "Solid benchmark established! To cross the 95%ile threshold, aim for ~160+ marks by maintaining >85% accuracy in Chemistry and Physics."}
                </p>
              </div>

              {/* Visual Milestones Pills */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                <div className="px-3.5 py-2 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/10 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Your Score</span>
                  <span className="text-sm font-extrabold font-heading text-white">{stats.latestScore}</span>
                </div>
                <div className="px-3.5 py-2 bg-indigo-500/20 backdrop-blur-xs rounded-2xl border border-indigo-400/30 text-center">
                  <span className="text-[9px] uppercase font-bold text-indigo-300 block tracking-wider">NIT Cutoff</span>
                  <span className="text-sm font-extrabold font-heading text-indigo-200">~160+</span>
                </div>
                <div className="px-3.5 py-2 bg-amber-500/20 backdrop-blur-xs rounded-2xl border border-amber-400/30 text-center">
                  <span className="text-[9px] uppercase font-bold text-amber-300 block tracking-wider">Tier-1 CSE</span>
                  <span className="text-sm font-extrabold font-heading text-amber-200">~210+</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ----------------- CORE DATA SECTION ----------------- */}
      {displayData.length === 0 ? (
        /* EMPTY STATE CARD */
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-2xs max-w-xl mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Award className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">No Mock Attempts Recorded Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1.5">
            Upload a coaching mock PDF or launch the benchmark test. Your trajectory, scores, and solutions will appear here.
          </p>
          <div className="mt-5">
            <button
              onClick={() => onSetStep("UPLOAD")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-98"
            >
              <span>Upload Mock Paper (PDF)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ----------------- PROGRESSION GRAPH & LEDGER ----------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: PROGRESSION CHART (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/70 rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-600" />
                    <span>Performance Trajectory</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Track your percentile, accuracy, and score evolution across CBT mock tests
                  </p>
                </div>

                {/* Linear-Style Segmented Metric Switcher */}
                <div className="inline-flex p-1 bg-slate-100/90 rounded-full border border-slate-200/60 text-xs font-semibold self-start sm:self-auto">
                  {[
                    { id: "percentile", label: "Percentile (%ile)" },
                    { id: "accuracy", label: "Accuracy (%)" },
                    { id: "score", label: "Scaled Score (/300)" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setChartMetric(tab.id as any)}
                      className={`relative px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer select-none ${
                        chartMetric === tab.id ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {chartMetric === tab.id && (
                        <motion.div
                          layoutId="chartMetricPill"
                          className="absolute inset-0 bg-white rounded-full shadow-2xs border border-slate-200/60"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DYNAMIC SVG CHART WITH Y-AXIS LABELS */}
              <div className="h-72 w-full bg-[#fafbfc] rounded-2xl relative p-4 sm:p-5 border border-slate-200/60 flex flex-col justify-between">
                <svg className="w-full h-full" viewBox="0 0 540 220" preserveAspectRatio="none">
                  {/* Horizontal Grid Lines with Dynamic Y-Axis Markers */}
                  {(chartMetric === "score" ? [
                    { label: "300", y: 30 },
                    { label: "225", y: 65 },
                    { label: "150", y: 100 },
                    { label: "75", y: 135 },
                    { label: "0", y: 170 },
                  ] : chartMetric === "percentile" ? [
                    { label: "100%ile", y: 30 },
                    { label: "75%ile", y: 65 },
                    { label: "50%ile", y: 100 },
                    { label: "25%ile", y: 135 },
                    { label: "0%ile", y: 170 },
                  ] : [
                    { label: "100%", y: 30 },
                    { label: "75%", y: 65 },
                    { label: "50%", y: 100 },
                    { label: "25%", y: 135 },
                    { label: "0%", y: 170 },
                  ]).map((grid) => (
                    <g key={grid.label}>
                      <text x="42" y={grid.y + 4} textAnchor="end" fill="#94a3b8" fontSize="10" fontWeight="600">
                        {grid.label}
                      </text>
                      <line x1="50" y1={grid.y} x2="520" y2={grid.y} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                    </g>
                  ))}

                  {/* Target Benchmark Reference Line */}
                  {(() => {
                    const targetPercentile = userProfile.targetPercentile || 99.0;
                    const targetY = chartMetric === "percentile"
                      ? Math.round(170 - (targetPercentile / 100) * 140)
                      : chartMetric === "accuracy"
                      ? Math.round(170 - (85 / 100) * 140)
                      : Math.round(170 - (200 / 300) * 140);

                    const targetLabel = chartMetric === "percentile"
                      ? `Goal: ${targetPercentile}%ile`
                      : chartMetric === "accuracy"
                      ? "85% Safe Target"
                      : "200+ Tier-1 Cutoff";

                    return (
                      <g>
                        <line x1="50" y1={targetY} x2="520" y2={targetY} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="1.25" opacity="0.85" />
                        <text x="518" y={targetY - 5} textAnchor="end" fill="#d97706" fontSize="9" fontWeight="bold">
                          {targetLabel}
                        </text>
                      </g>
                    );
                  })()}

                  {/* Gradient Area Definition */}
                  <defs>
                    <linearGradient id="areaGlowIndigo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="areaGlowSky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="areaGlowPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {chronologicalData.length > 1 ? (
                    (() => {
                      const count = chronologicalData.length;
                      const maxVal = chartMetric === "score" ? 300 : 100;
                      const points = chronologicalData.map((d, i) => {
                        const x = Math.round(65 + (i / Math.max(1, count - 1)) * 440);
                        const metricVal = chartMetric === "percentile"
                          ? d.percentile
                          : chartMetric === "accuracy"
                          ? d.accuracy
                          : Math.max(0, Math.round((d.score / (d.maxScore || 300)) * 300));

                        const y = Math.round(170 - (metricVal / maxVal) * 140);
                        return { x, y, metricVal, data: d };
                      });

                      const pathPoints = points.map(p => `${p.x},${p.y}`).join(" L ");
                      const areaPoints = `M ${points[0].x},170 L ${pathPoints} L ${points[points.length - 1].x},170 Z`;
                      const strokeColor = chartMetric === "percentile" ? "#4f46e5" : chartMetric === "accuracy" ? "#0284c7" : "#8b5cf6";
                      const fillAreaId = chartMetric === "percentile" ? "url(#areaGlowIndigo)" : chartMetric === "accuracy" ? "url(#areaGlowSky)" : "url(#areaGlowPurple)";

                      return (
                        <>
                          <path d={areaPoints} fill={fillAreaId} />
                          <path 
                            d={`M ${pathPoints}`} 
                            fill="none" 
                            stroke={strokeColor} 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                          />
                          {points.map((p, idx) => (
                            <g 
                              key={p.data.id} 
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredIndex(idx)}
                              onMouseLeave={() => setHoveredIndex(null)}
                            >
                              <circle 
                                cx={p.x} 
                                cy={p.y} 
                                r={hoveredIndex === idx ? "8" : "5.5"} 
                                fill="#ffffff" 
                                stroke={strokeColor} 
                                strokeWidth="3" 
                              />
                            </g>
                          ))}
                        </>
                      );
                    })()
                  ) : (
                    // Single Data Point Display with Target Projection
                    (() => {
                      const d = chronologicalData[0];
                      const maxVal = chartMetric === "score" ? 300 : 100;
                      const metricVal = chartMetric === "percentile"
                        ? d.percentile
                        : chartMetric === "accuracy"
                        ? d.accuracy
                        : Math.max(0, Math.round((d.score / (d.maxScore || 300)) * 300));
                      const y = Math.round(170 - (metricVal / maxVal) * 140);
                      const targetPercentile = userProfile.targetPercentile || 99.0;
                      const targetY = chartMetric === "percentile"
                        ? Math.round(170 - (targetPercentile / 100) * 140)
                        : chartMetric === "accuracy"
                        ? Math.round(170 - (85 / 100) * 140)
                        : Math.round(170 - (200 / 300) * 140);

                      return (
                        <g>
                          {/* Projected Growth Trajectory Curve */}
                          <path
                            d={`M 140,${y} Q 310,${Math.round((y + targetY) / 2)} 480,${targetY}`}
                            fill="none"
                            stroke="#4f46e5"
                            strokeWidth="2.5"
                            strokeDasharray="5 5"
                            opacity="0.35"
                          />
                          {/* Initial baseline marker */}
                          <circle cx="140" cy={y} r="8" fill="#4f46e5" stroke="#ffffff" strokeWidth="3.5" />
                          <text x="140" y={y - 14} textAnchor="middle" fill="#4f46e5" fontSize="11" fontWeight="bold">
                            {chartMetric === "percentile" ? `${d.percentile}%ile Baseline` : chartMetric === "accuracy" ? `${d.accuracy}% Acc` : `${d.score} Marks`}
                          </text>

                          {/* Target Projection Marker */}
                          <circle cx="480" cy={targetY} r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                          <text x="480" y={targetY - 12} textAnchor="end" fill="#d97706" fontSize="10" fontWeight="bold">
                            Projected Target
                          </text>
                        </g>
                      );
                    })()
                  )}
                </svg>

                {/* X-Axis Attempt Badges underneath points */}
                <div className="flex justify-between pl-12 pr-2 pt-1.5 border-t border-slate-200/70 text-[10px] text-slate-500">
                  {chronologicalData.map((d) => (
                    <div key={d.id} className="text-center truncate max-w-[100px]">
                      <span className="block text-slate-700 font-bold">Attempt #{d.attemptIndex}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {chartMetric === "percentile" ? `${d.percentile}%ile` : chartMetric === "accuracy" ? `${d.accuracy}% acc` : `${d.score} pts`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Hover Tooltip Overlay */}
                {hoveredIndex !== null && chronologicalData[hoveredIndex] && (
                  <div className="absolute top-3 right-4 bg-slate-900/95 backdrop-blur-md text-white text-[11px] p-3.5 rounded-2xl shadow-xl border border-slate-700 pointer-events-none z-20">
                    <p className="font-bold text-indigo-300 truncate max-w-[220px]">
                      {chronologicalData[hoveredIndex].testName}
                    </p>
                    <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-sans">
                      <span>Percentile: <strong className="text-amber-300 font-bold">{chronologicalData[hoveredIndex].percentile}%ile</strong></span>
                      <span>Accuracy: <strong className="text-emerald-400 font-bold">{chronologicalData[hoveredIndex].accuracy}%</strong></span>
                      <span>Raw Score: <strong className="text-white font-bold">{chronologicalData[hoveredIndex].score}/{chronologicalData[hoveredIndex].maxScore}</strong></span>
                      <span>Session: <strong className="text-slate-400 font-medium">{chronologicalData[hoveredIndex].date}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-500 mt-4 px-1 gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    chartMetric === "percentile" ? "bg-indigo-600" : chartMetric === "accuracy" ? "bg-sky-600" : "bg-purple-600"
                  }`} />
                  <span>
                    {chartMetric === "percentile" ? "Percentile Trajectory Curve (%ile)" :
                     chartMetric === "accuracy" ? "Accuracy Efficiency Curve (%)" : "Scaled Marks Progression (/300)"}
                  </span>
                </div>
                <div className="text-amber-800 bg-amber-50/90 px-3 py-1 rounded-full text-[11px] border border-amber-200/70 font-semibold">
                  {chartMetric === "percentile" ? `Target Goal: ${userProfile.targetPercentile || 99.0}%ile` :
                   chartMetric === "accuracy" ? "Safe Benchmark: 85%" : "Tier-1 Target: 200+ Marks"}
                </div>
              </div>
            </div>

            {/* COLUMN 2: MOCK ATTEMPTS LEDGER (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white border border-slate-200/70 rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="font-heading font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Mock Scores Ledger</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                        {displayData.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      Select any attempt to inspect question-by-question solutions
                    </p>
                  </div>

                  {/* Quick Search */}
                  {displayData.length > 2 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-400 w-28"
                      />
                    </div>
                  )}
                </div>

                {/* ATTEMPTS LIST SCROLLABLE FEED */}
                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {filteredAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-4 bg-[#fafbfc] hover:bg-white border border-slate-200/70 hover:border-blue-200/80 rounded-2xl transition-all duration-150 flex flex-col gap-3 shadow-2xs hover:shadow-md"
                    >
                      {/* Top Row: Attempt #, Date & Standing */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-bold px-2.5 py-0.5 bg-slate-200/70 text-slate-700 rounded-full text-[10px]">
                            Attempt #{attempt.attemptIndex}
                          </span>
                          {attempt.isLatest && (
                            <span className="font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200/60 text-[10px]">
                              Latest
                            </span>
                          )}
                          <span className="text-slate-400 font-medium text-[11px]">
                            {attempt.date}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50/90 border border-indigo-200/70 px-2.5 py-0.5 rounded-full font-heading">
                          {attempt.percentile}%ile
                        </span>
                      </div>

                      {/* Title & Score */}
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {attempt.testName}
                        </h4>
                        <span className="text-sm font-heading font-extrabold text-slate-900 shrink-0">
                          {attempt.score} <span className="text-xs text-slate-400 font-normal">/ {attempt.maxScore}</span>
                        </span>
                      </div>

                      {/* Concise Metric Strip */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 py-2.5 px-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs font-sans">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock size={12} className="text-slate-400" />
                            <span>{formatDuration(attempt.totalTime)}</span>
                          </span>
                          <span className="text-slate-200">|</span>
                          <span>Acc: <strong className="text-emerald-700 font-bold">{attempt.accuracy}%</strong></span>
                        </div>

                        {/* Subject Score Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            attempt.subjectBreakdown[Subject.PHYSICS].score < 0 
                              ? "bg-rose-50 text-rose-700 border-rose-200/80" 
                              : "bg-blue-50 text-blue-700 border-blue-200/80"
                          }`}>
                            P: {attempt.subjectBreakdown[Subject.PHYSICS].score}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            attempt.subjectBreakdown[Subject.CHEMISTRY].score < 0 
                              ? "bg-rose-50 text-rose-700 border-rose-200/80" 
                              : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                          }`}>
                            C: {attempt.subjectBreakdown[Subject.CHEMISTRY].score}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            attempt.subjectBreakdown[Subject.MATHEMATICS].score < 0 
                              ? "bg-rose-50 text-rose-700 border-rose-200/80" 
                              : "bg-purple-50 text-purple-700 border-purple-200/80"
                          }`}>
                            M: {attempt.subjectBreakdown[Subject.MATHEMATICS].score}
                          </span>
                        </div>
                      </div>

                      {/* Visual Stacked Question Distribution Bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-full transition-all" 
                          style={{ width: `${((attempt.correct) / Math.max(1, attempt.totalQs)) * 100}%` }} 
                          title={`${attempt.correct} Correct`} 
                        />
                        <div 
                          className="bg-rose-500 h-full transition-all" 
                          style={{ width: `${((attempt.incorrect) / Math.max(1, attempt.totalQs)) * 100}%` }} 
                          title={`${attempt.incorrect} Wrong`} 
                        />
                        <div 
                          className="bg-slate-200 h-full transition-all" 
                          style={{ width: `${((attempt.unattempted) / Math.max(1, attempt.totalQs)) * 100}%` }} 
                          title={`${attempt.unattempted} Skipped`} 
                        />
                      </div>

                      {/* Audit counts & CTA */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                          <span className="text-emerald-700 font-bold">{attempt.correct} Correct</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-rose-600 font-bold">{attempt.incorrect} Wrong</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">{attempt.unattempted} Skipped</span>
                        </div>

                        <button
                          onClick={() => onSelectAttempt(attempt.testState)}
                          className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <FileText size={12} className="text-blue-400" />
                          <span>Review Solutions</span>
                          <ArrowUpRight size={12} className="text-slate-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Launch */}
              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => onSetStep("UPLOAD")}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 rounded-full text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <PlayCircle size={15} className="text-blue-600" />
                  <span>Start New Mock Exam Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultsPage;
