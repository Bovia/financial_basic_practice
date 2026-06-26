import { getProgressQuestions, parseProgressQuestionIds } from "@/lib/progress-questions";
import { getQuestionsFromRefs, parseQuestionRefs, type SprintQuestion } from "@/lib/sprint";
import { getPaper } from "@/lib/questions";
import type { Question, QuestionType } from "@/types/question";

/** 证券从业 · 金融市场基础常见卷面：单选 0.5、多选/判断 1 分，120 题满分 100，60 分合格 */
export const EXAM_PASS_SCORE = 60;

const DEFAULT_SCORE_BY_TYPE: Record<QuestionType, number> = {
  single: 0.5,
  multiple: 1,
  judge: 1,
};

type ScorableQuestion = Pick<Question, "id" | "type" | "score"> & { paperId?: number };

type ScoreRecord = {
  paperId: number;
  questionId: number;
  isCorrect: boolean;
};

export function getQuestionPointValue(question: ScorableQuestion): number {
  if (typeof question.score === "number") return question.score;
  return DEFAULT_SCORE_BY_TYPE[question.type ?? "single"];
}

export function getMaxPointScore(questions: ScorableQuestion[]): number {
  return questions.reduce((sum, question) => sum + getQuestionPointValue(question), 0);
}

export function calculatePointScore(
  questions: ScorableQuestion[],
  records: ScoreRecord[]
): {
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
} {
  let score = 0;
  let correctCount = 0;

  for (const question of questions) {
    const record = records.find((item) =>
      question.paperId != null
        ? item.paperId === question.paperId && item.questionId === question.id
        : item.questionId === question.id
    );

    if (record?.isCorrect) {
      score += getQuestionPointValue(question);
      correctCount++;
    }
  }

  const totalQuestions = questions.length;
  const incorrectCount = totalQuestions - correctCount;
  const maxScore = getMaxPointScore(questions);
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    score: roundPointScore(score),
    maxScore: roundPointScore(maxScore),
    correctCount,
    incorrectCount,
    accuracy,
  };
}

export function roundPointScore(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 数据库存储为十分位整数，如 75.5 分存 755 */
export function toStoredScore(points: number): number {
  return Math.round(points * 10);
}

export function fromStoredScore(stored: number): number {
  return roundPointScore(stored / 10);
}

export function formatPointScore(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

export function isExamPassed(score: number, maxScore: number): boolean {
  if (maxScore <= 0) return false;
  if (maxScore >= 100 - 0.01) {
    return score >= EXAM_PASS_SCORE;
  }
  return score >= roundPointScore((EXAM_PASS_SCORE / 100) * maxScore);
}

export function scorePaperProgress(progress: {
  kind: string;
  paperId: number;
  questionIds: unknown;
  practiceRecords: ScoreRecord[];
}): {
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  totalQuestions: number;
  questions: ScorableQuestion[];
} {
  let questions: ScorableQuestion[] = [];

  if (progress.kind === "sprint") {
    const sprintQuestions: SprintQuestion[] = getQuestionsFromRefs(
      parseQuestionRefs(progress.questionIds) ?? []
    );
    questions = sprintQuestions.map((question) => ({
      id: question.questionId,
      paperId: question.paperId,
      type: question.type,
      score: question.score,
    }));
  } else {
    const progressQuestionIds = parseProgressQuestionIds(progress.questionIds);
    questions = getProgressQuestions(progress.paperId, progressQuestionIds);
  }

  const result = calculatePointScore(questions, progress.practiceRecords);

  return {
    ...result,
    totalQuestions: questions.length,
    questions,
  };
}

export function getFullPaperMaxScore(paperId: number): number {
  const paper = getPaper(paperId);
  if (!paper) return 100;
  return getMaxPointScore(paper.questions);
}
