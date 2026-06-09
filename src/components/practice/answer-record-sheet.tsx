"use client";

import {
  Sheet,
  SheetCloseButton,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type AnswerItem = {
  index: number;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  isUnsaved?: boolean;
};

type AnswerRecordSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentIndex: number;
  totalQuestions: number;
  examMode?: boolean;
  answers: AnswerItem[];
  onSelectQuestion: (index: number) => void;
};

export function AnswerRecordSheet({
  open,
  onOpenChange,
  currentIndex,
  totalQuestions,
  examMode,
  answers,
  onSelectQuestion,
}: AnswerRecordSheetProps) {
  const answeredCount = answers.filter((a) => a.selectedAnswer).length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full max-w-[300px] flex-col overflow-hidden p-0">
        <div className="flex shrink-0 items-center justify-between border-b border-app-border px-4 py-3">
          <SheetHeader className="space-y-0">
            <SheetTitle className="text-base">答题记录</SheetTitle>
          </SheetHeader>
          <SheetCloseButton />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          <div className="grid grid-cols-5 gap-1.5">
            {answers.map((item) => {
              const isActive = item.index === currentIndex;
              const isAnswered = !!item.selectedAnswer;
              const showResult = !examMode;
              const isCorrect = showResult && item.isCorrect === true;
              const isIncorrect = showResult && item.isCorrect === false;

              return (
                <button
                  key={item.index}
                  type="button"
                  onClick={() => {
                    onSelectQuestion(item.index);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex h-10 flex-col items-center justify-center rounded-lg border transition-colors",
                    isActive && "border-app-accent bg-app-surface ring-1 ring-app-accent",
                    !isActive && isCorrect && "border-app-success-border bg-app-success-soft",
                    !isActive && isIncorrect && "border-app-error-border bg-app-error-soft",
                    !isActive && isAnswered && examMode && "border-app-accent-soft bg-app-accent-soft",
                    !isActive && !isAnswered && "border-app-border bg-app-surface-muted"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold leading-none",
                      isCorrect && "text-app-success",
                      isIncorrect && "text-app-error",
                      examMode && isAnswered && !isActive && "text-app-accent-text",
                      !isAnswered && "text-app-text-muted"
                    )}
                  >
                    {item.index + 1}
                  </span>
                  {item.selectedAnswer && (
                    <span className="mt-0.5 text-[10px] leading-none text-app-text-muted">
                      {item.selectedAnswer}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-app-border px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between text-xs text-app-text-secondary">
            <span>
              已答 {answeredCount}/{totalQuestions}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-1" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
