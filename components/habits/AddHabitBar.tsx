// components/habits/AddHabitBar.tsx
import { useState, useCallback } from "react";
import { View, TextInput, Pressable, Text } from "react-native";

export default function AddHabitBar({ onAdd }: { onAdd: (name: string) => void }) {
  const [text, setText] = useState("");
  const commit = useCallback(() => {
    const v = text.trim();
    if (!v) return;
    onAdd(v);
    setText("");
  }, [text, onAdd]);

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="습관 이름 (예: 아침 물 500ml)"
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
        returnKeyType="done"
        onSubmitEditing={commit}
      />
      <Pressable
        onPress={commit}
        style={{
          backgroundColor: "#111",
          paddingHorizontal: 16,
          justifyContent: "center",
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>추가</Text>
      </Pressable>
    </View>
  );
}
