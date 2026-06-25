import { notFound } from "next/navigation";
import { PracticeClient } from "@/components/practice/practice-client";
import { prisma } from "@/lib/prisma";
import {
  getQuestionsFromRefs,
  parseQuestionRefs,
  SPRINT_PAPER_ID,
  toSprintQuestionPayload,
} from "@/lib/sprint";

type SprintPageProps = {
  searchParams: Promise<{ progressId?: string }>;
};

export default async function SprintPage({ searchParams }: SprintPageProps) {
  const { progressId: progressIdParam } = await searchParams;
  const progressId = Number(progressIdParam);

  if (Number.isNaN(progressId)) {
    notFound();
  }

  const progress = await prisma.paperProgress.findUnique({
    where: { id: progressId },
  });

  if (!progress || progress.kind !== "sprint" || progress.completed) {
    notFound();
  }

  const refs = parseQuestionRefs(progress.questionIds);
  if (!refs || refs.length === 0) {
    notFound();
  }

  const questions = toSprintQuestionPayload(getQuestionsFromRefs(refs));

  return (
    <PracticeClient
      paperId={SPRINT_PAPER_ID}
      progressId={progressId}
      questions={questions}
      sprintMeta={{ groupNumber: progress.sprintGroupNumber ?? 1 }}
    />
  );
}
