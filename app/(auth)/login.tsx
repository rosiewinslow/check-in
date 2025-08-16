import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function AuthScreen() {
  const router = useRouter();
  return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center", gap: 16, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800" }}>로그인</Text>

      <Pressable
        onPress={() => {/* TODO: 구글 OAuth 시작 */}}
        style={{ backgroundColor: "#111", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Google로 계속하기</Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/(tabs)/dashboard")}
        style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
        <Text>건너뛰기 (임시로 대시보드 이동)</Text>
      </Pressable>
    </View>
  );
}
