import { useMemo, useState, useEffect } from "react";
import {
  View, Text, Pressable, FlatList, TextInput, Platform
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTimeLogStore, toDateKey, TimeLog } from "../../store/useTimeLogStore";

const IS_IOS = Platform.OS === "ios";

// 화면에서 단 하나의 피커만 열리게 제어
type OpenPicker = { id: string; field: "start" | "end" } | null;

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

  const fmtYYMMDD = (d: Date) => {
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
  };

  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* 상단: 날짜 + 이전/다음 같은 줄 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Pressable
          onPress={goPrev}
          style={{
            paddingVertical: 6, paddingHorizontal: 12,
            borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
          }}
        >
          <Text style={{ fontWeight: "600" }}>⟨ 저번날</Text>
        </Pressable>

        <Text style={{ fontSize: 16, fontWeight: "700" }}>{fmtYYMMDD(anchor)}</Text>

        <Pressable
          onPress={goNext}
          style={{
            paddingVertical: 6, paddingHorizontal: 12,
            borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
          }}
        >
          <Text style={{ fontWeight: "600" }}>다음날 ⟩</Text>
        </Pressable>
      </View>

      {/* 리스트 */}
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
          <View style={{ marginTop: 16 }}>
            <Pressable
              onPress={() => add(dateKey)}
              style={{
                alignSelf: "center",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: "#111",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>+ 추가</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

/** 단일 항목 Row: 편집모드(위: 시간칩, 아래: 휠, 그 아래: 메모, 맨아래: 삭제/저장) or 리스트뷰 */
function TimeLogRow({
  log,
  isOpenStart,
  isOpenEnd,
  open,
  close,
  onSave,
  onRemove,
}: {
  log: TimeLog;
  isOpenStart: boolean;
  isOpenEnd: boolean;
  open: (field: "start" | "end") => void;
  close: () => void;
  onSave: (draft: { start: string; end: string | null; memo: string }) => void;
  onRemove: () => void;
}) {
  // “저장하면 리스트형태” → 로컬 편집 플래그
  const [editing, setEditing] = useState(() => !log.memo && !log.end);

  // 드래프트(저장 전까지는 로컬 상태)
  const [dStart, setDStart] = useState(log.start);
  const [dEnd, setDEnd] = useState<string | null>(log.end ?? null);
  const [dMemo, setDMemo] = useState(log.memo);

  // 저장/외부 변경 시 드래프트 동기화
  useEffect(() => {
    setDStart(log.start);
    setDEnd(log.end ?? null);
    setDMemo(log.memo);
  }, [log.start, log.end, log.memo]);

  const parseHHMM = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const onPickStart = (_e: DateTimePickerEvent, date?: Date) => {
    if (!date) return;
    setDStart(fmt(date));
    if (!IS_IOS) close();
  };
  const onPickEnd = (_e: DateTimePickerEvent, date?: Date) => {
    if (!date) return;
    setDEnd(fmt(date));
    if (!IS_IOS) close();
  };

  // Android 전용 prop 묶음
  const android24h = !IS_IOS ? ({ is24Hour: true as const }) : ({} as {});

  // ---- 리스트 모드 (저장 후) ----
  if (!editing) {
    return (
      <View
        style={{
          borderWidth: 1, borderColor: "#eee", borderRadius: 12,
          padding: 12, marginBottom: 12, backgroundColor: "white",
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <Text style={{ fontWeight: "600" }}>
          {dStart} ~ {dEnd ?? "—"} {dMemo ? ` ${dMemo}` : ""}
        </Text>
        <Pressable onPress={onRemove}>
          <Text style={{ color: "#b00", fontWeight: "700" }}>(삭제)</Text>
        </Pressable>
      </View>
    );
  }

  // ---- 편집 모드 ----
  return (
    <View
      style={{
        borderWidth: 1, borderColor: "#eee", borderRadius: 12,
        padding: 12, marginBottom: 12, backgroundColor: "white",
      }}
    >
      {/* 윗줄: 시작/끝 시간 칩 */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>시작</Text>
          <Pressable
            onPress={() => (isOpenStart ? close() : open("start"))}
            style={{
              borderWidth: 1,
              borderColor: isOpenStart ? "#111" : "#ddd",
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: "center",
              backgroundColor: isOpenStart ? "#111" : "white",
            }}
          >
            <Text style={{ fontWeight: "800", color: isOpenStart ? "white" : "#111" }}>
              {dStart}
            </Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>끝(선택)</Text>
          <Pressable
            onPress={() => (isOpenEnd ? close() : open("end"))}
            style={{
              borderWidth: 1,
              borderColor: isOpenEnd ? "#111" : "#ddd",
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: "center",
              backgroundColor: isOpenEnd ? "#111" : "white",
            }}
          >
            <Text style={{ fontWeight: "800", color: isOpenEnd ? "white" : "#111" }}>
              {dEnd ?? "—"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 시간 휠: 선택된 것이 있으면 바로 아래에 하나만 표시 */}
      {IS_IOS ? (
        <>
          {isOpenStart && (
            <View style={{ marginTop: 10 }}>
              <DateTimePicker
                value={parseHHMM(dStart)}
                mode="time"
                display="spinner"
                onChange={onPickStart}
              />
            </View>
          )}
          {!isOpenStart && isOpenEnd && (
            <View style={{ marginTop: 10 }}>
              <DateTimePicker
                value={parseHHMM(dEnd ?? dStart)}
                mode="time"
                display="spinner"
                onChange={onPickEnd}
              />
            </View>
          )}
        </>
      ) : (
        <>
          {isOpenStart && (
            <DateTimePicker
              value={parseHHMM(dStart)}
              mode="time"
              display="spinner"
              onChange={onPickStart}
              {...android24h}
            />
          )}
          {isOpenEnd && !isOpenStart && (
            <DateTimePicker
              value={parseHHMM(dEnd ?? dStart)}
              mode="time"
              display="spinner"
              onChange={onPickEnd}
              {...android24h}
            />
          )}
        </>
      )}

      {/* 메모 입력: 항상 시간(휠 포함) 아래 */}
      <View style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>무엇을 했나요?</Text>
        <TextInput
          value={dMemo}
          onChangeText={setDMemo}
          placeholder="예) 코딩, 운동, 독서..."
          multiline
          style={{
            minHeight: 90,
            borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
            paddingHorizontal: 10, paddingVertical: 8,
            textAlignVertical: "top",
          }}
        />
      </View>

      {/* 맨 아래: 삭제 / 저장 나란히 */}
      <View
        style={{
          marginTop: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Pressable
          onPress={onRemove}
          style={{
            paddingVertical: 10, paddingHorizontal: 14,
            borderRadius: 10, backgroundColor: "#fee",
          }}
        >
          <Text style={{ color: "#b00", fontWeight: "700" }}>삭제</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            onSave({ start: dStart, end: dEnd ?? null, memo: dMemo });
            close();        // 열린 피커 닫기
            setEditing(false); // 리스트 모드로 전환
          }}
          style={{
            paddingVertical: 10, paddingHorizontal: 16,
            borderRadius: 10, backgroundColor: "#111",
          }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>저장</Text>
        </Pressable>
      </View>
    </View>
  );
}
