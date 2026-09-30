/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldCheck, Lock, Trash2, Database, EyeOff, ArrowLeft, GraduationCap } from "lucide-react";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 select-text text-left">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-750 hover:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-98"
        id="privacy_back_btn"
      >
        <ArrowLeft size={14} className="text-[#1a3a5f]" />
        <span>Return to Platform</span>
      </button>

      {/* Main Content Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-md relative overflow-hidden">
        {/* top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-[#1a3a5f] to-indigo-850" />

        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-2 bg-blue-50 text-[#1a3a5f] rounded-lg">
                <ShieldCheck size={20} />
              </span>
              <span className="text-[10px] font-black tracking-widest text-[#1a3a5f] uppercase font-mono">
                Candidate Confidentiality Framework
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Privacy Policy & Data Security Agreement
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1 font-mono">
              Last Updated & Calibrated: June 12, 2026 (Independent Student Compact)
            </p>
          </div>

          {/* Quick Overview Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start gap-3">
              <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg shrink-0 mt-0.5">
                <Lock size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Client-Side Keys</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                  LLM API credentials (Gemini, Groq) rest in local sandboxes and never touch any tracking server.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start gap-3">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0 mt-0.5">
                <Database size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Secure Sync</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                  Your simulated report history and wallet credit ledgers are locked behind Firebase Auth protocols.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start gap-3">
              <div className="p-1.5 bg-rose-100 text-rose-800 rounded-lg shrink-0 mt-0.5">
                <Trash2 size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Instant Purge</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                  Shared library/school terminals can be cleared with a single click using Public Device Guard.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
            
            <section className="space-y-2">
              <h3 className="text-sm font-black text-[#1a3a5f] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-[#1a3a5f]" />
                <span>1. Core Philosophy of Trust & Data Independence</span>
              </h3>
              <p>
                As an independent educational mock testing platform, this system is built on a fundamental principle: <strong>Your mock test scores, study habits, and API usage quotas belong exclusively to you.</strong> We do not engage in data harvesting, monetization, or sharing with external commercial educational distributors.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-black text-[#1a3a5f] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-[#1a3a5f]" />
                <span>2. API Credentials & Sandboxed Storage</span>
              </h3>
              <p>
                To provide high-fidelity LaTeX equation parsing and custom answer explanations, our server interfaces with the stable <strong>Google Gemini API</strong>. 
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-500">
                <li>When you input a personal API Key, the key is saved securely inside your browser's private <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold font-mono">localStorage</code>.</li>
                <li>Your key is transit-encrypted and used solely on a server-to-server stream to coordinate your specific paper extraction. It is never logged on our servers or exposed on public screens.</li>
                <li>The public key option runs under shared sandboxed quotas, subject to strict rate limits to guarantee equitable distribution.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-black text-[#1a3a5f] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-[#1a3a5f]" />
                <span>3. Cloud Databases & Wallet Ledger Security</span>
              </h3>
              <p>
                Our services utilize a highly secure <strong>Firebase Firestore</strong> database instance to establish continuous support for user accounts:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-500">
                <li>Account records contain only the essential variables needed to track credit balances, safe transaction ledgers, and authorized role status.</li>
                <li>Financial data processed via simulated scans or test-credit top-up procedures is routed through secure, verified Webhooks without storing external bank information.</li>
                <li>Database security rules (Firestore Rules) are locked down strictly so no third party can query or tamper with your candidate profiles.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-black text-[#1a3a5f] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-[#1a3a5f]" />
                <span>4. Public Terminal Security (Safe Purge Safeguards)</span>
              </h3>
              <p>
                JEE aspirants frequently study on communal infrastructure, such as school laboratories, study group laptops, coaching centers, or cyber cafes. To prevent subsequent users from accessing your custom reports or consuming your private API credits:
              </p>
              <p className="bg-amber-50/60 border border-amber-200/60 p-3.5 rounded-lg text-amber-900">
                ⚠️ <strong>Public Device Guard:</strong> Clicking the <span className="underline decoration-amber-500 font-extrabold font-mono">Wipe All Local Data</span> button or the brush icon in the navigation bar immediately wipes all cookies, saved API keys, cached mock papers ({`savedPapers`}), and past reports from local storage, returning the testing shell to an pristine state.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-black text-[#1a3a5f] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-[#1a3a5f]" />
                <span>5. Statutory Declarations & Legal Disclaimers</span>
              </h3>
              <p>
                This platform is an independent student companion. As such:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-500">
                <li>We do not represent, mimic, or have licensing relations with the <strong>National Testing Agency (NTA)</strong>, <strong>JoSAA Board</strong>, <strong>IIT/NIT Senates</strong>, or any central educational boards.</li>
                <li>All mock test material uploaded is evaluated on a peer-to-peer study basis, and results are meant strictly for score calibration.</li>
              </ul>
            </section>

            <section className="space-y-2 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 text-slate-750">
                <EyeOff size={16} className="text-[#1a3a5f]" />
                <span className="font-extrabold text-[#1a3a5f]">We Believe in Open, Transparent Learning.</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-xs">
                Your preparation represents months of relentless hard work. We are committed to making sure your testing portal is as secure as it is accurate. Good luck with your study schedules, master your mock sheets, and break the grid!
              </p>
            </section>

          </div>

          {/* Bottom compact footer card */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center justify-between text-left select-none">
            <div className="flex items-center gap-2 text-[#1a3a5f] text-xs font-bold">
              <GraduationCap size={16} />
              <span>JEE CBT Practice Compact · June 2026</span>
            </div>
            <button
              onClick={onBack}
              className="text-[#1a3a5f] hover:text-[#132c49] font-black text-xs hover:underline decoration-blue-400"
            >
              Back to Portal
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
