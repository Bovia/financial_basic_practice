"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useUser } from "@/hooks/use-user";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "@/types/user";

type UserSettingsContextValue = {
  settings: UserSettings;
  examMode: boolean;
  autoNext: boolean;
  theme: UserSettings["theme"];
  isReady: boolean;
  updating: boolean;
  setExamMode: (examMode: boolean) => Promise<boolean>;
  setAutoNext: (autoNext: boolean) => Promise<boolean>;
  setTheme: (theme: UserSettings["theme"]) => Promise<boolean>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<boolean>;
  reloadSettings: () => Promise<void>;
};

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const { username, isReady: userReady } = useUser();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isReady, setIsReady] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!username) {
      setSettings(DEFAULT_USER_SETTINGS);
      setIsReady(true);
      return;
    }

    const response = await fetch(
      `/api/user/settings?username=${encodeURIComponent(username)}`
    );

    if (response.ok) {
      const data = (await response.json()) as { settings: UserSettings };
      setSettings(data.settings);
    }

    setIsReady(true);
  }, [username]);

  useEffect(() => {
    if (!userReady) return;
    setIsReady(false);
    void loadSettings();
  }, [userReady, loadSettings]);

  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      if (!username) return false;

      let previous = DEFAULT_USER_SETTINGS;
      setSettings((current) => {
        previous = current;
        return { ...current, ...patch };
      });
      setUpdating(true);

      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, settings: patch }),
      });

      setUpdating(false);

      if (!response.ok) {
        setSettings(previous);
        return false;
      }

      const data = (await response.json()) as { settings: UserSettings };
      setSettings(data.settings);
      return true;
    },
    [username]
  );

  const setExamMode = useCallback(
    async (examMode: boolean) => updateSettings({ examMode }),
    [updateSettings]
  );

  const setAutoNext = useCallback(
    async (autoNext: boolean) => updateSettings({ autoNext }),
    [updateSettings]
  );

  const setTheme = useCallback(
    async (theme: UserSettings["theme"]) => updateSettings({ theme }),
    [updateSettings]
  );

  const value = useMemo(
    () => ({
      settings,
      examMode: settings.examMode,
      autoNext: settings.autoNext,
      theme: settings.theme,
      isReady,
      updating,
      setExamMode,
      setAutoNext,
      setTheme,
      updateSettings,
      reloadSettings: loadSettings,
    }),
    [
      settings,
      isReady,
      updating,
      setExamMode,
      setAutoNext,
      setTheme,
      updateSettings,
      loadSettings,
    ]
  );

  return (
    <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>
  );
}

export function useUserSettingsContext() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("useUserSettings must be used within UserSettingsProvider");
  }
  return context;
}
