import type { AnswerRecord, ProgressDetail } from "@/types/question";
import { paperIdFromGuestProgressId } from "@/lib/portfolio-embed";

const STORAGE_PREFIX = "finance-guest-progress-v1";

function storageKey(progressId: number): string {
  return `${STORAGE_PREFIX}:${progressId}`;
}

type GuestProgressStore = {
  currentQuestionIndex: number;
  answers: AnswerRecord[];
};

function emptyStore(): GuestProgressStore {
  return { currentQuestionIndex: 0, answers: [] };
}

export function loadGuestProgress(
  progressId: number,
  paperId: number,
  paperName: string,
  totalQuestions: number
): ProgressDetail {
  try {
    const raw = localStorage.getItem(storageKey(progressId));
    const store: GuestProgressStore = raw ? JSON.parse(raw) : emptyStore();
    return {
      progressId,
      paperId,
      paperName,
      currentQuestionIndex: store.currentQuestionIndex,
      completed: false,
      score: null,
      totalQuestions,
      answers: store.answers,
    };
  } catch {
    return {
      progressId,
      paperId,
      paperName,
      currentQuestionIndex: 0,
      completed: false,
      score: null,
      totalQuestions,
      answers: [],
    };
  }
}

export function saveGuestProgress(
  progressId: number,
  patch: Partial<GuestProgressStore>
): void {
  const paperId = paperIdFromGuestProgressId(progressId);
  const existing = loadGuestProgress(progressId, paperId, "", 0);
  const next: GuestProgressStore = {
    currentQuestionIndex: patch.currentQuestionIndex ?? existing.currentQuestionIndex,
    answers: patch.answers ?? existing.answers,
  };
  localStorage.setItem(storageKey(progressId), JSON.stringify(next));
}

export function clearGuestProgressForUser(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
