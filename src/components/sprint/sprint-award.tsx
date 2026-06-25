"use client";

import { Button } from "@/components/ui/button";
import { getSprintCheer, getSprintTheme } from "@/lib/sprint";
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

const THEME_STYLES = {
  blue: {
    rays: "from-[#2E5A88] via-[#3D6A99] to-[#2E5A88]",
    accent: "text-[#F1C40F]",
    cup: "from-[#F1C40F] to-[#E6A800]",
    base: "bg-[#5D2E1D]",
  },
  green: {
    rays: "from-[#1B4332] via-[#2D6A4F] to-[#1B4332]",
    accent: "text-[#FFD166]",
    cup: "from-[#FFD166] to-[#F4A261]",
    base: "bg-[#4A2C20]",
  },
  purple: {
    rays: "from-[#3D2C5E] via-[#5B4B8A] to-[#3D2C5E]",
    accent: "text-[#FFE066]",
    cup: "from-[#FFE066] to-[#F5C842]",
    base: "bg-[#4A2C20]",
  },
};

function CssTrophy({ theme }: { theme: keyof typeof THEME_STYLES }) {
  const styles = THEME_STYLES[theme];

  return (
    <div className="relative mx-auto mb-6 h-36 w-36 animate-in zoom-in-95 duration-500">
      <div
        className={cn(
          "absolute inset-x-6 bottom-0 h-5 rounded-sm",
          styles.base,
          "shadow-[0_4px_0_rgba(0,0,0,0.25)]"
        )}
      />
      <div
        className={cn(
          "absolute inset-x-10 bottom-5 h-4 rounded-sm",
          styles.base,
          "opacity-90"
        )}
      />
      <div className="absolute inset-x-[4.75rem] bottom-9 h-10 w-2 rounded-sm bg-gradient-to-b from-[#F1C40F] to-[#E6A800]" />
      <div
        className={cn(
          "absolute inset-x-8 top-6 h-16 rounded-t-full rounded-b-lg bg-gradient-to-br shadow-lg",
          styles.cup
        )}
      >
        <div className="absolute top-2 right-3 h-10 w-2 rounded-full bg-white/45" />
      </div>
      <div className="absolute top-10 -left-1 h-10 w-8 rounded-l-full border-[6px] border-[#E6A800] border-r-0" />
      <div className="absolute top-10 -right-1 h-10 w-8 rounded-r-full border-[6px] border-[#E6A800] border-l-0" />
      <div className="absolute inset-x-[3.75rem] bottom-[1.35rem] h-2 rounded bg-white/90" />
    </div>
  );
}

function Confetti() {
  const dots = [
    "left-[12%] top-[18%] bg-[#F1C40F]",
    "left-[22%] top-[72%] bg-white/80",
    "left-[78%] top-[24%] bg-[#FFD166]",
    "left-[86%] top-[68%] bg-[#F1C40F]",
    "left-[48%] top-[12%] bg-white/70",
    "left-[62%] top-[80%] bg-[#FFE066]",
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((className, index) => (
        <span
          key={index}
          className={cn(
            "absolute h-2 w-2 rounded-full opacity-80 animate-bounce",
            className
          )}
          style={{ animationDelay: `${index * 120}ms`, animationDuration: "1.8s" }}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl animate-in zoom-in-95 fade-in duration-300">
        <div
          className={cn(
            "relative px-6 py-8 text-center",
            "bg-[repeating-conic-gradient(from_0deg,#2E5A88_0deg_10deg,#3D6A99_10deg_20deg)]"
          )}
          style={{
            background:
              theme === "blue"
                ? "repeating-conic-gradient(from 0deg, #2E5A88 0deg 10deg, #3D6A99 10deg 20deg)"
                : theme === "green"
                  ? "repeating-conic-gradient(from 0deg, #1B4332 0deg 10deg, #2D6A4F 10deg 20deg)"
                  : "repeating-conic-gradient(from 0deg, #3D2C5E 0deg 10deg, #5B4B8A 10deg 20deg)",
          }}
        >
          <Confetti />
          <CssTrophy theme={theme} />

          <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", styles.accent)}>
            {allDone ? "冲刺完成" : `第 ${groupNumber} 组完成`}
          </p>
          <h1 className={cn("mt-2 text-3xl font-bold leading-tight", styles.accent)}>{cheer}</h1>
          <p className="mt-3 text-sm text-white/90">
            本轮 {score}/{totalQuestions}
            {!allDone && remainingPool > 0 && ` · 待巩固还剩 ${remainingPool} 题`}
          </p>
          {allDone && (
            <p className="mt-2 text-sm text-white/80">待巩固题目已全部刷完，考前状态拉满了。</p>
          )}
        </div>

        <div className="flex gap-2 bg-app-surface p-4">
          {allDone ? (
            <Button className="w-full" onClick={onRest}>
              回首页
            </Button>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={onRest} disabled={loadingNext}>
                先休息
              </Button>
              <Button className="flex-1" onClick={onNextGroup} disabled={loadingNext}>
                {loadingNext ? "准备中..." : "下一组"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
