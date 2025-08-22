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

// 하단 스위칭 토글
function BottomViewToggle({
  mode,
  onChange,
}: {
  mode: "list" | "grid";
  onChange: (m: "list" | "grid") => void;
}) {
  const segBase = {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 18,
        alignItems: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "white",
          borderRadius: 24,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          padding: 4,
          gap: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Pressable
          onPress={() => onChange("list")}
          style={({ pressed }) => [
            segBase,
            {
              backgroundColor: mode === "list" ? "#111" : "transparent",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ color: mode === "list" ? "white" : "#111", fontWeight: "700" }}>
            리스트 보기
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange("grid")}
          style={({ pressed }) => [
            segBase,
            {
              backgroundColor: mode === "grid" ? "#111" : "transparent",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ color: mode === "grid" ? "white" : "#111", fontWeight: "700" }}>
            타임테이블 보기
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function TimeCheckScreen() {
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(today);
  const dateKey = useMemo(() => toDateKey(anchor), [anchor]);

  const {
    logs: rawLogs = [],
    add,
    setMemo,
    setStart,
    setEnd,
    remove,
  } = useTimeLogStore();
  const logs = Array.isArray(rawLogs) ? rawLogs : [];

  const dayLogs = useMemo(
    () =>
      (logs ?? [])
        .filter((l) => l?.dateKey === dateKey)
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

  // 하단 고정 토글
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // 기록 기준상 가장 이른 시작 시각
  const earliestHour = useMemo(() => {
    const firstStart = (dayLogs ?? [])
      .map((l) => l?.start)
      .filter((s): s is string => typeof s === "string" && s.includes(":"))
      .sort()[0];
    if (!firstStart) return 8;
    const hh = Number(firstStart.split(":")[0]);
    return Math.min(Math.max(hh, 0), 23);
  }, [dayLogs]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* 상단 날짜 스위처 */}
      <DaySwitcher label={fmtYYMMDD(anchor)} onPrev={goPrev} onNext={goNext} />

      {/* 컨텐츠 영역 */}
      {viewMode === "list" ? (
        <FlatList
          data={dayLogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 110 }}
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
            // 리스트 모드에서만 +추가 보이게 유지
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <Pressable
                onPress={() => add(dateKey)}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  backgroundColor: "#111",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>+ 추가</Text>
              </Pressable>
            </View>
          }
        />
      ) : (
        <View style={{ flex: 1, marginTop: 8 }}>
          {/* 타임테이블 뷰도 아래 토글 공간 확보 */}
          <View style={{ flex: 1, paddingBottom: 10 }}>
            <TimeTableView
              logs={(dayLogs ?? []).map((l) => ({
                start: l?.start ?? "00:00",
                end: l?.end ?? null,
                memo: l?.memo ?? "",
              }))}
              startHour={earliestHour}
            />
          </View>
        </View>
      )}

      {/* 하단 고정 스위칭 토글 */}
      <BottomViewToggle mode={viewMode} onChange={setViewMode} />
    </View>
  );
}
