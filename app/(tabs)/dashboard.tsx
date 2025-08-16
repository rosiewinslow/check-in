import { useMemo, useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView,
  Platform, Keyboard, NativeSyntheticEvent, TextInputFocusEventData
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useTodoStore } from "../../store/useTodoStore";
import { useDiaryStore, toDateKey } from "../../store/useDiaryStore";

export default function DashboardScreen() {
  const today = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState(toDateKey(today));

  const { todos } = useTodoStore();
  const { diaries, setDiary, removeDiary } = useDiaryStore();

  // 키보드 열릴 때 리스트 끝으로 스크롤
  const listRef = useRef<FlatList>(null);
  const onDiaryFocus = (_e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  // 선택 날짜의 투두(읽기용)
  const dayTodos = useMemo(() => {
    return [...todos]
      .filter(t => toDateKey(new Date(t.createdAt)) === selected)
      .sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt);
  }, [todos, selected]);

  // 캘린더 선택 표시
  const marked = useMemo(() => {
    const m: any = {};
    m[selected] = { selected: true, selectedColor: "#111", selectedTextColor: "white" };
    return m;
  }, [selected]);

  const diaryText = diaries[selected]?.text ?? "";
  const [draft, setDraft] = useState(diaryText);
  useEffect(() => setDraft(diaryText), [diaryText, selected]);

  // 헤더 컴포넌트: 캘린더 + 날짜 타이틀 + 투두 개수
  const ListHeader = (
    <>
      <Calendar
        firstDay={1}
        markedDates={marked}
        onDayPress={(d) => setSelected(d.dateString)}
        style={{ borderBottomWidth: 1, borderColor: "#eee" }}
        theme={{
          textDayFontWeight: "600",
          textMonthFontWeight: "700",
          arrowColor: "#111",
        }}
        dayComponent={({ date, state }) => {
          const isSelected = date?.dateString === selected;
          const hasDiary = !!diaries[date?.dateString ?? ""];
          return (
            <Pressable onPress={() => setSelected(date!.dateString!)} style={{ paddingVertical: 6 }}>
              <View
                style={{
                  width: 40, height: 40, borderRadius: 8,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: isSelected ? "#111" : "transparent",
                }}
              >
                <Text
                  style={{
                    color: state === "disabled" ? "#ccc" : isSelected ? "white" : "#111",
                    fontWeight: "600",
                  }}
                >
                  {date?.day}
                </Text>
              </View>
              {/* 일기 있는 날 하트 */}
              {hasDiary ? (
                <Text style={{ textAlign: "center", marginTop: 2 }}>♥</Text>
              ) : (
                <View style={{ height: 18 }} />
              )}
            </Pressable>
          );
        }}
      />

      <View style={{ padding: 12, borderBottomWidth: 1, borderColor: "#f0f0f0" }}>
        <Text style={{ fontSize: 16, fontWeight: "700" }}>{selected} 기록</Text>
        <Text style={{ color: "#666", marginTop: 6 }}>투두 {dayTodos.length}개</Text>
      </View>
    </>
  );

  // 푸터 컴포넌트: 일기 입력 + 저장/삭제 버튼 (버튼은 입력창 아래에 고정)
  const ListFooter = (
    <View style={{ padding: 12, borderTopWidth: 1, borderColor: "#eee", gap: 8 }}>
      <Text style={{ fontWeight: "700" }}>일기</Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onFocus={onDiaryFocus}
        placeholder="오늘 있었던 일, 감정, 메모 등을 적어보세요"
        multiline
        style={{
          minHeight: 120,
          borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
          paddingHorizontal: 12, paddingVertical: 10,
          textAlignVertical: "top",
        }}
      />

      <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
        {diaryText ? (
          <Pressable
            onPress={() => { removeDiary(selected); Keyboard.dismiss(); }}
            style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#fee" }}
          >
            <Text style={{ color: "#b00", fontWeight: "600" }}>삭제</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => { setDiary(selected, draft); Keyboard.dismiss(); }}
          style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: "#111" }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {diaryText ? "수정 저장" : "작성 저장"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <FlatList
        ref={listRef}
        data={dayTodos}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={{ paddingBottom: 12 }}
        renderItem={({ item }) => (
          <View
            style={{
              marginHorizontal: 12, marginTop: 8, padding: 12,
              borderWidth: 1, borderColor: "#eee", borderRadius: 10,
              backgroundColor: item.done ? "#f7f7f7" : "white",
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                textDecorationLine: item.done ? "line-through" : "none",
              }}
            >
              {item.title}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: "#999", textAlign: "center", marginTop: 16 }}>
            이 날짜에 투두 기록이 없어요.
          </Text>
        }
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}
