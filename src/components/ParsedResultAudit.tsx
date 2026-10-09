/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Play, 
  ChevronRight, 
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Info,
  ChevronDown,
  Image as ImageIcon
} from "lucide-react";
import { Question } from "../types";
import { NtaInstructions } from "./NtaInstructions";

interface ParsedResultAuditProps {
  testName: string;
  questions: Question[];
  onProceedToTest: () => void;
  onCancel: () => void;
}

export function ParsedResultAudit({ testName, questions, onProceedToTest, onCancel }: ParsedResultAuditProps) {
  const [currentPage, setCurrentPage] = useState<"SUMMARY" | "INSTRUCTIONS">("SUMMARY");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Group questions and scan for warnings
  const auditReport = useMemo(() => {
    const physicsQ = questions.filter(q => q.subject === "Physics");
    const chemistryQ = questions.filter(q => q.subject === "Chemistry");
    const mathQ = questions.filter(q => q.subject === "Mathematics");

    const warnings: Array<{ id: string; type: "warning" | "error"; message: string }> = [];

    questions.forEach((q, index) => {
      if (!q) return;
      const isSecA = q.section === "Section A" || !q.section;
      if (isSecA && (!q.options || q.options.length < 4)) {
        warnings.push({
          id: `opt-${q.id || index}`,
          type: "warning",
          message: `Q.${q.questionNumber || index + 1} (${q.subject || "Unknown"}): Only ${q.options?.length || 0} MCQ options detected.`
        });
      }

      if (!q.correctAnswer || String(q.correctAnswer).trim() === "") {
        warnings.push({
          id: `ans-${q.id || index}`,
          type: "warning",
          message: `Q.${q.questionNumber || index + 1} (${q.subject || "Unknown"}): Answer key not detected; placeholder set.`
        });
      }
    });

    if (physicsQ.length === 0) {
      warnings.push({ id: "empty-p", type: "error", message: "Physics: 0 questions extracted." });
    }
    if (chemistryQ.length === 0) {
      warnings.push({ id: "empty-c", type: "error", message: "Chemistry: 0 questions extracted." });
    }
    if (mathQ.length === 0) {
      warnings.push({ id: "empty-m", type: "error", message: "Mathematics: 0 questions extracted." });
    }

    const diagramCount = questions.filter(q => Boolean(q.diagramImage)).length;

    return {
      physicsCount: physicsQ.length,
      chemistryCount: chemistryQ.length,
      mathCount: mathQ.length,
      totalCount: questions.length,
      diagramCount,
      warnings,
    };
  }, [questions]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 p-4 flex items-center justify-center z-50 select-none overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col my-8 animate-scale-up max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1a3a5f] p-5 px-6 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/15">
              <BookOpen size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-base font-bold text-white tracking-tight">Paper Ready for Testing</h2>
              <p className="text-xs text-blue-200 mt-0.5 max-w-md truncate" title={testName}>
                {testName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-blue-100 font-mono">
            <Clock size={14} className="text-blue-300" />
            <span>180 Mins</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button
            onClick={() => setCurrentPage("SUMMARY")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              currentPage === "SUMMARY"
                ? "bg-white text-[#1a3a5f] font-bold shadow-xs border border-slate-200"
                : "hover:text-slate-900"
            }`}
          >
            <span>Overview & Breakdown</span>
          </button>
          <ChevronRight size={14} className="text-slate-300" />
          <button
            onClick={() => setCurrentPage("INSTRUCTIONS")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              currentPage === "INSTRUCTIONS"
                ? "bg-white text-[#1a3a5f] font-bold shadow-xs border border-slate-200"
                : "hover:text-slate-900"
            }`}
          >
            <Info size={13} />
            <span>Exam Instructions</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 text-left">
          {currentPage === "SUMMARY" ? (
            <div className="space-y-6">
              
              {/* Ready Confirmation Banner */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-3.5">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800 text-sm block mb-0.5">
                    Extracted {auditReport.totalCount} Questions
                  </span>
                  Your questions, diagrams, and mathematical formatting are parsed and aligned with standard JEE Computer Based Testing (CBT) navigation.
                </div>
              </div>

              {/* Subject Breakdown Cards */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Subject Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Physics</span>
                    <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                      {auditReport.physicsCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Questions</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Chemistry</span>
                    <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                      {auditReport.chemistryCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Questions</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Mathematics</span>
                    <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                      {auditReport.mathCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Questions</span>
                  </div>
                </div>
              </div>

              {/* High-Res Diagram Extraction Indicator */}
              {auditReport.diagramCount > 0 && (
                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-center justify-between text-xs text-blue-900 font-medium">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={15} className="text-blue-600 shrink-0" />
                    <span>High-Resolution Diagrams Detected & Embedded:</span>
                  </div>
                  <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                    {auditReport.diagramCount} Figures
                  </span>
                </div>
              )}

              {/* Offline fallback note if active */}
              {questions.some(q => q.isOfflineFallback) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block mb-0.5">High Server Load — Calibrated Preset Loaded</strong>
                    To ensure instant practice without delay, an offline calibrated benchmark paper was generated. No credits were deducted.
                  </div>
                </div>
              )}

              {/* Diagnostics accordion (optional, clean) */}
              {auditReport.warnings.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <span>{auditReport.warnings.length} parsing note{auditReport.warnings.length > 1 ? "s" : ""}</span>
                    </span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${showDiagnostics ? "rotate-180" : ""}`} />
                  </button>

                  {showDiagnostics && (
                    <div className="p-3 bg-white divide-y divide-slate-100 max-h-40 overflow-y-auto text-xs text-slate-600">
                      {auditReport.warnings.map(w => (
                        <div key={w.id} className="py-2 first:pt-1 last:pb-1">
                          {w.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <NtaInstructions showProceed={false} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Upload Another</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {currentPage === "SUMMARY" ? (
              <button
                type="button"
                onClick={() => setCurrentPage("INSTRUCTIONS")}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold transition cursor-pointer"
              >
                View Rules & Instructions
              </button>
            ) : (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#1a3a5f] focus:ring-[#1a3a5f] cursor-pointer"
                />
                <span>I have read the instructions</span>
              </label>
            )}

            <button
              type="button"
              onClick={onProceedToTest}
              disabled={currentPage === "INSTRUCTIONS" && !agreedToTerms}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                currentPage === "INSTRUCTIONS" && !agreedToTerms
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10 cursor-pointer"
              }`}
            >
              <Play size={13} className="fill-white" />
              <span>Start CBT Exam</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ParsedResultAudit;
