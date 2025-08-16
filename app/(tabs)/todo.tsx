import { useState, useMemo } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import Slider from "@react-native-community/slider";
import { useTodoStore } from "../../store/useTodoStore";

export default function TodoScreen() {
  const { todos, add, toggle, remove, clearDone, rename, setProgress } = useTodoStore();
  const [text, setText] = useState("");

  const onAdd = () => {
    const v = text.trim();
    if (!v) return;
    add(v);
    setText("");
  };

  // 완료된 항목을 아래로: done=false가 위, 생성일 내림차순
  const sorted = useMemo(
    () =>
      [...todos].sort(
        (a, b) =>
          Number(a.done) - Number(b.done) || b.createdAt - a.createdAt
      ),
    [todos]
  );

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      {/* 입력 */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="할 일 입력"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
          returnKeyType="done"
          onSubmitEditing={onAdd}
        />
        <Pressable
          onPress={onAdd}
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

      {/* 리스트 */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
        renderItem={({ item }) => (
          <TodoRow
            id={item.id}
            title={item.title}
            done={item.done}
            progress={item.progress}
            onToggle={() => toggle(item.id)}
            onRemove={() => remove(item.id)}
            onRename={(t) => rename(item.id, t)}
            onProgress={(p) => setProgress(item.id, p)}
          />
        )}
        ListEmptyComponent={
          <Text style={{ color: "#666", textAlign: "center", marginTop: 24 }}>
            아직 항목이 없어요. 위에서 추가해봐!
          </Text>
        }
      />

      <Pressable
        onPress={clearDone}
        style={{
          alignSelf: "flex-end",
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <Text>완료 항목 지우기</Text>
      </Pressable>
    </View>
  );
}

function TodoRow({
  id,
  title,
  done,
  progress,
  onToggle,
  onRemove,
  onRename,
  onProgress,
}: {
  id: string;
  title: string;
  done: boolean;
  progress: number;      // 0~100
  onToggle: () => void;
  onRemove: () => void;
  onRename: (t: string) => void;
  onProgress: (p: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== title) onRename(v);
    setEditing(false);
  };

  const statusLabel = done
    ? "되돌리기"
    : progress === 0
    ? "완료"
    : progress < 100
    ? "진행중"
    : "완료"; // 100%면 자동 완료되므로 보일 일 거의 없음

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 10,
        padding: 12,
        gap: 10,
        backgroundColor: done ? "#f5f5f5" : "white",
      }}
    >
      {/* 제목 */}
      {editing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          autoFocus
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        />
      ) : (
        <Text
          style={{
            fontSize: 16,
            textDecorationLine: done ? "line-through" : "none",
          }}
        >
          {title}
        </Text>
      )}

      {/* 진행 바 + 퍼센트 */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: "#666" }}>
            진행률
          </Text>
          <Text style={{ fontSize: 12, color: "#666" }}>{progress}%</Text>
        </View>
        <Slider
          value={progress}
          minimumValue={0}
          maximumValue={100}
          step={1}
          onValueChange={onProgress}       // 슬라이드 중 실시간 업데이트
          // onSlidingComplete={onProgress} // 실시간이 부담스러우면 이걸로 교체
        />
      </View>

      {/* 버튼들 */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Btn onPress={onToggle} label={statusLabel} />
        <Btn onPress={() => setEditing((v) => !v)} label={editing ? "완료" : "수정"} />
        <Btn onPress={onRemove} label="삭제" danger />
      </View>
    </View>
  );
}

function Btn({
  onPress,
  label,
  danger,
}: {
  onPress: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: danger ? "#fee" : "#eee",
      }}
    >
      <Text style={{ color: danger ? "#b00" : "#111" }}>{label}</Text>
    </Pressable>
  );
}
