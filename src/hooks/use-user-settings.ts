"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "@/types/user";

export function useUserSettings() {
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

      const previous = settings;
      const optimistic = { ...settings, ...patch };
      setSettings(optimistic);
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
    [username, settings]
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

  return {
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
  };
}
