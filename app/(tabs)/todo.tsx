// app/(tabs)/todo.tsx
import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useTodoStore } from "../../store/useTodoStore";
import DayNav from "../../components/todo/DayNav";
import TodoRow from "../../components/todo/TodoRow";
import { todayKey, useDateKey } from "../../hooks/useKstDate";

export default function TodoScreen() {
  const router = useRouter();
  const {
    todos, add, addForDate, remove, rename, setProgress,
    rolloverTo, isReadOnly,
  } = useTodoStore() as any;

  const [text, setText] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateKey = useDateKey(selectedDate);
  const isPast = dateKey < todayKey();
  const isToday = dateKey === todayKey();

  const onAdd = () => {
    const v = text.trim();
    if (!v) return;
    if (typeof addForDate === "function") addForDate(dateKey, v);
    else add(v);
    setText("");
  };

  const moveDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  // 해당 날짜 투두만 (date 키 기준)
  const daily = useMemo(() => {
    const list = todos.filter((t: any) => t.date === dateKey);
    return list.sort(
      (a: any, b: any) =>
        Number((a.progress ?? 0) >= 100) - Number((b.progress ?? 0) >= 100) ||
        (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) ||
        b.createdAt - a.createdAt
    );
  }, [todos, dateKey]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <DayNav
        label={dateKey}
        isPast={isPast}
        onPrev={() => moveDay(-1)}
        onNext={() => moveDay(+1)}
      />

      {/* 입력 */}
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="할 일 입력"
          editable={!isPast}
          style={{
            flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8,
            paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, opacity: isPast ? 0.5 : 1,
          }}
          returnKeyType="done"
          onSubmitEditing={!isPast ? onAdd : undefined}
        />
        <Pressable
          onPress={!isPast ? onAdd : undefined}
          style={{
            backgroundColor: isPast ? "#999" : "#111",
            paddingHorizontal: 16, justifyContent: "center", borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>추가</Text>
        </Pressable>
      </View>

      {/* 오늘일 때만 어제 미완료 가져오기 버튼 */}
      {isToday && (
        <View style={{ alignItems: "flex-end", marginBottom: 12 }}>
          <Pressable
            onPress={() => rolloverTo(todayKey())}
            style={{
              backgroundColor: "#eee",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <Text style={{ fontSize: 12, color: "#333" }}>어제 미완료 가져오기</Text>
          </Pressable>
        </View>
      )}

      {/* 리스트 */}
      <FlatList
        data={daily}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => {
          const lockedForEdit = isPast;
          return (
            <TodoRow
              id={item.id}
              title={item.title}
              done={item.done}
              progress={item.progress}
              dueAt={item.dueAt}
              notifyAt={item.notifyAt}
              note={item.note}
              locked={lockedForEdit}
              onRemove={!isPast ? () => remove(item.id) : undefined}
              onRename={!lockedForEdit ? (t: string) => rename(item.id, t) : undefined}
              onProgress={!lockedForEdit ? (p: number) => setProgress(item.id, p) : undefined}
              onOpenDetail={() =>
                router.push({ pathname: "/(modal)/todo-detail", params: { id: item.id } })
              }
            />
          );
        }}
        ListEmptyComponent={() => (
          <Text style={{ color: "#666", textAlign: "center", marginTop: 24 }}>
            {`아직 항목이 없어요. ${dateKey} 할 일을 추가해주세요!`}
          </Text>
        )}
      />
    </View>
  );
}
