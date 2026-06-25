import { notFound } from "next/navigation";
import { SprintCompleteClient } from "@/components/sprint/sprint-complete-client";

type SprintCompletePageProps = {
  params: Promise<{ progressId: string }>;
};

export default async function SprintCompletePage({ params }: SprintCompletePageProps) {
  const { progressId: progressIdParam } = await params;
  const progressId = Number(progressIdParam);

  if (Number.isNaN(progressId)) {
    notFound();
  }

  return <SprintCompleteClient progressId={progressId} />;
}
