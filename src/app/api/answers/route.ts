import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaper, isAnswerCorrect } from "@/lib/questions";
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
    };

    const { username, progressId, paperId, questionId, selectedAnswer } = body;

    if (
      !username ||
      typeof progressId !== "number" ||
      typeof paperId !== "number" ||
      typeof questionId !== "number" ||
      !selectedAnswer
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const paper = getPaper(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const question = paper.questions.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const user = await getOrCreateUser(username);
    const progress = await prisma.paperProgress.findFirst({
      where: { id: progressId, userId: user.id, completed: false },
    });

    if (!progress) {
      return NextResponse.json({ error: "Progress not found or already completed" }, { status: 404 });
    }

    const correct = isAnswerCorrect(paperId, questionId, selectedAnswer);

    const record = await prisma.practiceRecord.upsert({
      where: {
        progressId_questionId: { progressId, questionId },
      },
      create: {
        userId: user.id,
        paperId,
        progressId,
        questionId,
        selectedAnswer,
        isCorrect: correct,
      },
      update: {
        selectedAnswer,
        isCorrect: correct,
      },
    });

    return NextResponse.json({
      questionId: record.questionId,
      selectedAnswer: record.selectedAnswer,
      isCorrect: record.isCorrect,
    });
  } catch {
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}
