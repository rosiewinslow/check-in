import { useMemo, useState, useRef } from "react";
import { useEffect } from "react";
import { FlatList, KeyboardAvoidingView, Platform, View } from "react-native";
import { useTodoStore } from "../../store/useTodoStore";
import { useDiaryStore, toDateKey } from "../../store/useDiaryStore";
import DayCalendar from "../../components/dashboard/DayCalendar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DiaryCard from "../../components/dashboard/DiaryCard";
import TodoItem from "../../components/dashboard/TodoItem";
import EmptyState from "../../components/dashboard/EmptyState";
import useKeyboardAutoScroll from "../../hooks/useKeyboardAutoScroll";
import type { Todo } from "../../types"; 

export default function DashboardScreen() {
  const today = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState(toDateKey(today));

  const { todos } = useTodoStore();
  const { diaries, setDiary, removeDiary } = useDiaryStore();

//   //대시보드 진입 시 서버 데이터 불러오기
//   const { hydrateFromServer } = useTodoStore();
//   useEffect(() => { hydrateFromServer().catch(()=>{}); }, [hydrateFromServer]);
//  //변경이 생길떄 주기적으로 서버에 밀어넣기
//   const { syncUp } = useTodoStore();
//   useEffect(() => {
//   const t = setInterval(() => { syncUp().catch(()=>{}); }, 8000);
//   return () => clearInterval(t);
//   }, [syncUp]);


  const listRef = useRef<FlatList>(null);
  const onDiaryFocus = useKeyboardAutoScroll(listRef); // 포커스 시 스크롤

  const dayTodos = useMemo(() => {
    // 혹시 과거 데이터에 date가 비어있으면 createdAt으로 보정(임시 호환)
    const normalizeDate = (t: Todo) =>
      t.date && t.date.length === 10 ? t.date : toDateKey(new Date(t.createdAt));

    const isDone = (t: Todo) => t.progress >= 100 || !!t.completedAt;

    return [...todos]
      .filter((t) => normalizeDate(t) === selected)
      .sort((a, b) =>
        Number(isDone(a)) - Number(isDone(b)) ||
        (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) ||
        b.createdAt - a.createdAt
      );
  }, [todos, selected]);
  

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: undefined })}>
      <FlatList
        ref={listRef}
        data={dayTodos}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={
          <View>
            <DayCalendar selected={selected} onSelect={setSelected} diaries={diaries} />
            <DashboardHeader selected={selected} todoCount={dayTodos.length} />
          </View>
        }
        ListFooterComponent={
          <DiaryCard
            selected={selected}
            diary={diaries[selected]}
            onFocusInput={onDiaryFocus}
            onSave={(text) => setDiary(selected, text)}
            onDelete={() => removeDiary(selected)}
          />
        }
        contentContainerStyle={{ paddingBottom: 12 }}
        renderItem={({ item }) => <TodoItem item={item} />}
        ListEmptyComponent={<EmptyState text="이 날짜에 투두 기록이 없어요." />}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}
