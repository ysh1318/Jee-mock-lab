/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Settings, 
  Sparkles, 
  BookCheck, 
  Maximize, 
  Minimize,
  Compass,
  FileUp,
  Target,
  Award,
  BarChart3,
  Shield,
  Coins,
  Trash2,
  Trophy,
  Zap
} from "lucide-react";
import { Question, Section, TestState, UserProfile, UserAccount } from "./types";
import { PdfUploader } from "./components/PdfUploader";
import { CbtEngine } from "./components/CbtEngine";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { ParsedResultAudit } from "./components/ParsedResultAudit";
import { LandingPage } from "./components/LandingPage";
import { ProfileSetupModal } from "./components/ProfileSetupModal";
import { WalletAndAuth } from "./components/WalletAndAuth";
import { AdminControlHub } from "./components/AdminControlHub";
import { ResultsPage } from "./components/ResultsPage";
import { PredictorHub } from "./components/PredictorHub";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { ShiftVault } from "./components/ShiftVault";
import { isAnswerCorrect } from "./utils/answerEvaluator";

import { useFullscreen } from "./hooks/useFullscreen";
import { useOrientation } from "./hooks/useOrientation";

export type AppStep = "LANDING" | "VAULT" | "UPLOAD" | "CBT" | "ANALYTICS" | "ADMIN" | "RESULTS" | "PREDICTOR" | "PRIVACY";

const STEP_TO_HASH: Record<AppStep, string> = {
  LANDING: "#home",
  VAULT: "#vault",
  UPLOAD: "#practice",
  CBT: "#cbt",
  ANALYTICS: "#analytics",
  RESULTS: "#results",
  PREDICTOR: "#predictor",
  ADMIN: "#admin",
  PRIVACY: "#privacy",
};

const getStepFromHash = (): AppStep => {
  if (typeof window === "undefined") return "LANDING";
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, "");
  switch (hash) {
    case "vault":
    case "shifts":
    case "pyq":
      return "VAULT";
    case "upload":
    case "practice":
      return "UPLOAD";
    case "cbt":
    case "exam":
      return "CBT";
    case "analytics":
    case "analysis":
      return "ANALYTICS";
    case "results":
    case "history":
      return "RESULTS";
    case "predictor":
    case "college":
    case "josaa":
      return "PREDICTOR";
    case "admin":
      return "ADMIN";
    case "privacy":
      return "PRIVACY";
    case "home":
    case "landing":
      return "LANDING";
    default: {
      try {
        const stored = sessionStorage.getItem("jee_active_step") as AppStep;
        if (stored && ["LANDING", "VAULT", "UPLOAD", "CBT", "ANALYTICS", "RESULTS", "PREDICTOR", "ADMIN", "PRIVACY"].includes(stored)) {
          return stored;
        }
      } catch {}
      return "LANDING";
    }
  }
};

