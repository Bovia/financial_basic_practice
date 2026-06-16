import { getPaper } from "@/lib/questions";
import type { Question } from "@/types/question";

export function parseProgressQuestionIds(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const ids = raw.filter((id): id is number => typeof id === "number" && Number.isInteger(id));
  return ids.length > 0 ? ids : null;
}

export function getProgressQuestions(paperId: number, questionIds: number[] | null): Question[] {
  const paper = getPaper(paperId);
  if (!paper) return [];

  if (!questionIds) return paper.questions;

  const idSet = new Set(questionIds);
  return paper.questions.filter((question) => idSet.has(question.id));
}

export function getProgressTotalQuestions(paperId: number, questionIds: number[] | null): number {
  return getProgressQuestions(paperId, questionIds).length;
}

export function normalizeProgressQuestionIds(
  paperId: number,
  questionIds: number[] | undefined
): number[] | null {
  if (!questionIds || questionIds.length === 0) return null;

  const paper = getPaper(paperId);
  if (!paper) return null;

  const validIds = new Set(paper.questions.map((question) => question.id));
  const normalized = [...new Set(questionIds.filter((id) => validIds.has(id)))];

  return normalized.length > 0 ? normalized : null;
}
