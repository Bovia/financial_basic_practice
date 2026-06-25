"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SprintAward } from "@/components/sprint/sprint-award";
import { useUser } from "@/hooks/use-user";

type SprintCompleteClientProps = {
  progressId: number;
};

type SprintCompleteData = {
  groupNumber: number;
  score: number;
  totalQuestions: number;
  remainingPool: number;
  allDone: boolean;
  username: string;
};

export function SprintCompleteClient({ progressId }: SprintCompleteClientProps) {
  const router = useRouter();
  const { username, isReady } = useUser();
  const [result, setResult] = useState<SprintCompleteData | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);

  useEffect(() => {
    if (!isReady || !username) return;

    async function load() {
      const name = username;
      if (!name) return;
      const response = await fetch(
        `/api/sprint/complete/${progressId}?username=${encodeURIComponent(name)}`
      );
      if (response.ok) {
        setResult((await response.json()) as SprintCompleteData);
      }
    }

    void load();
  }, [isReady, username, progressId]);

  async function handleNextGroup() {
    if (!username || loadingNext) return;
    setLoadingNext(true);

    const response = await fetch("/api/sprint/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = (await response.json()) as {
      progressId?: number;
      completed?: boolean;
    };

    if (data.progressId) {
      router.push(`/sprint?progressId=${data.progressId}`);
      return;
    }

    setLoadingNext(false);
    router.push("/");
  }

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center text-app-text-secondary">
        加载中...
      </div>
    );
  }

  return (
    <SprintAward
      username={result.username}
      groupNumber={result.groupNumber}
      score={result.score}
      totalQuestions={result.totalQuestions}
      remainingPool={result.remainingPool}
      allDone={result.allDone}
      loadingNext={loadingNext}
      onNextGroup={handleNextGroup}
      onRest={() => router.push("/")}
    />
  );
}
