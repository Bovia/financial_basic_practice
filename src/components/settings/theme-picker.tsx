"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppTheme } from "@/types/user";

type ThemePickerProps = {
  value: AppTheme;
  onChange: (theme: AppTheme) => void;
  disabled?: boolean;
};

const THEMES: Array<{ id: AppTheme; label: string; Icon: typeof Sun }> = [
  { id: "sun", label: "太阳", Icon: Sun },
  { id: "moon", label: "月亮", Icon: Moon },
];

export function ThemePicker({ value, onChange, disabled }: ThemePickerProps) {
  return (
    <div className="pb-3">
      <p className="text-sm font-medium text-app-text">界面风格</p>
      <p className="mt-0.5 text-xs text-app-text-muted">太阳明亮 · 月亮深色</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {THEMES.map(({ id, label, Icon }) => {
          const selected = value === id;

          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-colors",
                selected
                  ? "border-app-accent bg-app-accent-soft text-app-accent-text"
                  : "border-app-border bg-app-surface text-app-text-secondary hover:bg-app-surface-muted",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
