// components/time/DaySwitcher.tsx
import { View, Text, Pressable } from "react-native";

export default function DaySwitcher({
  label,
  onPrev,
  onNext,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <Pressable
        onPress={onPrev}
        style={{
          paddingVertical: 6, paddingHorizontal: 12,
          borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
        }}
      >
        <Text style={{ fontWeight: "600" }}>⟨ 지난날</Text>
      </Pressable>

      <Text style={{ fontSize: 16, fontWeight: "700" }}>{label}</Text>

      <Pressable
        onPress={onNext}
        style={{
          paddingVertical: 6, paddingHorizontal: 12,
          borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
        }}
      >
        <Text style={{ fontWeight: "600" }}>다음날 ⟩</Text>
      </Pressable>
    </View>
  );
}
