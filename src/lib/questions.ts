import questionBankData from "../../data/question-bank.json";
import { isAnswerMatch } from "@/lib/answer";
import type { Category, Paper, Question, QuestionBank } from "@/types/question";

const questionBank = questionBankData as QuestionBank;

export function getCategories(): Category[] {
  return questionBank.categories;
}

export function getPaper(paperId: number): Paper | undefined {
  for (const category of questionBank.categories) {
    const paper = category.papers.find((p) => p.id === paperId);
    if (paper) return paper;
  }
  return undefined;
}

export function getQuestion(paperId: number, questionId: number): Question | undefined {
  const paper = getPaper(paperId);
  return paper?.questions.find((q) => q.id === questionId);
}

export function getQuestionByIndex(paperId: number, index: number): Question | undefined {
  const paper = getPaper(paperId);
  if (!paper) return undefined;
  return paper.questions[index];
}

export function getPaperTotalQuestions(paperId: number): number {
  return getPaper(paperId)?.questions.length ?? 0;
}

export function isAnswerCorrect(
  paperId: number,
  questionId: number,
  selectedAnswer: string
): boolean {
  const question = getQuestion(paperId, questionId);
  if (!question) return false;
  return isAnswerMatch(selectedAnswer, question.answer);
}

export function getPaperName(paperId: number): string {
  return getPaper(paperId)?.name ?? `第${paperId}套题`;
}
