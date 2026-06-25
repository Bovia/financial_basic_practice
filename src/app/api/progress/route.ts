import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getProgressQuestions,
  getProgressTotalQuestions,
  normalizeProgressQuestionIds,
  parseProgressQuestionIds,
} from "@/lib/progress-questions";
import {
  getQuestionsFromRefs,
  parseQuestionRefs,
  SPRINT_PAPER_ID,
} from "@/lib/sprint";
import { getPaper } from "@/lib/questions";
import { getOrCreateUser, isGuestUsername } from "@/lib/user";
import type { AnswerRecord } from "@/types/question";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      paperId?: number;
      restart?: boolean;
      questionIds?: number[];
    };

    const { username, paperId, restart, questionIds } = body;

    if (!username || typeof paperId !== "number") {
      return NextResponse.json({ error: "username and paperId are required" }, { status: 400 });
    }

    if (isGuestUsername(username)) {
      return NextResponse.json({ error: "Guest mode uses local storage only" }, { status: 403 });
    }

    const paper = getPaper(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const user = await getOrCreateUser(username);
    const normalizedQuestionIds = normalizeProgressQuestionIds(paperId, questionIds);

    if (questionIds && questionIds.length > 0 && !normalizedQuestionIds) {
      return NextResponse.json({ error: "No valid questionIds provided" }, { status: 400 });
    }

    if (restart) {
      const progress = await prisma.paperProgress.create({
        data: {
          userId: user.id,
          paperId,
          currentQuestionIndex: 0,
          completed: false,
          questionIds: normalizedQuestionIds ?? undefined,
        },
      });
      return NextResponse.json({ progressId: progress.id, currentQuestionIndex: 0 });
    }

    if (normalizedQuestionIds) {
      const progress = await prisma.paperProgress.create({
        data: {
          userId: user.id,
          paperId,
          currentQuestionIndex: 0,
          completed: false,
          questionIds: normalizedQuestionIds,
        },
      });
      return NextResponse.json({ progressId: progress.id, currentQuestionIndex: 0 });
    }

    const existing = await prisma.paperProgress.findFirst({
      where: {
        userId: user.id,
        paperId,
        kind: "paper",
        completed: false,
        questionIds: { equals: Prisma.DbNull },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      return NextResponse.json({
        progressId: existing.id,
        currentQuestionIndex: existing.currentQuestionIndex,
      });
    }

    const progress = await prisma.paperProgress.create({
      data: {
        userId: user.id,
        paperId,
        currentQuestionIndex: 0,
        completed: false,
      },
    });

    return NextResponse.json({ progressId: progress.id, currentQuestionIndex: 0 });
  } catch {
    return NextResponse.json({ error: "Failed to create progress" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");
    const progressIdParam = request.nextUrl.searchParams.get("progressId");

    if (!username || !progressIdParam) {
      return NextResponse.json({ error: "username and progressId are required" }, { status: 400 });
    }

    if (isGuestUsername(username)) {
      return NextResponse.json({ error: "Guest cannot load cloud progress" }, { status: 403 });
    }

    const progressId = Number(progressIdParam);
    if (Number.isNaN(progressId)) {
      return NextResponse.json({ error: "Invalid progressId" }, { status: 400 });
    }

    const user = await getOrCreateUser(username);
    const progress = await prisma.paperProgress.findFirst({
      where: { id: progressId, userId: user.id },
      include: { practiceRecords: true },
    });

    if (!progress) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    if (progress.kind === "sprint") {
      const refs = parseQuestionRefs(progress.questionIds) ?? [];
      const questions = getQuestionsFromRefs(refs);

      const answers: AnswerRecord[] = questions.map((q) => {
        const record = progress.practiceRecords.find(
          (r) => r.paperId === q.paperId && r.questionId === q.questionId
        );
        return {
          questionId: q.questionId,
          selectedAnswer: record?.selectedAnswer ?? null,
          isCorrect: record?.isCorrect ?? null,
        };
      });

      return NextResponse.json({
        progressId: progress.id,
        paperId: SPRINT_PAPER_ID,
        paperName: `冲刺 · 第 ${progress.sprintGroupNumber ?? 1} 组`,
        kind: "sprint",
        sprintGroupNumber: progress.sprintGroupNumber,
        currentQuestionIndex: progress.currentQuestionIndex,
        completed: progress.completed,
        score: progress.score,
        totalQuestions: questions.length,
        answers,
        questionRefs: refs,
      });
    }

    const paper = getPaper(progress.paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const progressQuestionIds = parseProgressQuestionIds(progress.questionIds);
    const questions = getProgressQuestions(progress.paperId, progressQuestionIds);

    const answers: AnswerRecord[] = questions.map((q) => {
      const record = progress.practiceRecords.find((r) => r.questionId === q.id);
      return {
        questionId: q.id,
        selectedAnswer: record?.selectedAnswer ?? null,
        isCorrect: record?.isCorrect ?? null,
      };
    });

    return NextResponse.json({
      progressId: progress.id,
      paperId: progress.paperId,
      paperName: paper.name,
      currentQuestionIndex: progress.currentQuestionIndex,
      completed: progress.completed,
      score: progress.score,
      totalQuestions: getProgressTotalQuestions(progress.paperId, progressQuestionIds),
      answers,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      progressId?: number;
      currentQuestionIndex?: number;
      completed?: boolean;
      score?: number;
    };

    const { username, progressId, currentQuestionIndex, completed, score } = body;

    if (!username || typeof progressId !== "number") {
      return NextResponse.json({ error: "username and progressId are required" }, { status: 400 });
    }

    const user = await getOrCreateUser(username);
    const progress = await prisma.paperProgress.findFirst({
      where: { id: progressId, userId: user.id },
    });

    if (!progress) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    const updated = await prisma.paperProgress.update({
      where: { id: progressId },
      data: {
        ...(typeof currentQuestionIndex === "number" && { currentQuestionIndex }),
        ...(typeof completed === "boolean" && { completed }),
        ...(typeof score === "number" && { score }),
      },
    });

    return NextResponse.json({
      progressId: updated.id,
      currentQuestionIndex: updated.currentQuestionIndex,
      completed: updated.completed,
      score: updated.score,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
