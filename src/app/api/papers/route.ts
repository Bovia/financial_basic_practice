import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCategories, getPaperTotalQuestions } from "@/lib/questions";
import { getFullPaperMaxScore, scorePaperProgress } from "@/lib/scoring";
import { getOrCreateUser, isGuestUsername } from "@/lib/user";
import type { HistoryRecord, PaperListItem, PaperStatus } from "@/types/question";

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");
    if (!username) {
      return NextResponse.json({ error: "username is required" }, { status: 400 });
    }

    if (isGuestUsername(username)) {
      const categories = getCategories();
      const result = categories.map((category) => ({
        id: category.id,
        name: category.name,
        paperCount: category.papers.length,
        papers: category.papers.map((paper) => ({
          id: paper.id,
          name: paper.name,
          totalQuestions: getPaperTotalQuestions(paper.id),
          status: "not_started" as PaperStatus,
          answeredCount: 0,
          progressId: null,
          history: [],
        })),
      }));
      return NextResponse.json(result);
    }

    const user = await getOrCreateUser(username);
    const categories = getCategories();

    const allProgress = await prisma.paperProgress.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        practiceRecords: true,
      },
    });

    const result = categories.map((category) => ({
      id: category.id,
      name: category.name,
      paperCount: category.papers.length,
      papers: category.papers.map((paper) => {
        const paperProgresses = allProgress.filter(
          (p) => p.paperId === paper.id && p.kind === "paper"
        );
        const activeProgress = paperProgresses.find((p) => !p.completed);
        const completedProgresses = paperProgresses.filter((p) => p.completed);
        const totalQuestions = getPaperTotalQuestions(paper.id);

        let status: PaperStatus = "not_started";
        let answeredCount = 0;
        let progressId: number | null = null;

        if (activeProgress) {
          status = "in_progress";
          answeredCount = activeProgress.practiceRecords.length;
          progressId = activeProgress.id;
        } else if (completedProgresses.length > 0) {
          status = "completed";
          const latest = completedProgresses[0];
          answeredCount = latest.practiceRecords.length;
          progressId = latest.id;
        }

        const history: HistoryRecord[] = completedProgresses.map((p) => {
          const scored = scorePaperProgress(p);
          return {
            id: p.id,
            score: scored.score,
            maxScore: scored.maxScore || getFullPaperMaxScore(paper.id),
            totalQuestions,
            completedAt: p.updatedAt.toISOString(),
          };
        });

        return {
          id: paper.id,
          name: paper.name,
          totalQuestions,
          status,
          answeredCount,
          progressId,
          history,
        } satisfies PaperListItem;
      }),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch papers" }, { status: 400 });
  }
}
