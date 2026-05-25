"use client";

import type { LetterResult } from "@/lib/game-logic";

interface GuessEntry {
  word: string;
  result: LetterResult[];
}

interface GameBoardProps {
  guesses: GuessEntry[];
  currentGuess: string;
  wordLength: number;
  maxGuesses: number;
  shakeCurrentRow: boolean;
}

export default function GameBoard({
  guesses,
  currentGuess,
  wordLength,
  maxGuesses,
  shakeCurrentRow,
}: GameBoardProps) {
  const rows = [];

  for (let i = 0; i < maxGuesses; i++) {
    if (i < guesses.length) {
      // Completed guess row
      rows.push(
        <CompletedRow key={i} guess={guesses[i]} wordLength={wordLength} />
      );
    } else if (i === guesses.length) {
      // Current input row
      rows.push(
        <CurrentRow
          key={i}
          guess={currentGuess}
          wordLength={wordLength}
          shake={shakeCurrentRow}
        />
      );
    } else {
      // Empty row
      rows.push(<EmptyRow key={i} wordLength={wordLength} />);
    }
  }

  return (
    <div className="grid gap-[5px]" style={{ gridTemplateRows: `repeat(${maxGuesses}, 1fr)` }}>
      {rows}
    </div>
  );
}

function CompletedRow({ guess, wordLength }: { guess: GuessEntry; wordLength: number }) {
  return (
    <div className="flex gap-[5px]">
      {Array.from({ length: wordLength }).map((_, i) => {
        const letter = guess.word[i] || "";
        const result = guess.result[i];
        const bgColor = getBgColor(result);

        return (
          <div
            key={i}
            className={`w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] flex items-center justify-center text-2xl font-bold uppercase border-2 ${bgColor} tile-flip`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}

function CurrentRow({
  guess,
  wordLength,
  shake,
}: {
  guess: string;
  wordLength: number;
  shake: boolean;
}) {
  return (
    <div className={`flex gap-[5px] ${shake ? "row-shake" : ""}`}>
      {Array.from({ length: wordLength }).map((_, i) => {
        const letter = guess[i] || "";
        const hasBorder = letter ? "border-gray-500" : "border-gray-700";

        return (
          <div
            key={i}
            className={`w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] flex items-center justify-center text-2xl font-bold uppercase border-2 ${hasBorder} bg-transparent ${letter ? "tile-pop" : ""}`}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}

function EmptyRow({ wordLength }: { wordLength: number }) {
  return (
    <div className="flex gap-[5px]">
      {Array.from({ length: wordLength }).map((_, i) => (
        <div
          key={i}
          className="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] flex items-center justify-center text-2xl font-bold uppercase border-2 border-gray-700 bg-transparent"
        />
      ))}
    </div>
  );
}

function getBgColor(result: LetterResult): string {
  switch (result) {
    case "correct":
      return "bg-green-700 border-green-700 text-white";
    case "present":
      return "bg-yellow-600 border-yellow-600 text-white";
    case "absent":
      return "bg-gray-700 border-gray-700 text-white";
    default:
      return "border-gray-700";
  }
}
