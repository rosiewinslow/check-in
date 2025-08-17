// app/(tabs)/todo.tsx
import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useTodoStore } from "../../store/useTodoStore";

const toKstDateKey = (d = new Date()) => {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
};
const todayKey = () => toKstDateKey(new Date());

export default function TodoScreen() {


  // app/(tabs)/todo.tsx — TodoScreen 컴포넌트 내부 테스트용 코드

// 🧪 ROLLOVER TEST: 내일로 강제 이월 + 화면 이동 (개발용)
const jumpOneDayAndRollover = () => {
  // 선택한 날짜의 다음날 키
  const d = new Date(selectedDate);
  d.setDate(d.getDate() + 1);
  const nextKey = toKstDateKey(d);

  // 1) 다음날 기준으로 이월(복제) 생성
  //    - store의 롤오버 로직은 인자로 받은 dateKey를 "기준일"로 사용함
  rolloverTo(nextKey);

  // 2) 화면도 다음날로 이동해서 결과 즉시 확인
  setSelectedDate(d);
};
// 🧪 ROLLOVER TEST END



  const router = useRouter();
  const { todos, add, addForDate, remove, rename, setProgress, rolloverTo, isReadOnly } =
    useTodoStore() as any;

  const [text, setText] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateKey = useMemo(() => toKstDateKey(selectedDate), [selectedDate]);
  const isPast = dateKey < todayKey();

  // 오늘 페이지 진입 시 미완료 스냅샷 자동 복제(이월)
  useEffect(() => {
    const today = todayKey();
    if (dateKey === today) rolloverTo(today);
  }, [dateKey, rolloverTo]);

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

  // 해당 날짜 스냅샷만 표시
  const daily = useMemo(() => {
    const list = todos.filter((t: any) => t.date === dateKey);
    return list.sort(
      (a: any, b: any) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt
    );
  }, [todos, dateKey]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* 날짜 네비 */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Pressable onPress={() => moveDay(-1)}>
          <Text>{"◀ 이전"}</Text>
        </Pressable>
        <Text style={{ fontWeight: "700" }}>
          {dateKey}{isPast ? " (읽기전용)" : ""}
        </Text>
        <Pressable onPress={() => moveDay(+1)}>
          <Text>{"다음 ▶"}</Text>
        </Pressable>
      </View>


{/* 날짜 네비 아래 (개발용 테스트 버튼) */}
{__DEV__ && (
  <Pressable
    onPress={jumpOneDayAndRollover}
    style={{ alignSelf: "flex-end", backgroundColor: "#f0f0f0", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 8 }}
  >
    <Text>내일로 이월(테스트)</Text>
  </Pressable>
)}



      {/* 입력 */}
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="할 일 입력"
          editable={!isPast}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginRight: 8,
            opacity: isPast ? 0.5 : 1,
          }}
          returnKeyType="done"
          onSubmitEditing={!isPast ? onAdd : undefined}
        />
        <Pressable
          onPress={!isPast ? onAdd : undefined}
          style={{
            backgroundColor: isPast ? "#999" : "#111",
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
              onRename={!locked ? (t) => rename(item.id, t) : undefined}
              onProgress={!locked ? (p) => setProgress(item.id, p) : undefined}
              onOpenDetail={() =>
                router.push({ pathname: "/(modal)/todo-detail", params: { id: item.id } })
              }
            />
          );
        }}
        ListEmptyComponent={() => (
          <Text style={{ color: "#666", textAlign: "center", marginTop: 24 }}>
            {"아직 항목이 없어요. "}{dateKey}{" 할 일을 추가해주세요!"}
          </Text>
        )}
      />
    </View>
  );
}

function TodoRow({
  id, title, done, progress, onRemove, onRename, onProgress, onOpenDetail,
  dueAt, notifyAt, note, locked,
}: {
  id: string;
  title: string;
  done: boolean;
  progress: number;
  onRemove?: () => void;
  onRename?: (t: string) => void;
  onProgress?: (p: number) => void;
  onOpenDetail: () => void;
  dueAt?: number;
  notifyAt?: number;
  note?: string;
  locked: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== title && onRename) onRename(v);
    setEditing(false);
  };

  const dueText = dueAt ? new Date(dueAt).toLocaleString() : "";
  const notiText = notifyAt ? new Date(notifyAt).toLocaleTimeString() : "";

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 10,
        padding: 12,
        backgroundColor: done ? "#f5f5f5" : "white",
        opacity: locked ? 0.85 : 1,
      }}
    >
      {/* 제목 */}
      {editing && !locked ? (
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
            marginBottom: 10,
          }}
        />
      ) : (
        <Text
          style={{
            fontSize: 16,
            textDecorationLine: done ? "line-through" : "none",
            marginBottom: 6,
          }}
        >
          {title}
        </Text>
      )}

      {/* 배지들 */}
      {(dueText || notiText || note || locked) ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
          {dueText ? <Badge text={`마감 ${dueText}`} /> : null}
          {notiText ? <Badge text={`⏰ ${notiText}`} /> : null}
          {note ? <Badge text={"메모 있음"} /> : null}
          {locked ? <Badge text={"읽기전용"} /> : null}
        </View>
      ) : null}

      {/* 진행 바 + 퍼센트 */}
      <View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: "#666" }}>진행률</Text>
          <Text style={{ fontSize: 12, color: "#666" }}>{`${progress}%`}</Text>
        </View>
        <Slider
          value={progress}
          minimumValue={0}
          maximumValue={100}
          step={1}
          disabled={!onProgress}
          onValueChange={onProgress || (() => {})}
        />
      </View>

      {/* 버튼들 */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
        <Btn onPress={onOpenDetail} label="자세히" />
        <View style={{ width: 8 }} />
        <Btn onPress={onRemove} label="삭제" danger disabled={!onRemove} />
        <View style={{ width: 8 }} />
        <Btn onPress={() => setEditing((v) => !v)} label={editing ? "완료" : "수정"} disabled={locked} />
      </View>
    </View>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View
      style={{
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 999,
        backgroundColor: "#f0f0f0",
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      <Text style={{ fontSize: 11, color: "#333" }}>{text}</Text>
    </View>
  );
}

function Btn({
  onPress,
  label,
  danger,
  disabled,
}: {
  onPress?: () => void;
  label: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: disabled ? "#ddd" : danger ? "#fee" : "#eee",
      }}
    >
      <Text style={{ color: danger ? "#b00" : "#111" }}>{label}</Text>
    </Pressable>
  );
}
