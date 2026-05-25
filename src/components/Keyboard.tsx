"use client";

import type { LetterResult } from "@/lib/game-logic";

// Slovenian keyboard layout (matches besedle.com - no Q, W, X, Y)
const KEYBOARD_ROWS = [
  ["e", "r", "t", "z", "u", "i", "o", "p", "š", "ž"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "č"],
  ["ENTER", "c", "v", "b", "n", "m", "BACKSPACE"],
];

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  keyColors: Record<string, LetterResult>;
}

export default function Keyboard({ onKeyPress, keyColors }: KeyboardProps) {
  return (
    <div className="flex flex-col items-center gap-[6px] px-2">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-[4px] sm:gap-[6px]">
          {row.map((key) => {
            const isSpecial = key === "ENTER" || key === "BACKSPACE";
            const color = keyColors[key];
            const bgClass = getKeyBg(color);
            const widthClass = isSpecial ? "px-3 sm:px-4" : "w-[30px] sm:w-[40px]";

            return (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className={`${widthClass} h-[50px] sm:h-[58px] flex items-center justify-center rounded font-bold text-sm sm:text-base uppercase ${bgClass} select-none active:opacity-70 transition-colors`}
              >
                {key === "BACKSPACE" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M2.515 10.674a1.875 1.875 0 000 2.652l6.18 6.18a1.875 1.875 0 001.326.549h8.354a3.75 3.75 0 003.75-3.75V7.695a3.75 3.75 0 00-3.75-3.75h-8.354a1.875 1.875 0 00-1.326.55l-6.18 6.18zM12.53 9.22a.75.75 0 10-1.06 1.06L13.19 12l-1.72 1.72a.75.75 0 101.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L15.31 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" clipRule="evenodd" />
                  </svg>
                ) : key === "ENTER" ? (
                  "↵"
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function getKeyBg(color?: LetterResult): string {
  switch (color) {
    case "correct":
      return "bg-green-700 text-white";
    case "present":
      return "bg-yellow-600 text-white";
    case "absent":
      return "bg-gray-800 text-gray-400";
    default:
      return "bg-gray-600 text-white";
  }
}
