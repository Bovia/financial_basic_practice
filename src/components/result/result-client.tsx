"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { isOptionInAnswer } from "@/lib/answer";
import { formatPointScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { AnswerOption, ResultDetail } from "@/types/question";

type ResultClientProps = {
  progressId: number;
};

const OPTION_LABELS: AnswerOption[] = ["A", "B", "C", "D"];

export function ResultClient({ progressId }: ResultClientProps) {
  const router = useRouter();
  const { username, isReady } = useUser();
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [startingReview, setStartingReview] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    if (!isReady || !username) return;

    async function load() {
      const name = username;
      if (!name) return;
      const response = await fetch(
        `/api/result/${progressId}?username=${encodeURIComponent(name)}`
      );
      if (response.ok) {
        const data = (await response.json()) as ResultDetail;
        setResult(data);
      }
      setLoading(false);
    }

    load();
  }, [isReady, username, progressId]);

  async function handleRetry() {
    if (!username || !result || restarting) return;
    setRestarting(true);

    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, paperId: result.paperId, restart: true }),
    });

    if (response.ok) {
      const data = (await response.json()) as { progressId: number };
      router.push(`/practice/${result.paperId}?progressId=${data.progressId}`);
    }
    setRestarting(false);
  }

  async function handleReview(mode: "correct" | "wrong") {
    if (!username || !result || startingReview) return;

    const questionIds = result.answers
      .filter((item) => (mode === "correct" ? item.isCorrect : !item.isCorrect))
      .map((item) => item.questionId);

    if (questionIds.length === 0) return;

    setStartingReview(mode);

    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, paperId: result.paperId, questionIds }),
    });

    if (response.ok) {
      const data = (await response.json()) as { progressId: number };
      router.push(`/practice/${result.paperId}?progressId=${data.progressId}`);
    }

    setStartingReview(null);
  }

  if (loading || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center text-app-text-secondary">
        加载中...
      </div>
    );
  }

  const currentAnswer = result.answers[currentIndex];

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-app-bg pb-28">
      <header className="flex items-center gap-3 px-4 py-4">
        <Button variant="icon" size="icon" onClick={() => router.push("/")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-app-text">答题记录</h1>
      </header>

      <div className="px-4">
        <div
          className="relative overflow-hidden rounded-2xl border border-app-border p-4 text-white"
          style={{
            backgroundImage: "linear-gradient(to bottom right, var(--app-hero-from), var(--app-hero-to))",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/70">{result.paperName}</p>
              <p className="mt-1 text-3xl font-bold">
                {formatPointScore(result.score)} 分
              </p>
              {result.maxScore >= 100 && (
                <span
                  className={cn(
                    "mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    result.passed ? "bg-white/25 text-white" : "bg-black/20 text-white/90"
                  )}
                >
                  {result.passed ? "合格" : "未合格（60 分及格）"}
                </span>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span>
              答对 {result.correctCount}/{result.totalQuestions} 题
            </span>
            <span>正确率 {result.accuracy}%</span>
          </div>
        </div>

        <section className="mt-4">
          <h2 className="mb-2 text-sm font-bold text-app-text">答题详情</h2>
          <div className="max-h-40 overflow-y-auto overscroll-contain rounded-xl border border-app-border bg-app-surface p-2">
            <div className="grid grid-cols-6 gap-1">
              {result.answers.map((item, index) => (
                <button
                  key={item.questionId}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "flex h-8 flex-col items-center justify-center rounded-md border transition-colors",
                    index === currentIndex && "border-app-accent bg-app-surface ring-1 ring-app-accent",
                    index !== currentIndex && item.isCorrect && "border-app-success-border bg-app-success-soft",
                    index !== currentIndex && !item.isCorrect && "border-app-error-border bg-app-error-soft"
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] font-semibold leading-none",
                      item.isCorrect ? "text-app-success" : "text-app-error"
                    )}
                  >
                    {index + 1}
                  </span>
                  {item.selectedAnswer && (
                    <span className="mt-px text-[9px] leading-none text-app-text-muted">
                      {item.selectedAnswer}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-app-border bg-app-surface p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-semibold text-app-text">第{currentIndex + 1}题</span>
            <div className="flex items-center gap-3 text-sm text-app-text-secondary">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="flex items-center gap-0.5 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                上一题
              </button>
              <button
                type="button"
                disabled={currentIndex === result.answers.length - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="flex items-center gap-0.5 disabled:opacity-40"
              >
                下一题
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <h3 className="mb-4 text-base font-medium leading-relaxed text-app-text">
            {currentAnswer.title}
          </h3>

          <div className="space-y-2">
            {OPTION_LABELS.map((label, idx) => {
              const text = currentAnswer.options[idx];
              if (!text.trim()) return null;

              const isCorrect = isOptionInAnswer(currentAnswer.correctAnswer, label);
              const isSelected = isOptionInAnswer(currentAnswer.selectedAnswer, label);
              const isWrongSelected = isSelected && !isCorrect;

              return (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3",
                    isCorrect && "border-app-success-border bg-app-success-soft text-app-success",
                    isWrongSelected && "border-app-error-border bg-app-error-soft text-app-error",
                    !isCorrect && !isWrongSelected && "border-app-border bg-app-surface text-app-text"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      isCorrect && "bg-app-success text-white",
                      isWrongSelected && "bg-app-error text-white",
                      !isCorrect && !isWrongSelected && "bg-app-surface-muted text-app-text-muted"
                    )}
                  >
                    {label}
                  </span>
                  <span className="flex-1 text-sm">{text}</span>
                  {isCorrect && <Check className="h-4 w-4 text-app-success" strokeWidth={1.75} />}
                  {isWrongSelected && (
                    <span className="text-xs text-app-error">你的答案</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-app-surface-muted p-4 text-sm leading-relaxed text-app-text-secondary">
            <span className="font-semibold text-app-text">解析：</span>
            {currentAnswer.analysis}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-lg gap-2 border-t border-app-border bg-app-surface px-4 py-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleReview("correct")}
          disabled={result.correctCount === 0 || restarting || startingReview !== null}
        >
          {startingReview === "correct" ? "进入中..." : "刷对题"}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleReview("wrong")}
          disabled={result.incorrectCount === 0 || restarting || startingReview !== null}
        >
          {startingReview === "wrong" ? "进入中..." : "刷错题"}
        </Button>
        <Button
          className="flex-1"
          onClick={handleRetry}
          disabled={restarting || startingReview !== null}
        >
          <RefreshCw className="h-4 w-4" />
          {restarting ? "进入中..." : "再来一次"}
        </Button>
      </div>
    </div>
  );
}
