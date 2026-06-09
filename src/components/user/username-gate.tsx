"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";

type UsernameGateProps = {
  children: React.ReactNode;
};

export function UsernameGate({ children }: UsernameGateProps) {
  const { username, isReady, setUsername } = useUser();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-app-text-secondary">
        加载中...
      </div>
    );
  }

  if (username) {
    return <>{children}</>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const response = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: input }),
    });

    const data = (await response.json()) as { error?: string; username?: string };

    if (!response.ok) {
      setError(data.error ?? "登录失败，请重试");
      setSubmitting(false);
      return;
    }

    setUsername(data.username ?? input.trim());
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-app-border bg-app-surface p-6 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-app-accent-soft text-app-accent-text">
          <User className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-bold text-app-text">欢迎使用刷题系统</h1>
        <p className="mt-2 text-sm text-app-text-secondary">
          输入用户名即可开始，换浏览器或设备也能继续练习
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="请输入用户名"
              maxLength={20}
              autoFocus
              className="w-full rounded-xl border border-app-border bg-app-surface px-4 py-3 text-base text-app-text outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent-soft"
            />
            {error && <p className="mt-2 text-sm text-app-error">{error}</p>}
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={submitting || !input.trim()}>
            {submitting ? "进入中..." : "进入练习"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-app-text-muted">
          2-20 个字符，支持中文、字母、数字、下划线
        </p>
      </div>
    </div>
  );
}
