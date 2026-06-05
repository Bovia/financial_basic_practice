"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "exam-practice-username";

export function useUser() {
  const [username, setUsernameState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setUsernameState(stored);
    setIsReady(true);
  }, []);

  const setUsername = useCallback((name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    setUsernameState(name);
  }, []);

  const clearUsername = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUsernameState(null);
  }, []);

  const ensureUser = useCallback(async () => {
    if (!username) return null;

    const response = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) return null;
    return username;
  }, [username]);

  return { username, isReady, setUsername, clearUsername, ensureUser };
}
