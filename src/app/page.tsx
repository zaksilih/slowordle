"use client";

import { useState, useEffect, useCallback } from "react";
import GameBoard from "@/components/GameBoard";
import Keyboard from "@/components/Keyboard";
import Header from "@/components/Header";
import GameOverModal from "@/components/GameOverModal";
import type { LetterResult } from "@/lib/game-logic";

interface GuessEntry {
  word: string;
  result: LetterResult[];
}

interface GameState {
  puzzleNumber: number;
  wordLength: number;
  guesses: GuessEntry[];
  status: "in_progress" | "won" | "lost";
  score: number;
  word?: string;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch today's game state
  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch("/api/game/today");
        const data = await res.json();
        setGameState({
          puzzleNumber: data.puzzleNumber,
          wordLength: data.wordLength,
          guesses: data.gameState?.guesses || [],
          status: data.gameState?.status || "in_progress",
          score: data.gameState?.score || 0,
          word: data.word,
        });
        if (data.username) setUsername(data.username);
        // Show modal if game was already completed (returning to page)
        if (data.gameState?.status === "won" || data.gameState?.status === "lost") {
          setTimeout(() => setShowModal(true), 1000);
        }
      } catch {
        setError("Napaka pri nalaganju igre");
      } finally {
        setIsLoading(false);
      }
    }
    fetchGame();
  }, []);

  const submitGuess = useCallback(async () => {
    if (!gameState || isSubmitting) return;
    if (currentGuess.length !== gameState.wordLength) return;
    if (gameState.status !== "in_progress") return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/game/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: currentGuess }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError("Za igranje se morate prijaviti →");
          window.location.href = "/login";
          return;
        }
        setError(data.error || "Napaka");
        setShakeRow(true);
        setTimeout(() => setShakeRow(false), 500);
        return;
      }

      setGameState({
        ...gameState,
        guesses: data.guesses,
        status: data.status,
        score: data.score,
        word: data.word,
      });
      setCurrentGuess("");

      // Show modal after a delay so user can see the completed board
      if (data.status === "won" || data.status === "lost") {
        setTimeout(() => setShowModal(true), 1500);
      }
    } catch {
      setError("Napaka pri pošiljanju");
    } finally {
      setIsSubmitting(false);
    }
  }, [currentGuess, gameState, isSubmitting]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (!gameState || gameState.status !== "in_progress") return;

      if (key === "ENTER") {
        submitGuess();
      } else if (key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (currentGuess.length < gameState.wordLength) {
        setCurrentGuess((prev) => prev + key.toLowerCase());
      }
    },
    [gameState, currentGuess, submitGuess]
  );

  // Handle physical keyboard
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Enter") {
        e.preventDefault();
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleKeyPress("BACKSPACE");
      } else if (e.key.length === 1 && /[a-žA-Ž]/i.test(e.key)) {
        handleKeyPress(e.key.toLowerCase());
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  // Compute keyboard colors from guesses
  const keyboardColors = computeKeyboardColors(gameState?.guesses || []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Nalagam...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
      <Header puzzleNumber={gameState?.puzzleNumber} username={username} />

      {error && (
        <div className="text-center py-2 text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-2">
        <GameBoard
          guesses={gameState?.guesses || []}
          currentGuess={currentGuess}
          wordLength={gameState?.wordLength || 5}
          maxGuesses={6}
          shakeCurrentRow={shakeRow}
        />
      </div>

      <div className="pb-2">
        <Keyboard onKeyPress={handleKeyPress} keyColors={keyboardColors} />
      </div>

      {showModal && gameState && gameState.status !== "in_progress" && (
        <GameOverModal
          status={gameState.status}
          word={gameState.word || ""}
          score={gameState.score}
          guessCount={gameState.guesses.length}
          puzzleNumber={gameState.puzzleNumber}
          wordLength={gameState.wordLength}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function computeKeyboardColors(
  guesses: GuessEntry[]
): Record<string, LetterResult> {
  const colors: Record<string, LetterResult> = {};

  for (const guess of guesses) {
    for (let i = 0; i < guess.word.length; i++) {
      const letter = guess.word[i];
      const result = guess.result[i];

      // Priority: correct > present > absent
      if (result === "correct") {
        colors[letter] = "correct";
      } else if (result === "present" && colors[letter] !== "correct") {
        colors[letter] = "present";
      } else if (!colors[letter]) {
        colors[letter] = "absent";
      }
    }
  }

  return colors;
}
