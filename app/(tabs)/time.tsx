// app/(tabs)/time-check.tsx
import { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import DaySwitcher from "../../components/time/DaySwitcher";
import TimeLogRow, { type OpenPicker } from "../../components/time/TimeLogRow";
import { useTimeLogStore, toDateKey } from "../../store/useTimeLogStore";
import TimeTableView from "../../components/time/TimeTableView";

const fmtYYMMDD = (d: Date) => {
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

export default function TimeCheckScreen() {
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(today);
  const dateKey = useMemo(() => toDateKey(anchor), [anchor]);

  const { logs, add, setMemo, setStart, setEnd, remove } = useTimeLogStore();

  const dayLogs = useMemo(
    () =>
      logs
        .filter((l) => l.dateKey === dateKey)
        .sort((a, b) =>
          a.start < b.start ? -1 : a.start > b.start ? 1 : a.createdAt - b.createdAt
        ),
    [logs, dateKey]
  );

  const goPrev = () =>
    setAnchor((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const goNext = () =>
    setAnchor((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));

  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  // ★ 리스트/타임테이블 토글
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const toggleView = () => setViewMode((m) => (m === "list" ? "grid" : "list"));

  // ★ 버튼 스타일(샘플과 동일)
  const outlineBtn = ({ pressed }: { pressed: boolean }) => ({
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    opacity: pressed ? 0.7 : 1,
  });
  const blackBtn = ({ pressed }: { pressed: boolean }) => ({
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#111",
    opacity: pressed ? 0.8 : 1,
  });

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* 상단 날짜 스위처 */}
      <DaySwitcher label={fmtYYMMDD(anchor)} onPrev={goPrev} onNext={goNext} />

      {/* ★ 뷰 토글 버튼 (오른쪽 정렬) */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
        <Pressable onPress={toggleView} style={outlineBtn}>
          <Text>{viewMode === "list" ? "타임테이블 보기" : "리스트 보기"}</Text>
        </Pressable>
      </View>

      {viewMode === "list" ? (
        // ===== 리스트 뷰 =====
        <FlatList
          data={dayLogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => (
            <TimeLogRow
              log={item}
              isOpenStart={openPicker?.id === item.id && openPicker.field === "start"}
              isOpenEnd={openPicker?.id === item.id && openPicker.field === "end"}
              open={(field) => setOpenPicker({ id: item.id, field })}
              close={() => setOpenPicker(null)}
              onSave={(draft) => {
                setStart(item.id, draft.start);
                setEnd(item.id, draft.end ?? null);
                setMemo(item.id, draft.memo);
                setOpenPicker(null);
              }}
              onRemove={() => {
                setOpenPicker(null);
                remove(item.id);
              }}
            />
          )}
          ListEmptyComponent={
            <Text style={{ color: "#888", textAlign: "center", marginTop: 20 }}>
              아직 기록이 없습니다. 아래 ‘추가’ 버튼으로 시작해보세요.
            </Text>
          }
          ListFooterComponent={
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <Pressable onPress={() => add(dateKey)} style={blackBtn}>
                <Text style={{ color: "white", fontWeight: "700" }}>+ 추가</Text>
              </Pressable>
            </View>
          }
        />
      ) : (
        // ===== 타임테이블 뷰 =====
        <View style={{ flex: 1, marginTop: 8 }}>
          <TimeTableView
            logs={dayLogs.map((l) => ({
              start: l.start,
              end: l.end,
              memo: l.memo,
            }))}
          />
          {/* 하단에도 +추가 버튼 유지하고 싶으면 표시 */}
          <View style={{ marginTop: 8, alignItems: "center" }}>
            <Pressable onPress={() => add(dateKey)} style={blackBtn}>
              <Text style={{ color: "white", fontWeight: "700" }}>+ 추가</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
