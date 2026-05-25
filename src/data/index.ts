// This file re-exports all answer word lists and provides a unified valid words check
// The full valid words lists would be loaded from JSON files in production
// For now, we use the answer lists as valid words too (expanded later)

import { ANSWERS_4 } from "./answers-4";
import { ANSWERS_5 } from "./answers-5";
import { ANSWERS_6 } from "./answers-6";

export { ANSWERS_4, ANSWERS_5, ANSWERS_6 };

// In production, these would be much larger lists (all valid dictionary words)
// For now, answers are also valid guesses
export function isValidWord(word: string): boolean {
  const length = word.length;
  switch (length) {
    case 4:
      return ANSWERS_4.includes(word.toLowerCase());
    case 5:
      return ANSWERS_5.includes(word.toLowerCase());
    case 6:
      return ANSWERS_6.includes(word.toLowerCase());
    default:
      return false;
  }
}

export function getAnswerList(length: number): string[] {
  switch (length) {
    case 4:
      return ANSWERS_4;
    case 5:
      return ANSWERS_5;
    case 6:
      return ANSWERS_6;
    default:
      return ANSWERS_5;
  }
}
