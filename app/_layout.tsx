// app/_layout.tsx
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../providers/AuthProvider";

function ProtectedLayout() {
  const { loading, userId } = useAuth();
  const segments = useSegments(); // 예: ["(auth)","sign-in"] 또는 ["(tabs)","dashboard"]
  const router = useRouter();

  const inAuthGroup = segments[0] === "(auth)";

  useEffect(() => {
    if (loading) return;

    // 비로그인 상태 → (auth) 아니면 로그인 페이지로
    if (!userId && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
      return;
    }
    // 로그인 상태 → (auth) 안에 있으면 메인으로
    if (userId && inAuthGroup) {
      router.replace("/(tabs)/dashboard");
    }
  }, [loading, userId, inAuthGroup]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // 🚨 여기서 다른 네비게이터/Slot을 또 그리지 말고 "딱 하나의 Stack"만 반환
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProtectedLayout />
    </AuthProvider>
  );
}
