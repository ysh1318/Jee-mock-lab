import React, { useState, useMemo } from "react";
import { UserProfile, TestState } from "../types";
import { 
  TrendingUp, Award, Target, Calendar, ArrowRight, Sparkles, 
  ChevronRight, RefreshCw, BarChart2, ShieldCheck, PlayCircle
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
  onSetStep: (step: "LANDING" | "UPLOAD" | "CBT" | "ANALYTICS" | "ADMIN" | "RESULTS") => void;
}

export function ResultsPage({ completedAttempts, userProfile, onSelectAttempt, onSetStep }: ResultsPageProps) {
  // Score to Percentile calibrator (Allen style calibration formula)
  const calculatePercentile = (score: number, maxScore: number = 300) => {
    const ratio = score / maxScore;
    if (ratio >= 0.9) return 99.9;
    if (ratio >= 0.8) return 99.5 + (ratio - 0.8) * 4;
    if (ratio >= 0.6) return 98.0 + (ratio - 0.6) * 7.5;
    if (ratio >= 0.4) return 93.0 + (ratio - 0.4) * 25;
    if (ratio >= 0.2) return 80.0 + (ratio - 0.2) * 65;
    return Math.max(10.0, ratio * 400);
  };

  // Compute stats based only on real completed attempts
  const displayData = useMemo(() => {
    return completedAttempts.map((attempt) => {
      const qs = attempt.testState.questions;
      const ur = attempt.testState.userResponses;
      const totalQs = qs.length;
      const correct = qs.filter(q => ur[q.id] === q.correctAnswer).length;
      const accuracy = totalQs > 0 ? Math.round((correct / totalQs) * 100) : 0;
      
      return {
        id: attempt.id,
        testName: attempt.testName,
        date: attempt.date,
        score: attempt.score,
        maxScore: attempt.maxScore,
        accuracy: accuracy,
        percentile: Number(calculatePercentile(attempt.score, attempt.maxScore).toFixed(1)),
        testState: attempt.testState
      };
    });
  }, [completedAttempts]);

  // Overall improvement stats
  const stats = useMemo(() => {
    if (displayData.length === 0) {
      return {
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

    const first = displayData[0];
    const latest = displayData[displayData.length - 1];
    const accuracyDiff = latest.accuracy - first.accuracy;
    const percentileDiff = latest.percentile - first.percentile;

    return {
      firstAccuracy: first.accuracy,
      latestAccuracy: latest.accuracy,
      accuracyDiff: accuracyDiff,
      firstPercentile: first.percentile,
      latestPercentile: latest.percentile,
      percentileDiff: parseFloat(percentileDiff.toFixed(1)),
      latestScore: latest.score,
      maxScore: latest.maxScore
    };
  }, [displayData]);

  const targetDiff = useMemo(() => {
    const current = stats.latestPercentile;
    const target = userProfile.targetPercentile || 98.5;
    const diff = target - current;
    return {
      met: diff <= 0,
      value: parseFloat(Math.abs(diff).toFixed(1))
    };
  }, [stats, userProfile]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans" id="results_page_container">
      {/* HEADER CARD */}
      <div className="bg-linear-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" /> High-Fidelity Results Center
            </span>
            <h1 className="text-2xl md:text-3xl font-black mt-3 font-heading tracking-tight">
              Aspirant Performance Analytics
            </h1>
            <p className="text-slate-350 text-xs md:text-sm mt-1 max-w-xl">
              Track your test accuracy progression, analyze velocity calibrations across mocks, and measure alignment to your goals.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 shrink-0 text-center md:text-right">
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Target Percentile Goal</span>
            <div className="text-3xl font-black text-amber-400 tracking-tight mt-1">
              {userProfile.targetPercentile || 98.5}%ile
            </div>
            <span className="text-[10px] text-indigo-200 block mt-0.5">Category: {userProfile.category || "General"} • {userProfile.homeState || "All India"}</span>
          </div>
        </div>
      </div>

      {/* CORE PERFORMANCE SUMMARY BENTO BOX */}
      {displayData.length === 0 ? (
        <div className="bg-white border-2 border-slate-100 rounded-2xl p-8 mb-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Award size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Exam Attempts Recorded Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Upload and complete your first JEE mock paper or launch the benchmark test. Your accuracy, percentile calibration, and subject progression will automatically calculate here!
          </p>
          <div className="pt-2">
            <button
              onClick={() => onSetStep("UPLOAD")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Launch First Mock Practice</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* BLOCK 1: ACCURACY PROGRESSION */}
          <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between" id="accuracy_stats_card">
            <div>
              <div className="flex items-center gap-2 text-slate-500">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Accuracy Improvement</span>
              </div>
              <div className="mt-4">
                <span className="text-[11px] text-slate-400 font-bold block uppercase">Your Accuracy Growth</span>
                <div className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-1">
                  {stats.firstAccuracy}% → {stats.latestAccuracy}% 
                  <span className="text-sm font-extrabold text-emerald-600 ml-1.5 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                    {stats.accuracyDiff >= 0 ? `↑+${stats.accuracyDiff}` : `↓${stats.accuracyDiff}`} points
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-4 pt-4 border-t border-slate-50 leading-relaxed italic">
              "Your accuracy: {stats.firstAccuracy}% → {stats.latestAccuracy}%"
            </p>
          </div>

          {/* BLOCK 2: PERCENTILE COMPARISON */}
          <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between" id="percentile_compare_card">
            <div>
              <div className="flex items-center gap-2 text-slate-500">
                <Target className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Compare to Target Percentile</span>
              </div>
              <div className="mt-4">
                <span className="text-[11px] text-slate-400 font-bold block uppercase">Estimated Latest vs. Target</span>
                <div className="text-2xl font-black text-slate-800 mt-1 flex items-baseline gap-1.5 select-all">
                  {stats.latestPercentile}%ile 
                  <span className="text-xs text-slate-400 font-semibold">vs {userProfile.targetPercentile || 98.5}%ile target</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50">
              {targetDiff.met ? (
                <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50/50 p-2 rounded-lg">
                  🎉 Goal Exceeded! You are +{targetDiff.value}%ile above target. Keep practicing!
                </div>
              ) : (
                <div className="text-[11px] font-bold text-indigo-650 flex items-center gap-1.5 bg-indigo-50/50 p-2 rounded-lg">
                  🎯 Just {targetDiff.value}%ile to reach your target goal.
                </div>
              )}
            </div>
          </div>

          {/* BLOCK 3: ATTEMPTS STATISTICS */}
          <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between" id="attempts_stats_card">
            <div>
              <div className="flex items-center gap-2 text-slate-500">
                <Award className="w-4 h-4 text-indigo-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Latest Score</span>
              </div>
              <div className="mt-4">
                <span className="text-[11px] text-slate-400 font-bold block uppercase">Exam Raw Score</span>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {stats.latestScore} / {stats.maxScore} 
                  <span className="text-xs text-slate-500 block mt-0.5 font-bold">Standard NTA (+4 / -1) scoring</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 pt-4 border-t border-slate-50 leading-relaxed font-mono">
              Total completed attempts: {displayData.length}
            </p>
          </div>
        </div>
      )}

      {/* CHART & TEST SELECTION DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* GRAPH COLUMN (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
            <div>
              <h3 className="font-heading font-black text-slate-800 text-sm">
                📈 Accuracy & Score Trend Graph
              </h3>
              <p className="text-[11px] text-slate-405 font-medium">Visualization of student improvement over time</p>
            </div>
          </div>

          {/* CUSTOM SVG PROGRESSIVE CHART */}
          {displayData.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No study data available. Complete mock tests to render performance chart!
            </div>
          ) : (
            <div className="relative">
              {/* SVG GRAPH PLOTTER */}
              <div className="h-64 w-full bg-slate-50/50 rounded-xl relative p-3 border border-slate-100/80">
                <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="200" x2="500" y2="200" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Draw area gradient */}
                  {displayData.length > 1 && (
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  )}

                  {/* Progressive Line Path (computed based on dataset array) */}
                  {displayData.length > 1 ? (
                    (() => {
                      const points = displayData.map((item, idx) => {
                        const x = Math.round((idx / (displayData.length - 1)) * 460) + 20;
                        // Accuracy is out of 100 on graph height 200 (scale: height = 200 - accuracy * 1.6)
                        const y = Math.round(180 - (item.accuracy * 1.5));
                        return `${x},${y}`;
                      });

                      const pathD = `M ${points.join(" L ")}`;
                      const areaD = `M 20,190 L ${points.join(" L ")} L ${Math.round((displayData.length - 1) / (displayData.length - 1) * 460) + 20},190 Z`;

                      return (
                        <>
                          <path d={areaD} fill="url(#chartGrad)" />
                          <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                          
                          {/* Points */}
                          {displayData.map((item, idx) => {
                            const x = Math.round((idx / (displayData.length - 1)) * 460) + 20;
                            const y = Math.round(180 - (item.accuracy * 1.5));
                            return (
                              <g key={item.id} className="group cursor-pointer">
                                <circle cx={x} cy={y} r="6" fill="#ffffff" stroke="#4f46e5" strokeWidth="3" />
                                <circle cx={x} cy={y} r="10" fill="#4f46e5" fillOpacity="0.1" className="hover:scale-125 transition-transform" />
                              </g>
                            );
                          })}
                        </>
                      );
                    })()
                  ) : (
                    // Single Data Point fallback line
                    <circle cx="250" cy="100" r="8" fill="#4f46e5" />
                  )}
                </svg>

                {/* X-Axis labels mapping */}
                <div className="absolute bottom-2 left-6 right-6 flex justify-between text-[8px] font-bold font-mono text-slate-450 uppercase">
                  {displayData.map((item, i) => (
                    <span key={item.id} className="truncate max-w-[80px]">
                      Test {i + 1} ({item.accuracy}%)
                    </span>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-4 items-center mt-3 justify-center text-[10px] font-sans font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-650" />
                  <span>Your Extracted Accuracy Trajectory (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span>Target percentile target baseline</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LIST COLUMN (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-xs">
          <h3 className="font-heading font-black text-slate-800 text-sm mb-1">
            📊 Mock Scores Ledger ({displayData.length})
          </h3>
          <p className="text-[11px] text-slate-400 mb-4 font-sans">
            Detailed view of your completed mock exam sessions and calibrated statistics.
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {displayData.map((attempt, index) => (
              <div
                key={attempt.id}
                className="p-3 bg-slate-50 border border-slate-150 hover:bg-slate-100/55 rounded-xl transition flex flex-col justify-between gap-3 relative"
              >
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black uppercase font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                      Attempt #{index + 1}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block max-w-[120px] truncate">
                      {attempt.date}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 leading-tight truncate">
                    {attempt.testName}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Est. Percentile</span>
                      <strong className="text-xs text-indigo-700 font-extrabold">{attempt.percentile}%ile</strong>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Score & Accuracy</span>
                      <strong className="text-xs text-slate-700 font-extrabold">{attempt.score}/{attempt.maxScore} ({attempt.accuracy}%)</strong>
                    </div>
                  </div>
                </div>

                {attempt.testState && (
                  <button
                    onClick={() => onSelectAttempt(attempt.testState)}
                    className="w-full text-center py-1.5 bg-white hover:bg-slate-100/50 border border-slate-200 text-slate-700 text-[10px] font-black rounded-lg transition"
                  >
                    Open Detailed Scorecard →
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={() => onSetStep("UPLOAD")}
              className="w-full py-2.5 bg-sky-650 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4" /> Start Parsing Another Paper
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
