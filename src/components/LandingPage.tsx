/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  GraduationCap, 
  Sparkles, 
  Upload, 
  Play, 
  BarChart3, 
  Target, 
  ShieldCheck, 
  CheckCircle2, 
  BookOpen,
  Clock,
  FileUp,
  Award,
  Video,
  FileText,
  Activity,
  Check,
  Calendar,
  CheckSquare,
  Layers,
  ChevronRight,
  Zap,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Sliders,
  Cpu,
  Compass,
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCheck,
  ChevronLeft,
  Scan,
  Maximize2,
  Eye
} from "lucide-react";

import { MarkdownMath } from "./MathText";
import { UserProfile } from "../types";

interface LandingPageProps {
  onEnterPlatform: (viewStep?: "UPLOAD" | "ANALYTICS" | "RESULTS" | "PREDICTOR" | "VAULT") => void;
  savedPapersCount: number;
  attemptsCount: number;
  userProfile: UserProfile;
  onEditProfile: () => void;
  onPrivacyClick: () => void;
  activeSession?: any;
  onResumeActiveSession?: () => void;
}

// =========================================================================
// INTERACTIVE CANVAS BACKGROUND COMPONENT
// Draws an interactive dot-matrix grid with magnetic cursor physics & glow
// =========================================================================
function InteractiveDotCanvas({ mousePos }: { mousePos: { x: number; y: number } }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const internalMouse = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  // Update target mouse coordinates smoothly
  useEffect(() => {
    internalMouse.current.targetX = mousePos.x;
    internalMouse.current.targetY = mousePos.y;
  }, [mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 900);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    const SPACING = 28;
    const RADIUS_INFLUENCE = 120;

    let time = 0;

    const render = () => {
      time += 0.02;

      // Smooth lerp mouse towards target
      internalMouse.current.x += (internalMouse.current.targetX - internalMouse.current.x) * 0.12;
      internalMouse.current.y += (internalMouse.current.targetY - internalMouse.current.y) * 0.12;

      const mx = internalMouse.current.x;
      const my = internalMouse.current.y;

      ctx.clearRect(0, 0, width, height);

      // Render subtle interactive dots
      const cols = Math.ceil(width / SPACING);
      const rows = Math.ceil(height / SPACING);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const baseX = i * SPACING + (SPACING / 2);
          const baseY = j * SPACING + (SPACING / 2);

          // Distance from mouse pointer
          const dx = mx - baseX;
          const dy = my - baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let drawX = baseX;
          let drawY = baseY;
          let dotRadius = 1.15;
          let alpha = 0.22;
          let isHovered = false;

          // Gentle ambient wave when mouse is away
          const wave = Math.sin(time + i * 0.2 + j * 0.2) * 0.4;

          if (dist < RADIUS_INFLUENCE && dist > 0) {
            const force = (1 - dist / RADIUS_INFLUENCE);
            // Magnetic gentle displacement
            drawX -= (dx / dist) * force * 7;
            drawY -= (dy / dist) * force * 7;

            // Expand dot & illuminate
            dotRadius = 1.15 + force * 2.2;
            alpha = 0.22 + force * 0.7;
            isHovered = true;
          } else {
            drawY += wave;
          }

          ctx.beginPath();
          ctx.arc(drawX, drawY, dotRadius, 0, Math.PI * 2);

          if (isHovered) {
            // Bright electric blue glow on hover
            ctx.fillStyle = `rgba(37, 99, 235, ${alpha.toFixed(2)})`;
          } else {
            // Subtle slate dot
            ctx.fillStyle = `rgba(148, 163, 184, ${alpha.toFixed(2)})`;
          }
          ctx.fill();

          // Connect adjacent illuminated dots with fine lines
          if (isHovered && dist < 70) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${(0.3 * (1 - dist / 70)).toFixed(2)})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(mx, my);
            ctx.stroke();
          }
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
}

