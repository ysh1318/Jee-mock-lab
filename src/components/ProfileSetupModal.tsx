import React, { useState } from "react";
import { UserProfile } from "../types";
import { Award, Compass, Globe, Award as AwardIcon, Check, Settings, X, Info, ShieldCheck, MapPin, TrendingUp } from "lucide-react";

interface ProfileSetupModalProps {
  currentProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose?: () => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Other State"
];

export function ProfileSetupModal({ currentProfile, onSave, onClose }: ProfileSetupModalProps) {
  const [step, setStep] = useState<number>(1);
  const [category, setCategory] = useState<UserProfile["category"]>(currentProfile?.category || "General");
  const [homeState, setHomeState] = useState<string>(currentProfile?.homeState || "Maharashtra");
  const [gender, setGender] = useState<UserProfile["gender"]>(currentProfile?.gender || "Neutral");
  const [targetPercentile, setTargetPercentile] = useState<number>(currentProfile?.targetPercentile || 98.5);

  const getTargetScore = (percentile: number) => {
    // Basic standard moderate shift marks-to-percentile mapping
    if (percentile >= 99.9) return 265;
    if (percentile >= 99.5) return 215;
    if (percentile >= 99.0) return 180;
    if (percentile >= 98.0) return 155;
    if (percentile >= 95.0) return 118;
    if (percentile >= 90.0) return 92;
    if (percentile >= 80.0) return 68;
    return 50;
  };

  const currentScoreNeeded = getTargetScore(targetPercentile);

  const handleSave = () => {
    onSave({
      category,
      homeState,
      gender,
      targetPercentile
    });
  };

  return (
    <div id="setup-modal-container" className="fixed inset-0 bg-slate-900/85 backdrop-blur-xs flex items-center justify-center z-[100] p-4 select-none animate-fade-in">
      <div id="setup-modal-card" className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden relative text-left flex flex-col max-h-[90vh]">
        {/* Top brand indicator */}
        <div className="bg-[#1a3a5f] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
              <Compass size={18} className="text-blue-300 animate-spin-slow" />
            </div>
            <div>
              <h3 id="setup-modal-title" className="font-black text-sm uppercase tracking-wider">JEE Mains 2026 Platform Calibration</h3>
              <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Let's configure your reservation category, state advantages & targets</p>
            </div>
          </div>
          {onClose && (
            <button 
              id="close-profile-setup-btn"
              onClick={onClose}
              className="p-1 rounded bg-[#1a3a5f]/40 hover:bg-red-650/30 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Step Progression Indicators */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step >= 1 ? "bg-[#1a3a5f] text-white" : "bg-slate-200 text-slate-500"}`}>1</span>
            <span className={step >= 1 ? "text-[#1a3a5f] font-extrabold" : ""}>Category & Gender</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step >= 2 ? "bg-[#1a3a5f] text-white" : "bg-slate-200 text-slate-500"}`}>2</span>
            <span className={step >= 2 ? "text-[#1a3a5f] font-extrabold" : ""}>Home State Quota</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step >= 3 ? "bg-[#1a3a5f] text-white" : "bg-slate-200 text-slate-500"}`}>3</span>
            <span className={step >= 3 ? "text-[#1a3a5f] font-extrabold" : ""}>Target Performance</span>
          </div>
        </div>

        {/* Form Body - scrollable if needed */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          
          {/* STEP 1: CATEGORY & GENDER */}
          {step === 1 && (
            <div className="space-y-5 flex flex-col animate-fade-in">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">Step 1 of 3 • Allocation Parameters</span>
                <h4 className="text-base font-black text-slate-800 tracking-tight mt-1">Select Reservation & Gender Pools</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  JoSAA utilizes separate seat matrices and merit ranks for reservation quotas. Correct category tuning ensures accurate predicted colleges.
                </p>
              </div>

              {/* Category Picker */}
              <div className="space-y-2 text-left">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                  1. JoSAA Reservation Category:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "General", label: "General", desc: "Open merit lists" },
                    { id: "OBC_NCL", label: "OBC-NCL", desc: "Central OBC lists" },
                    { id: "SC", label: "SC Quota", desc: "Scheduled Caste" },
                    { id: "ST", label: "ST Quota", desc: "Scheduled Tribe" },
                    { id: "EWS", label: "General-EWS", desc: "Economic Weaker" }
                  ].map((cat) => (
                    <button
                      id={`profile-setup-category-${cat.id}`}
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between h-20 cursor-pointer ${
                        category === cat.id
                          ? "border-blue-600 bg-blue-50/20 shadow-xs"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-750"
                      }`}
                    >
                      <span className="text-xs font-extrabold text-[#1a3a5f] flex items-center gap-1">
                        <span>{cat.label}</span>
                        {category === cat.id && <span className="text-blue-600 font-bold">✓</span>}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-semibold leading-tight line-clamp-2">
                        {cat.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender Picker */}
              <div className="space-y-2 text-left pt-2 border-t border-slate-100">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                  2. Candidate Gender Pool:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "Neutral", label: "Gender-Neutral", desc: "Open to all aspirants" },
                    { id: "Female", label: "Female-Only (Supernumerary)", desc: "20% specialized female seat quota" }
                  ].map((gen) => (
                    <button
                      id={`profile-setup-gender-${gen.id}`}
                      key={gen.id}
                      type="button"
                      onClick={() => setGender(gen.id as any)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-20 cursor-pointer ${
                        gender === gen.id
                          ? "border-emerald-600 bg-emerald-50/15"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-750"
                      }`}
                    >
                      <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1">
                        <span>{gen.label}</span>
                        {gender === gen.id && <span className="text-emerald-600 font-bold">✓</span>}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-semibold leading-tight">
                        {gen.desc}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 flex gap-2 items-start mt-2">
                  <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-450 leading-normal font-semibold">
                    * JoSAA designates reserved supernumerary slots for female aspirants, permitting seat allocations at considerably relaxed category ranks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: HOME STATE OF ELIGIBILITY */}
          {step === 2 && (
            <div className="space-y-5 flex flex-col animate-fade-in">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">Step 2 of 3 • State Eligibility Quotas</span>
                <h4 className="text-base font-black text-slate-800 tracking-tight mt-1">Select Home State of Eligibility</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  In NITs & state government colleges, exactly <strong>50% of all seat intakes</strong> are exclusively reserved for candidates who passed Class 12 from that state. This is known as the **Home State (HS) Quota**.
                </p>
              </div>

              {/* State List Dropdown Grid */}
              <div className="space-y-2 text-left">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                  Choose State where you finished/graduating Class 12:
                </label>
                <div className="relative">
                  <select
                    id="profile-setup-state-select"
                    value={homeState}
                    onChange={(e) => setHomeState(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 bg-blue-50/60 border border-blue-150 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={13} className="text-blue-700 shrink-0" />
                    <span>Unlocked State Advantages:</span>
                  </div>
                  <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                    With <strong>{homeState}</strong> eligibility active:
                  </p>
                  <ul className="text-[11px] text-slate-550 space-y-1.5 list-disc pl-5 font-semibold">
                    {homeState === "Delhi" && (
                      <li>Unlocks massive **85% Regional Quota** in DTU Delhi, NSUT Delhi, and regional IIIT Delhi cutoffs.</li>
                    )}
                    {homeState === "Maharashtra" && (
                      <li>Unlocks native state reserve quota priority for COEP Tech University Nagpur and VNIT Nagpur seats.</li>
                    )}
                    {homeState === "Tamil Nadu" && (
                      <li>Unlocks the prized Home State quota for NIT Trichy, lowering General CSE admission ranks drastically.</li>
                    )}
                    {homeState !== "Delhi" && homeState !== "Maharashtra" && homeState !== "Tamil Nadu" && (
                      <li>You get highly prioritized **Home State Cutoffs** at your regional local NIT (e.g. NIT Calicut for Kerala, NIT Warangal for Telangana/Andhra, MNIT Jaipur for Rajasthan, etc.).</li>
                    )}
                    <li>Ranks required inside the home-state NIT will be relaxed by up to 2x compared to Other State (OS) candidates!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TARGET METRICS CALIBRATION */}
          {step === 3 && (
            <div className="space-y-5 flex flex-col animate-fade-in">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">Step 3 of 3 • Target Calibration Metrics</span>
                <h4 className="text-base font-black text-slate-800 tracking-tight mt-1">Set Your Target Percentile Goal</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Your customized target percentile acts as a progress beacon. We will design step-by-step target milestones relative to this goal.
                </p>
              </div>

              {/* Target Percentile Slider */}
              <div className="space-y-4 text-left bg-slate-50 p-4 border border-slate-150 rounded-xl">
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-xs font-black text-slate-600 uppercase tracking-wide">Target Percentile:</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      step="0.01"
                      min="80.0"
                      max="99.9"
                      value={targetPercentile}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTargetPercentile(isNaN(val) ? 80 : Math.max(80.0, Math.min(99.9, val)));
                      }}
                      className="w-20 text-center font-black text-xl text-[#1a3a5f] bg-slate-50 border border-slate-200 rounded py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">%ile</span>
                  </div>
                </div>

                <input
                  id="profile-setup-percentile-slider"
                  type="range"
                  min="80.0"
                  max="99.9"
                  step="0.05"
                  value={targetPercentile}
                  onChange={(e) => setTargetPercentile(Number(e.target.value))}
                  className="w-full accent-[#1a3a5f] cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono">
                  <span>80.00 %ile (Qualified)</span>
                  <span>95.00 %ile (Assured NIT)</span>
                  <span>99.90 %ile (Elite Ranks)</span>
                </div>
              </div>

              {/* Mapped Score Milestone Output */}
              <div className="border border-indigo-150 rounded-xl bg-indigo-50/20 p-4 text-left grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-indigo-750 uppercase tracking-widest">Est Exam Score Required:</span>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-3xl font-black text-[#1a3a5f]">{currentScoreNeeded}</span>
                    <span className="text-xs font-black text-slate-400">/300 Marks</span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic font-semibold leading-tight">
                    *Required score based on moderately difficult June 2026 Shift parameters.
                  </p>
                </div>
                <div className="bg-white p-3 border border-indigo-100/70 rounded-lg text-xs leading-relaxed space-y-1 font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5 text-[#1a3a5f] font-black">
                    <TrendingUp size={13} className="text-[#1a3a5f] shrink-0" />
                    <span>Predicted Outlook:</span>
                  </div>
                  <p className="text-[11px] leading-normal font-medium text-slate-500">
                    At {targetPercentile.toFixed(2)}%ile (~{Math.round(((100 - targetPercentile)/100)*1450000).toLocaleString("en-IN")} CRL rank), you are highly competitive for computer science, artificial intelligence, and electronics streams across top-tier NITs and premium IIITs.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Action bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            id="profile-setup-prev-btn"
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black rounded-xl transition cursor-pointer text-slate-600"
          >
            ← Previous
          </button>

          {step < 3 ? (
            <button
              id="profile-setup-next-btn"
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2 bg-[#1a3a5f] hover:bg-blue-800 text-white text-xs font-black rounded-xl shadow-xs transition hover:scale-[1.01] cursor-pointer"
            >
              Continue Next →
            </button>
          ) : (
            <button
              id="profile-setup-submit-btn"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/10 transition hover:scale-[1.01] cursor-pointer flex items-center gap-1.5"
            >
              <span>Apply & Calibrate</span>
              <span className="text-sm">✓</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
