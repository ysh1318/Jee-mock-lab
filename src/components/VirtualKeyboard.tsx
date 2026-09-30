/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Delete, Trash2 } from "lucide-react";

interface VirtualKeyboardProps {
  value: string;
  onChange: (val: string) => void;
}

export function VirtualKeyboard({ value, onChange }: VirtualKeyboardProps) {
  const keys = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    "0", ".", "-"
  ];

  const handleKeyPress = (char: string) => {
    // Prevent duplicate minus signs or multiple decimals
    if (char === "-" && value.includes("-")) return;
    if (char === "." && value.includes(".")) return;
    
    // If empty and '-' is hit, set it
    if (char === "-") {
      onChange("-" + value);
      return;
    }

    onChange(value + char);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 w-full max-w-[280px]">
      <div className="text-[10px] font-mono tracking-wider text-slate-500 uppercase text-center mb-2 select-none">
        CBT Virtual Numeric Keypad
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleKeyPress(key)}
            className="h-10 text-sm font-semibold bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded shadow-sm transition active:bg-blue-100 text-center flex items-center justify-center cursor-pointer select-none"
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="h-10 text-xs font-semibold bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded shadow-sm transition active:bg-red-200 flex items-center justify-center gap-1 cursor-pointer select-none col-span-1"
          title="Clear response"
        >
          <Trash2 size={13} />
          <span>CLR</span>
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="h-10 text-xs font-semibold bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-700 rounded shadow-sm transition active:bg-slate-400 flex items-center justify-center gap-1 cursor-pointer select-none col-span-2"
          title="Backspace"
        >
          <Delete size={14} />
          <span>BACKSPACE</span>
        </button>
      </div>
    </div>
  );
}
