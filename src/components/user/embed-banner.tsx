"use client";

import { useUser } from "@/hooks/use-user";

type EmbedBannerProps = {
  onLogin: () => void;
};

export function EmbedBanner({ onLogin }: EmbedBannerProps) {
  const { embedMode, isGuestMode } = useUser();

  if (!embedMode || !isGuestMode) return null;

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-2 border-b border-app-border bg-app-bg px-3 py-2 text-xs text-app-text-secondary">
      <span>演示模式 · 数据仅保存在本浏览器</span>
      <button
        type="button"
        onClick={onLogin}
        className="rounded-full border border-app-border bg-app-surface px-2.5 py-0.5 font-semibold text-app-text hover:bg-app-accent-soft"
      >
        登录云同步
      </button>
    </div>
  );
}
