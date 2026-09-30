/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, BookOpen, Clock, Settings, Sparkles, BookCheck, Maximize, Minimize } from "lucide-react";
import { Question, TestState, UserProfile, UserAccount } from "./types";
import { PdfUploader } from "./components/PdfUploader";
import { CbtEngine } from "./components/CbtEngine";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { ParsedResultAudit } from "./components/ParsedResultAudit";
import { LandingPage } from "./components/LandingPage";
import { ProfileSetupModal } from "./components/ProfileSetupModal";
import { WalletAndAuth } from "./components/WalletAndAuth";
import { AdminControlHub } from "./components/AdminControlHub";
import { ResultsPage } from "./components/ResultsPage";
import { PrivacyPolicy } from "./components/PrivacyPolicy";

type AppStep = "LANDING" | "UPLOAD" | "CBT" | "ANALYTICS" | "ADMIN" | "RESULTS" | "PRIVACY";

export default function App() {
  const [step, setStep] = useState<AppStep>("LANDING");
  const [testName, setTestName] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testState, setTestState] = useState<TestState | null>(null);
  const [initialCbtState, setInitialCbtState] = useState<any>(null);

  // --- USER CALIBRATION PROFILE STATE ---
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("jee_user_profile");
      if (saved) return JSON.parse(saved);
    } catch {}
    // Standard JEE candidate defaults
    return {
      category: "General",
      homeState: "Maharashtra",
      gender: "Neutral",
      targetPercentile: 98.5
    };
  });

  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [showSharePromo, setShowSharePromo] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);

  // --- CANDIDATE SESSION & MONETIZATION STATES ---
  const [userAccount, setUserAccount] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem("jee_user_account");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletModalTab, setWalletModalTab] = useState<"auth" | "wallet" | "admin" | "transactions" | "mailbox" | undefined>(undefined);

  // Screen controller and Landscape Recommendations
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);
  const [showFullscreenRecommend, setShowFullscreenRecommend] = useState(true);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    const checkOrientation = () => {
      // If width < 800 and in portrait
      if (window.innerWidth < 800 && window.innerHeight > window.innerWidth) {
        setShowOrientationWarning(true);
      } else {
        setShowOrientationWarning(false);
      }
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      window.removeEventListener("resize", checkOrientation);
    };
  }, []);

  // Periodic background wallet sync to match header/modals credits perfectly
  useEffect(() => {
    if (!userAccount) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/user/${userAccount.id}/wallet`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.credits !== undefined && data.credits !== userAccount.credits) {
            const updatedAccount = { ...userAccount, credits: data.credits };
            setUserAccount(updatedAccount);
            localStorage.setItem("jee_user_account", JSON.stringify(updatedAccount));
          }
        }
      } catch (err) {
        console.warn("Auto-sync wallet failed in background:", err);
      }
    }, 4500); // Sync every 4.5 seconds
    return () => clearInterval(interval);
  }, [userAccount?.id, userAccount?.credits]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn(`Error exiting fullscreen: ${err.message}`);
      });
    }
  };

  const handleRotateDevice = () => {
    try {
      const orientationApi = screen.orientation as any;
      if (orientationApi && orientationApi.lock) {
        const lockOrientation = () => {
          orientationApi.lock("landscape").catch((err: any) => {
            console.warn("Orientation lock failed:", err);
            alert("Auto-rotation is restricted by your device secure permissions or browser wrapper. Please rotate your physical device or allow screen rotation in your notification panel!");
          });
        };

        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
            .then(lockOrientation)
            .catch(() => {
              orientationApi.lock("landscape").catch(() => {});
            });
        } else {
          lockOrientation();
        }
      } else {
        alert("Your web browser does not support programmatic force-rotation. Please rotate your physical device horizontally (Landscape mode)!");
      }
    } catch (e) {
      console.warn("Screen orientation locking not supported:", e);
    }
  };

  useEffect(() => {
    try {
      const account = localStorage.getItem("jee_user_account");
      const signupAlreadyPrompted = localStorage.getItem("jee_signup_prompted_v2");
      
      if (!account && !signupAlreadyPrompted) {
        localStorage.setItem("jee_signup_prompted_v2", "true");
        setWalletModalTab("auth");
        setShowWalletModal(true);
      }
    } catch {}
  }, []);

  const handleSaveUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    try {
      localStorage.setItem("jee_user_profile", JSON.stringify(profile));
    } catch {}
    setShowProfileWizard(false);
  };

  // --- PARSED AUDIT & INSTRUCTION SEQUENCE ---
  const [pendingTestToAudit, setPendingTestToAudit] = useState<{ name: string; questions: Question[] } | null>(null);

  // --- SAFETY & CONFIRMATION STATES ---
  const [deletePaperId, setDeletePaperId] = useState<string | null>(null);
  const [deleteAttemptId, setDeleteAttemptId] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSelfDestructConfirm, setShowSelfDestructConfirm] = useState(false);

  // --- LOCALPERSISTENCE STATE ---
  const [savedPapers, setSavedPapers] = useState<Array<{ id: string; testName: string; questions: Question[]; createdAt: string }>>(() => {
    try {
      const saved = localStorage.getItem("jee_saved_papers");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [completedAttempts, setCompletedAttempts] = useState<Array<{ id: string; testName: string; date: string; score: number; maxScore: number; testState: TestState }>>(() => {
    try {
      const saved = localStorage.getItem("jee_completed_attempts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSession, setActiveSession] = useState<{ testName: string; questions: Question[]; testState: TestState; currentSubject: any; currentQuestionId: string } | null>(() => {
    try {
      const saved = localStorage.getItem("jee_cbt_active_exam");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Check for active session when we enter step UPLOAD
  useEffect(() => {
    if (step === "UPLOAD") {
      try {
        const saved = localStorage.getItem("jee_cbt_active_exam");
        setActiveSession(saved ? JSON.parse(saved) : null);
      } catch {
        setActiveSession(null);
      }
    }
  }, [step]);

  // Safety alert before unload on public devices
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasKeys = localStorage.getItem("user_gemini_api_key") || 
                      localStorage.getItem("user_groq_api_key");
      const hasPapers = localStorage.getItem("jee_saved_papers");
      if (hasKeys || hasPapers) {
        e.preventDefault();
        e.returnValue = "Public Security Check: Please make sure you wipe all your stored API keys and mock histories before closing the tab if you are on a school or library device.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleTestLoaded = (name: string, loadedQuestions: Question[]) => {
    // Hold load start sequence and prompt with parsing audit pop up / instructions first!
    setPendingTestToAudit({ name, questions: loadedQuestions });

    // Save this extracted paper to Saved Papers list if it isn't already there!
    setSavedPapers((prev) => {
      const exists = prev.some((p) => p.testName.trim().toLowerCase() === name.trim().toLowerCase());
      if (exists) return prev;

      const newPaper = {
        id: String(Date.now()),
        testName: name,
        questions: loadedQuestions,
        createdAt: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      const updated = [newPaper, ...prev].slice(0, 8); // Keep up to 8 saved papers
      try {
        localStorage.setItem("jee_saved_papers", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save paper to localStorage:", e);
      }
      return updated;
    });
  };

  const handleTestSubmitted = (state: TestState) => {
    setTestState(state);
    setStep("ANALYTICS");
    setActiveSession(null);
    try {
      localStorage.removeItem("jee_cbt_active_exam");
    } catch {}

    // Calculate candidate score (+4 for correct, -1 for incorrect, 0 for unattempted)
    let score = 0;
    state.questions.forEach((q) => {
      const resp = state.userResponses[q.id];
      if (resp !== undefined && resp !== null && String(resp).trim() !== "") {
        if (String(resp).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase()) {
          score += 4;
        } else {
          score -= 1;
        }
      }
    });

    setCompletedAttempts((prev) => {
      const newAttempt = {
        id: String(Date.now()),
        testName: state.testName,
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        score,
        maxScore: state.questions.length * 4,
        testState: state,
      };
      const updated = [newAttempt, ...prev].slice(0, 15); // Store recent 15 attempts
      try {
        localStorage.setItem("jee_completed_attempts", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save attempt history to localStorage:", e);
      }
      return updated;
    });
  };

  const handleRestart = () => {
    setQuestions([]);
    setTestName("");
    setTestState(null);
    setInitialCbtState(null);
    setStep("UPLOAD");
  };

  // --- ACTIONS ---
  const handleLoadSavedPaper = (paper: { testName: string; questions: Question[] }) => {
    setPendingTestToAudit({ name: paper.testName, questions: paper.questions });
  };

  const handleDeleteSavedPaper = (id: string) => {
    setSavedPapers((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem("jee_saved_papers", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleReviewPastAttempt = (attempt: { testState: TestState }) => {
    setTestState(attempt.testState);
    setStep("ANALYTICS");
  };

  const handleDeletePastAttempt = (id: string) => {
    setCompletedAttempts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem("jee_completed_attempts", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleResumeActiveSession = () => {
    if (activeSession) {
      setTestName(activeSession.testName);
      setQuestions(activeSession.questions);
      setInitialCbtState(activeSession.testState); // pass saved response progress map
      setStep("CBT");
    }
  };

  const handleDiscardActiveSession = () => {
    try {
      localStorage.removeItem("jee_cbt_active_exam");
    } catch {}
    setActiveSession(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between select-none">
      {/* PERSISTENT ROTATION RECOMMENDATION BANNER */}
      {showOrientationWarning && (
        <div className="bg-amber-950 text-amber-100 px-4 py-2.5 text-xs font-semibold border-b border-amber-800/60 flex items-center justify-between gap-3 animate-fade-in relative z-[100] shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm animate-bounce shrink-0">🔄</span>
            <span>
              <strong>Authentic PC Exam:</strong> We detected you are in portrait mode! Please rotate your device horizontally (Landscape mode) to experience the genuine NTA computer-based exam simulator correctly!
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRotateDevice}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold uppercase text-[10px] tracking-wider transition-all cursor-pointer rounded shadow-xs"
            >
              Rotate Screen 🔄
            </button>
            <button 
              type="button"
              onClick={() => setShowOrientationWarning(false)}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white/90 text-[10px] rounded transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* RECOMMENDATION TO GO FULLSCREEN FOR LANDSCAPE TRUE SIMULATOR */}
      {step !== "CBT" && step !== "LANDING" && !isFullscreen && showFullscreenRecommend && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-4 py-2.5 text-xs font-semibold border-b border-blue-800/60 flex items-center justify-between gap-3 animate-fade-in relative z-[100] shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm shrink-0 animate-pulse">🖥️</span>
            <span>
              <strong>Highly Recommended:</strong> Click <strong className="text-amber-300 font-extrabold underline decoration-amber-400">Go Fullscreen</strong> in the simulator header to run inside a true-to-life PC layout browser wrapper!
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold uppercase text-[10px] tracking-wider transition-all cursor-pointer rounded shadow-xs"
            >
              Go Fullscreen ⚡
            </button>
            <button 
              type="button"
              onClick={() => setShowFullscreenRecommend(false)}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white/90 text-[10px] rounded transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL BANNER HEADER WITH DUAL-LAYER NAVIGATION */}
      {step !== "CBT" && step !== "LANDING" && (
        <div className="flex flex-col shrink-0 sticky top-0 z-50 shadow-md">
          <header className="bg-[#1a3a5f] border-b border-slate-700/60 px-3 sm:px-6 py-2 sm:py-3.5 flex flex-row items-center justify-between select-none text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white p-0.5 sm:p-1 rounded-sm shrink-0 shadow-sm">
                <div className="w-7 h-7 sm:w-9 sm:h-9 bg-blue-100 flex items-center justify-center text-[#1a3a5f] font-bold text-[8px] sm:text-[10px] leading-tight text-center italic font-sans animate-pulse">
                  JEE<br />MAIN
                </div>
              </div>
              <div className="text-left leading-normal">
                <h1 className="font-bold text-xs sm:text-sm tracking-tight text-white uppercase flex flex-wrap items-center gap-1 sm:gap-1.5">
                  <span>JEE CBT Simulator</span>
                  <span className="hidden xs:inline-block text-[8px] sm:text-[10px] text-blue-200 bg-blue-900/40 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded border border-blue-500/30 font-bold font-mono uppercase tracking-wide">CBT Panel</span>
                </h1>
                <p className="hidden md:block text-[10px] text-slate-300 opacity-85 uppercase tracking-widest leading-none mt-1">PDF-to-Test AI Calibration & Simulator</p>
              </div>
            </div>

            {/* COMPACT MIDDLE SHARE ENCOURAGEMENT */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900/30 px-3 py-1 rounded-full border border-slate-700/40">
              <span className="text-[10px] text-slate-300 font-medium">Love this free app?</span>
              <button
                type="button"
                onClick={() => {
                  const shareData = {
                    title: 'JEE CBT Mock Test Simulator',
                    text: 'Practice any offline JEE mock exam PDF inside a real CBT interface with AI solver!',
                    url: window.location.origin
                  };
                  if (navigator.share) {
                    navigator.share(shareData).catch(() => {});
                  } else {
                    try {
                      navigator.clipboard.writeText(window.location.origin);
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2000);
                    } catch {}
                  }
                }}
                className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full cursor-pointer transition-all shadow-xs flex items-center gap-1"
              >
                <span>📢</span>
                <span>{shareCopied ? "Link Copied!" : "Spread Word"}</span>
              </button>
            </div>

            {/* Header Rightside controls */}
            <div className="flex items-center gap-1.5 shrink-0 text-[10px] sm:text-[11px] font-semibold text-slate-200">
              {/* Admin Panel Button */}
              {userAccount && userAccount.role === "admin" && (
                <button
                  type="button"
                  onClick={() => {
                    setStep("ADMIN");
                  }}
                  className="px-2 py-1 sm:px-2.5 bg-rose-600 hover:bg-rose-500 border border-rose-500/40 hover:border-rose-450 text-white rounded text-[9px] sm:text-[10px] font-extrabold cursor-pointer transition-all flex items-center gap-1 shadow-sm active:scale-95 duration-100 mr-0.5 whitespace-nowrap"
                  title="Open Admin Desk Control Tower Dashboard"
                  id="header_admin_panel_btn"
                >
                  <span className="animate-pulse">🛡️</span>
                  <span>Admin Panel</span>
                </button>
              )}

              {/* Wallet Credits Chip */}
              <button
                type="button"
                onClick={() => {
                  setWalletModalTab(userAccount?.role === "admin" ? "wallet" : undefined);
                  setShowWalletModal(true);
                }}
                className="px-2 py-1 sm:px-2.5 bg-sky-650 hover:bg-sky-550 border border-sky-500/30 hover:border-sky-500/50 text-white rounded text-[9px] sm:text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95 duration-100 shadow-xs"
                title="Manage mock parsing credits, scan-to-pay UPI, view logs"
                id="header_wallet_chip"
              >
                <span className="text-amber-300">🪙</span>
                <span>
                  {userAccount ? `${userAccount.credits} cr` : "Claim 3 Free Credits"}
                </span>
                {userAccount && userAccount.role === "admin" && (
                  <span className="ml-1 text-[8px] font-black text-rose-300 bg-rose-950/40 px-1 py-0.1 border border-rose-500/30 rounded">A</span>
                )}
              </button>

              {/* Fullscreen switch toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-2 py-1 sm:px-2.5 bg-slate-850/80 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-500 text-slate-200 hover:text-white rounded text-[9px] sm:text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                title={isFullscreen ? "Exit Fullscreen Mode" : "Enter Authentic Fullscreen Mode"}
              >
                {isFullscreen ? <Minimize size={10} className="text-amber-400" /> : <Maximize size={10} />}
                <span className="hidden sm:inline">{isFullscreen ? "Default" : "🖥️ Fullscreen"}</span>
              </button>

              <button
                onClick={() => setShowSelfDestructConfirm(true)}
                className="px-2 py-1 sm:px-2.5 bg-red-650/15 hover:bg-red-600/35 border border-red-500/30 hover:border-red-500/50 text-red-100 hover:text-white rounded text-[9px] sm:text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-inner"
                title="Wipe keys and cached tests"
              >
                <span>🧹 <span className="hidden sm:inline">Safe Wipe</span></span>
              </button>

              <div className="hidden lg:flex items-center gap-1 opacity-90 bg-slate-900/40 border border-slate-700/40 px-2 py-0.5 rounded text-[10px] text-blue-200 font-mono">
                <Sparkles size={11} className="text-amber-300 animate-pulse shrink-0" />
                <span>Full Stack API</span>
              </div>

              {/* Creator badge */}
              <div className="hidden md:flex items-center gap-1.5 ml-1">
                <a
                  href="https://www.instagram.com/break_thegrid/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/90 hover:bg-black border border-slate-805 rounded px-1.5 py-0.5 shadow-xs flex items-center gap-1 transition-all duration-250 cursor-pointer text-[9.5px]/none"
                  title="Visit creator's Instagram"
                >
                  <div 
                    className="w-3.5 h-3.5 bg-slate-950 border border-slate-900 rounded-sm flex items-center justify-center font-black text-[4.5px]"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(220, 38, 38, 0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: "2px 2px"
                    }}
                  >
                    <span className="text-red-500 scale-[0.9]">BG</span>
                  </div>
                  <span className="font-extrabold text-slate-100 leading-none">BREAK THE GRID</span>
                </a>
              </div>
            </div>
          </header>

          {/* SECONDARY NAVIGATION BAR */}
          <nav className="bg-white border-b border-slate-200 py-1.5 px-3 sm:px-6 flex items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStep("LANDING")}
                className={`px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1 sm:gap-2 transition shrink-0 cursor-pointer ${
                  step === "LANDING"
                    ? "bg-[#1a3a5f]/10 text-[#1a3a5f] font-extrabold"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span>🌐 <span className="hidden sm:inline">Home Portal</span><span className="inline sm:hidden">Home</span></span>
              </button>

              <button
                type="button"
                onClick={() => setStep("UPLOAD")}
                className={`px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1 sm:gap-2 transition shrink-0 cursor-pointer ${
                  step === "UPLOAD"
                    ? "bg-[#1a3a5f]/10 text-[#1a3a5f] font-extrabold"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span>📝 <span className="hidden sm:inline">Practice Hub</span><span className="inline sm:hidden">Mock Portal</span></span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (!testState && completedAttempts.length > 0) {
                    setTestState(completedAttempts[0].testState);
                  }
                  setStep("ANALYTICS");
                }}
                className={`px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1 sm:gap-2 transition shrink-0 cursor-pointer ${
                  step === "ANALYTICS"
                    ? "bg-[#1a3a5f]/10 text-[#1a3a5f] font-extrabold"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span>📊 <span className="hidden sm:inline">Growth Analytics</span><span className="inline sm:hidden">Growth</span></span>
              </button>

              <button
                type="button"
                onClick={() => setStep("RESULTS")}
                className={`px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1 sm:gap-2 transition shrink-0 cursor-pointer ${
                  step === "RESULTS"
                    ? "bg-[#1a3a5f]/10 text-[#1a3a5f] font-extrabold"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span>📈 <span className="hidden sm:inline">Mock Results</span><span className="inline sm:hidden">Results</span></span>
              </button>
            </div>

            {/* Quick stats indicators */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold text-slate-500 font-mono shrink-0">
              <div className="flex items-center gap-1 text-[#1a3a5f]">
                <span>📚</span>
                <span>Library: <strong className="text-slate-700 font-black">{savedPapers.length}</strong></span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1 text-indigo-750">
                <span>🏆</span>
                <span>Attempts: <strong className="text-slate-700 font-black">{completedAttempts.length}</strong></span>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* CORE VIEW MODULE */}
      <main className="flex-1 w-full flex flex-col justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "LANDING" && (
            <motion.div
              key="LANDING"
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -15 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              className="w-full flex-1 flex flex-col justify-center"
            >
              <LandingPage 
                onEnterPlatform={(viewStep) => setStep(viewStep || "UPLOAD")}
                savedPapersCount={savedPapers.length}
                attemptsCount={completedAttempts.length}
                userProfile={userProfile}
                onEditProfile={() => setShowProfileWizard(true)}
                onPrivacyClick={() => setStep("PRIVACY")}
              />
            </motion.div>
          )}

          {step === "UPLOAD" && (
            <motion.div
              key="UPLOAD"
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -15 }}
              transition={{ duration: 0.3 }}
              className="py-6 w-full flex-1"
            >
            
            {/* ACTIVE EXAMINATION RECOVERY BANNER */}
            {activeSession && (
              <div className="max-w-6xl w-full mx-auto mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-pulse select-none text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold shrink-0">
                    📝
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider">Unfinished Offline Session Found</h4>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{activeSession.testName}</p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>⏰ Time Left: <span className="font-mono font-bold text-slate-700">{Math.floor(activeSession.testState.timeLeft / 60)} mins</span></span>
                      <span>•</span>
                      <span>💼 Extracted: <span className="font-bold text-slate-700">{activeSession.questions.length} Questions</span></span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 select-none items-center">
                  <button
                    onClick={handleResumeActiveSession}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 cursor-pointer text-white font-bold text-xs rounded transition flex items-center gap-1.5 shadow-md shadow-amber-600/10"
                  >
                    <span>Resume Live Exam</span>
                    <span>→</span>
                  </button>
                  {!showDiscardConfirm ? (
                    <button
                      onClick={() => setShowDiscardConfirm(true)}
                      className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-600 rounded cursor-pointer transition w-20"
                    >
                      Discard
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                      <span className="text-[10px] font-extrabold text-red-600 uppercase">Sure?</span>
                      <button
                        onClick={() => {
                          handleDiscardActiveSession();
                          setShowDiscardConfirm(false);
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] rounded cursor-pointer transition"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowDiscardConfirm(false)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] rounded cursor-pointer transition"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <PdfUploader 
              onTestLoaded={handleTestLoaded} 
              userAccount={userAccount}
              onRequestLogin={() => {
                setWalletModalTab(undefined);
                setShowWalletModal(true);
              }}
              onCreditsUpdated={(newCredits) => {
                if (userAccount) {
                  const updatedAccount = { ...userAccount, credits: newCredits };
                  setUserAccount(updatedAccount);
                  localStorage.setItem("jee_user_account", JSON.stringify(updatedAccount));
                }
              }}
            />

            {/* PUBLIC DEVICE GUARD HUD ON HOME SCREEN */}
            <div className="max-w-6xl w-full mx-auto mt-6 px-4 select-none">
              <div className="bg-linear-to-r from-slate-50 to-slate-100/50 p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">🛡️</span>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase flex items-center gap-1.5">
                      <span>Public Device Guard</span>
                      <span className="text-[9px] bg-[#1a3a5f]/10 text-[#1a3a5f] px-1.5 rounded-full uppercase font-mono font-black">Armed</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                      Are you practicing using a shared classroom, school, or library computer? Clear your secrets instantly before logging off.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSelfDestructConfirm(true)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-250 font-bold text-xs rounded-lg transition hover:scale-[1.01] cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <span>🧹 Wipe All Local Data</span>
                </button>
              </div>
            </div>

            {/* OFFLINE LOCAL LIBRARY SECTION */}
            {(savedPapers.length > 0 || completedAttempts.length > 0) && (
              <div className="max-w-6xl w-full mx-auto mt-8 border-t border-slate-200 pt-8 text-left select-none pb-12 w-full px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* COLUMN 1: SAVED MOCK PAPERS (FREE TIER RESOLVER) */}
                  {savedPapers.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
                      <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <div>
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                            <BookCheck size={16} className="text-emerald-600" />
                            <span>CBT Mock Paper Library</span>
                          </h3>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Saved locally (never spends quota again)</p>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                          {savedPapers.length} Papers
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {savedPapers.map((paper) => (
                          <div 
                            key={paper.id} 
                            onClick={() => handleLoadSavedPaper(paper)}
                            className="group flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:border-blue-200 cursor-pointer transition"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded bg-blue-50 text-[#1a3a5f] font-black text-[10px] flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition">
                                PDF
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-700 text-xs truncate group-hover:text-[#1a3a5f] transition">{paper.testName}</p>
                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-semibold">
                                  <span>{paper.createdAt}</span>
                                  <span>•</span>
                                  <span className="text-[#1a3a5f] font-bold">{paper.questions.length} Qs</span>
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {deletePaperId !== paper.id ? (
                                <>
                                  <span className="text-[10px] text-blue-600 font-bold group-hover:underline opacity-0 group-hover:opacity-100 transition mr-1 hidden sm:inline">
                                    Launch CBT
                                  </span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletePaperId(paper.id);
                                    }}
                                    className="p-1 rounded text-slate-450 hover:text-red-600 hover:bg-red-50 cursor-pointer transition text-xs"
                                    title="Delete Saved Paper"
                                  >
                                    🗑️
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-150 p-1 rounded-sm animate-bounce">
                                  <button
                                    onClick={() => {
                                      handleDeleteSavedPaper(paper.id);
                                      setDeletePaperId(null);
                                    }}
                                    className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9.5px] font-black hover:bg-red-700 transition"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setDeletePaperId(null)}
                                    className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded text-[9.5px] font-bold hover:bg-slate-300 transition"
                                  >
                                    No
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* COLUMN 2: COMPLETED SCORES & SCORECARDS HISTORY */}
                  {completedAttempts.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
                      <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <div>
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                            <GraduationCap size={16} className="text-indigo-600" />
                            <span>Past Attempt History</span>
                          </h3>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Track and review previous report cards</p>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                          {completedAttempts.length} Reports
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {completedAttempts.map((attempt) => {
                          const accuracy = attempt.testState ? Math.round(
                            (Object.keys(attempt.testState.userResponses).filter(
                              (qId) => {
                                const qObj = attempt.testState.questions.find((q) => q.id === qId);
                                return qObj && String(attempt.testState.userResponses[qId]).trim().toUpperCase() === String(qObj.correctAnswer).trim().toUpperCase();
                              }
                            ).length / Math.max(Object.keys(attempt.testState.userResponses).length, 1)) * 100
                          ) : 0;

                          return (
                            <div 
                              key={attempt.id}
                              onClick={() => handleReviewPastAttempt(attempt)}
                              className="group flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:border-indigo-200 cursor-pointer transition"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-700 font-black text-[10px] flex flex-col items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition leading-none py-1">
                                  <span>{attempt.score}</span>
                                  <span className="text-[6px] opacity-75 mt-0.5 uppercase">PTS</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-700 text-xs truncate group-hover:text-indigo-950 transition">{attempt.testName}</p>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1.5 flex-wrap">
                                    <span>{attempt.date}</span>
                                    <span>•</span>
                                    <span>Score: <span className="text-indigo-600 font-bold">{attempt.score}/{attempt.maxScore}</span></span>
                                    <span>•</span>
                                    <span>Acc: <span className="font-bold">{accuracy}%</span></span>
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {deleteAttemptId !== attempt.id ? (
                                  <>
                                    <span className="text-[10px] text-indigo-600 font-bold group-hover:underline opacity-0 group-hover:opacity-100 transition mr-1 hidden sm:inline">
                                      Review
                                    </span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteAttemptId(attempt.id);
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition text-xs"
                                      title="Delete past history"
                                    >
                                      🗑️
                                    </button>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-1 bg-red-50 border border-red-150 p-1 rounded-sm animate-bounce">
                                    <button
                                      onClick={() => {
                                        handleDeletePastAttempt(attempt.id);
                                        setDeleteAttemptId(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9.5px] font-black hover:bg-red-700 transition"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeleteAttemptId(null)}
                                      className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded text-[9.5px] font-bold hover:bg-slate-300 transition"
                                    >
                                      No
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

          </motion.div>
        )}

        {step === "CBT" && (
          <motion.div
            key="CBT"
            initial={{ opacity: 0, scale: 0.99, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -10 }}
            transition={{ duration: 0.25 }}
            className="h-[calc(100vh-100px)] w-full flex-1"
          >
            <CbtEngine
              testName={testName}
              questions={questions}
              onTestSubmit={handleTestSubmitted}
              onExit={handleRestart}
              initialState={initialCbtState}
            />
          </motion.div>
        )}

        {step === "ANALYTICS" && testState && (
          <motion.div
            key="ANALYTICS_REPORT"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="py-6 w-full flex-1"
          >
            <AnalyticsDashboard testState={testState} onRestart={handleRestart} />
          </motion.div>
        )}

        {step === "ANALYTICS" && !testState && (
          <motion.div
            key="ANALYTICS_EMPTY"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="py-12 max-w-4xl w-full mx-auto px-4 text-center flex-1"
          >
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-xs">
              <span className="text-4xl">📊</span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight mt-3">No Active Scorecard Selected</h3>
              <p className="text-xs text-slate-550 mt-1 max-w-md mx-auto leading-relaxed">
                You haven't parsed or submitted any active mock tests during this session yet. To generate high-fidelity reports click on any past test reports in your history or head back to the practice hub.
              </p>

              {completedAttempts.length > 0 ? (
                <div className="mt-6 space-y-2 text-left max-w-lg mx-auto">
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block mb-2">Available Reports ({completedAttempts.length}):</span>
                  {completedAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      onClick={() => setTestState(attempt.testState)}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/55 border border-slate-150 hover:border-indigo-250 rounded-lg cursor-pointer flex justify-between items-center transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-700 truncate">{attempt.testName}</p>
                        <p className="text-[10px] text-slate-405 font-semibold mt-0.5">{attempt.date} • Score: {attempt.score}/{attempt.maxScore}</p>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-650 shrink-0">Open Report →</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-8 flex justify-center gap-3">
                  <button
                    onClick={() => setStep("UPLOAD")}
                    className="px-4 py-2 bg-[#1a3a5f] text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
                  >
                    Go Upload PDF
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === "RESULTS" && (
          <motion.div
            key="RESULTS"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="py-2 w-full flex-1"
          >
            <ResultsPage
              completedAttempts={completedAttempts}
              userProfile={userProfile}
              onSelectAttempt={(attemptState) => {
                setTestState(attemptState);
                setStep("ANALYTICS");
              }}
              onSetStep={(newStep) => setStep(newStep)}
            />
          </motion.div>
        )}

        {step === "ADMIN" && userAccount && userAccount.role === "admin" && (
          <motion.div
            key="ADMIN"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full flex-1"
          >
            <AdminControlHub
              userAccount={userAccount}
              onLogout={() => {
                setUserAccount(null);
                localStorage.removeItem("jee_user_account");
                setStep("LANDING");
              }}
              onClose={() => setStep("LANDING")}
            />
          </motion.div>
        )}

        {step === "PRIVACY" && (
          <motion.div
            key="PRIVACY"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -15 }}
            className="w-full flex-1"
          >
            <PrivacyPolicy onBack={() => setStep("LANDING")} />
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* PUBLIC COMPUTER SAFE-WIPE MODAL */}
      {showSelfDestructConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-[100] p-4 select-none">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-red-100 animate-scale-up text-left relative overflow-hidden">
            {/* Top red header stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-rose-600" />
            
            <div className="flex gap-4 items-start pt-2">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xl font-bold shrink-0">
                🧹
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Public Computer Security Check</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you preparing on a public computer, library, classroom, or cyber cafe? Leaving your cached credentials can put your private API quotas at risk. Let's make sure everything is completely wiped clean!
                </p>
              </div>
            </div>

            <div className="my-5 bg-rose-50/50 rounded-xl border border-rose-100 p-4 space-y-3">
              <div className="text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-rose-105 pb-1.5">
                <span>⚠️ Session components to be permanently deleted:</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 font-semibold">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500 font-bold">✓</span>
                  <span><strong>All Provider API Keys</strong> (Gemini, Groq)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500 font-bold">✓</span>
                  <span><strong>Custom Study Companions</strong> and Graphic Assets URLs</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500 font-bold">✓</span>
                  <span><strong>Saved Mock papers library</strong> cache ({savedPapers.length} items)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500 font-bold">✓</span>
                  <span><strong>Past score report cards</strong> & Analytics records ({completedAttempts.length} report cards)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500 font-bold">✓</span>
                  <span><strong>Unfinished test progress maps</strong> and active session cookies</span>
                </li>
              </ul>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              * Note: This safely cleans 100% of local storage data. This action is instant and irreversible.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end select-none">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.clear();
                    window.location.reload();
                  } catch {}
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md shadow-rose-200 hover:scale-[1.01]"
              >
                <span>🧹 Wipe All My Platform Data</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSelfDestructConfirm(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-150 hover:bg-slate-205 text-slate-600 font-bold text-xs rounded-lg transition cursor-pointer text-center"
              >
                Cancel & Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL FOOTER (only shown outside examination engine) */}
      {step !== "CBT" && step !== "LANDING" && (
        <footer className="bg-white border-t border-slate-200 py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[10px] sm:text-xs select-none shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col text-left gap-0.5 max-w-xl">
            <div className="flex items-center gap-1.5 font-bold text-slate-500">
              <GraduationCap size={14} className="text-[#1a3a5f]" />
              <span>&copy; {new Date().getFullYear()} CBT Simulator. Independent Educational Tool.</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              * This simulator is a custom student companion and is not affiliated with, licensed by, or connected to the National Testing Agency (NTA) in any manner.
            </p>
          </div>
          <div className="flex gap-4 font-semibold text-slate-400 shrink-0 items-center">
            <button
              onClick={() => setStep("PRIVACY")}
              className="hover:text-slate-600 hover:underline cursor-pointer transition-colors"
              id="global_footer_privacy_btn"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <span>Prescribed Calibration Standards</span>
            <span>•</span>
            <span>MathonGo/Allen Scale Metrics</span>
          </div>
        </footer>
      )}

      {/* AI PARSED AUDIT & EXAM REGULATORY INSTRUCTIONS FLOW ONBOARDING */}
      {pendingTestToAudit && (
        <ParsedResultAudit
          testName={pendingTestToAudit.name}
          questions={pendingTestToAudit.questions}
          onProceedToTest={() => {
            const auditData = pendingTestToAudit;
            setPendingTestToAudit(null); // clear overlay
            setTestName(auditData.name);
            setQuestions(auditData.questions);
            setInitialCbtState(null);
            setStep("CBT");
            setActiveSession(null); // dismiss previous
          }}
          onCancel={() => {
            setPendingTestToAudit(null);
          }}
        />
      )}

      {/* USER PROFILE CALIBRATION & STEP-BY-STEP SETUP WIZARD */}
      {showProfileWizard && (
        <ProfileSetupModal
          currentProfile={userProfile}
          onSave={handleSaveUserProfile}
          onClose={() => setShowProfileWizard(false)}
        />
      )}

      {/* CANDIDATE WALLET, ACCOUNT MANAGEMENT, AND PEER PAYMENT HUB */}
      <AnimatePresence>
        {showWalletModal && (
          <WalletAndAuth
            userAccount={userAccount}
            initialTab={walletModalTab}
            onLogin={(account) => {
              setUserAccount(account);
              localStorage.setItem("jee_user_account", JSON.stringify(account));
            }}
            onLogout={() => {
              setUserAccount(null);
              localStorage.removeItem("jee_user_account");
            }}
            onClose={() => setShowWalletModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
