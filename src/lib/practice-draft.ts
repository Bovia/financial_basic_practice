import type { AnswerOption } from "@/types/question";

export type PracticeDraft = {
  currentIndex: number;
  selections: Record<number, AnswerOption>;
  revealed: number[];
};

function draftKey(progressId: number) {
  return `practice-draft:${progressId}`;
}

export function loadPracticeDraft(progressId: number): PracticeDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(draftKey(progressId));
    if (!raw) return null;
    return JSON.parse(raw) as PracticeDraft;
  } catch {
    return null;
  }
}

export function savePracticeDraft(progressId: number, draft: PracticeDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(draftKey(progressId), JSON.stringify(draft));
}

export function clearPracticeDraft(progressId: number) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(draftKey(progressId));
}
