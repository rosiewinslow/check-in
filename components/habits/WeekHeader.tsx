// components/habits/WeekHeader.tsx
import { View, Text } from "react-native";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export default function WeekHeader({
  nameColWidth,
  cellWidth,
}: {
  nameColWidth: number;
  cellWidth: number;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {/* 왼쪽 습관명 자리(비움) */}
      <View style={{ width: nameColWidth }} />
      {DAY_LABELS.map((label, i) => (
        <View
          key={label + i}
          style={{
            width: cellWidth,
            paddingVertical: 6,
            alignItems: "center",
            borderBottomWidth: 1,
            borderColor: "#eee",
          }}
        >
          <Text style={{ fontWeight: "700" }}>{label}</Text>
        </View>
      ))}
    </View>
  );
}
