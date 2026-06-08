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
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
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
              const isUnsaved = !examMode && item.isUnsaved === true;

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
                    isActive && "border-blue-600 bg-white",
                    !isActive && isUnsaved && "border-amber-300 bg-amber-50",
                    !isActive && !isUnsaved && isCorrect && "border-green-200 bg-green-50",
                    !isActive && !isUnsaved && isIncorrect && "border-red-200 bg-red-50",
                    !isActive && isAnswered && examMode && "border-blue-100 bg-blue-50",
                    !isActive && !isAnswered && "border-slate-100 bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold leading-none",
                      isUnsaved && "text-amber-600",
                      !isUnsaved && isCorrect && "text-green-600",
                      !isUnsaved && isIncorrect && "text-red-600",
                      examMode && isAnswered && !isActive && "text-blue-600",
                      !isAnswered && "text-slate-400"
                    )}
                  >
                    {item.index + 1}
                  </span>
                  {item.selectedAnswer && (
                    <span className="mt-0.5 text-[10px] leading-none text-slate-500">
                      {item.selectedAnswer}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
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
