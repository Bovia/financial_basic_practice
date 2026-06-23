"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GUEST_USERNAME,
  isGuestMode,
  isGuestUsername,
  isPortfolioEmbed,
} from "@/lib/portfolio-embed";
import { clearGuestProgressForUser } from "@/lib/guest-progress";

const STORAGE_KEY = "exam-practice-username";

export function useUser() {
  const [username, setUsernameState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [embedMode] = useState(() => isPortfolioEmbed());
  const [loginPrompt, setLoginPrompt] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUsernameState(stored);
    } else if (isPortfolioEmbed()) {
      localStorage.setItem(STORAGE_KEY, GUEST_USERNAME);
      setUsernameState(GUEST_USERNAME);
    }
    setIsReady(true);
  }, []);

  const setUsername = useCallback((name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    setUsernameState(name);
    setLoginPrompt(false);
  }, []);

  const clearUsername = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUsernameState(null);
    setLoginPrompt(false);
  }, []);

  const openCloudLogin = useCallback(() => {
    setLoginPrompt(true);
  }, []);

  const cancelCloudLogin = useCallback(() => {
    setLoginPrompt(false);
    if (!username && embedMode) {
      localStorage.setItem(STORAGE_KEY, GUEST_USERNAME);
      setUsernameState(GUEST_USERNAME);
    }
  }, [username, embedMode]);

  const exitToGuest = useCallback(() => {
    clearGuestProgressForUser();
    localStorage.setItem(STORAGE_KEY, GUEST_USERNAME);
    setUsernameState(GUEST_USERNAME);
    setLoginPrompt(false);
  }, []);

  return {
    username,
    isReady,
    embedMode,
    loginPrompt,
    isGuestMode: isGuestMode(username),
    isCloudLoggedIn: !!username && !isGuestUsername(username),
    setUsername,
    clearUsername,
    openCloudLogin,
    cancelCloudLogin,
    exitToGuest,
    ensureUser: useCallback(async () => {
      if (!username || isGuestUsername(username)) return null;
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!response.ok) return null;
      return username;
    }, [username]),
  };
}
