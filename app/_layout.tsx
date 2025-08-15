// 루트 레이아웃. 앱의 뼈대
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* 나중에 로그인, 모달 등 추가 가능 */}
      {/* <Stack.Screen name="(auth)/login" options={{ headerShown: false }} /> */}
      {/* <Stack.Screen name="(modal)/alert" options={{ presentation: "modal" }} /> */}
    </Stack>
  );
}
