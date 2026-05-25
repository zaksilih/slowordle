import { ANSWERS_4 } from "./answers-4";
import { ANSWERS_5 } from "./answers-5";
import { ANSWERS_6 } from "./answers-6";
import { VALID_4 } from "./valid-4";
import { VALID_5 } from "./valid-5";
import { VALID_6 } from "./valid-6";

export { ANSWERS_4, ANSWERS_5, ANSWERS_6 };

export function isValidWord(word: string): boolean {
  const w = word.toLowerCase();
  const length = w.length;
  switch (length) {
    case 4:
      return VALID_4.includes(w);
    case 5:
      return VALID_5.includes(w);
    case 6:
      return VALID_6.includes(w);
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
