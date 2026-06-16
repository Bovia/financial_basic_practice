import { notFound } from "next/navigation";
import { PracticeClient } from "@/components/practice/practice-client";
import { prisma } from "@/lib/prisma";
import { getProgressQuestions, parseProgressQuestionIds } from "@/lib/progress-questions";
import { getPaper } from "@/lib/questions";

type PracticePageProps = {
  params: Promise<{ paperId: string }>;
  searchParams: Promise<{ progressId?: string }>;
};

export default async function PracticePage({ params, searchParams }: PracticePageProps) {
  const { paperId: paperIdParam } = await params;
  const { progressId: progressIdParam } = await searchParams;

  const paperId = Number(paperIdParam);
  const progressId = Number(progressIdParam);

  if (Number.isNaN(paperId) || Number.isNaN(progressId)) {
    notFound();
  }

  const paper = getPaper(paperId);
  if (!paper) {
    notFound();
  }

  const progress = await prisma.paperProgress.findUnique({
    where: { id: progressId },
  });

  if (!progress || progress.paperId !== paperId) {
    notFound();
  }

  const progressQuestionIds = parseProgressQuestionIds(progress.questionIds);
  const questions = getProgressQuestions(paperId, progressQuestionIds);

  if (questions.length === 0) {
    notFound();
  }

  return (
    <PracticeClient
      paperId={paperId}
      progressId={progressId}
      questions={questions.map((q) => ({
        id: q.id,
        type: q.type,
        title: q.title,
        options: q.options,
        answer: q.answer,
        analysis: q.analysis,
      }))}
    />
  );
}
