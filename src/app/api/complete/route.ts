import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaperTotalQuestions } from "@/lib/questions";
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

    const totalQuestions = getPaperTotalQuestions(progress.paperId);
    const correctCount = progress.practiceRecords.filter((r) => r.isCorrect).length;

    const updated = await prisma.paperProgress.update({
      where: { id: progressId },
      data: {
        completed: true,
        score: correctCount,
        currentQuestionIndex: totalQuestions - 1,
      },
    });

    return NextResponse.json({
      progressId: updated.id,
      score: updated.score,
      totalQuestions,
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      accuracy: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
    });
  } catch {
    return NextResponse.json({ error: "Failed to complete paper" }, { status: 500 });
  }
}
