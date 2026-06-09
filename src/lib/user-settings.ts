import { DEFAULT_USER_SETTINGS, type AppTheme, type UserSettings } from "@/types/user";

export function parseUserSettings(raw: unknown): UserSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_USER_SETTINGS;
  }

  const value = raw as Record<string, unknown>;

  return {
    examMode: value.examMode === true,
    autoNext: value.autoNext === true,
    theme: value.theme === "moon" ? "moon" : "sun",
  };
}

export function mergeUserSettings(
  current: UserSettings,
  patch: Partial<UserSettings>
): UserSettings {
  return {
    examMode: patch.examMode ?? current.examMode,
    autoNext: patch.autoNext ?? current.autoNext,
    theme: patch.theme ?? current.theme,
  };
}

export function isAppTheme(value: unknown): value is AppTheme {
  return value === "sun" || value === "moon";
}
