import { DEFAULT_USER_SETTINGS, type UserSettings } from "@/types/user";

export function parseUserSettings(raw: unknown): UserSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_USER_SETTINGS;
  }

  const value = raw as Record<string, unknown>;

  return {
    examMode: value.examMode === true,
    autoNext: value.autoNext === true,
  };
}

export function mergeUserSettings(
  current: UserSettings,
  patch: Partial<UserSettings>
): UserSettings {
  return {
    examMode: patch.examMode ?? current.examMode,
    autoNext: patch.autoNext ?? current.autoNext,
  };
}
