import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark";

type SettingsState = {
  nickname: string;
  theme: ThemeMode;
  pushEnabled: boolean;         // 전체 푸시 on/off
  dailyReminderTime: string | null; // "HH:mm" (예: "09:00") or null
  providers: { google?: boolean };  // 계정 연동 표시용
  setNickname: (n: string) => void;
  setTheme: (t: ThemeMode) => void;
  setPushEnabled: (v: boolean) => void;
  setDailyReminderTime: (hhmm: string | null) => void;
  setProviderLinked: (p: "google", v: boolean) => void;
  resetAll: () => void;         // 탈퇴/로그아웃 대비 로컬 초기화
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      nickname: "",
      theme: "light",
      pushEnabled: false,
      dailyReminderTime: null,
      providers: {},
      setNickname: (nickname) => set({ nickname }),
      setTheme: (theme) => set({ theme }),
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      setDailyReminderTime: (dailyReminderTime) => set({ dailyReminderTime }),
      setProviderLinked: (p, v) =>
        set((s) => ({ providers: { ...s.providers, [p]: v } })),
      resetAll: () => set({
        nickname: "",
        theme: "light",
        pushEnabled: false,
        dailyReminderTime: null,
        providers: {},
      }),
    }),
    {
      name: "settings-v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
