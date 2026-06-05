import { ResultClient } from "@/components/result/result-client";

type ResultPageProps = {
  params: Promise<{ progressId: string }>;
};

export default async function ResultPage({ params }: ResultPageProps) {
  const { progressId: progressIdParam } = await params;
  const progressId = Number(progressIdParam);

  if (Number.isNaN(progressId)) {
    return null;
  }

  return <ResultClient progressId={progressId} />;
}
