"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, LogOut, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserSettingsDialog } from "@/components/settings/user-settings-dialog";
import { useUser } from "@/hooks/use-user";
import { useUserSettings } from "@/hooks/use-user-settings";
import type { PaperListItem } from "@/types/question";

type CategoryData = {
  id: string;
  name: string;
  paperCount: number;
  papers: PaperListItem[];
};

export function PaperList() {
  const router = useRouter();
  const { username, isReady, clearUsername } = useUser();
  const { isReady: settingsReady } = useUserSettings();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [expandedPaperId, setExpandedPaperId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !username) return;

    async function load() {
      const name = username;
      if (!name) return;
      const response = await fetch(`/api/papers?username=${encodeURIComponent(name)}`);
      if (response.ok) {
        const data = (await response.json()) as CategoryData[];
        setCategories(data);
      }
      setLoading(false);
    }

    load();
  }, [isReady, username]);

  async function startPractice(paperId: number, restart = false) {
    if (!username) return;

    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, paperId, restart }),
    });

    if (!response.ok) return;
    const data = (await response.json()) as { progressId: number };
    router.push(`/practice/${paperId}?progressId=${data.progressId}`);
  }

  if (loading || !settingsReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        加载中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-8">
      <header className="mb-6 flex items-start justify-between pt-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">练习题库</h1>
          <p className="mt-1 text-sm text-slate-500">选择套题开始练习</p>
          {username && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span>
                当前用户：<span className="font-medium text-slate-600">{username}</span>
              </span>
              <button
                type="button"
                onClick={clearUsername}
                className="flex items-center gap-0.5 text-blue-600 hover:underline"
              >
                <LogOut className="h-3 w-3" />
                切换用户
              </button>
            </div>
          )}
        </div>
        <UserSettingsDialog />
      </header>

      {categories.map((category) => (
        <section key={category.id} className="mb-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">{category.name}</h2>
            <span className="text-sm text-slate-400">{category.paperCount}套</span>
          </div>

          <div className="space-y-3">
            {category.papers.map((paper) => {
              const isExpanded = expandedPaperId === paper.id;
              const hasHistory = paper.history.length > 0;

              return (
                <div
                  key={paper.id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                      {paper.id}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{paper.name}</p>
                      <p className="text-sm text-slate-500">
                        {paper.status === "not_started" && "未开始"}
                        {paper.status === "in_progress" && (
                          <span className="text-blue-600">
                            进行中 {paper.answeredCount}/{paper.totalQuestions}
                          </span>
                        )}
                        {paper.status === "completed" && (
                          <span>
                            已完成 {paper.history[0]?.score}/{paper.totalQuestions}
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
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
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
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
                      {paper.history.map((record, index) => (
                        <button
                          key={record.id}
                          type="button"
                          onClick={() => router.push(`/result/${record.id}`)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-slate-100"
                        >
                          <span className="text-slate-600">记录{paper.history.length - index}</span>
                          <span className="font-medium text-slate-800">
                            {record.score}/{record.totalQuestions} →
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
