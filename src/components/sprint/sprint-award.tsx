"use client";

import { Button } from "@/components/ui/button";
import { getSprintCheer, getSprintTheme, type SprintTheme } from "@/lib/sprint";
import { cn } from "@/lib/utils";

type SprintAwardProps = {
  username: string;
  groupNumber: number;
  score: number;
  totalQuestions: number;
  remainingPool: number;
  allDone: boolean;
  loadingNext?: boolean;
  onNextGroup: () => void;
  onRest: () => void;
};

const THEME_STYLES: Record<
  SprintTheme,
  {
    rays: [string, string];
    accent: string;
    accentMuted: string;
    buttonPrimary: string;
    buttonOutline: string;
  }
> = {
  pink: {
    rays: ["#9B1459", "#D63384"],
    accent: "text-[#FFF0A8]",
    accentMuted: "text-white/85",
    buttonPrimary: "bg-white text-[#9B1459] hover:bg-white/90",
    buttonOutline: "border-white/50 bg-white/15 text-white hover:bg-white/25",
  },
  orange: {
    rays: ["#C65D00", "#FF9F1C"],
    accent: "text-[#FFF8E7]",
    accentMuted: "text-white/90",
    buttonPrimary: "bg-white text-[#C65D00] hover:bg-white/90",
    buttonOutline: "border-white/50 bg-white/15 text-white hover:bg-white/25",
  },
  purple: {
    rays: ["#4C1D95", "#7C3AED"],
    accent: "text-[#FFE566]",
    accentMuted: "text-white/85",
    buttonPrimary: "bg-white text-[#5B21B6] hover:bg-white/90",
    buttonOutline: "border-white/50 bg-white/15 text-white hover:bg-white/25",
  },
};

function sunburstBackground(colorA: string, colorB: string) {
  return `repeating-conic-gradient(from 0deg, ${colorA} 0deg 12deg, ${colorB} 12deg 24deg)`;
}

function SvgTrophy() {
  return (
    <div className="relative mb-8 animate-in zoom-in-90 fade-in duration-700">
      <div
        className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFD54F]/25 blur-2xl"
        aria-hidden
      />
      <svg
        viewBox="0 0 160 180"
        className="relative mx-auto h-44 w-44 drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
        aria-hidden
      >
        <defs>
          <linearGradient id="trophyGold" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFF3B0" />
            <stop offset="35%" stopColor="#FFD54F" />
            <stop offset="70%" stopColor="#F5B800" />
            <stop offset="100%" stopColor="#C88700" />
          </linearGradient>
          <linearGradient id="trophyGoldDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="100%" stopColor="#E6A800" />
          </linearGradient>
          <linearGradient id="trophyBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A0522D" />
            <stop offset="100%" stopColor="#5D2E17" />
          </linearGradient>
          <linearGradient id="trophyShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <ellipse cx="80" cy="168" rx="52" ry="8" fill="#000" opacity="0.18" />

        <rect x="48" y="148" width="64" height="14" rx="4" fill="url(#trophyBase)" />
        <rect x="56" y="136" width="48" height="12" rx="3" fill="url(#trophyBase)" />
        <rect x="72" y="112" width="16" height="26" rx="3" fill="url(#trophyGoldDark)" />

        <path
          d="M48 108 C48 56 64 28 80 24 C96 28 112 56 112 108 C112 118 98 126 80 128 C62 126 48 118 48 108 Z"
          fill="url(#trophyGold)"
        />
        <path
          d="M48 108 C48 56 64 28 80 24 C96 28 112 56 112 108 C112 118 98 126 80 128 C62 126 48 118 48 108 Z"
          fill="url(#trophyShine)"
          opacity="0.35"
        />

        <path
          d="M48 72 C28 72 22 88 26 100 C30 110 42 112 48 106"
          fill="none"
          stroke="url(#trophyGoldDark)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M112 72 C132 72 138 88 134 100 C130 110 118 112 112 106"
          fill="none"
          stroke="url(#trophyGoldDark)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <path
          d="M58 118 L102 118 L98 128 L62 128 Z"
          fill="#FFF8E1"
          opacity="0.92"
        />
        <rect x="76" y="120" width="8" height="6" rx="1" fill="#C88700" opacity="0.5" />

        <polygon
          points="80,8 83,16 92,16 85,21 88,30 80,25 72,30 75,21 68,16 77,16"
          fill="#FFF8E1"
          stroke="#F5B800"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function Confetti({ theme }: { theme: SprintTheme }) {
  const palette =
    theme === "pink"
      ? ["#FFF0A8", "#FFFFFF", "#FFB8D9", "#FFE566"]
      : theme === "orange"
        ? ["#FFF8E7", "#FFFFFF", "#FFD166", "#FF6B35"]
        : ["#FFE566", "#FFFFFF", "#C4B5FD", "#FDE68A"];

  const pieces = Array.from({ length: 18 }, (_, index) => ({
    left: `${8 + ((index * 17) % 84)}%`,
    top: `${6 + ((index * 23) % 78)}%`,
    size: index % 3 === 0 ? 10 : index % 3 === 1 ? 6 : 8,
    color: palette[index % palette.length],
    delay: `${index * 90}ms`,
    rotate: `${(index * 37) % 360}deg`,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="absolute animate-bounce rounded-full opacity-80"
          style={{
            left: piece.left,
            top: piece.top,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            animationDuration: `${1.6 + (index % 4) * 0.3}s`,
            transform: `rotate(${piece.rotate})`,
          }}
        />
      ))}
    </div>
  );
}

