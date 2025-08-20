// components/todo/DayNav.tsx
import { View, Text, Pressable } from "react-native";

export default function DayNav({
  label, isPast, onPrev, onNext, rightExtra,
}: {
  label: string;
  isPast: boolean;
  onPrev: () => void;
  onNext: () => void;
  rightExtra?: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={onPrev}><Text>{"◀ 이전"}</Text></Pressable>
        <Text style={{ fontWeight: "700" }}>{label}{isPast ? " (읽기전용)" : ""}</Text>
        <Pressable onPress={onNext}><Text>{"다음 ▶"}</Text></Pressable>
      </View>
      {rightExtra ? <View style={{ marginTop: 8, alignItems: "flex-end" }}>{rightExtra}</View> : null}
    </View>
  );
}
