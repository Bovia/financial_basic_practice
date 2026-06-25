"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  GUEST_USERNAME,
  isGuestMode,
  isGuestUsername,
  isPortfolioEmbed,
} from "@/lib/portfolio-embed";
import { clearGuestProgressForUser } from "@/lib/guest-progress";

const STORAGE_KEY = "exam-practice-username";

type UserContextValue = {
  username: string | null;
  isReady: boolean;
  embedMode: boolean;
  loginPrompt: boolean;
  isGuestMode: boolean;
  isCloudLoggedIn: boolean;
  setUsername: (name: string) => void;
  clearUsername: () => void;
  openCloudLogin: () => void;
  cancelCloudLogin: () => void;
  exitToGuest: () => void;
  ensureUser: () => Promise<string | null>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
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
    setUsernameState((current) => {
      if (!current && embedMode) {
        localStorage.setItem(STORAGE_KEY, GUEST_USERNAME);
        return GUEST_USERNAME;
      }
      return current;
    });
  }, [embedMode]);

  const exitToGuest = useCallback(() => {
    clearGuestProgressForUser();
    localStorage.setItem(STORAGE_KEY, GUEST_USERNAME);
    setUsernameState(GUEST_USERNAME);
    setLoginPrompt(false);
  }, []);

  const ensureUser = useCallback(async () => {
    if (!username || isGuestUsername(username)) return null;
    const response = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) return null;
    return username;
  }, [username]);

  const value = useMemo(
    () => ({
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
      ensureUser,
    }),
    [
      username,
      isReady,
      embedMode,
      loginPrompt,
      setUsername,
      clearUsername,
      openCloudLogin,
      cancelCloudLogin,
      exitToGuest,
      ensureUser,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
