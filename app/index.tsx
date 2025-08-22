// app/index.tsx
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function CheckInScreen() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text
        style={{
          fontSize: 36,
          fontWeight: "800",
          color: "#5A4630", // 진한 브라운 (우드와 조화)
          marginBottom: 28,
          letterSpacing: 0.5,
        }}
      >
        Check-in
      </Text>

      <Pressable
        onPress={() => router.replace("/dashboard")} 
        style={({ pressed }) => ({
          backgroundColor: pressed ? "#E6DAC8" : "#F4F1EA", // 크림/포슬린 톤
          paddingVertical: 16,
          paddingHorizontal: 40,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: "#DCC9A7", // 샴페인 베일 계열 보더
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        })}
      >
        <Text style={{ color: "#5A4630", fontSize: 18, fontWeight: "700" }}>
          Enter
        </Text>
      </Pressable>
    </View>
  );
}
