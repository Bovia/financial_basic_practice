"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnswerOption } from "@/types/question";

type OptionCardProps = {
  label: AnswerOption;
  text: string;
  isSelected: boolean;
  isRevealed: boolean;
  isCorrectOption: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function OptionCard({
  label,
  text,
  isSelected,
  isRevealed,
  isCorrectOption,
  onClick,
  disabled,
}: OptionCardProps) {
  const showCorrect = isRevealed && isCorrectOption;
  const showWrong = isRevealed && isSelected && !isCorrectOption;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isRevealed}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition-all",
        showCorrect && "border-green-400 bg-green-50",
        showWrong && "border-red-400 bg-red-50",
        !isRevealed && isSelected && "border-blue-600 bg-white shadow-sm",
        !isRevealed && !isSelected && "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50",
        isRevealed && !showCorrect && !showWrong && "border-slate-200 bg-white opacity-60",
        disabled && !isRevealed && "cursor-default"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          showCorrect && "bg-green-600 text-white",
          showWrong && "bg-red-500 text-white",
          !isRevealed && isSelected && "bg-blue-600 text-white",
          !isRevealed && !isSelected && "bg-slate-100 text-slate-500",
          isRevealed && !showCorrect && !showWrong && "bg-slate-100 text-slate-400"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "flex-1 text-sm font-medium leading-snug",
          showCorrect && "text-green-800",
          showWrong && "text-red-800",
          !showCorrect && !showWrong && "text-slate-800"
        )}
      >
        {text}
      </span>
      {showCorrect && <Check className="h-4 w-4 shrink-0 text-green-600" />}
      {showWrong && <X className="h-4 w-4 shrink-0 text-red-500" />}
    </button>
  );
}
