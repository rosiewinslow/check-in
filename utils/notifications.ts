// utils/notifications.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { SchedulableTriggerInputTypes } from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    // 최신 SDK 타입에 맞춘 필드
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensurePushPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;

  // ✅ iOS 옵션은 ios 블록 안에
  const req = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: false,
      allowBadge: false,
    },
  });

  return req.granted;
}

export async function scheduleDailyLocal(hhmm: string, body: string) {
  const [hour, minute] = hhmm.split(":").map(Number);

  // 필요시 identifier로 개별 취소하도록 변경 가능
  await Notifications.cancelAllScheduledNotificationsAsync();

  // ✅ DailyTriggerInput에는 repeats 없음 (매일 트리거 자체가 반복)
  const trigger: Notifications.DailyTriggerInput = {
      hour, minute,
      type: SchedulableTriggerInputTypes.DAILY
  };

  await Notifications.scheduleNotificationAsync({
    content: { title: "리마인드", body },
    trigger,
  });
}
