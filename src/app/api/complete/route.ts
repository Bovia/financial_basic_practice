import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getProgressTotalQuestions,
  parseProgressQuestionIds,
} from "@/lib/progress-questions";
import { scorePaperProgress, toStoredScore, isExamPassed } from "@/lib/scoring";
import { getOrCreateUser } from "@/lib/user";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      progressId?: number;
    };

    const { username, progressId } = body;

    if (!username || typeof progressId !== "number") {
      return NextResponse.json({ error: "username and progressId are required" }, { status: 400 });
    }

    const user = await getOrCreateUser(username);
    const progress = await prisma.paperProgress.findFirst({
      where: { id: progressId, userId: user.id },
      include: { practiceRecords: true },
    });

    if (!progress) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    const progressQuestionIds = parseProgressQuestionIds(progress.questionIds);
    const totalQuestions = getProgressTotalQuestions(progress.paperId, progressQuestionIds);
    const scored = scorePaperProgress(progress);

    const updated = await prisma.paperProgress.update({
      where: { id: progressId },
      data: {
        completed: true,
        score: toStoredScore(scored.score),
        currentQuestionIndex: Math.max(totalQuestions - 1, 0),
      },
    });

    return NextResponse.json({
      progressId: updated.id,
      score: scored.score,
      maxScore: scored.maxScore,
      totalQuestions,
      correctCount: scored.correctCount,
      incorrectCount: scored.incorrectCount,
      accuracy: scored.accuracy,
      passed: isExamPassed(scored.score, scored.maxScore),
    });
  } catch {
    return NextResponse.json({ error: "Failed to complete paper" }, { status: 500 });
  }
}