// =========================================================================
// MAIN LANDING PAGE COMPONENT
// =========================================================================
export function LandingPage({ 
  onEnterPlatform, 
  savedPapersCount, 
  attemptsCount, 
  userProfile, 
  onEditProfile, 
  onPrivacyClick,
  activeSession,
  onResumeActiveSession
}: LandingPageProps) {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [timerSeconds, setTimerSeconds] = useState(10784); // 02:59:44 countdown
  const [selectedDemoOption, setSelectedDemoOption] = useState<number>(1);
  const [answeredCount, setAnsweredCount] = useState(18);
  const [activeTab, setActiveTab] = useState<"cbt" | "palette" | "keypad" | "analytics">("cbt");
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState<boolean>(false);
  const [slideProgress, setSlideProgress] = useState<number>(0);
  const [demoReattemptChoice, setDemoReattemptChoice] = useState<string | null>(null);
  const [demoSolutionRevealed, setDemoSolutionRevealed] = useState<boolean>(true);

  // Auto-play timer for showcase slides (advances every 7s, pause on hover)
  useEffect(() => {
    if (isAutoPlayPaused) return;
    const tickInterval = 60;
    const totalDuration = 7000;
    const step = (tickInterval / totalDuration) * 100;

    const interval = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((curr) => (curr + 1) % 4);
          return 0;
        }
        return prev + step;
      });
    }, tickInterval);

    return () => clearInterval(interval);
  }, [isAutoPlayPaused]);

  const goToSlide = (idx: number) => {
    setCurrentSlide(idx);
    setSlideProgress(0);
  };

  const handlePrevSlide = () => {
    goToSlide(currentSlide === 0 ? 3 : currentSlide - 1);
  };

  const handleNextSlide = () => {
    goToSlide((currentSlide + 1) % 4);
  };

  // Mouse tracking for interactive background & 3D tilt
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });

  const heroRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Calculate normalized tilt (-1 to 1)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = (x - centerX) / centerX;
    const tiltY = (y - centerY) / centerY;
    setCardTilt({ x: tiltX, y: tiltY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 });
    setCardTilt({ x: 0, y: 0 });
  }, []);

  // Live countdown timer for the floating reminder widget
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 10800));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const hrs = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const secs = String(totalSec % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const supportedInstitutes = [
    { name: "Allen", color: "bg-blue-600 text-white" },
    { name: "Resonance", color: "bg-amber-600 text-white" },
    { name: "FIITJEE", color: "bg-rose-600 text-white" },
    { name: "MathonGo", color: "bg-purple-600 text-white" },
    { name: "Motion", color: "bg-emerald-600 text-white" },
    { name: "Narayana", color: "bg-indigo-600 text-white" },
    { name: "PYQs (2019-2025)", color: "bg-slate-800 text-white" }
  ];

  const faqs = [
    {
      q: "Does this require any PDF reformatting or manual cropping?",
      a: "Zero reformatting required. Drag and drop any coaching mock test paper or official PYQ PDF. The system automatically segments Section A MCQs, Section B integer numericals, LaTeX mathematical formulas, and attached reference diagrams."
    },
    {
      q: "What if my PDF mock test doesn't have an answer key attached?",
      a: "The simulator evaluates questions, auto-suggests answers, and allows instant answer key adjustments inside the test review dashboard. You can also paste an answer key key-sequence (e.g. 1-A, 2-B, 3-C...) in one click."
    },
    {
      q: "Is the interface calibrated to the real 2026 NTA JEE Main pattern?",
      a: "Yes. It accurately replicates the official NTA computer-based exam terminal: 180-minute countdown, the standard 5-state question palettes (Answered, Not Answered, Marked for Review, Answered & Marked for Review, Not Visited), Section A & B rules, and +4/-1 scoring."
    },
    {
      q: "Are my uploaded PDFs and test responses kept private?",
      a: "Completely private. All question extraction, mock history, and responses are processed and stored locally inside your browser's IndexedDB and localStorage. Nothing is shared, sold, or sent to third-party databases."
    },
    {
      q: "Can I practice immediately without uploading a PDF?",
      a: "Yes! Click 'Try Benchmark Exam' to immediately launch a full 75-question full-syllabus JEE Main benchmark test pre-loaded with curated Physics, Chemistry, and Mathematics questions."
    }
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-between text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* ========================================================================= */}
      {/* 0. CHRONOTASK-STYLE CLEAN TOP NAVIGATION BAR (REPLACES OLD DARK APP HEADER) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#fafbfc]/80 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
        {/* Left: Brand & 4-Dot Squircle Icon */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => onEnterPlatform("UPLOAD")}
          title="JEE MockLab Home"
        >
          <div className="w-9 h-9 rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] border border-slate-200/80 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
            <div className="grid grid-cols-2 gap-1 w-full h-full">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            </div>
          </div>
          <div className="text-left">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">JEE MockLab</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full font-semibold">NTA CBT Engine</span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600">
          <button 
            type="button" 
            onClick={() => scrollToSection("features")} 
            className="hover:text-slate-950 transition cursor-pointer"
          >
            Features
          </button>
          <button 
            type="button" 
            onClick={() => scrollToSection("simulator")} 
            className="hover:text-slate-950 transition cursor-pointer"
          >
            CBT Simulator
          </button>
          <button 
            type="button" 
            onClick={() => scrollToSection("workflow")} 
            className="hover:text-slate-950 transition cursor-pointer"
          >
            How It Works
          </button>
          <button 
            type="button" 
            onClick={() => onEnterPlatform("PREDICTOR")} 
            className="hover:text-slate-950 transition cursor-pointer"
          >
            JoSAA Predictor
          </button>
          <button 
            type="button" 
            onClick={() => onEnterPlatform("VAULT")} 
            className="hover:text-slate-950 transition cursor-pointer flex items-center gap-1 font-semibold text-indigo-600"
          >
            <Sparkles size={13} />
            <span>Shift Vault</span>
            <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold">60 PYQs</span>
          </button>
          <button 
            type="button" 
            onClick={() => scrollToSection("faqs")} 
            className="hover:text-slate-950 transition cursor-pointer"
          >
            FAQs
          </button>
        </nav>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Active Exam Quick Jump (if candidate has a test in progress) */}
          {activeSession && onResumeActiveSession && (
            <button
              type="button"
              onClick={onResumeActiveSession}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-full text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Resume Exam</span>
              <span className="text-[10px] font-mono font-semibold">({Math.floor(activeSession.testState.timeLeft / 60)}m)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEnterPlatform("VAULT")}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hidden sm:flex items-center gap-1 px-3 py-2 cursor-pointer transition"
          >
            <Sparkles size={13} />
            <span>60 Shifts Vault</span>
          </button>

          <button
            type="button"
            onClick={() => onEnterPlatform("UPLOAD")}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hidden sm:block px-3 py-2 cursor-pointer transition"
          >
            Upload PDF
          </button>

          <button
            type="button"
            onClick={() => onEnterPlatform("UPLOAD")}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_10px_24px_rgba(37,99,235,0.35)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <span>Launch Simulator</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. CHRONOTASK-INSPIRED HERO SECTION WITH INTERACTIVE BACKGROUND & 3D TILT */}
      {/* ========================================================================= */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden pt-12 pb-24 px-4 sm:px-6 lg:pt-16 lg:pb-32 border-b border-slate-200/70 bg-[#fafbfc] min-h-[580px] flex items-center justify-center"
      >
        {/* INTERACTIVE BACKGROUND CANVAS */}
        <InteractiveDotCanvas mousePos={mousePos} />

        {/* Soft atmospheric gradient wash that subtly follows mouse */}
        <div 
          className="absolute w-[45rem] h-[25rem] bg-gradient-to-b from-blue-100/50 via-indigo-50/20 to-transparent rounded-full blur-3xl pointer-events-none transition-transform duration-300 ease-out -z-10"
          style={{
            top: "30%",
            left: "50%",
            transform: `translate(-50%, -50%) translate3d(${cardTilt.x * 40}px, ${cardTilt.y * 30}px, 0)`
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10 w-full">
          
          {/* Top 3D Embossed App Logo Icon */}
          <div className="flex justify-center mb-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                transform: `perspective(1000px) rotateX(${cardTilt.y * -15}deg) rotateY(${cardTilt.x * 15}deg)`
              }}
              className="w-14 h-14 rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,1)] border border-slate-200/80 flex items-center justify-center p-3 relative group cursor-pointer hover:scale-105 transition-transform"
              onClick={() => onEnterPlatform("UPLOAD")}
              title="JEE CBT Simulator"
            >
              <div className="grid grid-cols-2 gap-1.5 w-full h-full p-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              </div>
            </motion.div>
          </div>

          {/* Central Hero Headline & CTA */}
          <div className="text-center max-w-3xl mx-auto space-y-5 my-4">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.12]"
            >
              Practice, solve, and track <br />
              <span className="text-slate-400 font-bold">all in one place</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl mx-auto font-normal"
            >
              Turn any coaching mock test PDF into an authentic NTA computer-based exam simulator in seconds.
            </motion.p>

            {/* Blue Pill CTA Button */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => onEnterPlatform("VAULT")}
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-semibold rounded-full shadow-[0_10px_25px_rgba(79,70,229,0.25)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                id="hero_shift_vault_cta"
              >
                <Sparkles size={15} />
                <span>Explore 60 Shifts Vault</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">3 Free</span>
              </button>

              <button
                type="button"
                onClick={() => onEnterPlatform("UPLOAD")}
                className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-full border border-slate-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <FileUp size={15} className="text-slate-500" />
                <span>Upload Custom PDF</span>
              </button>
            </motion.div>
          </div>

          {/* ========================================================================= */}
          {/* FLOATING TACTILE WIDGETS WITH 3D MOUSE PARALLAX TILT */}
          {/* ========================================================================= */}
          
          {/* WIDGET 1: TOP LEFT - Study Sticky Note & Paper Folder */}
          <motion.div 
            initial={{ opacity: 0, x: -30, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              transform: `perspective(1000px) rotateX(${cardTilt.y * -12}deg) rotateY(${cardTilt.x * 12}deg) translate3d(${cardTilt.x * -18}px, ${cardTilt.y * -14}px, 0)`
            }}
            whileHover={{ y: -4, rotate: -4 }}
            className="hidden lg:block absolute top-6 -left-4 xl:-left-12 -rotate-3 select-none pointer-events-auto transition-transform duration-150 ease-out"
          >
            <div className="relative">
              {/* Yellow Post-it Note with 3D Red Pushpin */}
              <div className="w-56 bg-[#fef08a] text-amber-950 p-4 rounded-md shadow-[0_12px_24px_rgba(0,0,0,0.08)] border border-amber-200/70 font-sans text-xs relative">
                {/* 3D Red Pushpin */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-600 shadow-md border border-rose-700" />
                  <div className="w-1 h-2 bg-slate-400 absolute top-3" />
                </div>
                <p className="font-medium text-[11px] leading-relaxed italic text-amber-900 pt-1">
                  "Revise rotational inertia: Solid cylinder I = ½MR², Bernoulli's pressure gradient, & organic reaction pathways before mock."
                </p>
              </div>

              {/* White Folded Card Underneath with 3D Checkbox tile */}
              <div className="w-48 bg-white/95 backdrop-blur-xs rounded-2xl p-3.5 shadow-[0_14px_30px_rgba(0,0,0,0.07)] border border-slate-200/80 -mt-6 -ml-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-[0_6px_15px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,1)] border border-slate-100 flex items-center justify-center text-blue-600">
                  <div className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    ✓
                  </div>
                </div>
                <div className="text-left leading-tight">
                  <span className="text-[11px] font-bold text-slate-800 block">Section A MCQs</span>
                  <span className="text-[10px] text-slate-400 font-medium">NTA Standard Format</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* WIDGET 2: TOP RIGHT - Reminders / Countdown Clock Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            style={{
              transform: `perspective(1000px) rotateX(${cardTilt.y * -12}deg) rotateY(${cardTilt.x * 12}deg) translate3d(${cardTilt.x * 18}px, ${cardTilt.y * -14}px, 0)`
            }}
            whileHover={{ y: -4, rotate: 4 }}
            className="hidden lg:block absolute top-6 -right-4 xl:-right-12 rotate-3 select-none pointer-events-auto transition-transform duration-150 ease-out"
          >
            <div className="relative">
              {/* Folder tab card */}
              <div className="w-56 bg-white/95 backdrop-blur-xs rounded-2xl p-4 shadow-[0_16px_36px_rgba(0,0,0,0.08)] border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-100 pb-2">
                  <span>Exam Terminal</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Live</span>
                </div>
                
                <div className="text-left space-y-1">
                  <p className="text-xs font-bold text-slate-800">JEE (Main) Mock Test</p>
                  <p className="text-[10px] text-slate-400">Section 1: Physics • Q.1-25</p>
                </div>

                {/* Blue Time Pill */}
                <div className="bg-sky-50/80 border border-sky-200/60 rounded-xl p-2 flex items-center justify-between text-xs text-sky-900 font-mono font-bold">
                  <span className="text-[10px] font-sans font-semibold text-sky-700">Time Left:</span>
                  <span className="text-xs text-blue-700">{formatTimer(timerSeconds)}</span>
                </div>
              </div>

              {/* 3D Stopwatch Widget Icon Tile hanging over */}
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-white shadow-[0_10px_20px_rgba(0,0,0,0.09),inset_0_1px_1px_rgba(255,255,255,1)] border border-slate-100 flex items-center justify-center text-slate-700">
                <Clock size={20} className="text-slate-700" />
              </div>
            </div>
          </motion.div>

          {/* WIDGET 3: BOTTOM LEFT - Today's Mock Tasks & Question Progress */}
          <motion.div 
            initial={{ opacity: 0, x: -30, y: 40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            style={{
              transform: `perspective(1000px) rotateX(${cardTilt.y * -12}deg) rotateY(${cardTilt.x * 12}deg) translate3d(${cardTilt.x * -18}px, ${cardTilt.y * 14}px, 0)`
            }}
            whileHover={{ y: -4, rotate: 1 }}
            className="hidden lg:block absolute -bottom-12 left-0 xl:left-4 rotate-2 select-none pointer-events-auto transition-transform duration-150 ease-out"
          >
            <div className="w-64 bg-white/95 backdrop-blur-xs rounded-2xl p-4 shadow-[0_16px_36px_rgba(0,0,0,0.08)] border border-slate-200/80 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-100 pb-2">
                <span>Subject Progress</span>
                <span className="text-[10px] font-mono text-slate-500">75 Questions</span>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Physics (MCQ + NAT)</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">80%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="w-4/5 bg-blue-500 h-full rounded-full" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Chemistry (MCQ + NAT)</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">100%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="w-full bg-emerald-500 h-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* WIDGET 4: BOTTOM RIGHT - Supported Coaching Mocks & JoSAA Tile */}
          <motion.div 
            initial={{ opacity: 0, x: 30, y: 40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            style={{
              transform: `perspective(1000px) rotateX(${cardTilt.y * -12}deg) rotateY(${cardTilt.x * 12}deg) translate3d(${cardTilt.x * 18}px, ${cardTilt.y * 14}px, 0)`
            }}
            whileHover={{ y: -4, rotate: -1 }}
            className="hidden lg:block absolute -bottom-12 right-0 xl:right-4 -rotate-2 select-none pointer-events-auto transition-transform duration-150 ease-out"
          >
            <div className="w-64 bg-white/95 backdrop-blur-xs rounded-2xl p-4 shadow-[0_16px_36px_rgba(0,0,0,0.08)] border border-slate-200/80 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-100 pb-2">
                <span>Coaching Papers</span>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">PDF Parser</span>
              </div>

              {/* 3D squircle coaching icons row */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                {supportedInstitutes.slice(0, 4).map((inst, idx) => (
                  <div 
                    key={idx}
                    className="w-12 h-12 rounded-xl bg-white shadow-[0_6px_14px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] border border-slate-100 flex flex-col items-center justify-center text-center p-1"
                    title={inst.name}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${inst.color} flex items-center justify-center text-[7px] font-black mb-0.5`}>
                      {inst.name[0]}
                    </span>
                    <span className="text-[8px] font-bold text-slate-700 truncate w-full">{inst.name}</span>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-slate-400 font-medium pt-1 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>KaTeX Math & NATs Supported</span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. AUTHENTIC CBT PLATFORM SUITE - INTERACTIVE PRODUCTION SHOWCASE */}
      {/* ========================================================================= */}
      <section 
        id="simulator" 
        className="py-20 px-4 sm:px-6 max-w-5xl mx-auto text-left"
        onMouseEnter={() => setIsAutoPlayPaused(true)}
        onMouseLeave={() => setIsAutoPlayPaused(false)}
      >
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2.5">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <span>CBT Platform Suite</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            The Genuine Test-Day Terminal. Down to the Pixel.
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto">
            Engineered to replicate the exact National Testing Agency (NTA) candidate experience — official evaluation palettes, Section B numerical keypads, and instant diagnostic scorecards.
          </p>
        </div>

        {/* REFINED SEGMENTED PILL CONTROLS (LINEAR / APPLE STYLE) */}
        <div className="flex justify-center mb-8 select-none">
          <div className="p-1 bg-slate-100 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-center gap-1 max-w-2xl shadow-xs">
            {[
              { id: 0, label: "Section A: Single Choice" },
              { id: 1, label: "Section B: Integer Keypad" },
              { id: 2, label: "Official 5-Color Palette" },
              { id: 3, label: "Diagnostic Scorecard" },
            ].map((slide) => {
              const isActive = currentSlide === slide.id;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(slide.id)}
                  className={`relative px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    isActive 
                      ? "text-white shadow-xs" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeSlideIndicator"
                      className="absolute inset-0 bg-slate-900 rounded-xl"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{slide.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AUTHENTIC CANDIDATE TERMINAL SHELL */}
        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/8 overflow-hidden">
          
          {/* Subtle Candidate Header Bar */}
          <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
              <span className="ml-2 font-mono text-[11px] text-slate-500 font-semibold hidden sm:inline">
                Candidate: JEE ASPIRANT • Roll: 240310084920 • JEE (Main) Shift-1
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Live Terminal
              </span>
              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="w-6 h-6 bg-white hover:bg-slate-200 border border-slate-200 rounded flex items-center justify-center text-slate-600 transition cursor-pointer"
                  title="Previous Slide"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="w-6 h-6 bg-white hover:bg-slate-200 border border-slate-200 rounded flex items-center justify-center text-slate-600 transition cursor-pointer"
                  title="Next Slide"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* SLIDE CONTENT AREA */}
          <div className="relative min-h-[460px]">
            <AnimatePresence mode="wait">

              {/* ======================================================== */}
              {/* SLIDE 0: SECTION A (SINGLE CHOICE MCQ)                   */}
              {/* ======================================================== */}
              {currentSlide === 0 && (
                <motion.div
                  key="slide-section-a"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full"
                >
                  {/* Authentic NTA Header Strip */}
                  <div className="bg-[#1e3a8a] text-white px-5 py-2.5 flex items-center justify-between text-xs select-none">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="px-3 py-1 bg-white/20 rounded-md text-[11px]">Physics (Q.1-25)</span>
                      <span className="px-3 py-1 text-white/70 hover:bg-white/10 rounded-md text-[11px] hidden xs:inline cursor-pointer">Chemistry</span>
                      <span className="px-3 py-1 text-white/70 hover:bg-white/10 rounded-md text-[11px] hidden sm:inline cursor-pointer">Mathematics</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-xs bg-black/25 px-2.5 py-1 rounded-md border border-amber-400/20">
                      <Clock size={12} />
                      <span>Time Left: {formatTimer(timerSeconds)}</span>
                    </div>
                  </div>

                  {/* Body: Question + Official Palette */}
                  <div className="grid grid-cols-1 md:grid-cols-12 bg-white text-slate-800 p-6 sm:p-7 gap-6">
                    <div className="md:col-span-8 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">Question No. 7</span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Single Choice (MCQ)</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">Marks: <strong className="text-emerald-600">+4</strong>, <strong className="text-rose-600">-1</strong></span>
                      </div>

                      <div className="space-y-4">
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans select-text">
                          A uniform solid cylinder of mass <span className="font-mono text-blue-700 font-semibold">M = 2 kg</span> and radius <span className="font-mono text-blue-700 font-semibold">R = 0.2 m</span> rolls without slipping down an inclined plane of angle <span className="font-mono text-blue-700 font-semibold">θ = 30°</span>. The magnitude of the frictional force acting on the cylinder is:
                        </p>

                        {/* Interactive Options */}
                        <div className="space-y-2 pt-1 text-xs">
                          {[
                            { key: 1, text: "(1)  (1/3) M g sin(30°)" },
                            { key: 2, text: "(2)  (1/2) M g sin(30°)" },
                            { key: 3, text: "(3)  (2/3) M g sin(30°)" },
                            { key: 4, text: "(4)  M g sin(30°)" }
                          ].map((opt) => (
                            <div 
                              key={opt.key}
                              onClick={() => {
                                setSelectedDemoOption(opt.key);
                                setAnsweredCount(19);
                              }}
                              className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer select-none ${
                                selectedDemoOption === opt.key 
                                  ? "bg-blue-50/70 border-blue-500 text-blue-950 font-semibold shadow-xs" 
                                  : "bg-slate-50/50 border-slate-200 text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${
                                selectedDemoOption === opt.key ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                              }`}>
                                {selectedDemoOption === opt.key && "✓"}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* NTA Action Bar */}
                      <div className="flex flex-wrap items-center gap-2 pt-3 text-[11px]">
                        <button
                          type="button"
                          onClick={() => onEnterPlatform("UPLOAD")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-xs cursor-pointer active:scale-95"
                        >
                          Save & Next →
                        </button>
                        <button
                          type="button"
                          onClick={() => onEnterPlatform("UPLOAD")}
                          className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-semibold transition cursor-pointer"
                        >
                          Mark for Review
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDemoOption(0)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium transition cursor-pointer"
                        >
                          Clear Response
                        </button>
                      </div>
                    </div>

                    {/* Official 25-Question Palette */}
                    <div className="md:col-span-4 bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3.5">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
                        Official Question Palette
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-4 bg-emerald-600 rounded-xs text-white text-[9px] font-bold flex items-center justify-center">{answeredCount}</span>
                          <span>Answered</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-4 bg-rose-600 rounded-xs text-white text-[9px] font-bold flex items-center justify-center">2</span>
                          <span>Not Answered</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-4 bg-purple-600 rounded-xs text-white text-[9px] font-bold flex items-center justify-center">1</span>
                          <span>Marked Review</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-4 bg-slate-300 rounded-xs text-slate-700 text-[9px] font-bold flex items-center justify-center">{25 - answeredCount - 3}</span>
                          <span>Not Visited</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {Array.from({ length: 25 }, (_, i) => {
                          const qNum = i + 1;
                          let style = "bg-slate-200 text-slate-600";
                          if (qNum <= answeredCount) style = "bg-emerald-600 text-white font-bold";
                          else if (qNum === 20) style = "bg-purple-600 text-white font-bold";
                          else if (qNum === 21) style = "bg-rose-600 text-white font-bold";

                          if (qNum === 7) style += " ring-2 ring-blue-500 ring-offset-1";

                          return (
                            <div 
                              key={qNum}
                              className={`h-7 rounded-md flex items-center justify-center text-xs font-mono select-none ${style}`}
                            >
                              {qNum}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Physics: 25 Qs</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">+4 / -1 Scoring</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ======================================================== */}
              {/* SLIDE 1: SECTION B (NUMERICAL ANSWER TYPE KEYPAD)        */}
              {/* ======================================================== */}
              {currentSlide === 1 && (
                <motion.div
                  key="slide-section-b"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full"
                >
                  <div className="bg-[#1e3a8a] text-white px-5 py-2.5 flex items-center justify-between text-xs select-none">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="px-3 py-1 bg-white/20 rounded-md text-[11px]">Physics (Q.21-30 NAT)</span>
                      <span className="px-3 py-1 text-white/70 hover:bg-white/10 rounded-md text-[11px] hidden xs:inline cursor-pointer">Chemistry</span>
                      <span className="px-3 py-1 text-white/70 hover:bg-white/10 rounded-md text-[11px] hidden sm:inline cursor-pointer">Mathematics</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-xs bg-black/25 px-2.5 py-1 rounded-md border border-amber-400/20">
                      <Clock size={12} />
                      <span>Time Left: {formatTimer(timerSeconds)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 bg-white text-slate-800 p-6 sm:p-7 gap-6">
                    <div className="md:col-span-8 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">Question No. 21</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Section B: Numerical Answer Type
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">Marks: <strong className="text-emerald-600">+4</strong>, <strong className="text-rose-600">-1</strong></span>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-blue-50/70 border border-blue-150 p-2.5 rounded-xl text-xs text-blue-900">
                          <strong>Official NTA Instruction:</strong> Attempt any 5 out of 10 questions in Section B. Answer must be entered via on-screen virtual keypad.
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans select-text">
                          A particle moves along the x-axis with an acceleration given by <span className="font-mono text-blue-700 font-semibold">a(t) = 6t + 4</span> m/s². At <span className="font-mono text-blue-700 font-semibold">t = 0</span>, its initial velocity is <span className="font-mono text-blue-700 font-semibold">v(0) = 2</span> m/s. The displacement of the particle between <span className="font-mono text-blue-700 font-semibold">t = 0</span> and <span className="font-mono text-blue-700 font-semibold">t = 2</span> seconds is <span className="font-mono text-emerald-700 font-bold underline">16.00</span> meters.
                        </p>

                        {/* Candidate On-Screen Virtual Keypad */}
                        <div className="max-w-xs bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Candidate Keypad</span>
                            <span className="text-[9px] text-slate-400 font-mono">Virtual Input</span>
                          </div>
                          <div className="bg-white border border-slate-300 rounded-lg p-2.5 text-right font-mono text-lg font-black text-blue-900 shadow-inner">
                            16.00
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-700">
                            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((key) => (
                              <div key={key} className="h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-2xs hover:bg-slate-100 transition cursor-pointer select-none">
                                {key}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-3 text-[11px]">
                        <button
                          type="button"
                          onClick={() => onEnterPlatform("UPLOAD")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-xs cursor-pointer active:scale-95"
                        >
                          Save & Next →
                        </button>
                        <button
                          type="button"
                          onClick={() => onEnterPlatform("UPLOAD")}
                          className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-semibold transition cursor-pointer"
                        >
                          Mark for Review
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium transition cursor-pointer"
                        >
                          Clear Response
                        </button>
                      </div>
                    </div>

                    {/* Section B Palette */}
                    <div className="md:col-span-4 bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Section B NAT Palette</span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">3 / 5 Attempted</span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-tight">
                        You can attempt up to 5 questions out of the 10 available numericals.
                      </p>

                      <div className="grid grid-cols-5 gap-1.5 pt-2">
                        {Array.from({ length: 10 }, (_, i) => {
                          const qNum = i + 21;
                          let style = "bg-slate-200 text-slate-600";
                          if (qNum <= 23) style = "bg-emerald-600 text-white font-bold";
                          if (qNum === 21) style += " ring-2 ring-blue-500 ring-offset-1";

                          return (
                            <div 
                              key={qNum}
                              className={`h-8 rounded-md flex items-center justify-center text-xs font-mono select-none ${style}`}
                            >
                              {qNum}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Attempt Limit:</span>
                          <strong className="text-slate-800">5 Questions Max</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Marking Scheme:</span>
                          <strong className="text-emerald-700">+4 / -1 NTA Standard</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ======================================================== */}
              {/* SLIDE 2: OFFICIAL 5-COLOR PALETTE MATRIX                */}
              {/* ======================================================== */}
              {currentSlide === 2 && (
                <motion.div
                  key="slide-palette-matrix"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full bg-white p-6 sm:p-8 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">
                        Official NTA 5-Color Candidate Evaluation Protocol
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Avoid losing marks: know exactly which question states are evaluated by the NTA scoring server.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                      75 Questions Total
                    </span>
                  </div>

                  {/* 5-Color State Detailed Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                      <div className="w-6 h-5 bg-emerald-600 text-white rounded text-[10px] font-bold flex items-center justify-center font-mono">18</div>
                      <strong className="text-emerald-900 block font-bold text-xs">Answered</strong>
                      <p className="text-[10px] text-emerald-700 leading-tight">Will be evaluated for +4 / -1 marks.</p>
                    </div>

                    <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
                      <div className="w-6 h-5 bg-rose-600 text-white rounded text-[10px] font-bold flex items-center justify-center font-mono">6</div>
                      <strong className="text-rose-900 block font-bold text-xs">Not Answered</strong>
                      <p className="text-[10px] text-rose-700 leading-tight">Visited but skipped. 0 marks deducted.</p>
                    </div>

                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5">
                      <div className="w-6 h-5 bg-purple-600 text-white rounded text-[10px] font-bold flex items-center justify-center font-mono">2</div>
                      <strong className="text-purple-900 block font-bold text-xs">Marked Review</strong>
                      <p className="text-[10px] text-purple-700 leading-tight">No answer marked. Will NOT be evaluated.</p>
                    </div>

                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5 relative overflow-hidden">
                      <div className="w-6 h-5 bg-purple-600 text-white rounded text-[10px] font-bold flex items-center justify-center font-mono relative">
                        4
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-1 ring-white" />
                      </div>
                      <strong className="text-indigo-900 block font-bold text-xs">Ans & Review</strong>
                      <p className="text-[10px] text-indigo-700 leading-tight">Answer saved. EVALUATED by NTA server!</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="w-6 h-5 bg-slate-300 text-slate-700 rounded text-[10px] font-bold flex items-center justify-center font-mono">14</div>
                      <strong className="text-slate-800 block font-bold text-xs">Not Visited</strong>
                      <p className="text-[10px] text-slate-500 leading-tight">Not yet opened by candidate. 0 marks.</p>
                    </div>
                  </div>

                  {/* Complete 75-Question Simulation Matrix */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Full Exam Palette Matrix (Physics: Q.1-25 | Chemistry: Q.26-50 | Mathematics: Q.51-75)</span>
                      <span className="text-[10px] text-slate-400 font-mono">Live Grid</span>
                    </div>

                    <div className="grid grid-cols-15 sm:grid-cols-25 gap-1 pt-1">
                      {Array.from({ length: 75 }, (_, i) => {
                        const num = i + 1;
                        let bg = "bg-slate-200 text-slate-600";
                        if (num <= 18 || (num >= 26 && num <= 40)) bg = "bg-emerald-600 text-white font-bold";
                        else if (num === 20 || num === 45) bg = "bg-rose-600 text-white font-bold";
                        else if (num === 21 || num === 50) bg = "bg-purple-600 text-white font-bold";
                        else if (num === 22) bg = "bg-purple-600 text-white font-bold ring-2 ring-emerald-400";

                        return (
                          <div key={num} className={`h-6 rounded text-[9px] font-mono flex items-center justify-center select-none ${bg}`}>
                            {num}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ======================================================== */}
              {/* SLIDE 3: DIAGNOSTIC SCORECARD & SILLY ERROR AUDIT        */}
              {/* ======================================================== */}
              {currentSlide === 3 && (
                <motion.div
                  key="slide-scorecard"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full bg-white p-6 sm:p-8 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">
                        Instant Post-Exam Diagnostic Scorecard
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Generated immediately upon paper submission — calibrated against All-India percentile benchmarks.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      Test Submitted
                    </span>
                  </div>

                  {/* 4-Pillar Score Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Exam Raw Score</span>
                      <div className="text-2xl font-black text-slate-800 mt-0.5">
                        184 <span className="text-xs text-slate-400 font-semibold">/ 300</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 mt-1 block">+196 gross points</span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Calibrated Percentile</span>
                      <div className="text-2xl font-black text-indigo-700 mt-0.5">99.2%ile</div>
                      <span className="text-[10px] font-bold text-slate-500 mt-1 block">AIR ~11,200 (Allen Scale)</span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Precision Accuracy</span>
                      <div className="text-2xl font-black text-blue-700 mt-0.5">82%</div>
                      <span className="text-[10px] font-bold text-slate-500 mt-1 block">54 / 75 Attempted</span>
                    </div>

                    <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-rose-600 block">Negative Penalty</span>
                      <div className="text-2xl font-black text-rose-600 mt-0.5">-12 Marks</div>
                      <span className="text-[10px] font-bold text-rose-700 mt-1 block">12 Silly errors audited</span>
                    </div>
                  </div>

                  {/* Subject Velocity Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Physics</span>
                        <span className="text-blue-700">+58 Marks</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>15 Correct • 2 Wrong</span>
                        <span>88% Accuracy</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Chemistry</span>
                        <span className="text-blue-700">+72 Marks</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>18 Correct • 0 Wrong</span>
                        <span>100% Accuracy</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Mathematics</span>
                        <span className="text-blue-700">+54 Marks</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>14 Correct • 2 Wrong</span>
                        <span>87% Accuracy</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Total Test Time: <strong>2h 38m</strong> • Average <strong>2m 06s</strong> per question
                    </span>
                    <button
                      type="button"
                      onClick={() => onEnterPlatform("UPLOAD")}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>Launch Your First Mock Paper</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Minimalist Bottom Control Strip */}
          <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500 select-none">
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((dot) => (
                <button
                  key={dot}
                  type="button"
                  onClick={() => goToSlide(dot)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentSlide === dot ? "w-6 bg-slate-800" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                  aria-label={`Slide ${dot + 1}`}
                />
              ))}
              <span className="text-[10px] text-slate-400 ml-2 font-mono">
                {isAutoPlayPaused ? "Paused" : "Auto-advance"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onEnterPlatform("UPLOAD")}
              className="text-slate-800 hover:text-blue-600 font-bold inline-flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Open Simulator</span>
              <ArrowRight size={12} />
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 OFFICIAL SHIFT VAULT SHOWCASE SECTION (60 SHIFTS • 3 FREE FLAGSHIPS) */}
      {/* ========================================================================= */}
      <section className="py-20 bg-linear-to-b from-white via-indigo-50/20 to-slate-50 border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              <Sparkles size={14} className="text-indigo-600" />
              <span>OFFICIAL NTA ARCHIVE • 60 SHIFTS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Real JEE Main 2024, 2025 &amp; 2026 Shift Papers
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
              Simulate actual shift competition under real 3-hour timer conditions. Includes strict pattern calibration across the NTA transition (Legacy 90 Qs with optional Section B vs New 75 Qs mandatory).
            </p>
          </div>

          {/* 3 Flagship Highlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* 2026 Flagship */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-300 shadow-[0_10px_30px_rgba(16,185,129,0.08)] flex flex-col justify-between space-y-5 relative overflow-hidden group hover:border-emerald-400 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    ★ Official 2026 Flagship
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">75 Qs</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  2026 • 28 Jan Shift 1
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Calibrated benchmark for the 2026 standard. Section B has exactly 5 mandatory numericals per subject.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>99.0%ile: <strong className="text-slate-800">194 marks</strong></span>
                  <span className="text-emerald-600 font-bold">100% Free</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEnterPlatform("VAULT")}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <span>Take Free Test Drive</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* 2025 Flagship */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-200 shadow-[0_10px_30px_rgba(37,99,235,0.06)] flex flex-col justify-between space-y-5 relative overflow-hidden group hover:border-blue-300 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                    ★ Official 2025 Flagship
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">75 Qs</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  2025 • 24 Jan Shift 1
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Landmark shift marking the historic first implementation of the 75-question standard.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>99.0%ile: <strong className="text-slate-800">186 marks</strong></span>
                  <span className="text-emerald-600 font-bold">100% Free</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEnterPlatform("VAULT")}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <span>Take Free Test Drive</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* 2024 Flagship */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200 shadow-[0_10px_30px_rgba(245,158,11,0.06)] flex flex-col justify-between space-y-5 relative overflow-hidden group hover:border-amber-300 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase tracking-wider">
                    ★ Official 2024 Flagship
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">90 Qs</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  2024 • 27 Jan Shift 1
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The infamous record-high cutoff shift. 30 Qs per subject with attempt 5 of 10 in Section B.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>99.0%ile: <strong className="text-slate-800">236 marks</strong></span>
                  <span className="text-emerald-600 font-bold">100% Free</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEnterPlatform("VAULT")}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <span>Take Free Test Drive</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Bottom All-Access Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={13} />
                <span>All 60 Official Shifts (Session 1 &amp; 2)</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold">
                Unlock the Complete 2024–2026 PYQ Shift Vault
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                Get lifetime access to all 60 NTA shift papers with Allen percentile curves and step-by-step KaTeX solutions for only ₹199 (or 20 Credits).
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEnterPlatform("VAULT")}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0 flex items-center gap-2"
            >
              <span>Explore All 60 Shifts</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TACTILE BENTO GRID (CORE FEATURES IN MODERN SAAS CARDS) */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 bg-slate-50/60 border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
              Core Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered specifically for JEE Candidates
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Everything you need to convert passive PDF reading into active, high-percentile test-taking skill.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Wide 2-Column Spotlight - PDF Ingestion */}
            <div className="md:col-span-2 bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] space-y-5 text-left relative overflow-hidden group hover:border-slate-300 transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <FileUp size={24} />
              </div>

              <div className="space-y-1.5 max-w-lg">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Universal Coaching PDF Parser
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Drop any mock test PDF from Allen, Resonance, FIITJEE, MathonGo, Motion, Narayana, or official NTA PYQs. Questions, LaTeX math equations, and diagrams are parsed with zero manual cropping.
                </p>
              </div>

              {/* Supported Institutes Chips */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tested & Calibrated With</span>
                <div className="flex flex-wrap gap-2">
                  {supportedInstitutes.map((inst, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <span className={`w-2 h-2 rounded-full ${inst.color}`} />
                      <span>{inst.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bento Card 2: 1:1 Exam Terminal */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] space-y-4 text-left hover:border-slate-300 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Clock size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Authentic 180-Min Pressure
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Replicates the exact timing pressure, Section A/B rules, question navigation, and virtual numerical keypad of real NTA test centers.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-2.5">
                <CheckCircle2 size={16} />
                <span>Zero Exam Day Nervousness</span>
              </div>
            </div>

            {/* Bento Card 3: Negative Mark Leak Detector */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] space-y-4 text-left hover:border-slate-300 transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Negative Mark Leak Detector
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Identifies how many marks were lost to unforced negative guesses vs calculated risks, pinpointing exactly where your score leaked.
              </p>
              <div className="pt-1 space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Accuracy Rate</span>
                  <span className="text-blue-600 font-bold">84%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="w-[84%] bg-blue-600 h-full rounded-full" />
                </div>
              </div>
            </div>

            {/* Bento Card 4: JoSAA College & Rank Matrix */}
            <div className="md:col-span-2 bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] space-y-4 text-left hover:border-slate-300 transition">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <GraduationCap size={24} />
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                  JoSAA 2020-2025 Matrix
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Instant Percentile & JoSAA Seat Prediction
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
                Scores are mapped against historical JEE Main percentiles and JoSAA Round 6 closing ranks to show eligible IIT, NIT, and IIIT programs right after test submission.
              </p>
              
              {/* Sample prediction chip */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block font-semibold">Predicted Percentile</span>
                  <span className="text-base font-extrabold text-blue-600">99.12 %ile</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block font-semibold">Estimated AIR</span>
                  <span className="text-base font-extrabold text-slate-800">~10,400</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block font-semibold">Top Eligible College</span>
                  <span className="text-xs font-bold text-emerald-700">NIT Trichy (ECE)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. VISUAL 3-STEP WORKFLOW TIMELINE */}
      {/* ========================================================================= */}
      <section id="workflow" className="py-20 bg-white border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
              Workflow
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From PDF to CBT in 30 seconds
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Three seamless steps to transform any PDF question paper into genuine test day practice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-4 text-left shadow-2xs hover:bg-white hover:shadow-md transition">
              <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-blue-700 font-black text-sm flex items-center justify-center">
                01
              </div>
              <h3 className="font-bold text-base text-slate-900">1. Drag & Drop Mock PDF</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload any paper from Allen, Resonance, FIITJEE, MathonGo or PYQs. Questions and KaTeX math formulas are isolated automatically.
              </p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-4 text-left shadow-2xs hover:bg-white hover:shadow-md transition">
              <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-blue-700 font-black text-sm flex items-center justify-center">
                02
              </div>
              <h3 className="font-bold text-base text-slate-900">2. Solve with NTA Timer</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Practice under authentic CBT testing conditions: full-screen layout, 5-color status palette, and Section B integer keypads.
              </p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-4 text-left shadow-2xs hover:bg-white hover:shadow-md transition">
              <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-blue-700 font-black text-sm flex items-center justify-center">
                03
              </div>
              <h3 className="font-bold text-base text-slate-900">3. Review & Predict Ranks</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Get an instant +4/-1 score calculation, sub-topic accuracy tables, time-spent analysis, and eligible NIT/IIIT cutoffs.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TACTILE SAAS COMPARISON TABLE (PDF ON PAPER VS JEE MOCKLAB) */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-50/50 border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-10 text-left">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
              Why It Matters
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why solving on paper costs marks
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Compare solving coaching PDFs manually on paper versus taking them on JEE MockLab.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_12px_32px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-100/80 text-slate-700 text-xs font-bold px-6 py-3.5 border-b border-slate-200">
              <div className="col-span-6 sm:col-span-5">Feature / Dimension</div>
              <div className="col-span-3 sm:col-span-3 text-slate-400">Paper / Tablet PDF</div>
              <div className="col-span-3 sm:col-span-4 text-blue-700">JEE MockLab CBT</div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {[
                { feature: "Time Pressure & Speed Pacing", bad: "Casual / Paused", good: "Exact 180 min countdown" },
                { feature: "Question Palette Awareness", bad: "Manual Page Ticking", good: "Official 5-State NTA Palette" },
                { feature: "Section B Integer Questions", bad: "Rough Notebook Scratch", good: "NTA Virtual Keypad" },
                { feature: "Negative Mark Leak Analysis", bad: "Manual calculation", good: "Instant unforced leak audit" },
                { feature: "Percentile & College Prediction", bad: "Total guesswork", good: "JoSAA Round 6 Historical Data" }
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-slate-50/50 transition">
                  <div className="col-span-6 sm:col-span-5 font-semibold text-slate-800">{row.feature}</div>
                  <div className="col-span-3 sm:col-span-3 text-slate-400 flex items-center gap-1.5">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span className="truncate">{row.bad}</span>
                  </div>
                  <div className="col-span-3 sm:col-span-4 text-emerald-700 font-bold flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{row.good}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CANDID STUDENT FAQS */}
      {/* ========================================================================= */}
      <section id="faqs" className="py-20 bg-white border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-left space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
              FAQs
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Honest answers to common questions about mock uploads, answer keys, and privacy.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="bg-slate-50/60 border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs cursor-pointer transition hover:border-slate-300"
              >
                <div className="p-4 sm:p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800">
                  <span className="pr-4">{faq.q}</span>
                  <span className="text-blue-600 text-base font-black shrink-0">
                    {faqOpen === idx ? "−" : "+"}
                  </span>
                </div>
                {faqOpen === idx && (
                  <div className="p-5 pt-0 border-t border-slate-200/60 text-xs sm:text-sm text-slate-600 leading-relaxed select-text">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. HIGH-CONVERSION BOTTOM CALL TO ACTION BANNER (LIGHT & TACTILE) */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 bg-[#fafbfc] border-t border-slate-200/80 text-center select-none relative overflow-hidden">
        <div className="max-w-3xl mx-auto rounded-3xl p-8 sm:p-12 bg-linear-to-b from-blue-50/60 via-indigo-50/40 to-white border border-blue-200/60 shadow-[0_16px_40px_rgba(37,99,235,0.06)] space-y-6 relative z-10">
          
          <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200/80 flex items-center justify-center mx-auto text-blue-600">
            <GraduationCap size={28} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Ready to take your mock tests seriously?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
              Stop solving PDFs passively on paper. Upload your coaching test paper now or launch our benchmark exam to build genuine exam day confidence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onEnterPlatform("UPLOAD")}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.4)] cursor-pointer transition flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Upload Mock Test PDF</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onEnterPlatform("PREDICTOR")}
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 rounded-full text-xs sm:text-sm font-semibold cursor-pointer transition shadow-2xs"
            >
              <span>Explore JoSAA Cutoffs</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. STATUTORY DISCLAIMER FOOTER (CLEAN SLATE MINIMALIST) */}
      {/* ========================================================================= */}
      <footer className="bg-white text-slate-500 text-[11px] py-10 px-6 border-t border-slate-200 select-text text-left">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100 text-slate-400">
            <div className="space-y-1.5">
              <strong className="text-slate-700 text-xs font-bold block uppercase tracking-wider">Independent Testing Tool Disclaimer</strong>
              <p className="leading-relaxed text-[11px]">
                This simulated testing platform is an independent student study tool. It is <strong>not affiliated with, endorsed by, or connected to the National Testing Agency (NTA)</strong> or the Joint Seat Allocation Authority (JoSAA) in any capacity.
              </p>
            </div>
            <div className="space-y-1.5">
              <strong className="text-slate-700 text-xs font-bold block uppercase tracking-wider">Percentile & Cutoff Estimates</strong>
              <p className="leading-relaxed text-[11px]">
                Ranks, percentiles, and college allotments are algorithmic projections calculated from past JoSAA seat allocation trends. Actual qualifying cutoffs and seat allotments are governed strictly by statutory authorities.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs select-none">
            <span>&copy; {new Date().getFullYear()} JEE MockLab. Built for JEE Aspirants.</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onPrivacyClick}
                className="hover:text-slate-700 hover:underline cursor-pointer transition"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onEnterPlatform("UPLOAD")}
                className="hover:text-slate-700 hover:underline cursor-pointer transition"
              >
                Practice Hub
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onEnterPlatform("PREDICTOR")}
                className="hover:text-slate-700 hover:underline cursor-pointer transition"
              >
                JoSAA Predictor
              </button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
