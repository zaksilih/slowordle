import { getAnswerList } from "@/data";

const TIMEZONE = "Europe/Ljubljana";

/**
 * Get today's date string (YYYY-MM-DD) in Ljubljana timezone.
 */
export function getTodayDateStr(): string {
  const now = new Date();
  return now.toLocaleDateString("en-CA", { timeZone: TIMEZONE }); // en-CA gives YYYY-MM-DD
}

/**
 * Deterministically select the daily word based on date string and a secret salt.
 * This ensures the same word is selected for all users on the same day.
 */
export function getDailyWord(dateStr: string, salt: string): { word: string; wordLength: number; puzzleNumber: number } {
  const puzzleNumber = getPuzzleNumber(dateStr);
  const wordLength = getWordLength(dateStr, salt);
  const answers = getAnswerList(wordLength);
  const index = hashToIndex(dateStr + salt, answers.length);
  
  return {
    word: answers[index],
    wordLength,
    puzzleNumber,
  };
}

/**
 * Determine word length for a given day.
 * Weighted: 50% chance of 5 letters, 25% chance of 4, 25% chance of 6.
 */
function getWordLength(dateStr: string, salt: string): number {
  const hash = simpleHash(dateStr + "length" + salt);
  const mod = hash % 4;
  if (mod < 2) return 5; // 50% - indices 0,1
  if (mod === 2) return 4; // 25% - index 2
  return 6; // 25% - index 3
}

/**
 * Get puzzle number (days since the app launched).
 * Day 1 = 2026-05-25 (launch date).
 */
function getPuzzleNumber(dateStr: string): number {
  const epochMs = Date.UTC(2026, 4, 25); // May 25, 2026 UTC midnight
  const [year, month, day] = dateStr.split("-").map(Number);
  const currentMs = Date.UTC(year, month - 1, day);
  const diffDays = Math.floor((currentMs - epochMs) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Simple deterministic hash function (djb2 variant).
 */
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Convert a hash seed to an index within a given range.
 */
function hashToIndex(seed: string, max: number): number {
  return simpleHash(seed) % max;
}

export type LetterResult = "correct" | "present" | "absent";

export interface GuessResult {
  letters: LetterResult[];
}

/**
 * Evaluate a guess against the target word.
 * Handles duplicate letters correctly (Wordle rules).
 */
export function evaluateGuess(guess: string, target: string): GuessResult {
  const guessArr = guess.toLowerCase().split("");
  const targetArr = target.toLowerCase().split("");
  const result: LetterResult[] = new Array(guessArr.length).fill("absent");
  const targetUsed: boolean[] = new Array(targetArr.length).fill(false);

  // First pass: mark correct letters (green)
  for (let i = 0; i < guessArr.length; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = "correct";
      targetUsed[i] = true;
    }
  }

  // Second pass: mark present letters (yellow)
  for (let i = 0; i < guessArr.length; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < targetArr.length; j++) {
      if (!targetUsed[j] && guessArr[i] === targetArr[j]) {
        result[i] = "present";
        targetUsed[j] = true;
        break;
      }
    }
  }

  return { letters: result };
}

/**
 * Calculate score based on number of guesses.
 */
export function calculateScore(guessCount: number, won: boolean): number {
  if (!won) return 0;
  return Math.max(0, 7 - guessCount); // 1 guess = 6pts, 6 guesses = 1pt
}
