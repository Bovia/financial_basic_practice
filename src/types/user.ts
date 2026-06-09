export type AppTheme = "sun" | "moon";

export type UserSettings = {
  examMode: boolean;
  autoNext: boolean;
  theme: AppTheme;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  examMode: false,
  autoNext: false,
  theme: "sun",
};
