import { getCategories, getQuestion } from "@/lib/questions";
import type { Question, QuestionType } from "@/types/question";

export const SPRINT_PAPER_ID = 0;
export const SPRINT_GROUP_SIZE = 20;

export type QuestionRef = {
  paperId: number;
  questionId: number;
};

export type SprintQuestion = Question & {
  paperId: number;
  questionId: number;
};

export function questionRefKey(ref: QuestionRef): string {
  return `${ref.paperId}:${ref.questionId}`;
}

export function parseQuestionRefs(raw: unknown): QuestionRef[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const refs = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const paperId = record.paperId;
      const questionId = record.questionId;
      if (typeof paperId !== "number" || typeof questionId !== "number") return null;
      return { paperId, questionId };
    })
    .filter((item): item is QuestionRef => item !== null);

  return refs.length > 0 ? refs : null;
}

export function getAllQuestionRefs(categoryId = "financial-basics"): QuestionRef[] {
  const category = getCategories().find((item) => item.id === categoryId);
  if (!category) return [];

  const refs: QuestionRef[] = [];
  for (const paper of category.papers) {
    for (const question of paper.questions) {
      refs.push({ paperId: paper.id, questionId: question.id });
    }
  }
  return refs;
}

export function getQuestionsFromRefs(refs: QuestionRef[]): SprintQuestion[] {
  return refs
    .map((ref) => {
      const question = getQuestion(ref.paperId, ref.questionId);
      if (!question) return null;
      return {
        ...question,
        paperId: ref.paperId,
        questionId: ref.questionId,
      };
    })
    .filter((item): item is SprintQuestion => item !== null);
}

export function buildMasteredKeySet(
  records: Array<{ paperId: number; questionId: number; isCorrect: boolean }>
): Set<string> {
  const mastered = new Set<string>();
  for (const record of records) {
    if (record.isCorrect) {
      mastered.add(questionRefKey(record));
    }
  }
  return mastered;
}

export function getUnmasteredPool(
  allRefs: QuestionRef[],
  masteredKeys: Set<string>
): QuestionRef[] {
  return allRefs.filter((ref) => !masteredKeys.has(questionRefKey(ref)));
}

export function pickRandomGroup(pool: QuestionRef[], size = SPRINT_GROUP_SIZE): QuestionRef[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(size, shuffled.length));
}

export const SPRINT_CHEERS = [
  "你真棒！",
  "稳得很！",
  "状态拉满！",
  "越刷越顺！",
  "这组漂亮！",
  "继续保持！",
  "冲刺感有了！",
  "离目标更近了！",
];

export function getSprintCheer(groupNumber: number, username: string): string {
  const cheer = SPRINT_CHEERS[(groupNumber - 1) % SPRINT_CHEERS.length];
  return `${username}，${cheer}`;
}

export type SprintTheme = "pink" | "orange" | "purple";

export function getSprintTheme(groupNumber: number): SprintTheme {
  const themes: SprintTheme[] = ["pink", "orange", "purple"];
  return themes[(groupNumber - 1) % themes.length];
}

export type SprintQuestionPayload = {
  id: number;
  paperId: number;
  questionId: number;
  type?: QuestionType;
  title: string;
  options: [string, string, string, string];
  answer: string;
  analysis: string;
};

export function toSprintQuestionPayload(questions: SprintQuestion[]): SprintQuestionPayload[] {
  return questions.map((q) => ({
    id: q.questionId,
    paperId: q.paperId,
    questionId: q.questionId,
    type: q.type,
    title: q.title,
    options: q.options,
    answer: q.answer,
    analysis: q.analysis,
  }));
}