export function SprintAward({
  username,
  groupNumber,
  score,
  totalQuestions,
  remainingPool,
  allDone,
  loadingNext,
  onNextGroup,
  onRest,
}: SprintAwardProps) {
  const theme = getSprintTheme(groupNumber);
  const styles = THEME_STYLES[theme];
  const cheer = getSprintCheer(groupNumber, username);

  return (
    <div className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col overflow-hidden animate-in fade-in duration-300">
      <div
        className="absolute inset-0 scale-150"
        style={{ background: sunburstBackground(styles.rays[0], styles.rays[1]) }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-36 pt-10 text-center">
        <Confetti theme={theme} />
        <SvgTrophy />

        <p
          className={cn(
            "animate-in slide-in-from-bottom-3 text-xs font-semibold tracking-[0.25em] duration-500",
            styles.accent
          )}
        >
          {allDone ? "冲刺完成" : `第 ${groupNumber} 组完成`}
        </p>
        <h1
          className={cn(
            "mt-3 max-w-xs animate-in slide-in-from-bottom-4 text-4xl font-bold leading-tight duration-700",
            styles.accent
          )}
        >
          {cheer}
        </h1>
        <p className={cn("mt-4 text-base", styles.accentMuted)}>
          本轮 {score}/{totalQuestions}
          {!allDone && remainingPool > 0 && ` · 待巩固还剩 ${remainingPool} 题`}
        </p>
        {allDone && (
          <p className={cn("mt-2 max-w-xs text-sm", styles.accentMuted)}>
            待巩固题目已全部刷完，考前状态拉满了。
          </p>
        )}
      </div>

      <div className="relative px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto flex w-full max-w-md gap-3">
          {allDone ? (
            <Button
              className={cn("h-12 flex-1 rounded-2xl border-0 text-base font-semibold", styles.buttonPrimary)}
              onClick={onRest}
            >
              回首页
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className={cn(
                  "h-12 flex-1 rounded-2xl border text-base font-semibold backdrop-blur-sm",
                  styles.buttonOutline
                )}
                onClick={onRest}
                disabled={loadingNext}
              >
                先休息
              </Button>
              <Button
                className={cn(
                  "h-12 flex-1 rounded-2xl border-0 text-base font-semibold shadow-lg",
                  styles.buttonPrimary
                )}
                onClick={onNextGroup}
                disabled={loadingNext}
              >
                {loadingNext ? "准备中..." : "下一组"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
