import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildMasteredKeySet,
  getAllQuestionRefs,
  getUnmasteredPool,
} from "@/lib/sprint";
import { getOrCreateUser, isGuestUsername } from "@/lib/user";

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");
    if (!username) {
      return NextResponse.json({ error: "username is required" }, { status: 400 });
    }

    if (isGuestUsername(username)) {
      return NextResponse.json({
        available: false,
        reason: "guest",
        unmasteredCount: getAllQuestionRefs().length,
        completedGroups: 0,
        activeProgressId: null,
        activeGroupNumber: null,
        history: [],
      });
    }

    const user = await getOrCreateUser(username);
    const allRefs = getAllQuestionRefs();
    const records = await prisma.practiceRecord.findMany({
      where: { userId: user.id },
      select: { paperId: true, questionId: true, isCorrect: true },
    });
    const masteredKeys = buildMasteredKeySet(records);
    const unmasteredCount = getUnmasteredPool(allRefs, masteredKeys).length;

    const completedSprints = await prisma.paperProgress.findMany({
      where: { userId: user.id, kind: "sprint", completed: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    const activeSprint = await prisma.paperProgress.findFirst({
      where: { userId: user.id, kind: "sprint", completed: false },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      available: true,
      unmasteredCount,
      masteredCount: allRefs.length - unmasteredCount,
      totalQuestions: allRefs.length,
      completedGroups: completedSprints.length,
      activeProgressId: activeSprint?.id ?? null,
      activeGroupNumber: activeSprint?.sprintGroupNumber ?? null,
      history: completedSprints.map((item) => ({
        id: item.id,
        groupNumber: item.sprintGroupNumber ?? 0,
        score: item.score ?? 0,
        totalQuestions: Array.isArray(item.questionIds) ? item.questionIds.length : 0,
        completedAt: item.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch sprint status" }, { status: 500 });
  }
}
