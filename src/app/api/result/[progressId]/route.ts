import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getProgressQuestions,
  parseProgressQuestionIds,
} from "@/lib/progress-questions";
import { getPaper } from "@/lib/questions";
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
      return NextResponse.json(
        { error: "username and valid progressId are required" },
        { status: 400 }
      );
    }

    const user = await getOrCreateUser(username);
    const progress = await prisma.paperProgress.findFirst({
      where: { id: progressId, userId: user.id },
      include: { practiceRecords: true },
    });

    if (!progress) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    const paper = getPaper(progress.paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const progressQuestionIds = parseProgressQuestionIds(progress.questionIds);
    const questions = getProgressQuestions(progress.paperId, progressQuestionIds);
    const totalQuestions = questions.length;
    let correctCount = 0;

    const answers = questions.map((question, index) => {
      const record = progress.practiceRecords.find((r) => r.questionId === question.id);
      const selectedAnswer = record?.selectedAnswer ?? null;
      const isCorrect = record?.isCorrect ?? false;
      if (isCorrect) correctCount++;

      return {
        questionId: question.id,
        questionIndex: index,
        title: question.title,
        options: question.options,
        correctAnswer: question.answer,
        selectedAnswer,
        isCorrect,
        analysis: question.analysis,
      };
    });

    const incorrectCount = totalQuestions - correctCount;
    const score = progress.score ?? correctCount;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return NextResponse.json({
      progressId: progress.id,
      paperId: progress.paperId,
      paperName: paper.name,
      score,
      totalQuestions,
      correctCount,
      incorrectCount,
      accuracy,
      answers,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 });
  }
}
