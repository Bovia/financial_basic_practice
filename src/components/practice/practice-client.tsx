"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OptionCard } from "@/components/practice/option-card";
import { AnswerRecordSheet } from "@/components/practice/answer-record-sheet";
import { UserSettingsDialog } from "@/components/settings/user-settings-dialog";
import { useUser } from "@/hooks/use-user";
import { isGuestProgressId } from "@/lib/portfolio-embed";
import { loadGuestProgress, saveGuestProgress } from "@/lib/guest-progress";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import {
  isAnswerMatch,
  isOptionInAnswer,
  normalizeAnswer,
  toggleAnswerOption,
} from "@/lib/answer";
import {
  clearPracticeDraft,
  loadPracticeDraft,
  savePracticeDraft,
} from "@/lib/practice-draft";
import type { AnswerOption, ProgressDetail, QuestionType } from "@/types/question";

type PracticeQuestion = {
  id: number;
  paperId?: number;
  type?: QuestionType;
  title: string;
  options: [string, string, string, string];
  answer: string;
  analysis: string;
};

type PracticeClientProps = {
  paperId: number;
  progressId: number;
  questions: PracticeQuestion[];
  sprintMeta?: { groupNumber: number };
};

const OPTION_LABELS: AnswerOption[] = ["A", "B", "C", "D"];

const TYPE_LABELS: Record<QuestionType, string> = {
  single: "单选题",
  multiple: "多选题",
  judge: "判断题",
};

const AUTO_NEXT_DELAY_MS = 600;

