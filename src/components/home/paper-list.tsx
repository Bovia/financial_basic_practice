"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, LogOut, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserSettingsDialog } from "@/components/settings/user-settings-dialog";
import { useUser } from "@/hooks/use-user";
import { guestProgressId } from "@/lib/portfolio-embed";
import { useUserSettings } from "@/hooks/use-user-settings";
import type { PaperListItem } from "@/types/question";

type CategoryData = {
  id: string;
  name: string;
  paperCount: number;
  papers: PaperListItem[];
};

type SprintStatus = {
  available: boolean;
  unmasteredCount: number;
  completedGroups: number;
  activeProgressId: number | null;
  activeGroupNumber: number | null;
};

export function PaperList() {
  const router = useRouter();
  const { username, isReady, clearUsername, isGuestMode, isCloudLoggedIn, openCloudLogin } = useUser();
  const { isReady: settingsReady } = useUserSettings();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [sprintStatus, setSprintStatus] = useState<SprintStatus | null>(null);
  const [expandedPaperId, setExpandedPaperId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingSprint, setStartingSprint] = useState(false);
  const [sprintDoneMessage, setSprintDoneMessage] = useState("");

  useEffect(() => {
    if (!isReady) return;

    if (!username) {
      setCategories([]);
      setSprintStatus(null);
      setSprintDoneMessage("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setSprintStatus(null);
    setSprintDoneMessage("");

    async function load() {
      const name = username;
      if (!name) return;
      const [papersRes, sprintRes] = await Promise.all([
        fetch(`/api/papers?username=${encodeURIComponent(name)}`),
        fetch(`/api/sprint/status?username=${encodeURIComponent(name)}`),
      ]);
      if (papersRes.ok) {
        const data = (await papersRes.json()) as CategoryData[];
        setCategories(data);
      }
      if (sprintRes.ok) {
        setSprintStatus((await sprintRes.json()) as SprintStatus);
      }
      setLoading(false);
    }

    void load();
  }, [isReady, username]);

  async function startPractice(paperId: number, restart = false) {
    if (!username) return;

    if (isGuestMode) {
      router.push(`/practice/${paperId}?progressId=${guestProgressId(paperId)}`);
      return;
    }

    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, paperId, restart }),
    });

    if (!response.ok) return;
    const data = (await response.json()) as { progressId: number };
    router.push(`/practice/${paperId}?progressId=${data.progressId}`);
  }

  async function startSprint() {
    if (startingSprint) return;

    if (!username || isGuestMode || !isCloudLoggedIn) {
      openCloudLogin();
      return;
    }

    setStartingSprint(true);
    setSprintDoneMessage("");

    const response = await fetch("/api/sprint/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = (await response.json()) as {
      progressId?: number;
      completed?: boolean;
      message?: string;
      error?: string;
    };

    setStartingSprint(false);

    if (!response.ok) {
      setSprintDoneMessage(data.error ?? "无法开始冲刺，请稍后重试");
      return;
    }

    if (data.progressId) {
      router.push(`/sprint?progressId=${data.progressId}`);
      return;
    }

    if (data.completed) {
      setSprintDoneMessage(data.message ?? "待巩固题目已全部刷完！");
      setSprintStatus((prev) =>
        prev
          ? { ...prev, activeProgressId: null, activeGroupNumber: null }
          : prev
      );
    }
  }

  const hasActiveSprint =
    isCloudLoggedIn && !!sprintStatus?.activeProgressId && sprintStatus.available;

  if (loading || !settingsReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-app-text-secondary">
        加载中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-8">
      <header className="mb-6 flex items-start justify-between pt-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text">练习题库</h1>
          <p className="mt-1 text-sm text-app-text-secondary">选择套题开始练习</p>
          {username && (
            <div className="mt-2 flex items-center gap-2 text-xs text-app-text-muted">
              <span>
                当前用户：<span className="font-medium text-app-text-secondary">{username}</span>
              </span>
              <button
                type="button"
                onClick={() => (isGuestMode ? openCloudLogin() : clearUsername())}
                className="flex items-center gap-0.5 text-app-accent-text hover:underline"
              >
                <LogOut className="h-3 w-3" />
                {isGuestMode ? "登录云同步" : "切换用户"}
              </button>
            </div>
          )}
        </div>
        <UserSettingsDialog />
      </header>

      {categories.map((category) => (
        <section key={category.id} className="mb-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-app-accent" />
              <h2 className="text-lg font-bold text-app-text">{category.name}</h2>
              <span className="text-sm text-app-text-muted">{category.paperCount}套</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-app-accent text-app-accent-text"
              onClick={startSprint}
              disabled={startingSprint}
            >
              <Zap className="h-3.5 w-3.5" />
              {startingSprint
                ? "准备中..."
                : !isCloudLoggedIn
                  ? "登录后冲刺"
                  : hasActiveSprint
                    ? "继续冲刺"
                    : "最后冲刺"}
            </Button>
          </div>

          {sprintStatus?.available && isCloudLoggedIn && (
            <p className="-mt-2 mb-3 text-xs text-app-text-muted">
              冲刺 · 已完成 {sprintStatus.completedGroups} 组 · 待巩固{" "}
              {sprintStatus.unmasteredCount} 题
              {hasActiveSprint && sprintStatus.activeGroupNumber
                ? ` · 第 ${sprintStatus.activeGroupNumber} 组进行中`
                : ""}
            </p>
          )}

          {isGuestMode && (
            <p className="-mt-2 mb-3 text-xs text-app-text-muted">
              冲刺需登录云同步账号，登录后可跨设备继续
            </p>
          )}

          {sprintDoneMessage && (
            <p className="-mt-2 mb-3 rounded-xl bg-app-success-soft px-3 py-2 text-xs text-app-success">
              {sprintDoneMessage}
            </p>
          )}

          <div className="space-y-3">
            {category.papers.map((paper) => {
              const isExpanded = expandedPaperId === paper.id;
              const hasHistory = paper.history.length > 0;

              return (
                <div
                  key={paper.id}
                  className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm"
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-accent-soft text-sm font-bold text-app-accent-text">
                      {paper.id}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-app-text">{paper.name}</p>
                      <p className="text-sm text-app-text-secondary">
                        {paper.status === "not_started" && "未开始"}
                        {paper.status === "in_progress" && (
                          <span className="font-medium text-app-accent-text">
                            {paper.answeredCount}/{paper.totalQuestions}
                          </span>
                        )}
                        {paper.status === "completed" && (
                          <span className="font-medium text-app-success">
                            ✓ {paper.history[0]?.score}/{paper.totalQuestions}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {paper.status === "in_progress" ? (
                        <Button size="sm" onClick={() => startPractice(paper.id)}>
                          继续 →
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => startPractice(paper.id)}>
                          <Play className="h-3.5 w-3.5" />
                          开始
                        </Button>
                      )}

                      {hasHistory && (
                        <button
                          type="button"
                          onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}
                          className="rounded-lg p-2 text-app-text-muted hover:bg-app-surface-muted"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && hasHistory && (
                    <div className="border-t border-app-border bg-app-surface-muted px-4 py-2">
                      {paper.history.map((record, index) => (
                        <button
                          key={record.id}
                          type="button"
                          onClick={() => router.push(`/result/${record.id}`)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-app-surface"
                        >
                          <span className="text-app-text-secondary">记录{paper.history.length - index}</span>
                          <span className="font-medium text-app-success">
                            ✓ {record.score}/{record.totalQuestions} →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
