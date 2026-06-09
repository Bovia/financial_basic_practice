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
        showCorrect && "border-app-success-border bg-app-success-soft",
        showWrong && "border-app-error-border bg-app-error-soft",
        !isRevealed && isSelected && "border-app-accent bg-app-surface shadow-sm",
        !isRevealed &&
          !isSelected &&
          "border-app-border bg-app-surface hover:border-app-accent-text hover:bg-app-surface-muted",
        isRevealed && !showCorrect && !showWrong && "border-app-border bg-app-surface opacity-60",
        disabled && !isRevealed && "cursor-default"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          showCorrect && "bg-app-success text-white",
          showWrong && "bg-app-error text-white",
          !isRevealed && isSelected && "bg-app-accent text-white",
          !isRevealed && !isSelected && "bg-app-surface-muted text-app-text-muted",
          isRevealed && !showCorrect && !showWrong && "bg-app-surface-muted text-app-text-muted"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "flex-1 text-sm font-medium leading-snug",
          showCorrect && "text-app-success",
          showWrong && "text-app-error",
          !showCorrect && !showWrong && "text-app-text"
        )}
      >
        {text}
      </span>
      {showCorrect && <Check className="h-4 w-4 shrink-0 text-app-success" strokeWidth={1.75} />}
      {showWrong && <X className="h-4 w-4 shrink-0 text-app-error" strokeWidth={1.75} />}
    </button>
  );
}
