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
import type { AnswerOption } from "@/types/question";

type AnswerItem = {
  index: number;
  selectedAnswer: AnswerOption | null;
  isCorrect: boolean | null;
};

type AnswerRecordSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentIndex: number;
  totalQuestions: number;
  answers: AnswerItem[];
  onSelectQuestion: (index: number) => void;
};

export function AnswerRecordSheet({
  open,
  onOpenChange,
  currentIndex,
  totalQuestions,
  answers,
  onSelectQuestion,
}: AnswerRecordSheetProps) {
  const answeredCount = answers.filter((a) => a.selectedAnswer).length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-[300px] p-4">
        <div className="flex items-center justify-between">
          <SheetHeader className="space-y-0">
            <SheetTitle className="text-base">答题记录</SheetTitle>
          </SheetHeader>
          <SheetCloseButton />
        </div>

        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {answers.map((item) => {
            const isActive = item.index === currentIndex;
            const isAnswered = !!item.selectedAnswer;
            const isCorrect = item.isCorrect === true;
            const isIncorrect = item.isCorrect === false;

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
                  !isActive && isCorrect && "border-green-200 bg-green-50",
                  !isActive && isIncorrect && "border-red-200 bg-red-50",
                  !isActive && !isAnswered && "border-slate-100 bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-semibold leading-none",
                    isCorrect && "text-green-600",
                    isIncorrect && "text-red-600",
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

        <div className="mt-4">
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
