import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildMasteredKeySet,
  getAllQuestionRefs,
  getQuestionsFromRefs,
  getUnmasteredPool,
  parseQuestionRefs,
} from "@/lib/sprint";
import { getOrCreateUser } from "@/lib/user";

type RouteContext = {
  params: Promise<{ progressId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { progressId: progressIdParam } = await context.params;
    const username = request.nextUrl.searchParams.get("username");
    const progressId = Number(progressIdParam);

    if (!username || Number.isNaN(progressId)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await getOrCreateUser(username);
    const progress = await prisma.paperProgress.findFirst({
      where: { id: progressId, userId: user.id, kind: "sprint", completed: true },
      include: { practiceRecords: true },
    });

    if (!progress) {
      return NextResponse.json({ error: "Sprint record not found" }, { status: 404 });
    }

    const refs = parseQuestionRefs(progress.questionIds) ?? [];
    const questions = getQuestionsFromRefs(refs);
    const score = progress.score ?? 0;
    const totalQuestions = questions.length;

    const allRefs = getAllQuestionRefs();
    const allRecords = await prisma.practiceRecord.findMany({
      where: { userId: user.id },
      select: { paperId: true, questionId: true, isCorrect: true },
    });
    const remainingPool = getUnmasteredPool(allRefs, buildMasteredKeySet(allRecords)).length;
    const completedGroups = await prisma.paperProgress.count({
      where: { userId: user.id, kind: "sprint", completed: true },
    });

    return NextResponse.json({
      progressId: progress.id,
      groupNumber: progress.sprintGroupNumber ?? 1,
      score,
      totalQuestions,
      correctCount: score,
      incorrectCount: totalQuestions - score,
      accuracy: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
      remainingPool,
      completedGroups,
      allDone: remainingPool === 0,
      username: user.username,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch sprint result" }, { status: 500 });
  }
}
