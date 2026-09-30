/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, Eye, BookOpen } from "lucide-react";
import { Question, Subject } from "../types";
import { MarkdownMath } from "./MathText";

interface QuestionPaperModalProps {
  questions: Question[];
  onClose: () => void;
}

export function QuestionPaperModal({ questions, onClose }: QuestionPaperModalProps) {
  // Group questions by subject
  const physicsQuestions = questions.filter((q) => q.subject === Subject.PHYSICS);
  const chemistryQuestions = questions.filter((q) => q.subject === Subject.CHEMISTRY);
  const mathematicsQuestions = questions.filter((q) => q.subject === Subject.MATHEMATICS);

  const renderSubjectSection = (subjectName: string, subQuestions: Question[]) => {
    if (subQuestions.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 border-l-4 border-blue-600 rounded-r sticky top-0 z-10 flex items-center gap-2 select-none">
          <BookOpen size={16} className="text-blue-600" />
          <span>{subjectName} ({subQuestions.length} Questions)</span>
        </h3>
        <div className="mt-4 divide-y divide-slate-100">
          {subQuestions.map((q) => (
            <div key={q.id} className="py-4 pl-1">
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-800 text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-100 select-none">
                  Q.{q.questionNumber}
                </span>
                <div className="flex-1 text-slate-800 text-sm">
                  {/* Topic and Section indicator */}
                  <div className="flex gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {q.section}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {q.topic}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      q.difficulty === "Easy" ? "text-emerald-600 bg-emerald-50" : 
                      q.difficulty === "Medium" ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50"
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="leading-relaxed text-[13px]">
                    <MarkdownMath text={q.questionText} />
                  </div>

                  {/* Options if Section A */}
                  {q.options && q.options.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pl-3">
                      {q.options.map((opt, oIdx) => {
                        const optionLetter = String.fromCharCode(65 + oIdx);
                        return (
                          <div key={oIdx} className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="font-bold text-slate-500">({optionLetter})</span>
                            <span>
                              <MarkdownMath text={opt} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs select-text">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#1a3a5f] text-white px-6 py-4 flex items-center justify-between border-b border-slate-700/40 select-none">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} className="text-blue-300" />
            <h2 className="font-bold text-sm tracking-tight">Question Paper Overview</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="text-slate-600 text-xs mb-6 border border-blue-100 bg-blue-50/60 p-3.5 rounded-xl flex items-start gap-2.5 select-none leading-relaxed">
            <Eye size={16} className="text-[#1a3a5f] shrink-0 mt-0.5" />
            <span>
              This is a unified read-only overview of all questions in the examination. To record answers, return to the test workspace and navigate via the Question Palette.
            </span>
          </div>

          {renderSubjectSection("Physics Section", physicsQuestions)}
          {renderSubjectSection("Chemistry Section", chemistryQuestions)}
          {renderSubjectSection("Mathematics Section", mathematicsQuestions)}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 px-6 flex justify-end bg-slate-50 select-none">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1a3a5f] hover:bg-[#152e4d] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
          >
            Return to Exam
          </button>
        </div>
      </div>
    </div>
  );
}
export default QuestionPaperModal;
