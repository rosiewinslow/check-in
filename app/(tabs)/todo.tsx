// app/(tabs)/todo.tsx
import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useTodoStore } from "../../store/useTodoStore";
import DayNav from "../../components/todo/DayNav";
import TodoRow from "../../components/todo/TodoRow";
import { toKstDateKey, todayKey, useDateKey } from "../../hooks/useKstDate";

export default function TodoScreen() {
  const router = useRouter();
  const {
    todos, add, addForDate, remove, rename, setProgress,
    rolloverTo, isReadOnly, hydrateFromServer, syncUp,
  } = useTodoStore() as any;

  const [text, setText] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateKey = useDateKey(selectedDate);
  const isPast = dateKey < todayKey();

  // ✅ 오늘 입장 시 미완료 스냅샷 자동 이월
  useEffect(() => {
    const today = todayKey();
    if (dateKey === today) rolloverTo(today);
  }, [dateKey, rolloverTo]);

  // ✅ 서버 동기화(유저별 분기는 RLS가 보장)
  useEffect(() => { hydrateFromServer?.().catch(()=>{}); }, [hydrateFromServer]);
  useEffect(() => {
    const t = setInterval(() => { syncUp?.().catch(()=>{}); }, 8000);
    return () => clearInterval(t);
  }, [syncUp]);

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

  // 해당 날짜 스냅샷만
  const daily = useMemo(() => {
    const list = todos.filter((t: any) => t.date === dateKey);
    return list.sort((a: any, b: any) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt);
  }, [todos, dateKey]);

  // 🧪 개발용: 내일로 강제 이월 + 이동
  const jumpOneDayAndRollover = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const nextKey = toKstDateKey(d);
    rolloverTo(nextKey);
    setSelectedDate(d);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <DayNav
        label={dateKey}
        isPast={isPast}
        onPrev={() => moveDay(-1)}
        onNext={() => moveDay(+1)}
        rightExtra={
          __DEV__ ? (
            <Pressable
              onPress={jumpOneDayAndRollover}
              style={{ backgroundColor: "#f0f0f0", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
            >
              <Text>내일로 이월(테스트)</Text>
            </Pressable>
          ) : undefined
        }
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

      {/* 리스트 */}
      <FlatList
        data={daily}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => {
          const locked = isReadOnly(item);
          return (
            <TodoRow
              id={item.id}
              title={item.title}
              done={item.done}
              progress={item.progress}
              dueAt={item.dueAt}
              notifyAt={item.notifyAt}
              note={item.note}
              locked={locked}
              onRemove={!locked ? () => remove(item.id) : undefined}
              onRename={!locked ? (t: string) => rename(item.id, t) : undefined}
              onProgress={!locked ? (p: number) => setProgress(item.id, p) : undefined}
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
