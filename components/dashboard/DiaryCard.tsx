import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Keyboard } from "react-native";

type Diary = { text?: string; updatedAt?: number };
type Props = {
  selected: string;
  diary?: Diary;
  onSave: (text: string) => void;
  onDelete: () => void;
  onFocusInput: () => void;
};

type Mode = "read" | "edit";

export default function DiaryCard({ selected, diary, onSave, onDelete, onFocusInput }: Props) {
  const diaryText = diary?.text ?? "";
  const [draft, setDraft] = useState(diaryText);
  const [mode, setMode] = useState<Mode>("read");
  const isEmpty = useMemo(() => !diaryText.trim(), [diaryText]);

  useEffect(() => { setDraft(diaryText); setMode("read"); }, [diaryText, selected]);

  const handleSave = () => { onSave(draft); setMode("read"); Keyboard.dismiss(); };
  const handleCancel = () => { setDraft(diaryText); setMode("read"); Keyboard.dismiss(); };
  const handleDelete = () => { onDelete(); setDraft(""); setMode("read"); Keyboard.dismiss(); };

  return (
    <View style={{ padding: 12, borderTopWidth: 1, borderColor: "#eee" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ fontWeight: "700" }}>일기</Text>
        {mode === "read" && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {!!diaryText && (
              <Pressable onPress={handleDelete} style={({ pressed }) => ({ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#FEE2E2", opacity: pressed ? 0.8 : 1 })}>
                <Text style={{ color: "#B00020", fontWeight: "600" }}>삭제</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => { setMode("edit"); setTimeout(onFocusInput, 0); }}
              style={({ pressed }) => ({ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#cadafdff", opacity: pressed ? 0.8 : 1 })}
            >
              <Text style={{ color: "#346fefff", fontWeight: "600" }}>{isEmpty ? "작성" : "수정"}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {mode === "read" ? (
        isEmpty ? (
          <Pressable
            onPress={() => { setMode("edit"); setTimeout(onFocusInput, 0); }}
            style={{ paddingVertical: 18, alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderColor: "#E5E7EB", borderRadius: 12, backgroundColor: "#FAFAFA" }}
          >
            <Text style={{ color: "#9CA3AF" }}>오늘 하루를 간단히 기록해보세요.</Text>
          </Pressable>
        ) : (
          <View style={{ backgroundColor: "#FAFAFA", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#EFEFEF" }}>
            <Text style={{ fontSize: 15, lineHeight: 22 }}>{diaryText}</Text>
            {!!diary?.updatedAt && (
              <Text style={{ color: "#AAA", fontSize: 12, marginTop: 8 }}>
                저장됨 · {new Date(diary.updatedAt).toLocaleTimeString()}
              </Text>
            )}
          </View>
        )
      ) : (
        <>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onFocus={onFocusInput}
            placeholder="오늘 있었던 일, 감정, 메모 등을 적어보세요"
            multiline
            autoFocus
            style={{ minHeight: 120, borderWidth: 1, borderColor: "#ddd", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, textAlignVertical: "top", backgroundColor: "#FFFFFF", fontSize: 15, lineHeight: 22 }}
          />
          <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            <Pressable onPress={handleCancel} style={({ pressed }) => ({ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", opacity: pressed ? 0.7 : 1 })}>
              <Text>취소</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={({ pressed }) => ({ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#111", opacity: pressed ? 0.8 : 1 })}>
              <Text style={{ color: "white", fontWeight: "700" }}>{diaryText ? "수정 저장" : "작성 저장"}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
