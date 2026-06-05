import { notFound } from "next/navigation";
import { PracticeClient } from "@/components/practice/practice-client";
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

  return (
    <PracticeClient
      paperId={paperId}
      progressId={progressId}
      questions={paper.questions.map((q) => ({
        id: q.id,
        title: q.title,
        options: q.options,
        answer: q.answer,
        analysis: q.analysis,
      }))}
    />
  );
}
