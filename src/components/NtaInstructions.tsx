/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Info, HelpCircle } from "lucide-react";

interface NtaInstructionsProps {
  onClose?: () => void;
  showProceed?: boolean;
  onProceed?: () => void;
}

export function NtaInstructions({ onClose, showProceed = false, onProceed }: NtaInstructionsProps) {
  return (
    <div className="bg-white p-6 max-h-[80vh] overflow-y-auto leading-relaxed text-slate-700 text-sm">
      <div className="text-center font-bold text-lg text-blue-800 border-b pb-3 mb-4 uppercase tracking-wide flex items-center justify-center gap-2 select-none">
        <Info size={20} className="text-blue-700 animate-pulse" />
        General Instructions — JEE (Main) CBT
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">1. Duration of Examination:</h3>
          <p>
            The total duration of the examination is <strong>3 hours (180 minutes)</strong> for B.E./B.Tech papers.
            For candidates eligible for compensatory time, the duration will be increased accordingly.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">2. Timer Details:</h3>
          <p>
            The clock will be set at the server. The countdown timer in the top right corner of the screen will display the remaining time available for you to complete the exam. When the timer reaches zero, the examination will end by itself. You are not required to end or submit your examination manually.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-2">3. Question Palette Legends:</h3>
          <p className="mb-2">
            The Question Palette displayed on the right side of the screen will show the status of each question using one of the following symbols:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-3">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 flex items-center justify-center bg-slate-100 border border-slate-300 text-slate-700 rounded-sm font-semibold text-xs select-none">1</span>
              <span>You have not visited the question yet.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 flex items-center justify-center bg-red-500 border border-red-600 text-white rounded-sm font-semibold text-xs select-none">2</span>
              <span>You have visited the question but not answered it.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 flex items-center justify-center bg-green-500 border border-green-600 text-white rounded-sm font-semibold text-xs select-none">3</span>
              <span>You have answered the question.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 flex items-center justify-center bg-indigo-500 border border-indigo-600 text-white rounded-full font-semibold text-xs select-none">4</span>
              <span>You have NOT answered the question, but have marked the question for review.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 relative flex items-center justify-center bg-indigo-500 border border-indigo-600 text-white rounded-full font-semibold text-xs select-none">
                5
                <span className="absolute bottom-[-2px] right-[-2px] w-3.5 h-3.5 bg-green-500 rounded-full border border-white flex items-center justify-center text-[8px] font-black">✓</span>
              </span>
              <span>The question is answered and marked for review. It will be evaluated on final submission.</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-2">4. Navigating to a Question:</h3>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Click on the question number in the Question Palette to go to that question directly.</li>
            <li>Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
            <li>Click on <strong>Mark for Review & Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
            <li>Conversely, to clear your chosen answer, click on the <strong>Clear Response</strong> button of the current question.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">5. Marking Scheme:</h3>
          <div className="border border-slate-200 rounded max-w-md my-2 overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-2 border-r font-semibold">Response State</th>
                  <th className="p-2 font-semibold">Marks</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-2 border-r text-green-700 font-medium">Correct Response</td>
                  <td className="p-2 font-semibold text-green-700">+4 Marks</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-2 border-r text-red-600 font-medium">Incorrect Response</td>
                  <td className="p-2 font-semibold text-red-600">-1 Mark</td>
                </tr>
                <tr>
                  <td className="p-2 border-r text-slate-500">Unanswered / Marked (Only)</td>
                  <td className="p-2 text-slate-500">0 Marks</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 italic">
            * Note: Section B (Numerical value questions) consists of 10 questions. Candidates must attempt 5 out of 10 questions. Negative marking of -1 applies is active.
          </p>
        </div>
      </div>

      <div className="border-t pt-4 mt-6 flex justify-end gap-3 select-none">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-xs font-semibold cursor-pointer"
          >
            Close Instructions
          </button>
        )}
        {showProceed && onProceed && (
          <button
            type="button"
            onClick={onProceed}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-100"
          >
            <span>Proceed to Test</span>
            <span>&rarr;</span>
          </button>
        )}
      </div>
    </div>
  );
}
export default NtaInstructions;