export function PracticeClient({ paperId, progressId, questions, sprintMeta }: PracticeClientProps) {
  const router = useRouter();
  const isSprint = !!sprintMeta;
  const { username, isReady: userReady } = useUser();
  const { examMode, autoNext, isReady: settingsReady } = useUserSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ProgressDetail["answers"]>([]);
  const [localSelections, setLocalSelections] = useState<Record<number, string>>({});
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const hasLoadedRef = useRef(false);
  const prevExamModeRef = useRef(examMode);
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const questionType = currentQuestion?.type ?? "single";
  const isMultiple = questionType === "multiple";
  const savedAnswer = answers[currentIndex]?.selectedAnswer ?? null;
  const localAnswer = localSelections[currentIndex] ?? null;
  const currentAnswer = localAnswer ?? savedAnswer;
  const isRevealed = revealedIndices.has(currentIndex);
  const showFeedback = !examMode && isRevealed;
  const isCorrect = isAnswerMatch(currentAnswer, currentQuestion?.answer ?? "");
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const visibleOptions = OPTION_LABELS.map((label, idx) => ({
    label,
    text: currentQuestion?.options[idx] ?? "",
  })).filter(({ text }) => text.trim().length > 0);

  const persistDraft = useCallback(
    (index: number, selections: Record<number, string>, revealed: Set<number>) => {
      savePracticeDraft(progressId, {
        currentIndex: index,
        selections,
        revealed: [...revealed],
      });
    },
    [progressId]
  );

  const revealAnsweredQuestions = useCallback(() => {
    setRevealedIndices((prev) => {
      const next = new Set(prev);
      questions.forEach((_, index) => {
        if (localSelections[index] ?? answers[index]?.selectedAnswer) {
          next.add(index);
        }
      });
      return next;
    });
  }, [answers, localSelections, questions]);

  const loadProgress = useCallback(
    async (hideReveal: boolean) => {
      if (!username) return;

      if (isGuestProgressId(progressId)) {
        const data = loadGuestProgress(progressId, paperId, "", totalQuestions);
        const draft = loadPracticeDraft(progressId);
        const mergedSelections: Record<number, string> = { ...draft?.selections };
        const mergedRevealed = new Set<number>();
        if (!hideReveal) {
          data.answers.forEach((answer, index) => {
            if (answer.selectedAnswer) mergedRevealed.add(index);
          });
          draft?.revealed.forEach((index) => mergedRevealed.add(index));
        }
        setCurrentIndex(draft?.currentIndex ?? data.currentQuestionIndex);
        setAnswers(data.answers);
        setLocalSelections(mergedSelections);
        setRevealedIndices(mergedRevealed);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/progress?username=${encodeURIComponent(username)}&progressId=${progressId}`
      );
      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = (await response.json()) as ProgressDetail;
      const draft = loadPracticeDraft(progressId);

      const mergedSelections: Record<number, string> = { ...draft?.selections };
      const mergedRevealed = new Set<number>();

      if (!hideReveal) {
        data.answers.forEach((answer, index) => {
          if (answer.selectedAnswer) {
            mergedRevealed.add(index);
          }
        });
        draft?.revealed.forEach((index) => mergedRevealed.add(index));
      }

      setCurrentIndex(draft?.currentIndex ?? data.currentQuestionIndex);
      setAnswers(data.answers);
      setLocalSelections(mergedSelections);
      setRevealedIndices(mergedRevealed);
      setLoading(false);
    },
    [username, progressId, paperId, totalQuestions]
  );

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [progressId]);

  useEffect(() => {
    if (!userReady || !settingsReady || !username || hasLoadedRef.current) return;

    hasLoadedRef.current = true;
    setLoading(true);
    void loadProgress(examMode);
  }, [userReady, settingsReady, username, progressId, examMode, loadProgress]);

  useEffect(() => {
    if (loading) return;
    persistDraft(currentIndex, localSelections, revealedIndices);
  }, [loading, currentIndex, localSelections, revealedIndices, persistDraft]);

  useEffect(() => {
    if (prevExamModeRef.current && !examMode) {
      revealAnsweredQuestions();
    }
    prevExamModeRef.current = examMode;
  }, [examMode, revealAnsweredQuestions]);

  function getSelection(index: number) {
    return localSelections[index] ?? answers[index]?.selectedAnswer ?? null;
  }

  const cancelAutoNext = useCallback(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
  }, []);

  const scheduleAutoNext = useCallback(() => {
    cancelAutoNext();
    if (!autoNext) return;

    autoNextTimerRef.current = setTimeout(() => {
      setCurrentIndex((index) => {
        if (index >= totalQuestions - 1) return index;
        return index + 1;
      });
      autoNextTimerRef.current = null;
    }, AUTO_NEXT_DELAY_MS);
  }, [autoNext, cancelAutoNext, totalQuestions]);

  useEffect(() => () => cancelAutoNext(), [cancelAutoNext]);

  function selectOption(label: AnswerOption) {
    if (!examMode && isRevealed) return;

    if (isMultiple) {
      const current = localSelections[currentIndex] ?? savedAnswer ?? "";
      const next = toggleAnswerOption(current, label);

      setLocalSelections((prev) => {
        const updated = { ...prev };
        if (next) {
          updated[currentIndex] = next;
        } else {
          delete updated[currentIndex];
        }
        return updated;
      });

      if (examMode) return;

      return;
    }

    setLocalSelections((prev) => ({ ...prev, [currentIndex]: label }));

    if (examMode) {
      scheduleAutoNext();
      return;
    }

    setRevealedIndices((prev) => new Set(prev).add(currentIndex));
    scheduleAutoNext();
  }

  function confirmMultipleAnswer() {
    if (examMode || isRevealed || !isMultiple || !currentAnswer) return;

    const normalized = normalizeAnswer(currentAnswer);
    setLocalSelections((prev) => ({ ...prev, [currentIndex]: normalized }));
    setRevealedIndices((prev) => new Set(prev).add(currentIndex));
    scheduleAutoNext();
  }

  function applySavedAnswers(
    items: Array<{
      paperId?: number;
      questionId: number;
      selectedAnswer: string;
      isCorrect: boolean;
    }>
  ) {
    if (items.length === 0) return;

    const indexByKey = new Map(
      questions.map((question, index) => [
        `${question.paperId ?? paperId}:${question.id}`,
        index,
      ])
    );

    setAnswers((prev) => {
      const next = [...prev];
      for (const item of items) {
        const key = `${item.paperId ?? paperId}:${item.questionId}`;
        const index = indexByKey.get(key);
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
        const key = `${item.paperId ?? paperId}:${item.questionId}`;
        const index = indexByKey.get(key);
        if (index !== undefined) {
          delete next[index];
        }
      }
      return next;
    });
  }

  function getAllSelectionsBatch() {
    return questions
      .map((question, index) => {
        const selectedAnswer = getSelection(index);
        if (!selectedAnswer) return null;
        return {
          index,
          paperId: question.paperId ?? paperId,
          questionId: question.id,
          selectedAnswer: normalizeAnswer(selectedAnswer),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  function getCompletePath() {
    return isSprint ? `/sprint/complete/${progressId}` : `/result/${progressId}`;
  }

  async function saveToServer(options: {
    batch?: Array<{ paperId?: number; questionId: number; selectedAnswer: string }>;
    currentQuestionIndex?: number;
    complete?: boolean;
  }) {
    if (!username) return false;

    if (isGuestProgressId(progressId)) {
      const nextAnswers = [...answers];
      for (const item of options.batch ?? []) {
        const idx = questions.findIndex((q) => q.id === item.questionId);
        if (idx >= 0) {
          nextAnswers[idx] = {
            questionId: item.questionId,
            selectedAnswer: item.selectedAnswer,
            isCorrect: isAnswerMatch(item.selectedAnswer, questions[idx]?.answer ?? ""),
          };
        }
      }
      setAnswers(nextAnswers);
      saveGuestProgress(progressId, {
        answers: nextAnswers,
        currentQuestionIndex:
          typeof options.currentQuestionIndex === "number"
            ? options.currentQuestionIndex
            : currentIndex,
      });
      if (options.complete) clearPracticeDraft(progressId);
      return true;
    }

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
          answers: batch.map(({ paperId: itemPaperId, questionId, selectedAnswer }) => ({
            paperId: itemPaperId ?? paperId,
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
        paperId?: number;
        questionId: number;
        selectedAnswer: string;
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

  const navigateToIndex = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= totalQuestions) return;
      cancelAutoNext();
      setCurrentIndex(newIndex);
    },
    [totalQuestions, cancelAutoNext]
  );

  const swipeToPrev = useCallback(() => {
    navigateToIndex(currentIndex - 1);
  }, [currentIndex, navigateToIndex]);

  const swipeToNext = useCallback(() => {
    navigateToIndex(currentIndex + 1);
  }, [currentIndex, navigateToIndex]);

  const swipeEnabled = !saving && !sheetOpen && !exitOpen;

  const swipeHandlers = useSwipeNavigation({
    enabled: swipeEnabled,
    onSwipeLeft: swipeToNext,
    onSwipeRight: swipeToPrev,
  });

  async function handleSubmit() {
    setSaving(true);
    const ok = await saveToServer({
      batch: getAllSelectionsBatch(),
      currentQuestionIndex: currentIndex,
      complete: true,
    });
    setSaving(false);

    if (ok) {
      router.push(getCompletePath());
    }
  }

  async function handleNext() {
    if (examMode) {
      if (currentIndex < totalQuestions - 1) {
        navigateToIndex(currentIndex + 1);
        return;
      }

      await handleSubmit();
      return;
    }

    if (!isRevealed || !currentAnswer) return;

    if (currentIndex < totalQuestions - 1) {
      navigateToIndex(currentIndex + 1);
      return;
    }

    setSaving(true);
    const ok = await saveToServer({
      batch: getAllSelectionsBatch(),
      currentQuestionIndex: currentIndex,
      complete: true,
    });
    setSaving(false);

    if (ok) {
      router.push(getCompletePath());
    }
  }

  const canGoNext = examMode
    ? true
    : isRevealed && !!currentAnswer;

  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isSubmitting = saving && isLastQuestion;

  function getNextButtonLabel() {
    if (isSubmitting) {
      return examMode ? "交卷中..." : "提交中...";
    }
    if (examMode && isLastQuestion) return "交卷";
    if (isLastQuestion) return "完成";
    return "下一题";
  }

  function handleBackClick() {
    setExitOpen(true);
  }

  async function handleExitKeep() {
    setSaving(true);
    const ok = await saveToServer({
      batch: getAllSelectionsBatch(),
      currentQuestionIndex: currentIndex,
    });
    setSaving(false);

    if (!ok) return;

    clearPracticeDraft(progressId);
    setExitOpen(false);
    router.push("/");
  }

  function handleExitDiscard() {
    clearPracticeDraft(progressId);
    setExitOpen(false);
    router.push("/");
  }

  if (loading || !settingsReady || !currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center text-app-text-secondary">
        加载中...
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col bg-app-bg">
      <header className="z-10 shrink-0 border-b border-app-border bg-app-bg px-4 pt-3 pb-3">
        <div className="mb-2 flex items-center justify-between">
          <Button variant="icon" size="icon" onClick={handleBackClick}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-bold text-app-text">
            {isSprint && sprintMeta
              ? `冲刺 · 第${sprintMeta.groupNumber}组 · ${currentIndex + 1}/${totalQuestions}`
              : `第${currentIndex + 1}题 / ${totalQuestions}`}
          </h1>
          <div className="flex items-center gap-1">
            <UserSettingsDialog iconClassName="h-9 w-9" />
            <Button variant="icon" size="icon" onClick={() => setSheetOpen(true)}>
              <LayoutGrid className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-full bg-app-accent-soft px-2 py-0.5 text-xs font-medium text-app-accent-text">
            {TYPE_LABELS[questionType]}
          </span>
          {isSprint ? (
            <span className="text-xs text-app-text-secondary">待巩固专项 · 答对即掌握</span>
          ) : examMode ? (
            <span className="text-xs text-app-text-secondary">考试模式：交卷后出分</span>
          ) : (
            isMultiple &&
            !isRevealed && (
              <span className="text-xs text-app-text-secondary">可多选，确认后看解析</span>
            )
          )}
        </div>
        <Progress value={progressPercent} />
      </header>

      <main
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-6 touch-pan-y"
        {...swipeHandlers}
      >
        <h2 className="mb-4 text-base font-semibold leading-relaxed text-app-text">
          {currentQuestion.title}
        </h2>

        <div className="space-y-2">
          {visibleOptions.map(({ label, text }) => (
            <OptionCard
              key={label}
              label={label}
              text={text}
              isSelected={isOptionInAnswer(currentAnswer, label)}
              isRevealed={showFeedback}
              isCorrectOption={isOptionInAnswer(currentQuestion.answer, label)}
              onClick={() => selectOption(label)}
            />
          ))}
        </div>

        {!examMode && isMultiple && !isRevealed && (
          <Button
            className="mt-4 w-full"
            onClick={confirmMultipleAnswer}
            disabled={!currentAnswer}
          >
            确认答案
          </Button>
        )}

        {showFeedback && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
              className={`mb-2 rounded-lg px-3 py-2 text-sm font-medium ${
                isCorrect
                  ? "bg-app-success-soft text-app-success"
                  : "bg-app-error-soft text-app-error"
              }`}
            >
              {isCorrect ? "回答正确" : `回答错误，正确答案是 ${currentQuestion.answer}`}
            </div>
            <div className="rounded-lg bg-app-surface-muted p-3 text-sm leading-relaxed text-app-text-secondary">
              <span className="font-semibold text-app-text">解析：</span>
              {currentQuestion.analysis}
            </div>
          </div>
        )}
      </main>

      <footer className="shrink-0 flex items-center justify-between border-t border-app-border bg-app-bg px-4 py-3">
        <button
          type="button"
          onClick={() => navigateToIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 text-sm font-medium text-app-text-secondary disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          上一题
        </button>

        <span className="text-xs text-app-text-muted">已答 {getAllSelectionsBatch().length} 题</span>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext || saving}
          className="flex min-w-[4.5rem] items-center justify-end gap-1 text-sm font-medium text-app-text-secondary disabled:opacity-40"
        >
          {getNextButtonLabel()}
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4" aria-hidden />
          )}
        </button>
      </footer>

      <AnswerRecordSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        examMode={examMode}
        answers={questions.map((question, index) => {
          const selected = getSelection(index);

          return {
            index,
            selectedAnswer: selected,
            isCorrect: examMode
              ? null
              : revealedIndices.has(index) || answers[index]?.selectedAnswer
                ? isAnswerMatch(selected, question.answer)
                : null,
            isUnsaved: false,
          };
        })}
        onSelectQuestion={navigateToIndex}
      />

      <Dialog.Root open={exitOpen} onOpenChange={setExitOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-app-border bg-app-surface p-5 shadow-xl">
            <Dialog.Title className="text-base font-bold text-app-text">退出练习</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-app-text-secondary">
              是否保留此次记录？
            </Dialog.Description>

            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleExitDiscard}
                disabled={saving}
              >
                不保留
              </Button>
              <Button className="flex-1" onClick={handleExitKeep} disabled={saving}>
                {saving ? "保留中..." : "保留"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
