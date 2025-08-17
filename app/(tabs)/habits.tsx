import { useMemo, useState } from "react";
import {
  View, Text, TextInput, Pressable, FlatList, ScrollView,
} from "react-native";
import { Dimensions } from "react-native";
import {
  useHabitStore,
  weekDays,
  // toISO,
  mondayOf,
} from "../../store/useHabitStore";

// 로컬 자정 기준 YYYY-MM-DD
const toLocalDateKey = (d: Date) => {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function HabitsScreen() {
  const SCREEN_W = Dimensions.get("window").width;

  // 레이아웃 상수 (필요시 숫자만 조절)
  const PAGE_PADDING = 16;            // 상위 컨테이너 padding과 동일
  const NAME_COL_WIDTH = 140;         // 왼쪽 습관명 폭
  const HORIZONTAL_GAP = 0;           // 칸 사이 간격(현재 0)
  const INNER_W = SCREEN_W - PAGE_PADDING * 2 - NAME_COL_WIDTH - HORIZONTAL_GAP * 6;

  // ✅ 한 화면에 7칸 딱 맞게
  const CELL_W = Math.floor(INNER_W / 7);

  const { habits, checks, addHabit, removeHabit, renameHabit, toggleCheck } =
    useHabitStore();

  const [anchor, setAnchor] = useState(new Date()); 
  const [newHabit, setNewHabit] = useState("");

  // 로컬 자정으로 정규화
  const days = useMemo(
    () => weekDays(anchor).map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate())),
    [anchor]
  );
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

  const onAddHabit = () => {
    const v = newHabit.trim();
    if (!v) return;
    addHabit(v);
    setNewHabit("");
  };

  const headerRow = (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {/* 좌측 상단 빈칸(습관명 자리) */}
      <View style={{ width: NAME_COL_WIDTH }} /> {/* ✅ 상수 적용 */}
      {dayLabels.map((label, i) => (
        <View
          key={i}
          style={{
            width: CELL_W,                    
            paddingVertical: 6,                
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
    <View style={{ flex: 1, padding: PAGE_PADDING /* ✅ 상수 적용 */, gap: 12 }}>
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

      {/* 매트릭스 */}
      <ScrollView
        horizontal
        bounces={false}
        scrollEnabled={false}                 // ✅ 스와이프 안 생기게
        contentContainerStyle={{ paddingRight: 0 }} // ✅ 여유 패딩 제거
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
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
                cellWidth={CELL_W}                // ✅ 전달
                nameColWidth={NAME_COL_WIDTH}     // ✅ 전달
              />
            )}
            ListEmptyComponent={
              <Text style={{ color: "#666", textAlign: "center", marginTop: 24 }}>
                아직 습관이 없어요. 위에서 습관을 추가해보세요!
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
  cellWidth,
  nameColWidth,
}: {
  habitId: string;
  name: string;
  color: string;
  days: Date[];
  checks: Record<string, boolean>;
  onToggle: (dateKey: string) => void;
  onRename: (v: string) => void;
  onRemove: () => void;
  cellWidth: number;         // ✅ 추가
  nameColWidth: number;      // ✅ 추가
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
          width: nameColWidth,                 // ✅ 상수 사용
          paddingVertical: 8,                  // ⬇︎ 살짝 줄임
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
            <Text style={{ fontWeight: "600", flexShrink: 1 }}>
              {name}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
          <Tag onPress={() => setEditing((v) => !v)} text={editing ? "완료" : "수정"} />
          <Tag onPress={onRemove} text="삭제" danger />
        </View>
      </View>

      {/* 7일 셀 (고정 폭) */}
      {days.map((d, i) => {
        const dk = toLocalDateKey(d);
        const checked = !!checks[`${habitId}:${dk}`];

        return (
          <Pressable
            key={i}
            onPress={() => onToggle(dk)}
            hitSlop={10}
            style={{
              width: cellWidth,                 // ✅ flex 제거, 고정 폭
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 10,              // ⬇︎ 줄임
              borderBottomWidth: 1,
              borderLeftWidth: i === 0 ? 0 : 1,
              borderColor: "#eee",
              backgroundColor: checked ? (color + "22") : "transparent",
            }}
          >
            <View
              style={{
                width: 18,                      // ⬇︎ 살짝 줄임
                height: 18,
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
