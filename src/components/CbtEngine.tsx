/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Clock, User, Eye, Info, HelpCircle, GraduationCap, ChevronLeft, ChevronRight, AlertTriangle, Send, Maximize, Minimize } from "lucide-react";
import { Question, Subject, Section, QuestionStatus, TestState } from "../types";
import { MarkdownMath } from "./MathText";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { NtaInstructions } from "./NtaInstructions";
import { QuestionPaperModal } from "./QuestionPaperModal";

interface CbtEngineProps {
  testName: string;
  questions: Question[];
  onTestSubmit: (state: TestState) => void;
  onExit: () => void;
  initialState?: {
    userResponses: Record<string, string>;
    questionStatuses: Record<string, QuestionStatus>;
    timeSpent: Record<string, number>;
    timeLeft: number;
    currentSubject?: Subject;
    currentQuestionId?: string;
  } | null;
}

export function CbtEngine({ testName, questions, onTestSubmit, onExit, initialState }: CbtEngineProps) {
  // --- STATE ---
  const [currentSubject, setCurrentSubject] = useState<Subject>(() => initialState?.currentSubject || Subject.PHYSICS);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(() => initialState?.currentQuestionId || "");
  const [userResponses, setUserResponses] = useState<Record<string, string>>(() => initialState?.userResponses || {});
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>(() => initialState?.questionStatuses || {});
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>(() => initialState?.timeSpent || {});
  const [timeLeft, setTimeLeft] = useState<number>(() => initialState?.timeLeft ?? 10800); // 180 minutes = 10800 seconds
  
  // Custom states for horizontal UI optimization and Fullscreen
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showFullscreenRecommend, setShowFullscreenRecommend] = useState<boolean>(true);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Input buffer specifically for NAT questions (Section B)
  const [natInputValue, setNatInputValue] = useState<string>("");

  // Modals
  const [modalType, setModalType] = useState<"instructions" | "questionPaper" | "submitConfirm" | null>(null);

  // Active question ref/timer
  const activeQuestionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filtered questions for active subject
  const subjectQuestions = questions.filter((q) => q.subject === currentSubject);
  const activeQuestion = questions.find((q) => q.id === currentQuestionId) || subjectQuestions[0];

  // --- INITIALIZATION ---
  useEffect(() => {
    // If we're resuming a previous mock test session, skip resetting states to blank!
    if (initialState) {
      if (initialState.currentQuestionId) {
        setCurrentQuestionId(initialState.currentQuestionId);
      }
      return;
    }
    // Set first question of Physics as initial question
    const initialPhysicsQuestions = questions.filter((q) => q.subject === Subject.PHYSICS);
    if (initialPhysicsQuestions.length > 0) {
      setCurrentQuestionId(initialPhysicsQuestions[0].id);
      
      // Initialize statues
      const initialStatuses: Record<string, QuestionStatus> = {};
      const initialTimeSpent: Record<string, number> = {};
      
      questions.forEach((q) => {
        initialStatuses[q.id] = QuestionStatus.NOT_VISITED;
        initialTimeSpent[q.id] = 0;
      });

      // Mark the very first question as NOT_ANSWERED since it's viewed
      initialStatuses[initialPhysicsQuestions[0].id] = QuestionStatus.NOT_ANSWERED;

      setQuestionStatuses(initialStatuses);
      setTimeSpent(initialTimeSpent);
    }
  }, [questions, initialState]);

  // --- LOCAL PERSISTENCE AUTO-SAVE EFFECT ---
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    
    const activeSession = {
      testName,
      questions,
      testState: {
        questions,
        userResponses,
        questionStatuses,
        timeSpent,
        timeLeft,
        isCompleted: false,
        testName,
      },
      currentSubject,
      currentQuestionId,
    };
    try {
      localStorage.setItem("jee_cbt_active_exam", JSON.stringify(activeSession));
    } catch (e) {
      console.warn("Could not auto-save in-progress exam state to localStorage:", e);
    }
  }, [testName, questions, userResponses, questionStatuses, timeSpent, timeLeft, currentSubject, currentQuestionId]);

  // Synchronize Section B NAT inputs with saved state
  useEffect(() => {
    if (activeQuestion) {
      setNatInputValue(userResponses[activeQuestion.id] || "");
    }
  }, [activeQuestion, userResponses]);

  // --- TIME MANAGEMENT ---
  // Main countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(); // Auto submit when time runs out!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Increment timeSpent on the current active question every second
  useEffect(() => {
    if (!currentQuestionId || modalType !== null) return;

    const interval = setInterval(() => {
      setTimeSpent((prev) => ({
        ...prev,
        [currentQuestionId]: (prev[currentQuestionId] || 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionId, modalType]);

  // --- KEYBOARD SHORTCUTS CONTROLLER ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Disallow shortcuts if typing in any text box or digit pads
      const isInputActive = Boolean(
        document.activeElement && 
        (document.activeElement.tagName === "INPUT" || 
         document.activeElement.tagName === "TEXTAREA" ||
         (document.activeElement as HTMLElement).isContentEditable)
      );

      if (isInputActive) {
        if (event.key === "Escape") {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      const key = event.key.toLowerCase();

      // Subject select options Mapping
      if (activeQuestion && activeQuestion.section === Section.A) {
        if (key === "a" || key === "1") {
          event.preventDefault();
          handleSelectOption("A");
        } else if (key === "b" || key === "2") {
          event.preventDefault();
          handleSelectOption("B");
        } else if (key === "c" || key === "3") {
          event.preventDefault();
          handleSelectOption("C");
        } else if (key === "d" || key === "4") {
          event.preventDefault();
          handleSelectOption("D");
        }
      }

      // Actions Bindings
      if (key === "arrowleft") {
        event.preventDefault();
        moveToPreviousQuestion();
      } else if (key === "arrowright") {
        event.preventDefault();
        moveToNextQuestion();
      } else if (key === "s" || event.key === "Enter") {
        event.preventDefault();
        handleSaveAndNext();
      } else if (key === "m") {
        event.preventDefault();
        handleMarkForReviewAndNext();
      } else if (key === "c" || event.key === "Backspace") {
        event.preventDefault();
        handleClearResponse();
      } else if (key === "i") {
        event.preventDefault();
        setModalType((prev) => (prev === "instructions" ? null : "instructions"));
      } else if (key === "p") {
        event.preventDefault();
        setModalType((prev) => (prev === "questionPaper" ? null : "questionPaper"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeQuestion,
    natInputValue,
    userResponses,
    currentSubject,
    currentQuestionId,
    questions,
  ]);

  // --- PALETTE HELPERS ---
  const getSubjectQuestionsByStatus = (subject: Subject, status: QuestionStatus) => {
    return questions.filter((q) => q.subject === subject && questionStatuses[q.id] === status).length;
  };

  const getStatusCount = (status: QuestionStatus) => {
    return questions.filter((q) => questionStatuses[q.id] === status).length;
  };

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // --- QUESTION NAVIGATION WORKFLOWS ---
  const handleSelectQuestion = (qId: string) => {
    const clickedQ = questions.find((q) => q.id === qId);
    if (!clickedQ) return;

    // Track state transitions for previous question
    updateCurrentStateBeforeLeaving();

    // Select the clicked subject tab if it differed
    if (clickedQ.subject !== currentSubject) {
      setCurrentSubject(clickedQ.subject);
    }

    // Set new active question
    setCurrentQuestionId(qId);

    // Mark clicked question as NOT_ANSWERED if it was never visited
    setQuestionStatuses((prev) => {
      if (prev[qId] === QuestionStatus.NOT_VISITED) {
        return { ...prev, [qId]: QuestionStatus.NOT_ANSWERED };
      }
      return prev;
    });
  };

  const handleSubjectTabChange = (subject: Subject) => {
    updateCurrentStateBeforeLeaving();
    
    setCurrentSubject(subject);
    const subjectQuestionsArr = questions.filter((q) => q.subject === subject);
    if (subjectQuestionsArr.length > 0) {
      const targetQId = subjectQuestionsArr[0].id;
      setCurrentQuestionId(targetQId);

      setQuestionStatuses((prev) => {
        if (prev[targetQId] === QuestionStatus.NOT_VISITED) {
          return { ...prev, [targetQId]: QuestionStatus.NOT_ANSWERED };
        }
        return prev;
      });
    }
  };

  const updateCurrentStateBeforeLeaving = () => {
    if (!activeQuestion) return;

    const answer = userResponses[activeQuestion.id];
    setQuestionStatuses((prev) => {
      const currentStatus = prev[activeQuestion.id];
      
      // If we had answered or marked it, don't auto revert to NOT_ANSWERED
      if (
        currentStatus === QuestionStatus.ANSWERED ||
        currentStatus === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW ||
        currentStatus === QuestionStatus.MARKED_FOR_REVIEW
      ) {
        return prev;
      }
      
      // Otherwise, mark as NOT_ANSWERED since it was visited but had no reply saved
      return { ...prev, [activeQuestion.id]: QuestionStatus.NOT_ANSWERED };
    });
  };

  const moveToNextQuestion = () => {
    const activeIdx = subjectQuestions.findIndex((q) => q.id === activeQuestion.id);
    if (activeIdx < subjectQuestions.length - 1) {
      // Move to next question in same subject
      const nextQId = subjectQuestions[activeIdx + 1].id;
      handleSelectQuestion(nextQId);
    } else {
      // Find next subject
      const subjectsOrder = [Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS];
      const currentSubjectIdx = subjectsOrder.indexOf(currentSubject);
      if (currentSubjectIdx < subjectsOrder.length - 1) {
        const nextSubject = subjectsOrder[currentSubjectIdx + 1];
        handleSubjectTabChange(nextSubject);
      } else {
        // Last question of last subject - recommend submission or prompt instructions
        console.log("Reached the end of the test. User can review questions or click Submit.");
      }
    }
  };

  const moveToPreviousQuestion = () => {
    const activeIdx = subjectQuestions.findIndex((q) => q.id === activeQuestion.id);
    if (activeIdx > 0) {
      const prevQId = subjectQuestions[activeIdx - 1].id;
      handleSelectQuestion(prevQId);
    } else {
      // Find previous subject
      const subjectsOrder = [Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS];
      const currentSubjectIdx = subjectsOrder.indexOf(currentSubject);
      if (currentSubjectIdx > 0) {
        const prevSubject = subjectsOrder[currentSubjectIdx - 1];
        const prevSubjectQs = questions.filter((q) => q.subject === prevSubject);
        if (prevSubjectQs.length > 0) {
          handleSubjectTabChange(prevSubject);
          // Set active as last question of that subject
          const lastQId = prevSubjectQs[prevSubjectQs.length - 1].id;
          handleSelectQuestion(lastQId);
        }
      }
    }
  };

  // --- ACTIONS ---
  // Option Select (Section A MCQ)
  const handleSelectOption = (optionLetter: string) => {
    setUserResponses((prev) => ({
      ...prev,
      [activeQuestion.id]: optionLetter,
    }));
  };

  // 1. CLEAR RESPONSE
  const handleClearResponse = () => {
    // Clear user saved response
    setUserResponses((prev) => {
      const updated = { ...prev };
      delete updated[activeQuestion.id];
      return updated;
    });

    // Reset buffer (for numerical typed questions)
    setNatInputValue("");

    // Set status to NOT_ANSWERED (red)
    setQuestionStatuses((prev) => ({
      ...prev,
      [activeQuestion.id]: QuestionStatus.NOT_ANSWERED,
    }));
  };

  // 2. SAVE AND NEXT
  const handleSaveAndNext = () => {
    const responseToSave = activeQuestion.section === Section.B ? natInputValue.trim() : userResponses[activeQuestion.id];

    if (responseToSave) {
      // Save final response in record
      if (activeQuestion.section === Section.B) {
        setUserResponses((prev) => ({
          ...prev,
          [activeQuestion.id]: responseToSave,
        }));
      }

      // Set status to ANSWERED (green)
      setQuestionStatuses((prev) => ({
        ...prev,
        [activeQuestion.id]: QuestionStatus.ANSWERED,
      }));
    } else {
      // If no response is saved/provided:
      if (activeQuestion.section === Section.B) {
        setUserResponses((prev) => {
          const updated = { ...prev };
          delete updated[activeQuestion.id];
          return updated;
        });
      }
      // Set status to NOT_ANSWERED (red visited)
      setQuestionStatuses((prev) => ({
        ...prev,
        [activeQuestion.id]: QuestionStatus.NOT_ANSWERED,
      }));
    }

    // Sequential jump is always triggered, seamlessly moving to the next question
    moveToNextQuestion();
  };

  // 3. MARK FOR REVIEW AND NEXT
  const handleMarkForReviewAndNext = () => {
    // Determine whether student has already written/selected a reply
    const hasAnswer = activeQuestion.section === Section.B ? natInputValue.trim() !== "" : !!userResponses[activeQuestion.id];

    if (hasAnswer) {
      // Save and Mark for Review (purple with green check)
      if (activeQuestion.section === Section.B) {
        setUserResponses((prev) => ({
          ...prev,
          [activeQuestion.id]: natInputValue.trim(),
        }));
      }

      setQuestionStatuses((prev) => ({
        ...prev,
        [activeQuestion.id]: QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW,
      }));
    } else {
      // Mark for Review without answer (just plain purple circle)
      setQuestionStatuses((prev) => ({
        ...prev,
        [activeQuestion.id]: QuestionStatus.MARKED_FOR_REVIEW,
      }));
    }

    // Sequential jump
    moveToNextQuestion();
  };

  // SUBMIT TEST FINALIZATION
  const handleSubmitTest = () => {
    try {
      localStorage.removeItem("jee_cbt_active_exam");
    } catch (e) {
      console.warn("Could not remove active exam state upon submission:", e);
    }
    onTestSubmit({
      questions,
      userResponses,
      questionStatuses,
      timeSpent,
      timeLeft,
      isCompleted: true,
      testName,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none antialiased">
      {/* RECOMMENDATION TO GO FULLSCREEN FOR LANDSCAPE TRUE SIMULATOR */}
      {!isFullscreen && showFullscreenRecommend && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-4 py-2.5 text-xs font-semibold border-b border-blue-800/60 flex items-center justify-between gap-3 animate-fade-in relative z-[100] shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm shrink-0 animate-pulse">🖥️</span>
            <span>
              <strong>Highly Recommended:</strong> Click <strong className="text-amber-300 font-extrabold underline decoration-amber-400">Go Fullscreen</strong> below or toggle in the header to run this mock test exactly as presented at authentic NTA CBT terminal centers!
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

      {/* -------------------- MAIN APP BAR -------------------- */}
      <header className="bg-[#1a3a5f] text-white flex flex-row items-center justify-between px-3 sm:px-6 h-12 md:h-16 shrink-0 border-b border-[#2c4e75]/40 shadow-sm relative z-10 select-none">
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="bg-white p-0.5 sm:p-1 rounded-sm shrink-0 shadow-sm">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 flex items-center justify-center text-blue-900 font-bold text-[8px] sm:text-[9px] leading-tight text-center italic font-sans animate-pulse">
              JEE<br />MAIN
            </div>
          </div>
          <div className="leading-none text-left">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-white uppercase font-sans truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none" title={testName}>{testName}</h1>
              {questions.some(q => q.isOfflineFallback) && (
                <span className="bg-amber-500 text-slate-950 font-extrabold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded border border-amber-300 shadow-sm shrink-0 uppercase tracking-tight">Offline Mode</span>
              )}
            </div>
            <p className="hidden xs:block text-[8px] sm:text-[10px] opacity-80 uppercase tracking-widest font-semibold mt-0.5">Joint Entrance Exam</p>
          </div>
        </div>

        {/* TIME BAR */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          {/* Authentic Fullscreen switch toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2 py-1 bg-[#2c4e75]/60 hover:bg-[#2c4e75] border border-white/10 hover:border-white/30 text-white rounded text-[8px] sm:text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs shrink-0"
            title={isFullscreen ? "Exit Fullscreen" : "Full Screen Exam Simulation"}
          >
            {isFullscreen ? <Minimize size={10} className="text-amber-400" /> : <Maximize size={10} />}
            <span className="hidden xs:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
          </button>

          <div className="bg-[#2c4e75] px-2 sm:px-4 py-0.5 sm:py-1 rounded border border-white/20 shadow-inner flex flex-col items-center shrink-0">
            <span className="text-[7px] sm:text-[8px] uppercase opacity-75 font-bold tracking-wider leading-none mb-0.5">Time Left</span>
            <span className={`text-[11px] sm:text-sm font-mono font-bold leading-none ${timeLeft < 300 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 border-l border-[#2c3f54] pl-6 shrink-0">
            <div className="text-right leading-tight">
              <p className="text-xs font-bold text-white uppercase">Candidate</p>
              <p className="text-[10px] text-slate-300 font-mono">Roll: 2026CBT</p>
            </div>
            <div className="w-8 h-8 bg-[#e3e9f1] rounded border-2 border-white overflow-hidden flex items-center justify-center shadow-xs">
              <User size={16} className="text-[#1a3a5f]" />
            </div>
          </div>
        </div>
      </header>

      {/* -------------------- SUBJECT TAB FILTERS -------------------- */}
      <nav className="h-8 sm:h-10 bg-[#e3e9f1] border-b border-slate-300 flex items-center justify-between px-2 shrink-0 select-none">
        <div className="flex items-end h-full scrollbar-none overflow-x-auto gap-0.5">
          {[Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS].map((sub) => {
            const isSelected = currentSubject === sub;
            const shortName = sub === Subject.PHYSICS ? "Physics" : sub === Subject.CHEMISTRY ? "Chemistry" : "Maths";
            return (
              <button
                key={sub}
                type="button"
                onClick={() => handleSubjectTabChange(sub)}
                className={`px-2 sm:px-5 h-7 sm:h-9 pb-1 border-t border-x rounded-t transition-all duration-150 cursor-pointer text-[9px] sm:text-[11px] uppercase tracking-wider ${
                  isSelected
                    ? "bg-white border-slate-300 text-[#1a3a5f] font-black pointer-events-none"
                    : "border-transparent text-slate-600 font-bold hover:bg-slate-200/50"
                }`}
              >
                <span className="hidden xs:inline">{sub}</span>
                <span className="inline xs:hidden">{shortName}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-1 items-center shrink-0">
          <button
            onClick={() => setModalType("instructions")}
            className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-[8px] sm:text-[10px] rounded shadow-xs font-bold transition flex items-center gap-0.5 sm:gap-1 cursor-pointer uppercase"
          >
            <Info size={10} />
            <span className="hidden sm:inline">Instructions</span>
          </button>
          <button
            onClick={() => setModalType("questionPaper")}
            className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-[8px] sm:text-[10px] rounded shadow-xs font-bold transition flex items-center gap-0.5 sm:gap-1 cursor-pointer uppercase"
          >
            <Eye size={10} />
            <span>Q Paper</span>
          </button>
        </div>
      </nav>

      {/* -------------------- WORKSPACE WRAPPER -------------------- */}
      <div className="flex-1 flex overflow-hidden bg-white">
        {/* ==================== LEFT AREA (QUESTIONS & RESPONSES) ==================== */}
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200 overflow-hidden h-full">
          {/* Question Meta Row */}
          <div className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex justify-between items-center select-none shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-bold text-xs text-slate-700">Question No. {activeQuestion?.questionNumber}</span>
              {activeQuestion?.topic && (
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100/50">
                  {activeQuestion.topic}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex text-[10px] font-bold text-green-600">+4 CORRECT</span>
              <span className="hidden sm:inline-flex text-[10px] font-bold text-red-600">-1 INCORRECT</span>
              <button
                type="button"
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="px-2 py-0.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-[10px] rounded font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                title={sidebarExpanded ? "Collapse Question Palette to maximize reading space" : "Expand Question Palette"}
              >
                <span>{sidebarExpanded ? "👉 Collapse Palette" : "👈 Expand Palette"}</span>
              </button>
            </div>
          </div>

          {/* QUESTION TEXT AND INPUT AREA (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 select-text bg-white">
            {activeQuestion ? (
              <motion.div 
                key={activeQuestion.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="text-sm text-slate-800 leading-relaxed space-y-6 max-w-4xl"
              >
                {/* Question Area */}
                <div className="font-medium text-[14px]">
                  <MarkdownMath text={activeQuestion.questionText} />
                </div>

                {/* Input Fields */}
                <div className="pt-6 border-t border-slate-100">
                  {activeQuestion.section === Section.A ? (
                    // MCQ option list matching Geometric Balance theme
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                       {activeQuestion.options?.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const isSelected = userResponses[activeQuestion.id] === letter;
                        return (
                          <motion.button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectOption(letter)}
                            whileHover={{ scale: 1.01, x: 4 }}
                            whileTap={{ scale: 0.99 }}
                            className={`p-3.5 text-left border rounded hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors text-xs w-full ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 text-slate-900 font-semibold shadow-xs"
                                : "border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`radio_${activeQuestion.id}`}
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 accent-blue-700 pointer-events-none shrink-0"
                            />
                            <span className="flex-1 select-text ml-0.5">
                              <span className="font-bold text-slate-400 mr-2">({letter})</span>
                              <MarkdownMath text={opt} />
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    // NAT keypad and text box
                    <div className="flex flex-col md:flex-row gap-6 items-start mt-2">
                      <div className="flex-1 w-full bg-slate-50 p-5 rounded border border-slate-200">
                        <label className="block text-xs font-bold text-slate-650 uppercase tracking-wide mb-2 select-none">
                          Input numerical response (Use decimal if required):
                        </label>
                        <input
                          type="text"
                          value={natInputValue}
                          onChange={(e) => setNatInputValue(e.target.value)}
                          placeholder="Type answers here or use keyboard panel"
                          className="w-full text-base font-bold font-mono px-4 py-2.5 border border-slate-300 bg-white rounded shadow-inner focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 outline-hidden"
                        />
                        <div className="mt-2 text-[10px] text-slate-400 select-none">
                          {"* Do not append units or characters. (e.g. For $45\\text{ m/s}$, just type "}<code className="font-mono bg-slate-100 px-1 py-0.5 text-slate-600">45</code>{")"}
                        </div>
                      </div>

                      <div className="shrink-0 self-center md:self-start bg-slate-50 border border-slate-200 p-3 rounded">
                        <VirtualKeyboard value={natInputValue} onChange={setNatInputValue} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center select-none">
                Please wait... Loading question paper modules.
              </div>
            )}
          </div>

          {/* FOOTER BAR OF WORK SPACE containing saving anchors */}
          <footer className="h-auto py-2.5 bg-white border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] select-none gap-2">
            <div className="flex gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={handleMarkForReviewAndNext}
                className="px-2.5 sm:px-5 h-9 sm:h-10 border border-slate-300 rounded text-[10px] sm:text-xs font-bold text-slate-700 hover:bg-slate-50 uppercase tracking-tighter cursor-pointer transition-colors"
              >
                Mark for Review
              </button>
              <button
                type="button"
                onClick={handleClearResponse}
                className="px-2.5 sm:px-5 h-9 sm:h-10 border border-slate-300 rounded text-[10px] sm:text-xs font-bold text-slate-700 hover:bg-slate-50 uppercase tracking-tighter cursor-pointer transition-colors"
              >
                Clear Response
              </button>
            </div>

            <div className="flex gap-2.5 sm:gap-4 items-center justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
              <div className="flex border border-slate-300 rounded overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={moveToPreviousQuestion}
                  className="px-3 h-9 sm:h-10 bg-slate-100 hover:bg-slate-200 border-r border-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                  title="Previous Question"
                >
                  <ChevronLeft size={15} className="text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={moveToNextQuestion}
                  className="px-3 h-9 sm:h-10 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                  title="Next Question"
                >
                  <ChevronRight size={15} className="text-slate-600" />
                </button>
              </div>

              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="px-4 sm:px-8 h-9 sm:h-10 bg-blue-700 hover:bg-blue-800 text-white rounded text-[10px] sm:text-xs font-bold uppercase tracking-tighter cursor-pointer transition-colors"
                >
                  Save & Next
                </button>
                <button
                  type="button"
                  onClick={() => setModalType("submitConfirm")}
                  className="px-4 sm:px-10 h-9 sm:h-10 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] sm:text-xs font-bold uppercase tracking-tighter cursor-pointer transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </footer>
        </div>

        {/* ==================== RIGHT PANEL (PALETTE & LEGENDS) ==================== */}
        <aside className={`${sidebarExpanded ? "w-80 border-l" : "w-0 opacity-0 pointer-events-none border-l-0 hidden"} bg-slate-50 flex flex-col justify-between overflow-hidden h-full border-slate-200 select-none transition-all duration-200`}>
          {/* PROFILE PANEL */}
          <div className="p-4 border-b border-slate-200 bg-slate-100/40 shrink-0 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-300 rounded border-2 border-white overflow-hidden flex items-center justify-center text-slate-500 shrink-0 shadow-inner">
              <User size={20} className="text-[#1a3a5f]" />
            </div>
            <div className="leading-tight text-left">
              <div className="text-xs font-bold text-slate-800">Candidate Workspace</div>
              <div className="text-[10px] text-slate-500 font-medium font-mono">Roll: 2026CBT81739</div>
            </div>
          </div>

          {/* PALETTE SCROLLCONTAINER */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Status Legend Matching Geometric Balance Theme */}
            <div className="grid grid-cols-2 gap-2 pb-4 border-b border-slate-200 shrink-0 text-left">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-600 flex items-center justify-center text-white text-[10px] font-bold rounded-t-lg rounded-b-md">
                  {String(getStatusCount(QuestionStatus.ANSWERED) + getStatusCount(QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW)).padStart(2, "0")}
                </div>
                <span className="text-[10px] text-slate-600 font-semibold">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-600 flex items-center justify-center text-white text-[10px] font-bold rounded-t-lg rounded-b-md">
                  {String(getStatusCount(QuestionStatus.NOT_ANSWERED)).padStart(2, "0")}
                </div>
                <span className="text-[10px] text-slate-600 font-semibold">Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white border border-slate-400 flex items-center justify-center text-slate-600 text-[10px] font-bold rounded-md">
                  {String(getStatusCount(QuestionStatus.NOT_VISITED)).padStart(2, "0")}
                </div>
                <span className="text-[10px] text-slate-600 font-semibold">Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-700 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {String(getStatusCount(QuestionStatus.MARKED_FOR_REVIEW)).padStart(2, "0")}
                </div>
                <span className="text-[10px] text-slate-600 font-semibold">Marked Review</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <div className="w-6 h-6 relative bg-purple-700 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  •
                  <span className="absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 bg-green-600 rounded-full border border-white flex items-center justify-center text-[5px] font-bold text-white">
                    ✓
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 font-semibold leading-tight">Answered & Marked for Review</span>
              </div>
            </div>

            {/* Choose question panel */}
            <div className="flex-1">
              <p className="text-[11px] font-bold text-slate-700 uppercase mb-3 text-left">Choose a Question</p>
              <div className="grid grid-cols-5 gap-2 pr-1">
                {subjectQuestions.map((q) => {
                  const isActive = q.id === activeQuestion.id;
                  const status = questionStatuses[q.id] || QuestionStatus.NOT_VISITED;
                  
                  // Color mapping to Geometric Balance spec
                  let bgStyle = "bg-white border-slate-300 text-slate-600 rounded-md";
                  let checkMark = false;

                  if (status === QuestionStatus.NOT_ANSWERED) {
                    bgStyle = "bg-red-600 border-red-700 text-white font-bold rounded-t-lg rounded-b-md shadow-xs";
                  } else if (status === QuestionStatus.ANSWERED) {
                    bgStyle = "bg-green-600 border-green-700 text-white font-bold rounded-t-lg rounded-b-md shadow-xs";
                  } else if (status === QuestionStatus.MARKED_FOR_REVIEW) {
                    bgStyle = "bg-purple-700 border-purple-800 text-white rounded-full font-bold shadow-xs";
                  } else if (status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW) {
                    bgStyle = "bg-purple-700 border-purple-800 text-white rounded-full font-bold shadow-xs";
                    checkMark = true;
                  } else if (status === QuestionStatus.NOT_VISITED) {
                    bgStyle = "bg-white border-slate-300 text-slate-600 font-bold rounded-md";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSelectQuestion(q.id)}
                      className={`w-9 h-9 border flex items-center justify-center font-mono text-xs cursor-pointer select-none transition relative ${bgStyle} ${
                        isActive ? "ring-2 ring-blue-800 ring-offset-2 scale-[1.05]" : "hover:brightness-95"
                      }`}
                    >
                      <span>{q.questionNumber}</span>
                      {checkMark && (
                        <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 bg-green-500 rounded-full border border-white flex items-center justify-center text-[7px] font-black tracking-tighter shrink-0 z-10 text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KEYBOARD SHORTCUT CHIP CHEAT SHEET */}
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-left flex items-center gap-1.1">
                <span>⌨️</span> <span>Keyboard Shortcuts</span>
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-600 font-medium">
                <div className="bg-slate-100 border border-slate-200/60 rounded p-1.5 text-left flex justify-between items-center">
                  <span>Option Select:</span>
                  <span className="font-mono bg-white px-1 py-0.25 rounded border border-slate-300 font-extrabold text-[#1a3a5f] text-[8.5px]">A / B / C / D</span>
                </div>
                <div className="bg-slate-100 border border-slate-200/60 rounded p-1.5 text-left flex justify-between items-center">
                  <span>Save & Next:</span>
                  <span className="font-mono bg-white px-1 py-0.25 rounded border border-slate-300 font-extrabold text-[#1a3a5f] text-[8.5px] uppercase">S / Enter</span>
                </div>
                <div className="bg-slate-100 border border-slate-200/60 rounded p-1.5 text-left flex justify-between items-center">
                  <span>Prev / Next Q:</span>
                  <span className="font-mono bg-white px-1 py-0.25 rounded border border-slate-300 font-extrabold text-[#1a3a5f] text-[8.5px]">← / →</span>
                </div>
                <div className="bg-slate-100 border border-slate-200/60 rounded p-1.5 text-left flex justify-between items-center">
                  <span>Tag Review:</span>
                  <span className="font-mono bg-white px-1 py-0.25 rounded border border-slate-300 font-extrabold text-[#1a3a5f] text-[8.5px]">M</span>
                </div>
                <div className="bg-slate-100 border border-slate-200/60 rounded p-1.5 text-left flex justify-between items-center col-span-2">
                  <span>Clear Selection:</span>
                  <span className="font-mono bg-white px-1.5 py-0.25 rounded border border-slate-300 font-extrabold text-[#1a3a5f] text-[8.5px] uppercase">Backspace / C</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time MathonGo style Analysis panel at bottom of sidebar */}
          <div className="bg-slate-900 p-4 text-white shrink-0 shadow-inner">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold text-left leading-none mb-2.5">
              Real-time Analysis
            </p>
            <div className="flex items-center justify-between text-left">
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Exam Progress</p>
                <p className="text-base font-black text-emerald-400 mt-0.5">
                  {Math.round((questions.filter(q => questionStatuses[q.id] !== QuestionStatus.NOT_VISITED).length / questions.length) * 100)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-medium font-sans">Avg Speed/Q</p>
                <p className="text-base font-black text-blue-400 mt-0.5">
                  {(() => {
                    const ansCount = questions.filter(
                      (q) =>
                        questionStatuses[q.id] === QuestionStatus.ANSWERED ||
                        questionStatuses[q.id] === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW
                    ).length;
                    const totalSecs = (Object.values(timeSpent) as number[]).reduce((acc: number, val: number) => acc + val, 0);
                    const avg = ansCount > 0 ? Math.round(totalSecs / ansCount) : 0;
                    return avg > 0 ? `${Math.floor(avg / 60)}m ${avg % 60}s` : "0s";
                  })()}
                </p>
              </div>
            </div>
            <div className="mt-2 text-[9px] text-slate-500 font-semibold text-left select-text">
              Candidate Roll: 2026CBT81739
            </div>
            <div className="mt-2.5 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${Math.round(
                    (questions.filter((q) => questionStatuses[q.id] !== QuestionStatus.NOT_VISITED).length / questions.length) * 100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </aside>
      </div>

      {/* -------------------- POPUPS AND MODALS -------------------- */}
      {modalType === "instructions" && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-up">
            <NtaInstructions onClose={() => setModalType(null)} />
          </div>
        </div>
      )}

      {modalType === "questionPaper" && (
        <QuestionPaperModal questions={questions} onClose={() => setModalType(null)} />
      )}

      {modalType === "submitConfirm" && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 select-text">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scale-up leading-relaxed">
            <div className="text-center">
              <AlertTriangle size={36} className="text-amber-500 mx-auto animate-bounce mb-3" />
              <h3 className="font-extrabold text-slate-900 text-sm uppercase">Are you absolutely sure to submit?</h3>
              <p className="text-xs text-slate-500 mt-2 select-text">
                Your examination responses will be locked and saved for scoring. You will immediately access the MathonGo and Competishun-styled analytics reports with step-by-step model solutions.
              </p>

              {/* Counts checklist summary */}
              <div className="mt-4 bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs leading-relaxed text-slate-600 select-text">
                <div className="font-bold text-slate-800 text-[11px] mb-1.5 uppercase">Test Checklist Summary:</div>
                <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-left pl-2">
                  <div>✔ Answered: <span className="font-bold text-emerald-600">{getStatusCount(QuestionStatus.ANSWERED) + getStatusCount(QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW)}</span></div>
                  <div>🔲 Marked (Not evaluated): <span className="font-bold text-indigo-500">{getStatusCount(QuestionStatus.MARKED_FOR_REVIEW)}</span></div>
                  <div>✘ Unanswered: <span className="font-bold text-red-500">{getStatusCount(QuestionStatus.NOT_ANSWERED)}</span></div>
                  <div>⚪ Not Visited: <span className="font-bold text-slate-400">{getStatusCount(QuestionStatus.NOT_VISITED)}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 select-none">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded transition cursor-pointer"
              >
                No, Resume Test
              </button>
              <button
                onClick={handleSubmitTest}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition shadow shadow-emerald-600/20 cursor-pointer"
              >
                Yes, Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default CbtEngine;
