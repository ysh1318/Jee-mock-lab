/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ArrowRight, 
  GraduationCap, 
  Sparkles, 
  Upload, 
  Play, 
  BarChart3, 
  Target, 
  ShieldCheck, 
  Layers, 
  Lock, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen,
  Compass,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Award,
  Maximize,
  Minimize,
  Star,
  Clock,
  Flame,
  Users,
  Calendar
} from "lucide-react";

import { UserProfile } from "../types";

interface LandingPageProps {
  onEnterPlatform: (viewStep?: "UPLOAD" | "ANALYTICS") => void;
  savedPapersCount: number;
  attemptsCount: number;
  userProfile: UserProfile;
  onEditProfile: () => void;
  onPrivacyClick: () => void;
}

export function LandingPage({ onEnterPlatform, savedPapersCount, attemptsCount, userProfile, onEditProfile, onPrivacyClick }: LandingPageProps) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  
  // Fullscreen support logic
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);
  const [showFullscreenRecommend, setShowFullscreenRecommend] = useState(true);

  // FOMO urgency countdown state
  const [countdownMinutes, setCountdownMinutes] = useState(14);
  const [countdownSeconds, setCountdownSeconds] = useState(52);
  const [fomoPacksLeft, setFomoPacksLeft] = useState(45);

  React.useEffect(() => {
    const timer = setInterval(() => {
      if (countdownSeconds > 0) {
        setCountdownSeconds(prev => prev - 1);
      } else if (countdownMinutes > 0) {
        setCountdownMinutes(prev => prev - 1);
        setCountdownSeconds(59);
      } else {
        setCountdownMinutes(14);
        setCountdownSeconds(52);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSeconds, countdownMinutes]);

  React.useEffect(() => {
    // Slowly decrease packs left to increase real intensity, bounding it at minimum 3
    const interval = setInterval(() => {
      setFomoPacksLeft(prev => {
        if (prev > 3) {
          return prev - 1;
        }
        return prev;
      });
    }, 160000); // 2.6 minutes interval
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    const checkOrientation = () => {
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const stats = [
    { label: "JEE Candidates Joined", value: "2,847+", desc: "Aspirants who parsed their coaching mocks this month" },
    { label: "Avg Percentile Gain", value: "+12 Points", desc: "Average improvement after identifying weak topics via CBT" },
    { label: "Mocks Converted", value: "15,420+", desc: "Allen, Resonance, FIITJEE PDFs mapped to interactive CBTs" },
    { label: "CBT Mirror Accuracy", value: "100%", desc: "Authentic NTA layout, countdown timer, options, and panel" }
  ];

  const features = [
    {
      icon: <Upload className="text-[#1a3a5f]" size={20} />,
      title: "PDF Mock Paper Extraction",
      description: "Simply drag & drop any coaching mock, full length syllabus sheet, or previous year paper. Our Gemini AI system splits it instantly into Section A & B with formatted equations.",
      badge: "AI Powered",
      step: "UPLOAD" as const
    },
    {
      icon: <Play className="text-emerald-600" size={20} />,
      title: "NTA-Standard CBT Engine",
      description: "Practice under absolute exam simulations. Leverages authentic answer key mapping, a scientific question palette, live mark & review tags, and candidate timers.",
      badge: "Mirror Layout",
      step: "UPLOAD" as const
    },
    {
      icon: <BarChart3 className="text-indigo-600" size={20} />,
      title: "Step-by-Step Growth Reports",
      description: "Receive immediate detailed scorecards (+4/-1 marks). Deep-dive into sub-topic accuracy tables, custom time analysis, and request instant smart explanations.",
      badge: "Granular Feed",
      step: "ANALYTICS" as const
    }
  ];

  const faqs = [
    {
      q: "How does the PDF Extraction work? Do I need to format it first?",
      a: "No pre-formatting is needed! You can upload any scanned paper or direct PDF from top coaching centers. Our server-side model reads formulas, structured options, and diagrams, converting them into structured CBT assessments automatically."
    },
    {
      q: "What options do I have if my PDF doesn't have an answer key attached?",
      a: "No problem at all! The platform automatically evaluates questions. If no definitive answer keys are located, the parser employs fallback evaluation grids. In the scoring phase, you can also override or adjust any key to match official criteria."
    },
    {
      q: "How is my API key, credit balance, and student history secured?",
      a: "Your privacy is our utmost priority. Stored credentials, past reports, transactions, and user metadata are synced securely with our Firebase Firestore cloud database. For libraries or public terminals, you can securely sign out with a single click to protect your profile."
    },
    {
      q: "Is there any affiliation with NTA or Government systems?",
      a: "No, this is an independent, 100% non-profit educational peer practice simulator. All product names, registration titles, and logos (like NTA and JoSAA) belong strictly to their certified owners."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans">
      
      {/* LANDING PAGE NAVIGATION BAR */}
      <header className="sticky top-0 bg-[#1a3a5f] select-none text-white z-50 border-b border-slate-700/50 px-3 sm:px-6 py-2 sm:py-3.5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-white p-0.5 sm:p-1 rounded-sm shrink-0 shadow-sm">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 flex items-center justify-center text-[#1a3a5f] font-black text-[8px] sm:text-[9px] leading-tight text-center italic font-sans">
              JEE<br />MAIN
            </div>
          </div>
          <div className="text-left leading-tight">
            <h1 className="font-bold text-xs sm:text-sm tracking-tight text-white uppercase flex flex-wrap items-center gap-1 sm:gap-1.5">
              <span>Joint Entrance Exam</span>
              <span className="hidden xs:inline-block text-[8px] sm:text-[10px] text-blue-200 bg-blue-900/40 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded border border-blue-500/30 font-bold font-mono uppercase tracking-wide">CBT Portal</span>
            </h1>
            <p className="hidden md:block text-[9px] text-slate-350 uppercase tracking-wider leading-none mt-1">
              Independent Simulated Testing Framework
            </p>
          </div>
        </div>

        {/* COMPACT MIDDLE SHARE ENCOURAGEMENT */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/30 px-3 py-1 rounded-full border border-slate-700/40">
          <span className="text-[10px] text-slate-305 font-medium">Love this free app?</span>
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

        {/* Action controls */}
        <div className="flex items-center gap-1.5 shrink-0 text-[10px] sm:text-[11px] font-semibold text-slate-200">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2 py-1 bg-slate-850/80 hover:bg-slate-755 border border-slate-700/80 hover:border-slate-500 text-slate-200 hover:text-white rounded text-[9px] sm:text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs shrink-0"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Authentic Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize size={10} className="text-amber-400" /> : <Maximize size={10} />}
            <span className="hidden sm:inline">{isFullscreen ? "Default" : "🖥️ Fullscreen"}</span>
          </button>

          {savedPapersCount > 0 && (
            <span className="hidden lg:inline-flex items-center gap-1 bg-emerald-605 text-emerald-300 border border-emerald-500/30 text-[9.5px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded">
              📚 Saved: {savedPapersCount}
            </span>
          )}

          <button
            onClick={() => onEnterPlatform("UPLOAD")}
            className="px-2.5 py-1 sm:px-3.5 sm:py-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] sm:text-xs rounded shadow-md shadow-blue-500/10 cursor-pointer transition flex items-center gap-1 hover:scale-[1.01] active:scale-95 shrink-0"
          >
            <span>Launch</span>
            <ArrowRight size={11} className="hidden sm:inline shrink-0" />
          </button>
        </div>
      </header>

      {/* CORE HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 text-white py-16 px-6 lg:py-24 border-b border-slate-800">
        
        {/* Abstract decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto text-center space-y-6 relative z-10 flex flex-col items-center"
        >
          
          {/* Centered Hero Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10.5px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full"
          >
            <Sparkles size={12} className="text-amber-300 animate-pulse" />
            <span>PDF-To-Mock Entrance Vector Engine</span>
          </motion.div>
 
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white font-sans max-w-3xl mx-auto"
          >
            Transform Scanned Mock PDFs <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Into Interactive CBT Exams
            </span>
          </motion.h2>
 
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xs sm:text-sm text-slate-350 leading-relaxed max-w-2xl mx-auto font-medium"
          >
            Maximize your Rank & Percentile calibration. Upload any mock PDF from premier coaching networks and experience our precise server-side parsed, cloud-synced exam dashboard designed to replicate original NTA CBT rules.
          </motion.p>
 
          {/* Centered micro disclaimers */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10.5px] font-mono font-semibold text-slate-400 pt-2"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>NTA Rule Validation Grid</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Lock size={12} className="text-blue-500" />
              <span>Zero Exposure Key Safe</span>
            </span>
            <span className="flex items-center gap-1.5">
              <FileCheck size={12} className="text-blue-400" />
              <span>LaTeX Calculus Layouts</span>
            </span>
          </motion.div>
 
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-4 select-none w-full"
          >
            <motion.button
              type="button"
              onClick={() => onEnterPlatform("UPLOAD")}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-black tracking-wide shadow-lg shadow-blue-500/20 cursor-pointer transition flex items-center justify-center gap-2"
            >
              <span>Enter Practice & Upload Hub</span>
              <ArrowRight size={16} />
            </motion.button>
            
            <motion.button
              type="button"
              onClick={() => {
                const el = document.getElementById("learn-more-features");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              whileHover={{ scale: 1.02, bg: "rgba(255, 255, 255, 0.15)" }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white rounded-xl text-sm font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              <span>Compare Features</span>
              <ChevronRight size={14} />
            </motion.button>
          </motion.div>
 
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs font-semibold text-slate-400 w-full"
          >
            <div className="flex -space-x-2">
              <div className="w-7 h-7 bg-blue-950 border border-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-blue-400">2K</div>
              <div className="w-7 h-7 bg-emerald-950 border border-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-emerald-400">8K</div>
              <div className="w-7 h-7 bg-purple-950 border border-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-purple-400">47</div>
            </div>
            <span className="leading-snug">
              Join <strong className="text-white">2,847+ active JEE aspirants</strong>. Average score improvement: <strong className="text-emerald-400">+12 percentile points</strong>!
            </span>
          </motion.div>
 
        </motion.div>

        {/* STATS STRIP BANNER */}
        <div className="max-w-7xl mx-auto mt-16 lg:mt-20 border-t border-slate-800 pt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            {stats.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-[#1a3a5f] font-mono leading-none">
                  {s.value}
                </span>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{s.label}</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* MEET THE CREATOR & BREAK THE GRID SHOWCASE SECTION */}
      <section id="fellow-aspirant-note" className="py-12 px-6 max-w-7xl mx-auto text-left">
        <div className="bg-linear-to-br from-slate-900 via-[#0d1527] to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Subtle background ambient glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-900/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-950/20 rounded-full blur-3xl -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center font-sans">
            
            {/* Left Column: Recreated Pixel-Perfect BREAK THE GRID Profile Card (Square Picture Style) */}
            <div className="lg:col-span-6 xl:col-span-5 flex justify-center w-full">
              <div 
                id="break-the-grid-card"
                className="w-full max-w-sm aspect-square bg-black rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-5 select-none hover:border-red-600/40 transition duration-300"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(220, 38, 38, 0.08) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(220, 38, 38, 0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: "16px 16px"
                }}
              >
                {/* Diagonal Left border line */}
                <div className="absolute left-[-15%] top-0 bottom-0 w-[4px] bg-red-600 rotate-[18deg] opacity-70 transform origin-top" />
                <div className="absolute left-[8%] top-0 bottom-0 w-[2px] bg-red-600/40 rotate-[18deg] transform origin-top" />
                
                {/* Diagonal Right border line */}
                <div className="absolute right-[8%] top-0 bottom-0 w-[2px] bg-red-600/40 rotate-[18deg] transform origin-top" />
                <div className="absolute right-[-15%] top-0 bottom-0 w-[4px] bg-red-600 rotate-[18deg] opacity-70 transform origin-top" />

                {/* Top Section */}
                <div className="relative z-10">
                  <p className="text-[9px] sm:text-[10px] font-mono font-bold tracking-[0.25em] text-red-500 uppercase flex items-center gap-1.5">
                    <span>//</span> REFUSE ORDINARY
                  </p>
                </div>

                {/* Main Middle section (Optimized for square ratio) */}
                <div className="flex flex-col gap-4 relative z-10 my-auto text-left">
                  {/* Big white/red typography */}
                  <div className="flex flex-col font-sans font-black text-4xl sm:text-5xl tracking-tighter leading-[0.9] text-left">
                    <span className="text-white drop-shadow-sm">BREAK</span>
                    <span className="text-red-600 drop-shadow-md">THE</span>
                    <span className="text-white drop-shadow-sm">GRID</span>
                  </div>

                  {/* Bullet Points with red square bullets */}
                  <div className="border-l-2 border-red-600/50 pl-3 space-y-1.5 font-sans">
                    {[
                      "TECH & CODING",
                      "MONEY & FREEDOM",
                      "BTECH & HOSTEL LIFE",
                      "BUILD. EARN. ESCAPE."
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 shrink-0 transform rotate-45" />
                        <span className="text-[9px] sm:text-[10px] font-extrabold tracking-wider text-slate-300 uppercase leading-none">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Red Banner Bar (Stretched correctly) */}
                <div className="w-[calc(100%+2.5rem)] -ml-5 -mb-5 bg-red-600 py-2.5 px-4 relative z-10 flex items-center justify-center transform -skew-x-12 select-none">
                  <p className="text-[7.5px] font-mono font-black tracking-widest text-white uppercase text-center truncate pr-2 pl-2 skew-x-12">
                    BREAKTHEGRID &nbsp;—&nbsp; THINK DIFFERENT &nbsp;·&nbsp; BUILD DIFFERENT &nbsp;·&nbsp; LIVE DIFFERENT
                  </p>
                </div>

              </div>
            </div>

            {/* Right Column: Restored Heading, About Me description and Instagram Contact info */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-5 text-left font-sans">
              <div className="space-y-2">
                <span className="text-[9.5px] bg-[#1a3a5f] text-blue-200/90 border border-blue-800/60 font-black px-2.5 py-1 rounded-full uppercase tracking-widest font-mono inline-block">
                  🎓 Candidate to Candidate
                </span>
                <h3 className="text-2xl sm:text-3.5xl font-black tracking-tight text-white leading-tight">
                  By a Fellow JEE 2026 Aspirant <br />
                  <span className="text-red-500">For Fellow Future Aspirants</span>
                </h3>
              </div>

              <div className="space-y-4 text-slate-200 text-xs sm:text-sm leading-relaxed font-semibold">
                <p>
                  Hey, I'm <strong className="text-white">BREAK THE GRID</strong>! As a fellow JEE 2026 aspirant grinding day and night for that dream score, I got tired of struggling with static PDF practice sheets and having to pay high premium subscriptions just to solve questions on a simulated mock test screen.
                </p>
                <p>
                  I put <strong className="text-red-400 font-extrabold border-b border-red-500/30 pb-0.5">immense amount of real, painstaking hard work</strong> into developing this advanced sandboxed platform. My single objective was to solve student-facing roadblocks: converting flat test pages into dynamic NTA CBT palettes, providing automated AI chemistry/math derivations, and evaluating state list cutoffs instantly.
                </p>
                <p className="bg-red-950/40 border border-red-600/30 p-3.5 rounded-xl text-slate-300 flex items-start gap-2.5 shadow-inner">
                  <span className="text-base leading-none">📢</span>
                  <span>
                    <strong className="text-white">Share it forward so it helps more students!</strong> If this tool saves your time or makes mock test preparation easier, <strong className="text-red-400">please share it with your fellow aspirants, study channels, and friends</strong>. Getting the word out is the absolute highest reward and motivation for me to keep improving this database!
                  </span>
                </p>
              </div>

              {/* Instagram CTA block */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4 select-none">
                <a 
                  id="creator-instagram-link"
                  href="https://www.instagram.com/break_thegrid/"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all rounded-xl font-black text-xs text-white shadow-lg shadow-red-650/15 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  <span>Connect with me on Instagram</span>
                </a>
                
                <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                  <span>Tag:</span>
                  <strong className="text-red-400 hover:underline">
                    <a href="https://www.instagram.com/break_thegrid/" target="_blank" rel="noopener noreferrer">@break_thegrid</a>
                  </strong>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID SECTION */}
      <section id="learn-more-features" className="py-16 px-6 max-w-7xl mx-auto text-left space-y-12">
        
        <div className="max-w-3xl space-y-2">
          <span className="text-[10.5px] font-black text-[#1a3a5f] tracking-widest uppercase block">Engine Architecture</span>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Engineered Expressly for JEE Aspirants
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
            We provide a localized, rigorous workspace optimized to build elite exam speed, time-budget calibration, and JoSAA admission projections.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
          {features.map((feat, idx) => (
            <motion.div 
              key={idx} 
              onClick={() => onEnterPlatform(feat.step)}
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: idx * 0.1, ease: "easeOut" }}
              whileHover={{ 
                y: -6, 
                scale: 1.02,
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)"
              }}
              whileTap={{ scale: 0.98 }}
              className="bg-white border border-slate-205 rounded-2xl p-6 shadow-2xs hover:border-blue-400/40 cursor-pointer flex flex-col justify-between group text-left transition-colors"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                  {feat.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-extrabold text-[#1a3a5f] text-sm tracking-tight group-hover:text-blue-700 transition-colors">{feat.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] bg-slate-100 border border-slate-205 text-slate-600 font-bold px-2 py-0.5 rounded-md font-mono">
                  {feat.badge}
                </span>
                <span className="text-[10.5px] font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-all group-hover:translate-x-1">
                  <span>Explore</span>
                  <ArrowRight size={10} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </section>

      {/* DEVELOPER PORTFOLIO, CONTRIBUTION, KEY FEATURES & API ROADMAP */}
      <section className="bg-slate-900 text-white py-16 px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Box: Developer Contribution & Craftsmanship */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-300 border border-blue-500/35 text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                <Award size={12} className="text-blue-400" />
                <span>Developer Contribution & Craftsmanship</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight font-sans">
                Engineered to Calibrate, Solve & Protect
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-350 leading-relaxed font-semibold">
                To bridge the gap between static printed mock paper PDFs and actual online time pressure, I spearheaded the design and development of this independent testing platform. Below is the breakdown of my design and architectural contributions to this testing framework:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center text-xs font-bold text-blue-400">01</div>
                  <h4 className="font-extrabold text-xs text-slate-100 uppercase tracking-wide">LaTeX Formula Grid-Parser</h4>
                  <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
                    Engineered the extraction algorithms and JSON mapping schema that interpret raw math matrices, chemical reactions, formulas, and diagrams perfectly.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-xs font-bold text-emerald-400 font-mono">02</div>
                  <h4 className="font-extrabold text-xs text-slate-100 uppercase tracking-wide">Authentic CBT Engine Mirror</h4>
                  <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
                    Constructed the complete NTA-standard side navigation panels, color-coded state tracking grids (answered, marked, unvisited), and a built-in virtual keypad.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-950 flex items-center justify-center text-xs font-bold text-pink-400 font-mono">03</div>
                  <h4 className="font-extrabold text-xs text-slate-100 uppercase tracking-wide">Secure Firebase Cloud Sync</h4>
                  <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
                    Implemented robust Firebase Firestore syncing to protect your custom keys, purchase transactions, credit balances, and parsed CBT assessments across devices.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-950 flex items-center justify-center text-xs font-bold text-amber-400 font-mono">04</div>
                  <h4 className="font-extrabold text-xs text-slate-100 uppercase tracking-wide">JoSAA Category Cutoffs Forecast</h4>
                  <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
                    Integrated previous-year percentile records mapped with actual categories (General, EWS, OBC-NCL, SC, ST) to provide admission forecasts for NITs/IITs/IIITs.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Box: API Workspace Context & Own Key Encouragement */}
            <div className="lg:col-span-6 bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950/30 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-left relative">
              <div className="absolute top-4 right-4 animate-pulse">
                <span className="text-xl">⚡</span>
              </div>

              <div className="space-y-2">
                <span className="text-[9.5px] bg-[#1a3a5f] text-blue-200 border border-blue-500/30 font-black px-2.5 py-1 rounded font-mono uppercase tracking-widest">
                  Secure Gemini AI Pipeline
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans font-extrabold">
                  Context of API Usage & LLM Integration
                </h3>
                <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                  Large language models are critical to handling messy mock test layouts. We utilize the server-side <strong>Google Gemini API</strong> to analyze multi-page extracted PDFs, extract math characters, organize options, and automatically generate smart conceptual explanations for answers.
                </p>
              </div>

              {/* Explicit Key Encouragement Block */}
              <div className="bg-slate-900 hover:bg-slate-900/95 border border-slate-850 rounded-2xl p-5 space-y-3 transition">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔑</span>
                  <h4 className="font-extrabold text-[#94a3b8] text-xs uppercase tracking-wider">Ensure Sustainability: Use Your Own API Key</h4>
                </div>
                
                <p className="text-[11.5px] text-slate-400 leading-relaxed font-medium">
                  We supply a shared public key with small rate limits to help quick test flights. To enjoy unlimited parallel paper extractions, avoid public queue waits, and ensure high availability, <strong>we strongly encourage you to configure your own Gemini API key</strong>!
                </p>

                <div className="text-[10.5px] font-semibold text-amber-300 bg-amber-950/30 border border-amber-500/15 p-3 rounded-lg flex items-start gap-2">
                  <span className="mt-0.5">🛡️</span>
                  <span>
                    Your key never touches external servers directly—it remains safely saved inside your sandboxed local storage, passing strictly into server-side proxies for your individual mock parse streams.
                  </span>
                </div>
              </div>

              {/* Instructions on how to add API Key */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">How to Load Your Local Key:</span>
                <ul className="space-y-2 text-xs font-semibold text-slate-350 font-sans">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">1.</span>
                    <span>Obtain an API key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">Google AI Studio <ArrowRight size={10} /></a> (100% free of cost).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">2.</span>
                    <span>Click <strong>"Configure Mock Sandbox"</strong> or input it directly when launching a PDF extraction.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">3.</span>
                    <span>Experience blazing-fast, private, and precise question-by-question layout parsing instantly!</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>

        </div>
      </section>



      {/* REAL STUDENT TESTIMONIALS & CONVERSION OUTCOME SECTOR */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 border-y border-slate-800 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Section Header */}
          <div className="border-b border-slate-800 pb-8 text-left space-y-3">
            <span className="inline-flex items-center bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[10.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded">
              Aspirant Feedback
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight font-sans">
              Trusted by Candidates preparing for JEE
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-normal max-w-2xl font-medium">
              See how JEE aspirants convert static mock paper PDFs into fully interactive, on-screen CBT mock practice.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none text-left">
            
            {/* Testimonial 1 */}
            <div className="bg-slate-950/55 border border-slate-850 hover:border-slate-750 p-6 rounded-2xl flex flex-col justify-between space-y-6 transition duration-200">
              <div className="space-y-4">
                <div className="flex gap-1 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold font-sans">
                  "My coaching booklets in Physics (especially rotation/coordinate systems) were dry. I dragged my Allen test PDFs in here and simulated the exam. practicing on NTA's identical color palette cured my actual panel anxiety."
                </p>
              </div>
              <div className="border-t border-slate-900/60 pt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-xs font-black text-blue-300 font-mono">
                  AM
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block font-heading font-semibold">Aryan Mehta</span>
                  <span className="text-[10px] text-slate-500 font-mono">FIITJEE Regular Student</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-slate-950/55 border border-slate-850 hover:border-slate-750 p-6 rounded-2xl flex flex-col justify-between space-y-6 transition duration-200">
              <div className="space-y-4">
                <div className="flex gap-1 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold font-sans">
                  "Usually AI engines completely mess up math symbols or physical systems in chemistry. The LaTeX formulas mapped elegantly. Finding sub-topic weak centers in calculus catapulted my scores by +36 marks."
                </p>
              </div>
              <div className="border-t border-slate-900/60 pt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-xs font-black text-emerald-300 font-mono">
                  PI
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block font-heading font-semibold">Prisha Iyer</span>
                  <span className="text-[10px] text-slate-500 font-mono">Resonance Regular Student</span>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-slate-950/55 border border-slate-850 hover:border-slate-750 p-6 rounded-2xl flex flex-col justify-between space-y-6 transition duration-200">
              <div className="space-y-4">
                <div className="flex gap-1 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold font-sans">
                  "Having instant LaTeX step explanation feedback saved me so much time. I was struggling with physical chemistry timings, but simulating 10 full test sheets on this CBT board boosted my speed drastically."
                </p>
              </div>
              <div className="border-t border-slate-900/60 pt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-xs font-black text-purple-300 font-mono">
                  YS
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block font-heading font-semibold">Yuvraj Singh</span>
                  <span className="text-[10px] text-slate-500 font-mono">Self-Study Aspirant</span>
                </div>
              </div>
            </div>

          </div>

          {/* Static conversion multiplier banner */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 select-none text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-sm">✓</span>
                <span>Instant Wallet Top-up automated via UPI Webhook</span>
              </div>
              <div className="hidden sm:block text-slate-700 font-mono">•</div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-sm">✓</span>
                <span>Re-convert any number of times</span>
              </div>
              <div className="hidden sm:block text-slate-700 font-mono">•</div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-sm">✓</span>
                <span>Shared Server Key Mode Included</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS SECTION */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-left space-y-10">
        <div className="text-center space-y-2 pb-2">
          <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase block">Support Desk</span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Frequently Answered Queries</h3>
          <p className="text-xs text-slate-500 leading-normal max-w-md mx-auto font-semibold">
            Everything you need to know about compiler specifications, admissions prediction matrices, and data privacy controls.
          </p>
        </div>

        <div className="space-y-3.5 select-none">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs cursor-pointer transition"
              onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
            >
              <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 pr-4">
                  {faq.q}
                </span>
                <span className="text-[#1a3a5f] text-sm font-black shrink-0">
                  {faqOpen === idx ? "−" : "+"}
                </span>
              </div>
              {faqOpen === idx && (
                <div className="p-4 pt-1 border-t border-slate-100/80 text-xs text-slate-500 font-semibold leading-relaxed select-text bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* DISCLAIMER & CALL TO ACTION BOTTOM HERO */}
      <section className="bg-slate-950 p-8 sm:p-12 relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-radial from-[#1a3a5f]/30 to-slate-950/20 opacity-40" />
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10 text-white">
          <GraduationCap className="mx-auto text-blue-400 animate-bounce" size={40} />
          
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">Ready to Master NTA Computer-Based Tests?</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto font-medium">
            Upload your first JEE Main simulated mock paper PDF now. Generate interactive mark sheets, explore comprehensive explanatory steps, and calibrate with strict JoSAA category cutoff parameters.
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => onEnterPlatform("UPLOAD")}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md shadow-emerald-500/10 cursor-pointer transition hover:scale-[1.01]"
            >
              Start Practice Session Free
            </button>
          </div>
        </div>
      </section>

      {/* STATUTORY DISCLAIMER DRAWER FOR LEGAL COMPLIANCE */}
      <footer className="bg-slate-900 text-slate-500 text-[10px] sm:text-xs pt-12 pb-8 px-6 border-t border-slate-800 select-text text-left">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-slate-800">
            <div className="space-y-2">
              <strong className="text-slate-250 uppercase tracking-widest text-[9.5px] font-black block">National Testing Agency (NTA) Disclaimer</strong>
              <p className="leading-relaxed">
                This CBT simulator is a strictly mock peer study platform. It has <strong>no</strong> official affiliation with, license from, or authorization by the <strong>National Testing Agency (NTA)</strong> of India, the <strong>Joint Seat Allocation Authority (JoSAA)</strong>, the <strong>CSAB Board</strong>, or any government ministries.
              </p>
            </div>
            <div className="space-y-2">
              <strong className="text-slate-250 uppercase tracking-widest text-[9.5px] font-black block">Interactive Evaluation Accuracy</strong>
              <p className="leading-relaxed">
                Extracted numerical keys and integer validation patterns are estimated using analytical heuristics. Ranks and IIT/NIT system allotment forecasts remain benchmark predictions based on historical competitive trends and may differ from authorized statutory allocation parameters.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[10px] sm:text-xs pt-4 select-none">
            <span className="font-semibold">&copy; {new Date().getFullYear()} Independent Simulated Testing Framework.</span>
            <div className="flex items-center gap-3 font-semibold text-slate-500 items-center">
              <button
                onClick={onPrivacyClick}
                className="hover:text-slate-350 hover:underline cursor-pointer transition-colors"
                id="landing_footer_privacy_btn"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <span>IIT Delhi-Kharagpur Syllabus Grid</span>
              <span>•</span>
              <span>Allen / MathonGo Benchmark Metrics</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
