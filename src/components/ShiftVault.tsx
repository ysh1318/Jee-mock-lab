/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Search, 
  Clock, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Play, 
  ShieldCheck, 
  SlidersHorizontal,
  Flame,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Coins,
  Check,
  ChevronRight,
  Zap,
  Info
} from "lucide-react";
import { Question, ShiftMetadata, UserAccount } from "../types";
import { SHIFTS_CATALOG, FREE_FLAGSHIP_IDS } from "../data/shiftsCatalog";
import { loadShiftPaper, canAccessShift } from "../data/shiftsLoader";

interface ShiftVaultProps {
  userAccount: UserAccount | null;
  onStartShiftTest: (questions: Question[], testTitle: string) => void;
  onRequestRecharge?: (packId?: string) => void;
  onBackToHome?: () => void;
  onAccountUpdated?: (user: UserAccount) => void;
}

export function ShiftVault({
  userAccount,
  onStartShiftTest,
  onRequestRecharge,
  onBackToHome,
  onAccountUpdated
}: ShiftVaultProps) {
  // State
  const [selectedYear, setSelectedYear] = useState<"ALL" | 2026 | 2025 | 2024>("ALL");
  const [selectedSession, setSelectedSession] = useState<"ALL" | 1 | 2>("ALL");
  const [filterType, setFilterType] = useState<"ALL" | "FLAGSHIPS" | "TOUGH" | "HIGH_CUTOFF">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loadingShiftId, setLoadingShiftId] = useState<string | null>(null);
  const [showPassModal, setShowPassModal] = useState<boolean>(false);
  const [passPurchaseSuccess, setPassPurchaseSuccess] = useState<boolean>(false);
  const [isPurchasingPass, setIsPurchasingPass] = useState<boolean>(false);

  const isUserAdmin = userAccount?.role === "admin";

  // Check if user has All-Access Pass (via userAccount, admin role, or verified localStorage)
  const hasPass = isUserAdmin || Boolean(userAccount?.hasAllAccessPass) || (() => {
    try {
      return localStorage.getItem("jee_all_access_pass") === "true";
    } catch {
      return false;
    }
  })();

  // Keep localStorage aligned with user pass ownership
  React.useEffect(() => {
    if (userAccount?.hasAllAccessPass || isUserAdmin) {
      try {
        localStorage.setItem("jee_all_access_pass", "true");
      } catch {}
    }
  }, [userAccount?.hasAllAccessPass, isUserAdmin]);

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    return SHIFTS_CATALOG.filter((shift) => {
      // Year filter
      if (selectedYear !== "ALL" && shift.year !== selectedYear) return false;

      // Session filter
      if (selectedSession !== "ALL" && shift.session !== selectedSession) return false;

      // Quick category filters
      if (filterType === "FLAGSHIPS" && !shift.isFlagshipFree) return false;
      if (filterType === "TOUGH" && shift.difficulty !== "Tough") return false;
      if (filterType === "HIGH_CUTOFF" && shift.marksFor99Percentile < 210) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDate = shift.date.toLowerCase().includes(query);
        const matchesTitle = shift.title.toLowerCase().includes(query);
        const matchesTagline = shift.tagline.toLowerCase().includes(query);
        const matchesYear = String(shift.year).includes(query);
        const matchesCutoff = String(shift.marksFor99Percentile).includes(query);
        if (!matchesDate && !matchesTitle && !matchesTagline && !matchesYear && !matchesCutoff) {
          return false;
        }
      }

      return true;
    });
  }, [selectedYear, selectedSession, filterType, searchQuery]);

  // Handler for launching a shift
  const handleLaunchShift = async (shift: ShiftMetadata) => {
    const isUnlocked = isUserAdmin || hasPass || shift.isFlagshipFree;

    if (!isUnlocked) {
      setShowPassModal(true);
      return;
    }

    setLoadingShiftId(shift.id);
    try {
      const questions = await loadShiftPaper(shift.id);
      onStartShiftTest(questions, shift.title);
    } catch (err) {
      console.error("Failed to load shift paper:", err);
      alert("Unable to load the requested shift paper. Please try again.");
    } finally {
      setLoadingShiftId(null);
    }
  };

  // Handler for unlocking All-Access Pass with credits
  const handleUnlockWithCredits = async () => {
    if (isPurchasingPass) return;

    if (!userAccount) {
      alert("Please sign in or claim your free credits first.");
      onRequestRecharge?.();
      return;
    }

    if (userAccount.credits < 20) {
      alert(`You have ${userAccount.credits} credits. The All-Access Pass requires 20 credits.`);
      onRequestRecharge?.();
      return;
    }

    setIsPurchasingPass(true);
    try {
      const res = await fetch("/api/user/purchase-all-access-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userAccount.id }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to activate pass with credits.");
      }

      // Pass unlocked permanently in database
      const updatedUser: UserAccount = data.user;
      try {
        localStorage.setItem("jee_user_account", JSON.stringify(updatedUser));
        localStorage.setItem("jee_all_access_pass", "true");
      } catch {}

      onAccountUpdated?.(updatedUser);
      setPassPurchaseSuccess(true);
      setTimeout(() => {
        setShowPassModal(false);
        setPassPurchaseSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error activating pass:", err);
      alert(err.message || "Failed to activate pass. Please check your connection.");
    } finally {
      setIsPurchasingPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 select-text">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER WITH NTA STATS & PATTERN NOTICE */}
      {/* ========================================================================= */}
      <section className="bg-white border-b border-slate-200/80 pt-10 pb-8 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto">
          {/* Top Micro Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold tracking-wide">
              <Sparkles size={14} className="text-blue-600" />
              <span>Official NTA Archives • 60 Shifts (2024–2026)</span>
            </div>

            <div className="flex items-center gap-3">
              {hasPass || isUserAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>All-Access Pass Active (60/60 Unlocked)</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPassModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Unlock size={13} />
                  <span>Unlock 60 Shifts (₹199 / 20 Credits)</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Official Shift Vault & Flagship Selector
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Practice every real JEE Main shift from 2024 to 2026 inside the authentic NTA candidate interface.
              Includes strict Section B pattern enforcement and historical 99%ile cutoff calibrations.
            </p>
          </div>

          {/* Pattern Distinction Callout Ribbons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-6">
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                2026
              </div>
              <div className="text-xs">
                <p className="font-bold text-indigo-950">Latest Standard (75 Qs)</p>
                <p className="text-indigo-800/80 mt-0.5">25 Qs per subject • All 5 Section B numericals mandatory (No choice)</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                2025
              </div>
              <div className="text-xs">
                <p className="font-bold text-blue-950">New Format Pioneer (75 Qs)</p>
                <p className="text-blue-800/80 mt-0.5">First official implementation of non-optional Section B</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                2024
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-950">Legacy Pattern (90 Qs)</p>
                <p className="text-amber-800/80 mt-0.5">30 Qs per subject • Attempt any 5 of 10 in Section B (System enforced)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FILTER CONTROLS & YEAR SELECTOR */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Sticky Filters Ribbon */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-4">
          {/* Top row: Year segmented switcher + Session filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Year Segmented Switcher */}
            <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 overflow-x-auto scrollbar-none">
              {(
                [
                  { id: "ALL", label: "All Years (60)" },
                  { id: 2026, label: "2026 (18 Shifts)" },
                  { id: 2025, label: "2025 (20 Shifts)" },
                  { id: 2024, label: "2024 (22 Shifts)" },
                ] as const
              ).map((item) => {
                const isActive = selectedYear === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedYear(item.id)}
                    className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                      isActive ? "text-slate-900 font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="vaultYearActivePill"
                        className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/80"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Session Pills */}
            <div className="flex items-center gap-1.5 self-start md:self-auto">
              {(
                [
                  { id: "ALL", label: "All Sessions" },
                  { id: 1, label: "Session 1 (Jan)" },
                  { id: 2, label: "Session 2 (Apr)" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSession(s.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                    selectedSession === s.id
                      ? "bg-slate-900 text-white border-slate-900 font-semibold shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom row: Search bar + Quick Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by date (e.g. 27 Jan, 01 Feb), cutoff, or difficulty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white text-xs text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Filter Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 text-xs rounded-lg transition cursor-pointer shrink-0 ${
                  filterType === "ALL"
                    ? "bg-slate-200/80 text-slate-900 font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                All ({filteredShifts.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterType("FLAGSHIPS")}
                className={`px-3 py-1.5 text-xs rounded-lg border transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  filterType === "FLAGSHIPS"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                    : "text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Sparkles size={12} className="text-emerald-600" />
                <span>★ 3 Free Flagships</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType("TOUGH")}
                className={`px-3 py-1.5 text-xs rounded-lg border transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  filterType === "TOUGH"
                    ? "bg-rose-50 text-rose-800 border-rose-300 font-bold"
                    : "text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Flame size={12} className="text-rose-600" />
                <span>Tough Shifts</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType("HIGH_CUTOFF")}
                className={`px-3 py-1.5 text-xs rounded-lg border transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  filterType === "HIGH_CUTOFF"
                    ? "bg-amber-50 text-amber-800 border-amber-300 font-bold"
                    : "text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <TrendingUp size={12} className="text-amber-600" />
                <span>Cutoff &gt; 210</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SHIFT CARDS GRID */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {filteredShifts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <AlertCircle size={36} className="text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">No matching shifts found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your year, session, or search query.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedYear("ALL");
                setSelectedSession("ALL");
                setFilterType("ALL");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShifts.map((shift) => {
              const isUnlocked = isUserAdmin || hasPass || shift.isFlagshipFree;
              const isLoading = loadingShiftId === shift.id;

              return (
                <div
                  key={shift.id}
                  className={`relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                    shift.isFlagshipFree
                      ? "border-emerald-300 shadow-[0_4px_20px_rgba(16,185,129,0.08)] ring-1 ring-emerald-500/20"
                      : "border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  {/* Top Flagship Banner */}
                  {shift.isFlagshipFree && (
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={12} />
                        <span>Official Free Flagship</span>
                      </span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold">
                        100% Free
                      </span>
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Year, Shift number, and Session tags */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {shift.sessionName}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            shift.difficulty === "Tough"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : shift.difficulty === "Easy"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {shift.difficulty}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                        {shift.title}
                      </h3>

                      {/* Timing & Time Window */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-mono">
                        <Clock size={12} className="text-slate-400" />
                        <span>{shift.timeWindow}</span>
                      </div>

                      {/* Tagline */}
                      <p className="mt-2.5 text-xs text-slate-600 leading-relaxed font-normal">
                        {shift.tagline}
                      </p>

                      {/* Information badges: Pattern & 99%ile cutoff */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap gap-2">
                        {/* Pattern Badge */}
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                            shift.pattern === "NEW_75"
                              ? "bg-indigo-50/70 border-indigo-200/80 text-indigo-700"
                              : "bg-amber-50/70 border-amber-200/80 text-amber-800"
                          }`}
                        >
                          {shift.pattern === "NEW_75" ? "New Pattern (75 Qs)" : "Legacy Pattern (90 Qs)"}
                        </span>

                        {/* Cutoff Badge */}
                        <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                          <TrendingUp size={11} className="text-slate-500" />
                          <span>99%ile: {shift.marksFor99Percentile}m</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action CTA */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      {shift.isFlagshipFree ? (
                        <button
                          type="button"
                          onClick={() => handleLaunchShift(shift)}
                          disabled={isLoading}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <span>Loading Shift Paper...</span>
                          ) : (
                            <>
                              <Play size={13} fill="currentColor" />
                              <span>Start Free Test Drive</span>
                              <ArrowRight size={13} />
                            </>
                          )}
                        </button>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => handleLaunchShift(shift)}
                          disabled={isLoading}
                          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <span>Loading Shift Paper...</span>
                          ) : (
                            <>
                              <Play size={13} fill="currentColor" />
                              <span>Start Exam Simulation</span>
                              <ArrowRight size={13} />
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowPassModal(true)}
                          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          <Lock size={12} className="text-slate-500" />
                          <span>Unlock with All-Access Pass</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. ALL-ACCESS PASS MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showPassModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs w-7 h-7 rounded-full bg-white/10 flex items-center justify-center cursor-pointer transition"
                >
                  ✕
                </button>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <Sparkles size={11} />
                  <span>Lifetime Exam Access</span>
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  JEE PYQ All-Access Pass
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Unlock all 60 official shifts from 2024, 2025, and 2026. Practice with accurate NTA software and Allen calibration.
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Feature Checklist */}
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>All 60 Official Shifts</strong> (Session 1 & 2 for 2024, 2025, 2026)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>Pattern Fidelity</strong>: Section B 5 of 10 for 2024, all mandatory for 2025/2026</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>Historical Percentiles</strong>: Compare with real Allen/NTA cutoff data</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>KaTeX Step-by-Step Solutions</strong> for every single question</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Special One-Time Pass</span>
                    <span className="text-2xl font-black text-slate-900">₹199</span>
                    <span className="text-xs text-slate-500 ml-1.5 font-normal">or 20 Credits</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Zero Expiry
                    </span>
                  </div>
                </div>

                {/* Status messages */}
                {passPurchaseSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>All-Access Pass successfully unlocked! Reloading papers...</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  {userAccount && userAccount.credits >= 20 ? (
                    <button
                      type="button"
                      disabled={isPurchasingPass}
                      onClick={handleUnlockWithCredits}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                    >
                      {isPurchasingPass ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Activating Pass...</span>
                        </>
                      ) : (
                        <>
                          <Coins size={14} />
                          <span>Unlock with 20 Credits (Balance: {userAccount.credits})</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassModal(false);
                        onRequestRecharge?.("all_access_pass");
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                    >
                      <span>Get All-Access Pass for ₹199</span>
                      <ArrowRight size={14} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowPassModal(false)}
                    className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition cursor-pointer"
                  >
                    Continue with 3 Free Flagships
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
