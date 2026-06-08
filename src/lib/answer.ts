import type { AnswerOption } from "@/types/question";

const OPTION_ORDER: AnswerOption[] = ["A", "B", "C", "D"];

export function normalizeAnswer(answer: string): string {
  return answer
    .toUpperCase()
    .split("")
    .filter((char): char is AnswerOption => OPTION_ORDER.includes(char as AnswerOption))
    .sort()
    .join("");
}

export function toggleAnswerOption(current: string, label: AnswerOption): string {
  const selected = new Set(normalizeAnswer(current).split(""));

  if (selected.has(label)) {
    selected.delete(label);
  } else {
    selected.add(label);
  }

  return [...selected].sort().join("");
}

export function isAnswerMatch(selected: string | null | undefined, correct: string): boolean {
  if (!selected) return false;
  return normalizeAnswer(selected) === normalizeAnswer(correct);
}

export function isOptionInAnswer(answer: string | null | undefined, label: AnswerOption): boolean {
  if (!answer) return false;
  return normalizeAnswer(answer).includes(label);
}
