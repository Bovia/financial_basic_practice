import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaperTotalQuestions, isAnswerCorrect } from "@/lib/questions";
import { getOrCreateUser } from "@/lib/user";
import type { AnswerOption } from "@/types/question";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      progressId?: number;
      paperId?: number;
      questionId?: number;
      selectedAnswer?: AnswerOption;
      answers?: Array<{ questionId: number; selectedAnswer: AnswerOption }>;
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

    const pendingAnswers: Array<{ questionId: number; selectedAnswer: AnswerOption }> = [];

    if (Array.isArray(answerBatch) && answerBatch.length > 0) {
      pendingAnswers.push(...answerBatch);
    } else if (typeof questionId === "number" && selectedAnswer) {
      pendingAnswers.push({ questionId, selectedAnswer });
    }

    const savedAnswers: Array<{
      questionId: number;
      selectedAnswer: AnswerOption;
      isCorrect: boolean;
    }> = [];

    for (const item of pendingAnswers) {
      const correct = isAnswerCorrect(paperId, item.questionId, item.selectedAnswer);
      const record = await prisma.practiceRecord.upsert({
        where: { progressId_questionId: { progressId, questionId: item.questionId } },
        create: {
          userId: user.id,
          paperId,
          progressId,
          questionId: item.questionId,
          selectedAnswer: item.selectedAnswer,
          isCorrect: correct,
        },
        update: { selectedAnswer: item.selectedAnswer, isCorrect: correct },
      });
      savedAnswers.push({
        questionId: record.questionId,
        selectedAnswer: record.selectedAnswer as AnswerOption,
        isCorrect: record.isCorrect,
      });
    }

    const totalQuestions = getPaperTotalQuestions(paperId);
    let score: number | null = progress.score;

    if (complete) {
      const savedByQuestionId = new Map(savedAnswers.map((item) => [item.questionId, item]));
      const records = progress.practiceRecords.map((record) => {
        const saved = savedByQuestionId.get(record.questionId);
        return saved ? { isCorrect: saved.isCorrect } : { isCorrect: record.isCorrect };
      });

      for (const saved of savedAnswers) {
        if (!progress.practiceRecords.some((record) => record.questionId === saved.questionId)) {
          records.push({ isCorrect: saved.isCorrect });
        }
      }

      score = records.filter((r) => r.isCorrect).length;
    }

    const updated = await prisma.paperProgress.update({
      where: { id: progressId },
      data: {
        ...(typeof currentQuestionIndex === "number" && { currentQuestionIndex }),
        ...(complete && {
          completed: true,
          score: score ?? 0,
          currentQuestionIndex: totalQuestions - 1,
        }),
      },
    });

    if (complete) {
      return NextResponse.json({
        progressId: updated.id,
        savedAnswer: savedAnswers[0] ?? null,
        savedAnswers,
        currentQuestionIndex: updated.currentQuestionIndex,
        completed: true,
        score: updated.score,
        totalQuestions,
        correctCount: updated.score ?? 0,
        incorrectCount: totalQuestions - (updated.score ?? 0),
        accuracy:
          totalQuestions > 0
            ? Math.round(((updated.score ?? 0) / totalQuestions) * 100)
            : 0,
      });
    }

    return NextResponse.json({
      progressId: updated.id,
      savedAnswer: savedAnswers[0] ?? null,
      savedAnswers,
      currentQuestionIndex: updated.currentQuestionIndex,
      completed: updated.completed,
    });
  } catch {
    return NextResponse.json({ error: "Failed to save practice data" }, { status: 500 });
  }
}