export default function App() {
  const [step, setStep] = useState<AppStep>(getStepFromHash);
  const [testName, setTestName] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testState, setTestState] = useState<TestState | null>(() => {
    try {
      const saved = localStorage.getItem("jee_active_scorecard");
      if (saved) return JSON.parse(saved);
      const attempts = localStorage.getItem("jee_completed_attempts");
      if (attempts) {
        const parsedAttempts = JSON.parse(attempts);
        if (Array.isArray(parsedAttempts) && parsedAttempts.length > 0 && parsedAttempts[0].testState) {
          return parsedAttempts[0].testState;
        }
      }
    } catch {}
    return null;
  });
  const [initialCbtState, setInitialCbtState] = useState<any>(null);

  const navigateTo = (newStep: AppStep, replace = false) => {
    const targetHash = STEP_TO_HASH[newStep] || "#home";
    if (window.location.hash !== targetHash) {
      if (replace) {
        window.history.replaceState(null, "", targetHash);
      } else {
        window.history.pushState(null, "", targetHash);
      }
    }
    try {
      sessionStorage.setItem("jee_active_step", newStep);
    } catch {}
    setStep(newStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleHashOrPopState = () => {
      const nextStep = getStepFromHash();
      setStep(nextStep);
    };
    window.addEventListener("hashchange", handleHashOrPopState);
    window.addEventListener("popstate", handleHashOrPopState);
    return () => {
      window.removeEventListener("hashchange", handleHashOrPopState);
      window.removeEventListener("popstate", handleHashOrPopState);
    };
  }, []);

  useEffect(() => {
    const targetHash = STEP_TO_HASH[step] || "#home";
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, "", targetHash);
    }
    try {
      sessionStorage.setItem("jee_active_step", step);
    } catch {}
  }, [step]);

  useEffect(() => {
    if (testState) {
      try {
        localStorage.setItem("jee_active_scorecard", JSON.stringify(testState));
      } catch (e) {
        console.warn("Could not save active scorecard to localStorage:", e);
      }
    }
  }, [testState]);

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
  const [walletModalTab, setWalletModalTab] = useState<"auth" | "wallet" | "transactions" | "mailbox" | undefined>(undefined);
  const [preselectedPackId, setPreselectedPackId] = useState<string | undefined>(undefined);

  // Screen controller and Landscape Recommendations via custom hooks
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { isPortraitMobile } = useOrientation(800);
  const [isOrientationDismissed, setIsOrientationDismissed] = useState(false);
  const showOrientationWarning = isPortraitMobile && !isOrientationDismissed;
  const [showFullscreenRecommend, setShowFullscreenRecommend] = useState(true);

  // Periodic background wallet sync to match header/modals credits perfectly
  useEffect(() => {
    if (!userAccount) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/user/${userAccount.id}/wallet`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.credits !== undefined) {
            const creditsChanged = data.credits !== userAccount.credits;
            const passChanged = data.hasAllAccessPass !== undefined && data.hasAllAccessPass !== Boolean(userAccount.hasAllAccessPass);
            if (creditsChanged || passChanged) {
              const updatedAccount: UserAccount = {
                ...userAccount,
                credits: data.credits,
                hasAllAccessPass: data.hasAllAccessPass ?? userAccount.hasAllAccessPass
              };
              setUserAccount(updatedAccount);
              try {
                localStorage.setItem("jee_user_account", JSON.stringify(updatedAccount));
                if (updatedAccount.hasAllAccessPass || updatedAccount.role === "admin") {
                  localStorage.setItem("jee_all_access_pass", "true");
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn("Auto-sync wallet failed in background:", err);
      }
    }, 4500); // Sync every 4.5 seconds
    return () => clearInterval(interval);
  }, [userAccount?.id, userAccount?.credits, userAccount?.hasAllAccessPass]);

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
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((p: any) => p && typeof p.testName === "string" && Array.isArray(p.questions));
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

  // Check for active session whenever step changes or window regains focus
  useEffect(() => {
    const checkActiveSession = () => {
      try {
        const saved = localStorage.getItem("jee_cbt_active_exam");
        setActiveSession(saved ? JSON.parse(saved) : null);
      } catch {
        setActiveSession(null);
      }
    };
    checkActiveSession();
    window.addEventListener("focus", checkActiveSession);
    return () => window.removeEventListener("focus", checkActiveSession);
  }, [step]);

  // If candidate is on CBT view (or refreshed page on #cbt) and questions are not yet loaded:
  useEffect(() => {
    if (step === "CBT" && questions.length === 0) {
      try {
        const saved = localStorage.getItem("jee_cbt_active_exam");
        if (saved) {
          const session = JSON.parse(saved);
          if (session && session.questions && session.questions.length > 0) {
            setTestName(session.testName || "JEE Main Mock Test");
            setQuestions(session.questions);
            setInitialCbtState({
              ...session.testState,
              questions: session.questions,
              currentSubject: session.currentSubject,
              currentQuestionId: session.currentQuestionId,
            });
            return;
          }
        }
      } catch (e) {
        console.warn("Failed restoring active session on load:", e);
      }
      // If no valid active session in storage, redirect cleanly to practice hub
      navigateTo("UPLOAD", true);
    }
  }, [step, questions.length]);

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
      const exists = prev.some((p) => (p?.testName || "").trim().toLowerCase() === (name || "").trim().toLowerCase());
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
    navigateTo("ANALYTICS");
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
        maxScore: (state.questions.length === 90 || state.questions.some((q) => q.section === Section.B && q.questionNumber > 25))
          ? 300
          : state.questions.length * 4,
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
    setInitialCbtState(null);
    navigateTo("UPLOAD");
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
    navigateTo("ANALYTICS");
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
    let session = activeSession;
    if (!session) {
      try {
        const saved = localStorage.getItem("jee_cbt_active_exam");
        session = saved ? JSON.parse(saved) : null;
      } catch {}
    }
    if (session) {
      setTestName(session.testName || "JEE Main Mock Test");
      setQuestions(session.questions);
      setInitialCbtState({
        ...session.testState,
        questions: session.questions,
        currentSubject: session.currentSubject,
        currentQuestionId: session.currentQuestionId,
      });
      navigateTo("CBT");
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
      {/* PERSISTENT ROTATION RECOMMENDATION BANNER - Only inside platform / exam */}
      {showOrientationWarning && step !== "LANDING" && (
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
              onClick={() => setIsOrientationDismissed(true)}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white/90 text-[10px] rounded transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}


      {/* UNIFIED SAAS HEADER & NAVIGATION - Hidden on CBT & LANDING */}
      {step !== "CBT" && step !== "LANDING" && (
        <div className="flex flex-col shrink-0 sticky top-0 z-50 shadow-xs">
          <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-4 select-none">
            {/* Left: Brand & Navigation */}
            <div className="flex items-center gap-3 sm:gap-6 min-w-0">
              {/* Brand Logo & Name */}
              <div 
                className="flex items-center gap-2 cursor-pointer group shrink-0"
                onClick={() => navigateTo("LANDING")}
                title="Go to Home Portal"
              >
                <div className="w-8 h-8 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200/80 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
                  <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  </div>
                </div>
                <div className="hidden xs:flex flex-col text-left leading-tight">
                  <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">JEE MockLab</span>
                  <span className="text-[9px] text-slate-400 font-mono font-medium hidden sm:block">NTA CBT Platform</span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                <button
                  type="button"
                  onClick={() => navigateTo("LANDING")}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
                >
                  <Compass size={14} className="text-slate-400" />
                  <span>Home</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo("VAULT")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    step === "VAULT"
                      ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
                  }`}
                  id="nav_shift_vault_btn"
                >
                  <Sparkles size={14} className={step === "VAULT" ? "text-blue-600" : "text-slate-400"} />
                  <span>Shift Vault</span>
                  <span className="hidden sm:inline-block bg-blue-100/80 text-blue-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono">60</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo("UPLOAD")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    step === "UPLOAD"
                      ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
                  }`}
                >
                  <FileUp size={14} className={step === "UPLOAD" ? "text-blue-600" : "text-slate-400"} />
                  <span>Practice Hub</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo("RESULTS")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    step === "RESULTS"
                      ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
                  }`}
                >
                  <Award size={14} className={step === "RESULTS" ? "text-blue-600" : "text-slate-400"} />
                  <span>Mock Results</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!testState && completedAttempts.length > 0) {
                      setTestState(completedAttempts[0].testState);
                    }
                    navigateTo("ANALYTICS");
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    step === "ANALYTICS"
                      ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
                  }`}
                >
                  <BarChart3 size={14} className={step === "ANALYTICS" ? "text-blue-600" : "text-slate-400"} />
                  <span>Growth Analytics</span>
                </button>
              </nav>
            </div>

            {/* Right: Quick Stats & Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 text-xs font-medium">
              {/* Quick stats indicators */}
              <div className="hidden xl:flex items-center gap-2.5 text-xs text-slate-500 font-medium font-mono">
                <div className="flex items-center gap-1.5">
                  <BookOpen size={13} className="text-slate-400" />
                  <span>Library: <strong className="text-slate-800 font-semibold">{savedPapers.length}</strong></span>
                </div>
                <span className="text-slate-200">|</span>
                <div className="flex items-center gap-1.5">
                  <Trophy size={13} className="text-amber-500" />
                  <span>Attempts: <strong className="text-slate-800 font-semibold">{completedAttempts.length}</strong></span>
                </div>
                <div className="h-4 w-px bg-slate-200 ml-1" />
              </div>

              {/* Admin Panel Button */}
              {userAccount && userAccount.role === "admin" && (
                <button
                  type="button"
                  onClick={() => {
                    navigateTo("ADMIN");
                  }}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-2xs active:scale-95 whitespace-nowrap"
                  title="Open Admin Control Hub"
                  id="header_admin_panel_btn"
                >
                  <Shield size={13} className="text-rose-600" />
                  <span>Admin Hub</span>
                </button>
              )}

              {/* Wallet Credits Chip */}
              <button
                type="button"
                onClick={() => {
                  setWalletModalTab(userAccount?.role === "admin" ? "wallet" : undefined);
                  setShowWalletModal(true);
                }}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-2xs active:scale-95 font-mono tabular-nums"
                title="Manage mock parsing credits and account"
                id="header_wallet_chip"
              >
                <Coins size={13} className="text-amber-500" />
                <span>
                  {userAccount ? `${userAccount.credits} credits` : "Claim 3 Free Credits"}
                </span>
                {userAccount && userAccount.role === "admin" && (
                  <span className="ml-0.5 text-[9px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 border border-rose-200 rounded">Admin</span>
                )}
              </button>

              {/* Fullscreen switch toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                title={isFullscreen ? "Exit Fullscreen Mode" : "Enter Fullscreen Mode"}
              >
                {isFullscreen ? <Minimize size={13} className="text-amber-500" /> : <Maximize size={13} className="text-slate-500" />}
                <span className="hidden sm:inline">{isFullscreen ? "Windowed" : "Fullscreen"}</span>
              </button>

              {/* Safe Wipe Cache */}
              <button
                onClick={() => setShowSelfDestructConfirm(true)}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200/90 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                title="Clear cached test storage"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Clear Cache</span>
              </button>
            </div>
          </header>

          {/* PERSISTENT LIVE EXAM RECOVERY STRIP */}
          {activeSession && (
            <div className="bg-linear-to-r from-amber-50 via-amber-50/90 to-orange-50/80 border-b border-amber-200/80 text-amber-950 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Zap size={14} className="fill-amber-500 text-amber-600 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">Mock In Progress</span>
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[220px] sm:max-w-md">{activeSession.testName}</span>
                  </div>
                  <div className="text-[11px] text-amber-850 flex items-center gap-3 mt-0.5">
                    <span>Remaining Time: <strong className="font-mono text-slate-900 font-bold">{Math.floor(activeSession.testState.timeLeft / 60)}m {activeSession.testState.timeLeft % 60}s</strong></span>
                    <span>•</span>
                    <span>{activeSession.questions.length} Questions</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResumeActiveSession}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>Resume Exam</span>
                  <span>→</span>
                </button>
                {!showDiscardConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDiscardConfirm(true)}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 font-medium text-xs rounded-lg transition cursor-pointer"
                  >
                    Discard
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Discard?</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleDiscardActiveSession();
                        setShowDiscardConfirm(false);
                      }}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded cursor-pointer transition"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDiscardConfirm(false)}
                      className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-[10px] rounded cursor-pointer transition"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
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
                onEnterPlatform={(viewStep) => navigateTo(viewStep || "UPLOAD")}
                savedPapersCount={savedPapers.length}
                attemptsCount={completedAttempts.length}
                userProfile={userProfile}
                onEditProfile={() => setShowProfileWizard(true)}
                onPrivacyClick={() => navigateTo("PRIVACY")}
                activeSession={activeSession}
                onResumeActiveSession={handleResumeActiveSession}
              />
            </motion.div>
          )}

          {step === "VAULT" && (
            <motion.div
              key="VAULT"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1"
            >
              <ShiftVault
                userAccount={userAccount}
                onStartShiftTest={(shiftQuestions, title) => {
                  setTestName(title);
                  setQuestions(shiftQuestions);
                  setInitialCbtState(null);
                  navigateTo("CBT");
                }}
                onRequestRecharge={(packId) => {
                  setWalletModalTab("wallet");
                  setPreselectedPackId(packId || "all_access_pass");
                  setShowWalletModal(true);
                }}
                onBackToHome={() => navigateTo("LANDING")}
                onAccountUpdated={(updatedAcc) => {
                  setUserAccount(updatedAcc);
                  try {
                    localStorage.setItem("jee_user_account", JSON.stringify(updatedAcc));
                    if (updatedAcc.hasAllAccessPass || updatedAcc.role === "admin") {
                      localStorage.setItem("jee_all_access_pass", "true");
                    }
                  } catch {}
                }}
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
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition text-xs flex items-center justify-center"
                                    title="Delete Saved Paper"
                                  >
                                    <Trash2 size={13} />
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
                                return qObj && isAnswerCorrect(attempt.testState.userResponses[qId], qObj.correctAnswer, qObj.section);
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
                    onClick={() => navigateTo("UPLOAD")}
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
                navigateTo("ANALYTICS");
              }}
              onSetStep={(newStep) => navigateTo(newStep)}
            />
          </motion.div>
        )}

        {step === "PREDICTOR" && (
          <motion.div
            key="PREDICTOR"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full flex-1"
          >
            <PredictorHub
              completedAttempts={completedAttempts}
              onSelectAttempt={(attempt) => {
                setTestState(attempt.testState);
                navigateTo("ANALYTICS");
              }}
              savedPapersCount={savedPapers.length}
              userProfile={userProfile}
              onEditProfile={() => setShowProfileWizard(true)}
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
                navigateTo("LANDING");
              }}
              onClose={() => navigateTo("LANDING")}
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
            <PrivacyPolicy onBack={() => navigateTo("LANDING")} />
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
              onClick={() => navigateTo("PRIVACY")}
              className="hover:text-slate-600 hover:underline cursor-pointer transition-colors"
              id="global_footer_privacy_btn"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <span>Prescribed Calibration Standards</span>
            <span>•</span>
            <span>NTA Standardized Percentile Metrics</span>
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
            navigateTo("CBT");
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
            initialPackId={preselectedPackId}
            onLogin={(account) => {
              setUserAccount(account);
              try {
                localStorage.setItem("jee_user_account", JSON.stringify(account));
                if (account.hasAllAccessPass || account.role === "admin") {
                  localStorage.setItem("jee_all_access_pass", "true");
                }
              } catch {}
            }}
            onLogout={() => {
              setUserAccount(null);
              try {
                localStorage.removeItem("jee_user_account");
                localStorage.removeItem("jee_all_access_pass");
              } catch {}
            }}
            onClose={() => {
              setShowWalletModal(false);
              setPreselectedPackId(undefined);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
