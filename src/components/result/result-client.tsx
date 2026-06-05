"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Home, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
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

  if (loading || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        加载中...
      </div>
    );
  }

  const currentAnswer = result.answers[currentIndex];

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[#f5f6f8] pb-28">
      <header className="flex items-center gap-3 px-4 py-4">
        <Button variant="icon" size="icon" onClick={() => router.push("/")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-slate-900">答题记录</h1>
      </header>

      <div className="px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-100">{result.paperName}</p>
              <p className="mt-2 text-4xl font-bold">
                {result.score}/{result.totalQuestions}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Trophy className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span>正确率 {result.accuracy}%</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              对 {result.correctCount}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              错 {result.incorrectCount}
            </span>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="mb-3 text-base font-bold text-slate-900">答题详情</h2>
          <div className="grid grid-cols-4 gap-3">
            {result.answers.map((item, index) => (
              <button
                key={item.questionId}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 py-3 transition-colors",
                  index === currentIndex && "border-blue-600",
                  index !== currentIndex && item.isCorrect && "border-green-200 bg-green-50",
                  index !== currentIndex && !item.isCorrect && "border-red-200 bg-red-50"
                )}
              >
                <span
                  className={cn(
                    "text-base font-semibold",
                    item.isCorrect ? "text-green-600" : "text-red-600"
                  )}
                >
                  {index + 1}
                </span>
                {item.selectedAnswer && (
                  <span className="mt-0.5 text-xs text-slate-500">{item.selectedAnswer}</span>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-semibold text-slate-900">第{currentIndex + 1}题</span>
            <div className="flex items-center gap-3 text-sm text-slate-500">
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

          <h3 className="mb-4 text-base font-medium leading-relaxed text-slate-800">
            {currentAnswer.title}
          </h3>

          <div className="space-y-2">
            {OPTION_LABELS.map((label, idx) => {
              const isCorrect = currentAnswer.correctAnswer === label;
              const isSelected = currentAnswer.selectedAnswer === label;

              return (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3",
                    isCorrect
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-slate-200 bg-white text-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      isCorrect ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {label}
                  </span>
                  <span className="flex-1 text-sm">{currentAnswer.options[idx]}</span>
                  {isCorrect && <Check className="h-4 w-4 text-green-600" />}
                  {isSelected && !isCorrect && (
                    <span className="text-xs text-red-500">你的答案</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">解析：</span>
            {currentAnswer.analysis}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-lg gap-3 border-t border-slate-200 bg-white px-4 py-4">
        <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
          <Home className="h-4 w-4" />
          返回首页
        </Button>
        <Button className="flex-1" onClick={handleRetry} disabled={restarting}>
          <RefreshCw className="h-4 w-4" />
          再来一次
        </Button>
      </div>
    </div>
  );
}
