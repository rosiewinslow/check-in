// components/habits/HabitRow.tsx
import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { toLocalDateKey } from "../../hooks/useLocalDate";

function Tag({
  onPress,
  text,
  danger,
}: {
  onPress: () => void;
  text: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: danger ? "#fee" : "#eee",
      }}
    >
      <Text style={{ color: danger ? "#b00" : "#111", fontSize: 12 }}>{text}</Text>
    </Pressable>
  );
}

type Props = {
  habitId: string;
  name: string;
  color: string;
  days: Date[];
  checks: Record<string, boolean>;
  onToggle: (dateKey: string) => void;
  onRename: (v: string) => void;
  onRemove: () => void;
  cellWidth: number;
  nameColWidth: number;
};

function HabitRowBase({
  habitId,
  name,
  color,
  days,
  checks,
  onToggle,
  onRename,
  onRemove,
  cellWidth,
  nameColWidth,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = useCallback(() => {
    const v = draft.trim();
    if (v && v !== name) onRename(v);
    setEditing(false);
  }, [draft, name, onRename]);

  const dayCells = useMemo(
    () =>
      days.map((d, i) => {
        const dk = toLocalDateKey(d);
        const checked = !!checks[`${habitId}:${dk}`];
        const bg = checked ? `${color}22` : "transparent"; // #RRGGBB + AA

        return (
          <Pressable
            key={dk}
            onPress={() => onToggle(dk)}
            hitSlop={10}
            style={{
              width: cellWidth,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderLeftWidth: i === 0 ? 0 : 1,
              borderColor: "#eee",
              backgroundColor: bg,
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: checked ? color : "#ccc",
                backgroundColor: checked ? color : "transparent",
              }}
            />
          </Pressable>
        );
      }),
    [days, checks, habitId, cellWidth, color, onToggle]
  );

  return (
    <View style={{ flexDirection: "row", alignItems: "stretch" }}>
      <View
        style={{
          width: nameColWidth,
          paddingVertical: 8,
          paddingHorizontal: 8,
          borderBottomWidth: 1,
          borderColor: "#eee",
          gap: 6,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: color,
              marginTop: 4,
            }}
          />
          {editing ? (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onBlur={commit}
              onSubmitEditing={commit}
              autoFocus
              multiline
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 6,
              }}
            />
          ) : (
            <Text style={{ fontWeight: "600", flexShrink: 1 }}>{name}</Text>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
          <Tag onPress={() => setEditing((v) => !v)} text={editing ? "완료" : "수정"} />
          <Tag onPress={onRemove} text="삭제" danger />
        </View>
      </View>

      {/* 오른쪽: 7일 셀 */}
      {dayCells}
    </View>
  );
}

const HabitRow = React.memo(HabitRowBase);
export default HabitRow;
