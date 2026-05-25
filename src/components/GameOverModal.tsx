"use client";

import { useState, useEffect } from "react";

interface GameOverModalProps {
  status: "won" | "lost";
  word: string;
  score: number;
  guessCount: number;
  puzzleNumber: number;
  wordLength: number;
  onClose: () => void;
}

export default function GameOverModal({
  status,
  word,
  score,
  guessCount,
  puzzleNumber,
  wordLength,
  onClose,
}: GameOverModalProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const emoji = status === "won" ? `${guessCount}/6` : "X/6";
    const text = `SloWordle #${puzzleNumber} (${wordLength} črk) ${emoji}\n\nSkopiraj rezultat na slovvordle.si`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full text-center relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center"
          aria-label="Zapri"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-2">
          {status === "won" ? "🎉 Čestitke!" : "😔 Naslednjič!"}
        </h2>

        {status === "won" ? (
          <p className="text-gray-300 mb-4">
            Uganili ste besedo v {guessCount} {guessCount === 1 ? "poskusu" : "poskusih"}!
          </p>
        ) : (
          <p className="text-gray-300 mb-4">
            Pravilna beseda je bila:{" "}
            <span className="font-bold text-white uppercase">{word}</span>
          </p>
        )}

        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{score}</div>
            <div className="text-xs text-gray-400">Točke</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{guessCount}/6</div>
            <div className="text-xs text-gray-400">Poskusi</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleShare}
            className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
          >
            {copied ? "Skopirano! ✓" : "Deli rezultat 📋"}
          </button>

          <p className="text-xs text-gray-500 mt-2">
            Naslednja uganka čez{" "}
            <CountdownTimer />
          </p>
        </div>
      </div>
    </div>
  );
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono">{timeLeft}</span>;
}

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
