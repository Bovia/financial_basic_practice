"use client";

import { useEffect } from "react";
import { useUserSettings } from "@/hooks/use-user-settings";
import { DEFAULT_USER_SETTINGS } from "@/types/user";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, isReady } = useUserSettings();

  useEffect(() => {
    const nextTheme = isReady ? theme : DEFAULT_USER_SETTINGS.theme;
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, [theme, isReady]);

  return children;
}
