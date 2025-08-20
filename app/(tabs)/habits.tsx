// app/(tabs)/habits.tsx
import { useCallback, useMemo, useState } from "react";
import { Dimensions, View, Text, Pressable, FlatList, ScrollView } from "react-native";
import WeekHeader from "../../components/habits/WeekHeader";
import HabitRow from "../../components/habits/HabitRow";
import AddHabitBar from "../../components/habits/AddHabitBar";
import {
  useHabitStore,
  weekDays,
  mondayOf,
} from "../../store/useHabitStore";

const fmtYYMMDD = (d: Date) => {
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

export default function HabitsScreen() {
  const SCREEN_W = Dimensions.get("window").width;

  // 레이아웃 상수
  const PAGE_PADDING = 16;
  const NAME_COL_WIDTH = 140;
  const HORIZONTAL_GAP = 0;
  const INNER_W = SCREEN_W - PAGE_PADDING * 2 - NAME_COL_WIDTH - HORIZONTAL_GAP * 6;
  const CELL_W = Math.floor(INNER_W / 7);

  const { habits, checks, addHabit, removeHabit, renameHabit, toggleCheck } = useHabitStore();

  const [anchor, setAnchor] = useState(new Date());

  const days = useMemo(
    () => weekDays(anchor).map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate())),
    [anchor]
  );

  const titleRange = useMemo(() => {
    const mon = mondayOf(anchor);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return `${fmtYYMMDD(mon)} ~ ${fmtYYMMDD(sun)}`;
  }, [anchor]);

  const goPrev = useCallback(() => {
    setAnchor(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
  }, []);
  const goNext = useCallback(() => {
    setAnchor(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
  }, []);

  const onAddHabit = useCallback((v: string) => addHabit(v), [addHabit]);

  return (
    <View style={{ flex: 1, padding: PAGE_PADDING, gap: 12 }}>
      {/* 상단: 이동/기간 */}
      <View
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}
      >
        <Pressable
          onPress={goPrev}
          style={{
            paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
            borderWidth: 1, borderColor: "#ddd", backgroundColor: "white",
          }}
        >
          <Text style={{ fontWeight: "600" }}>⟨ 저번주</Text>
        </Pressable>

        <Text style={{ fontSize: 16, fontWeight: "700" }}>{titleRange}</Text>

        <Pressable
          onPress={goNext}
          style={{
            paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
            borderWidth: 1, borderColor: "#ddd", backgroundColor: "white",
          }}
        >
          <Text style={{ fontWeight: "600" }}>다음주 ⟩</Text>
        </Pressable>
      </View>

      {/* 입력바 */}
      <AddHabitBar onAdd={onAddHabit} />

      {/* 표 (가로 고정, 스와이프 비활성) */}
      <ScrollView
        horizontal
        bounces={false}
        scrollEnabled={false}
        contentContainerStyle={{ paddingRight: 0 }}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        <View style={{ minWidth: "100%", flex: 1 }}>
          <WeekHeader nameColWidth={NAME_COL_WIDTH} cellWidth={CELL_W} />

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
                cellWidth={CELL_W}
                nameColWidth={NAME_COL_WIDTH}
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
