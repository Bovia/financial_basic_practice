"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OptionCard } from "@/components/practice/option-card";
import { AnswerRecordSheet } from "@/components/practice/answer-record-sheet";
import { useUser } from "@/hooks/use-user";
import type { AnswerOption, ProgressDetail } from "@/types/question";

type PracticeQuestion = {
  id: number;
  title: string;
  options: [string, string, string, string];
  answer: AnswerOption;
  analysis: string;
};

type PracticeClientProps = {
  paperId: number;
  progressId: number;
  questions: PracticeQuestion[];
};

const OPTION_LABELS: AnswerOption[] = ["A", "B", "C", "D"];

export function PracticeClient({ paperId, progressId, questions }: PracticeClientProps) {
  const router = useRouter();
  const { username, isReady } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ProgressDetail["answers"]>([]);
  const [localSelections, setLocalSelections] = useState<Record<number, AnswerOption>>({});
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const savedAnswer = answers[currentIndex]?.selectedAnswer ?? null;
  const localAnswer = localSelections[currentIndex] ?? null;
  const currentAnswer = localAnswer ?? savedAnswer;
  const isRevealed = revealedIndices.has(currentIndex);
  const isCorrect = currentAnswer ? currentAnswer === currentQuestion.answer : null;
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const loadProgress = useCallback(async () => {
    if (!username) return;

    const response = await fetch(
      `/api/progress?username=${encodeURIComponent(username)}&progressId=${progressId}`
    );
    if (!response.ok) return;

    const data = (await response.json()) as ProgressDetail;
    setCurrentIndex(data.currentQuestionIndex);
    setAnswers(data.answers);

    const revealed = new Set<number>();
    data.answers.forEach((a, index) => {
      if (a.selectedAnswer) revealed.add(index);
    });
    setRevealedIndices(revealed);
    setLoading(false);
  }, [username, progressId]);

  useEffect(() => {
    if (!isReady || !username) return;
    loadProgress();
  }, [isReady, username, loadProgress]);

  function selectOption(selectedAnswer: AnswerOption) {
    if (isRevealed) return;

    setLocalSelections((prev) => ({ ...prev, [currentIndex]: selectedAnswer }));
    setRevealedIndices((prev) => new Set(prev).add(currentIndex));
  }

  async function persistAnswer(index: number): Promise<boolean> {
    const question = questions[index];
    const selectedAnswer = localSelections[index] ?? answers[index]?.selectedAnswer;
    if (!username || !question || !selectedAnswer) return true;

    const alreadySaved =
      answers[index]?.selectedAnswer === selectedAnswer && answers[index]?.isCorrect !== null;
    if (alreadySaved) return true;

    setSaving(true);
    const response = await fetch("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        progressId,
        paperId,
        questionId: question.id,
        selectedAnswer,
      }),
    });

    if (response.ok) {
      const result = (await response.json()) as {
        questionId: number;
        selectedAnswer: AnswerOption;
        isCorrect: boolean;
      };

      setAnswers((prev) => {
        const next = [...prev];
        next[index] = {
          questionId: result.questionId,
          selectedAnswer: result.selectedAnswer,
          isCorrect: result.isCorrect,
        };
        return next;
      });

      setLocalSelections((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setSaving(false);
      return true;
    }

    setSaving(false);
    return false;
  }

  async function navigateToIndex(newIndex: number, saveCurrent = false) {
    if (!username || newIndex < 0 || newIndex >= totalQuestions) return;

    if (saveCurrent && isRevealed && currentAnswer) {
      const saved = await persistAnswer(currentIndex);
      if (!saved) return;
    }

    setCurrentIndex(newIndex);
    await fetch("/api/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, progressId, currentQuestionIndex: newIndex }),
    });
  }

  async function handleNext() {
    if (!isRevealed || !currentAnswer) return;

    const saved = await persistAnswer(currentIndex);
    if (!saved) return;

    if (currentIndex < totalQuestions - 1) {
      await navigateToIndex(currentIndex + 1);
      return;
    }

    if (!username) return;
    const response = await fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, progressId }),
    });

    if (response.ok) {
      router.push(`/result/${progressId}`);
    }
  }

  if (loading || !currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        加载中...
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-[#f5f6f8]">
      <header className="sticky top-0 z-10 bg-[#f5f6f8] px-4 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <Button variant="icon" size="icon" onClick={() => router.push("/")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-bold text-slate-900">
            第{currentIndex + 1}题 / {totalQuestions}
          </h1>
          <Button variant="icon" size="icon" onClick={() => setSheetOpen(true)}>
            <LayoutGrid className="h-5 w-5" />
          </Button>
        </div>
        <Progress value={progressPercent} />
      </header>

      <main className="flex-1 px-4 py-6">
        <h2 className="mb-6 text-lg font-semibold leading-relaxed text-slate-900">
          {currentQuestion.title}
        </h2>

        <div className="space-y-3">
          {OPTION_LABELS.map((label, idx) => (
            <OptionCard
              key={label}
              label={label}
              text={currentQuestion.options[idx]}
              isSelected={currentAnswer === label}
              isRevealed={isRevealed}
              isCorrectOption={currentQuestion.answer === label}
              onClick={() => selectOption(label)}
            />
          ))}
        </div>

        {isRevealed && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
              className={`mb-3 rounded-xl px-4 py-3 text-sm font-medium ${
                isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {isCorrect ? "回答正确" : `回答错误，正确答案是 ${currentQuestion.answer}`}
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">解析：</span>
              {currentQuestion.analysis}
            </div>
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 flex items-center justify-between border-t border-slate-200/60 bg-[#f5f6f8] px-6 py-4">
        <button
          type="button"
          onClick={() => navigateToIndex(currentIndex - 1, true)}
          disabled={currentIndex === 0 || saving}
          className="flex items-center gap-1 text-sm font-medium text-slate-600 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          上一题
        </button>
        <span className="text-sm text-slate-400">
          {currentIndex + 1}/{totalQuestions}
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={!isRevealed || !currentAnswer || saving}
          className="flex items-center gap-1 text-sm font-medium text-slate-600 disabled:opacity-40"
        >
          {currentIndex === totalQuestions - 1 ? "完成" : "下一题"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </footer>

      <AnswerRecordSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        answers={questions.map((_, index) => ({
          index,
          selectedAnswer:
            localSelections[index] ?? answers[index]?.selectedAnswer ?? null,
          isCorrect:
            revealedIndices.has(index) || answers[index]?.selectedAnswer
              ? (localSelections[index] ?? answers[index]?.selectedAnswer) ===
                questions[index].answer
              : null,
        }))}
        onSelectQuestion={(index) => navigateToIndex(index, true)}
      />
    </div>
  );
}
