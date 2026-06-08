"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OptionCard } from "@/components/practice/option-card";
import { AnswerRecordSheet } from "@/components/practice/answer-record-sheet";
import { useUser } from "@/hooks/use-user";
import {
  clearPracticeDraft,
  loadPracticeDraft,
  savePracticeDraft,
} from "@/lib/practice-draft";
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
  const hasUnsavedCurrent = currentIndex in localSelections;
  const unsavedCount = Object.keys(localSelections).length;

  const persistDraft = useCallback(
    (
      index: number,
      selections: Record<number, AnswerOption>,
      revealed: Set<number>
    ) => {
      savePracticeDraft(progressId, {
        currentIndex: index,
        selections,
        revealed: [...revealed],
      });
    },
    [progressId]
  );

  const loadProgress = useCallback(async () => {
    if (!username) return;

    const response = await fetch(
      `/api/progress?username=${encodeURIComponent(username)}&progressId=${progressId}`
    );
    if (!response.ok) return;

    const data = (await response.json()) as ProgressDetail;
    const draft = loadPracticeDraft(progressId);

    const mergedSelections: Record<number, AnswerOption> = { ...draft?.selections };
    const mergedRevealed = new Set<number>();

    data.answers.forEach((answer, index) => {
      if (answer.selectedAnswer) {
        mergedRevealed.add(index);
      }
    });
    draft?.revealed.forEach((index) => mergedRevealed.add(index));

    setCurrentIndex(draft?.currentIndex ?? data.currentQuestionIndex);
    setAnswers(data.answers);
    setLocalSelections(mergedSelections);
    setRevealedIndices(mergedRevealed);
    setLoading(false);
  }, [username, progressId]);

  useEffect(() => {
    if (!isReady || !username) return;
    loadProgress();
  }, [isReady, username, loadProgress]);

  useEffect(() => {
    if (loading) return;
    persistDraft(currentIndex, localSelections, revealedIndices);
  }, [loading, currentIndex, localSelections, revealedIndices, persistDraft]);

  function selectOption(selectedAnswer: AnswerOption) {
    if (isRevealed) return;
    setLocalSelections((prev) => ({ ...prev, [currentIndex]: selectedAnswer }));
    setRevealedIndices((prev) => new Set(prev).add(currentIndex));
  }

  function applySavedAnswers(
    items: Array<{
      questionId: number;
      selectedAnswer: AnswerOption;
      isCorrect: boolean;
    }>
  ) {
    if (items.length === 0) return;

    const indexByQuestionId = new Map(questions.map((question, index) => [question.id, index]));

    setAnswers((prev) => {
      const next = [...prev];
      for (const item of items) {
        const index = indexByQuestionId.get(item.questionId);
        if (index === undefined) continue;
        next[index] = {
          questionId: item.questionId,
          selectedAnswer: item.selectedAnswer,
          isCorrect: item.isCorrect,
        };
      }
      return next;
    });

    setLocalSelections((prev) => {
      const next = { ...prev };
      for (const item of items) {
        const index = indexByQuestionId.get(item.questionId);
        if (index !== undefined) {
          delete next[index];
        }
      }
      return next;
    });
  }

  function getUnsavedBatch() {
    return Object.entries(localSelections).map(([indexText, selectedAnswer]) => {
      const index = Number(indexText);
      return {
        index,
        questionId: questions[index].id,
        selectedAnswer,
      };
    });
  }

  async function saveToServer(options: {
    batch?: ReturnType<typeof getUnsavedBatch>;
    currentQuestionIndex?: number;
    complete?: boolean;
  }) {
    if (!username) return false;

    const batch = options.batch ?? [];
    if (batch.length === 0 && typeof options.currentQuestionIndex !== "number" && !options.complete) {
      return true;
    }

    const response = await fetch("/api/practice/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        progressId,
        paperId,
        ...(batch.length > 0 && {
          answers: batch.map(({ questionId, selectedAnswer }) => ({
            questionId,
            selectedAnswer,
          })),
        }),
        ...(typeof options.currentQuestionIndex === "number" && {
          currentQuestionIndex: options.currentQuestionIndex,
        }),
        ...(options.complete && { complete: true }),
      }),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as {
      savedAnswers?: Array<{
        questionId: number;
        selectedAnswer: AnswerOption;
        isCorrect: boolean;
      }>;
      completed?: boolean;
    };

    if (data.savedAnswers?.length) {
      applySavedAnswers(data.savedAnswers);
    }

    if (data.completed) {
      clearPracticeDraft(progressId);
    }

    return true;
  }

  async function handleSave() {
    if (!hasUnsavedCurrent || saving) return;

    setSaving(true);
    const ok = await saveToServer({
      batch: getUnsavedBatch().filter((item) => item.index === currentIndex),
      currentQuestionIndex: currentIndex,
    });
    setSaving(false);

    if (!ok) return;
  }

  function navigateToIndex(newIndex: number) {
    if (newIndex < 0 || newIndex >= totalQuestions) return;
    setCurrentIndex(newIndex);
  }

  async function handleNext() {
    if (!isRevealed || !currentAnswer) return;

    if (currentIndex < totalQuestions - 1) {
      navigateToIndex(currentIndex + 1);
      return;
    }

    setSaving(true);
    const ok = await saveToServer({
      batch: getUnsavedBatch(),
      currentQuestionIndex: currentIndex,
      complete: true,
    });
    setSaving(false);

    if (ok) {
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
        {unsavedCount > 0 && (
          <p className="mt-2 text-center text-xs text-amber-600">
            {unsavedCount} 题未保存，点击「保存」同步到云端
          </p>
        )}
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

      <footer className="sticky bottom-0 flex items-center justify-between border-t border-slate-200/60 bg-[#f5f6f8] px-4 py-4">
        <button
          type="button"
          onClick={() => navigateToIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 text-sm font-medium text-slate-600 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          上一题
        </button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasUnsavedCurrent || saving}
          className="min-w-16"
        >
          {saving ? "保存中" : "保存"}
        </Button>

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
          isUnsaved: index in localSelections,
        }))}
        onSelectQuestion={navigateToIndex}
      />
    </div>
  );
}
