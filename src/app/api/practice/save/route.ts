import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getProgressTotalQuestions,
  parseProgressQuestionIds,
} from "@/lib/progress-questions";
import { getQuestionsFromRefs, parseQuestionRefs } from "@/lib/sprint";
import { isAnswerCorrect } from "@/lib/questions";
import { scorePaperProgress, toStoredScore, isExamPassed } from "@/lib/scoring";
import { getOrCreateUser } from "@/lib/user";

type AnswerInput = {
  paperId?: number;
  questionId: number;
  selectedAnswer: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      progressId?: number;
      paperId?: number;
      questionId?: number;
      selectedAnswer?: string;
      answers?: AnswerInput[];
      currentQuestionIndex?: number;
      complete?: boolean;
    };

    const {
      username,
      progressId,
      paperId,
      questionId,
      selectedAnswer,
      answers: answerBatch,
      currentQuestionIndex,
      complete,
    } = body;

    if (!username || typeof progressId !== "number" || typeof paperId !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await getOrCreateUser(username);
    const progress = await prisma.paperProgress.findFirst({
      where: { id: progressId, userId: user.id, completed: false },
      include: { practiceRecords: true },
    });

    if (!progress) {
      return NextResponse.json({ error: "Progress not found or already completed" }, { status: 404 });
    }

    const isSprint = progress.kind === "sprint";
    const pendingAnswers: Array<{ paperId: number; questionId: number; selectedAnswer: string }> =
      [];

    if (Array.isArray(answerBatch) && answerBatch.length > 0) {
      for (const item of answerBatch) {
        pendingAnswers.push({
          paperId: item.paperId ?? (isSprint ? 0 : paperId),
          questionId: item.questionId,
          selectedAnswer: item.selectedAnswer,
        });
      }
    } else if (typeof questionId === "number" && selectedAnswer) {
      pendingAnswers.push({
        paperId: isSprint ? paperId : progress.paperId,
        questionId,
        selectedAnswer,
      });
    }

    if (isSprint) {
      const refs = parseQuestionRefs(progress.questionIds) ?? [];
      for (const item of pendingAnswers) {
        const valid = refs.some(
          (ref) => ref.paperId === item.paperId && ref.questionId === item.questionId
        );
        if (!valid) {
          return NextResponse.json({ error: "Invalid sprint question" }, { status: 400 });
        }
      }
    }

    const savedAnswers: Array<{
      paperId: number;
      questionId: number;
      selectedAnswer: string;
      isCorrect: boolean;
    }> = [];

    for (const item of pendingAnswers) {
      const itemPaperId = isSprint ? item.paperId : progress.paperId;
      const correct = isAnswerCorrect(itemPaperId, item.questionId, item.selectedAnswer);
      const record = await prisma.practiceRecord.upsert({
        where: {
          progressId_paperId_questionId: {
            progressId,
            paperId: itemPaperId,
            questionId: item.questionId,
          },
        },
        create: {
          userId: user.id,
          paperId: itemPaperId,
          progressId,
          questionId: item.questionId,
          selectedAnswer: item.selectedAnswer,
          isCorrect: correct,
        },
        update: { selectedAnswer: item.selectedAnswer, isCorrect: correct },
      });
      savedAnswers.push({
        paperId: record.paperId,
        questionId: record.questionId,
        selectedAnswer: record.selectedAnswer,
        isCorrect: record.isCorrect,
      });
    }

    let totalQuestions = 0;
    if (isSprint) {
      totalQuestions = getQuestionsFromRefs(parseQuestionRefs(progress.questionIds) ?? []).length;
    } else {
      const progressQuestionIds = parseProgressQuestionIds(progress.questionIds);
      totalQuestions = getProgressTotalQuestions(progress.paperId, progressQuestionIds);
    }

    let score: number | null = progress.score;
    let scoredResult: ReturnType<typeof scorePaperProgress> | null = null;

    if (complete) {
      const mergedRecords = progress.practiceRecords.map((record) => {
        const saved = savedAnswers.find(
          (item) => item.paperId === record.paperId && item.questionId === record.questionId
        );
        return {
          paperId: record.paperId,
          questionId: record.questionId,
          isCorrect: saved?.isCorrect ?? record.isCorrect,
        };
      });

      for (const saved of savedAnswers) {
        if (
          !progress.practiceRecords.some(
            (record) =>
              record.paperId === saved.paperId && record.questionId === saved.questionId
          )
        ) {
          mergedRecords.push({
            paperId: saved.paperId,
            questionId: saved.questionId,
            isCorrect: saved.isCorrect,
          });
        }
      }

      scoredResult = scorePaperProgress({
        kind: progress.kind,
        paperId: progress.paperId,
        questionIds: progress.questionIds,
        practiceRecords: mergedRecords,
      });
      score = toStoredScore(scoredResult.score);
    }

    const updated = await prisma.paperProgress.update({
      where: { id: progressId },
      data: {
        ...(typeof currentQuestionIndex === "number" && { currentQuestionIndex }),
        ...(complete && {
          completed: true,
          score: score ?? 0,
          currentQuestionIndex: Math.max(totalQuestions - 1, 0),
        }),
      },
    });

    if (complete && scoredResult) {
      return NextResponse.json({
        progressId: updated.id,
        savedAnswer: savedAnswers[0] ?? null,
        savedAnswers,
        currentQuestionIndex: updated.currentQuestionIndex,
        completed: true,
        score: scoredResult.score,
        maxScore: scoredResult.maxScore,
        totalQuestions,
        correctCount: scoredResult.correctCount,
        incorrectCount: scoredResult.incorrectCount,
        accuracy: scoredResult.accuracy,
        passed: isExamPassed(scoredResult.score, scoredResult.maxScore),
        isSprint,
      });
    }

    return NextResponse.json({
      progressId: updated.id,
      savedAnswer: savedAnswers[0] ?? null,
      savedAnswers,
      currentQuestionIndex: updated.currentQuestionIndex,
      completed: updated.completed,
      isSprint,
    });
  } catch {
    return NextResponse.json({ error: "Failed to save practice data" }, { status: 500 });
  }
}
