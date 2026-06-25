import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SPRINT_PAPER_ID,
  buildMasteredKeySet,
  getAllQuestionRefs,
  getUnmasteredPool,
  pickRandomGroup,
} from "@/lib/sprint";
import { getOrCreateUser, isGuestUsername } from "@/lib/user";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string };
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: "username is required" }, { status: 400 });
    }

    if (isGuestUsername(username)) {
      return NextResponse.json({ error: "冲刺模式需要登录云同步账号" }, { status: 403 });
    }

    const user = await getOrCreateUser(username);

    const active = await prisma.paperProgress.findFirst({
      where: { userId: user.id, kind: "sprint", completed: false },
      orderBy: { updatedAt: "desc" },
    });

    if (active) {
      const refs = active.questionIds as Array<{ paperId: number; questionId: number }> | null;
      const poolSize = await getRemainingPoolSize(user.id);
      return NextResponse.json({
        progressId: active.id,
        groupNumber: active.sprintGroupNumber ?? 1,
        totalInGroup: refs?.length ?? 0,
        remainingPool: poolSize,
        resumed: true,
      });
    }

    const poolSize = await getRemainingPoolSize(user.id);
    if (poolSize === 0) {
      const completedCount = await prisma.paperProgress.count({
        where: { userId: user.id, kind: "sprint", completed: true },
      });
      return NextResponse.json({
        completed: true,
        completedGroups: completedCount,
        message: "待巩固题目已全部刷完，冲刺完成！",
      });
    }

    const groupNumber =
      (await prisma.paperProgress.count({
        where: { userId: user.id, kind: "sprint", completed: true },
      })) + 1;

    const allRefs = getAllQuestionRefs();
    const records = await prisma.practiceRecord.findMany({
      where: { userId: user.id },
      select: { paperId: true, questionId: true, isCorrect: true },
    });
    const masteredKeys = buildMasteredKeySet(records);
    const pool = getUnmasteredPool(allRefs, masteredKeys);
    const groupRefs = pickRandomGroup(pool);

    const progress = await prisma.paperProgress.create({
      data: {
        userId: user.id,
        paperId: SPRINT_PAPER_ID,
        kind: "sprint",
        sprintGroupNumber: groupNumber,
        currentQuestionIndex: 0,
        completed: false,
        questionIds: groupRefs,
      },
    });

    const remainingAfter = pool.length - groupRefs.length;

    return NextResponse.json({
      progressId: progress.id,
      groupNumber,
      totalInGroup: groupRefs.length,
      remainingPool: remainingAfter,
      resumed: false,
    });
  } catch {
    return NextResponse.json({ error: "Failed to start sprint" }, { status: 500 });
  }
}

async function getRemainingPoolSize(userId: number): Promise<number> {
  const allRefs = getAllQuestionRefs();
  const records = await prisma.practiceRecord.findMany({
    where: { userId },
    select: { paperId: true, questionId: true, isCorrect: true },
  });
  const masteredKeys = buildMasteredKeySet(records);
  return getUnmasteredPool(allRefs, masteredKeys).length;
}
