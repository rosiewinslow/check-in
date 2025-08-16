import { useMemo, useState } from "react";
import {
  View, Text, TextInput, Pressable, FlatList, ScrollView,
} from "react-native";
import {
  useHabitStore,
  weekDays,
  toISO,
  mondayOf,
} from "../../store/useHabitStore";

export default function HabitsScreen() {
  const { habits, checks, addHabit, removeHabit, renameHabit, toggleCheck /*, clearWeek*/ } =
    useHabitStore();

  const [anchor, setAnchor] = useState(new Date()); // 기준일 (이번주: 오늘)
  const [newHabit, setNewHabit] = useState("");

  const days = useMemo(() => weekDays(anchor), [anchor]);
  const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];

  const fmtYYMMDD = (d: Date) => {
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
  };

  const titleRange = useMemo(() => {
    const mon = mondayOf(anchor);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return `${fmtYYMMDD(mon)} ~ ${fmtYYMMDD(sun)}`;
  }, [anchor]);

  const goPrev = () => setAnchor((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
  const goNext = () => setAnchor((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
  // "이번주로" 버튼은 제거

  const onAddHabit = () => {
    const v = newHabit.trim();
    if (!v) return;
    addHabit(v);
    setNewHabit("");
  };

  const headerRow = (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {/* 좌측 상단 빈칸(습관명 자리) */}
      <View style={{ width: 160 }} />
      {dayLabels.map((label, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            paddingVertical: 8,
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

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      {/* 상단: 기간 + 주간 이동 버튼 같은 줄 */}
<View
  style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  }}
>
  <Pressable
    onPress={goPrev}
    style={{
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#ddd",
      backgroundColor: "white",
    }}
  >
    <Text style={{ fontWeight: "600" }}>⟨ 저번주</Text>
  </Pressable>

  <Text style={{ fontSize: 16, fontWeight: "700" }}>{titleRange}</Text>

  <Pressable
    onPress={goNext}
    style={{
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#ddd",
      backgroundColor: "white",
    }}
  >
    <Text style={{ fontWeight: "600" }}>다음주 ⟩</Text>
  </Pressable>
</View>


      {/* 습관 추가 */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={newHabit}
          onChangeText={setNewHabit}
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
          onSubmitEditing={onAddHabit}
        />
        <Pressable
          onPress={onAddHabit}
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

      {/* 매트릭스: 가로 스크롤 */}
      <ScrollView horizontal bounces={false}>
        <View style={{ minWidth: "100%", flex: 1 }}>
          {headerRow}

          {/* 행(습관) 리스트 */}
          <FlatList
            data={habits}
            keyExtractor={(h) => h.id}
            renderItem={({ item }) => (
              <HabitRow
                habitId={item.id}
                name={item.name}
                color={item.color}
                days={days}
                checks={checks}
                onToggle={(dateKey) => toggleCheck(item.id, dateKey)}
                onRename={(v) => renameHabit(item.id, v)}
                onRemove={() => removeHabit(item.id)}
              />
            )}
            ListEmptyComponent={
              <Text style={{ color: "#666", textAlign: "center", marginTop: 24 }}>
                아직 습관이 없어요. 위에서 추가해봐!
              </Text>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

function HabitRow({
  habitId,
  name,
  color,
  days,
  checks,
  onToggle,
  onRename,
  onRemove,
}: {
  habitId: string;
  name: string;
  color: string;
  days: Date[];
  checks: Record<string, boolean>;
  onToggle: (dateKey: string) => void;
  onRename: (v: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== name) onRename(v);
    setEditing(false);
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "stretch" }}>
      {/* 왼쪽: 습관명(멀티라인 래핑) + 액션 */}
      <View
        style={{
          width: 160,               // 넓게 잡아 겹침 방지
          paddingVertical: 10,
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
              multiline    // ✅ 줄바꿈 허용
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
            <Text style={{ fontWeight: "600", flexShrink: 1 }}>
              {/* ✅ Text는 기본적으로 래핑됨. flexShrink로 공간 확보 */}
              {name}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
          <Tag onPress={() => setEditing((v) => !v)} text={editing ? "완료" : "수정"} />
          <Tag onPress={onRemove} text="삭제" danger />
        </View>
      </View>

      {/* 오른쪽: 7일 셀 */}
      {days.map((d, i) => {
        const dk = toISO(d);
        const checked = !!checks[`${habitId}:${dk}`];
        return (
          <Pressable
            key={i}
            onPress={() => onToggle(dk)}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderLeftWidth: i === 0 ? 0 : 1,
              borderColor: "#eee",
              backgroundColor: checked ? color + "22" : "white",
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: checked ? color : "#ccc",
                backgroundColor: checked ? color : "transparent",
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function Seg({ onPress, text }: { onPress: () => void; text: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: "white",
      }}
    >
      <Text style={{ fontWeight: "600" }}>{text}</Text>
    </Pressable>
  );
}

function Divider() {
  return <View style={{ width: 1, backgroundColor: "#ddd" }} />;
}

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
