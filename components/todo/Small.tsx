// components/todo/Small.tsx
import { Pressable, Text, View } from "react-native";

export function Badge({ text }: { text: string }) {
  return (
    <View
      style={{
        paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999,
        backgroundColor: "#f0f0f0", marginRight: 6, marginBottom: 6,
      }}
    >
      <Text style={{ fontSize: 11, color: "#333" }}>{text}</Text>
    </View>
  );
}

export function Btn({
  onPress, label, danger, disabled,
}: { onPress?: () => void; label: string; danger?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={{
        paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
        backgroundColor: disabled ? "#ddd" : danger ? "#fee" : "#eee",
      }}
    >
      <Text style={{ color: danger ? "#b00" : "#111" }}>{label}</Text>
    </Pressable>
  );
}
