"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Settings, X } from "lucide-react";
import { SettingSwitch } from "@/components/settings/setting-switch";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";

type UserSettingsDialogProps = {
  onExamModeChange?: (enabled: boolean) => void | Promise<void>;
  iconClassName?: string;
};

export function UserSettingsDialog({ onExamModeChange, iconClassName }: UserSettingsDialogProps) {
  const { examMode, autoNext, updating, setExamMode, updateSettings } = useUserSettings();

  async function handleExamModeChange(enabled: boolean) {
    if (onExamModeChange) {
      await onExamModeChange(enabled);
      return;
    }

    await setExamMode(enabled);
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors hover:bg-blue-200",
            iconClassName
          )}
          aria-label="练习设置"
        >
          <Settings className="h-5 w-5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-bold text-slate-900">练习设置</Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100">
              <X className="h-4 w-4" />
              <span className="sr-only">关闭</span>
            </Dialog.Close>
          </div>

          <div className="divide-y divide-slate-100">
            <SettingSwitch
              label="考试模式"
              description="开启后不揭晓答案，交卷后统一出分"
              checked={examMode}
              onChange={handleExamModeChange}
              disabled={updating}
            />
            <SettingSwitch
              label="自动下一题"
              description="答完当前题后自动跳转下一题"
              checked={autoNext}
              onChange={(checked) => void updateSettings({ autoNext: checked })}
              disabled={updating}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
