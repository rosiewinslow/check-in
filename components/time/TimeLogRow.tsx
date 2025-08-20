// components/time/TimeLogRow.tsx
import { useEffect, useState, useMemo } from "react";
import {
  View, Text, Pressable, TextInput, Platform, Alert,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import type { TimeLog } from "../../store/useTimeLogStore";

const IS_IOS = Platform.OS === "ios";

export type OpenPicker = { id: string; field: "start" | "end" } | null;

export default function TimeLogRow({
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
  // 저장 후엔 리스트형으로 보이게
  const [editing, setEditing] = useState(() => !log.memo && !log.end);

  // 드래프트
  const [dStart, setDStart] = useState(log.start);
  const [dEnd, setDEnd] = useState<string | null>(log.end ?? null);
  const [dMemo, setDMemo] = useState(log.memo);

  // 외부 변경 → 동기화
  useEffect(() => {
    setDStart(log.start);
    setDEnd(log.end ?? null);
    setDMemo(log.memo);
  }, [log.start, log.end, log.memo]);

  // util
  const parseHHMM = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m; // 0..1439
  };
  // 종료 비교 전용: "00:00" 은 24:00(=1440분)으로 간주
  const endMinutesForCompare = (endStr: string) =>
    endStr === "00:00" ? 24 * 60 : toMinutes(endStr);

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

  const android24h = useMemo(
    () => (!IS_IOS ? ({ is24Hour: true as const }) : ({} as {})),
    []
  );

  // 공통 버튼 스타일 (샘플과 동일)
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

  const handleEditStart = () => {
    // 편집 시작 시 최신 값 동기화
    setDStart(log.start);
    setDEnd(log.end ?? null);
    setDMemo(log.memo);
    setEditing(true);
  };

  const handleCancel = () => {
    // 드래프트 롤백
    setDStart(log.start);
    setDEnd(log.end ?? null);
    setDMemo(log.memo);
    close();
    setEditing(false);
  };

  const handleSave = () => {
    // 종료 미입력 → 바로 저장
    if (!dEnd) {
      onSave({ start: dStart, end: null, memo: dMemo.trim() });
      close();
      setEditing(false);
      return;
    }

    const s = toMinutes(dStart);               // 0..1439
    const e = endMinutesForCompare(dEnd);      // 1..1440 (00:00 → 1440)

    // 24:00 초과 금지 (이론상 없음, 방어)
    if (e > 24 * 60) {
      Alert.alert("저장 실패", "종료 시간은 24:00을 넘길 수 없어요.");
      return;
    }
    // 시작보다 같거나 빠른 종료 금지 (단, 00:00은 24:00으로 처리되므로 OK)
    if (e <= s) {
      Alert.alert("저장 실패", "종료 시간은 시작 시간보다 늦어야 해요.\n자정은 24:00으로 간주돼요.");
      return;
    }

    onSave({ start: dStart, end: dEnd, memo: dMemo.trim() });
    close();
    setEditing(false);
  };

  // ---- 리스트 모드 ----
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
          {dStart} ~ {dEnd ?? "—"}{dMemo ? `  ${dMemo}` : ""}
        </Text>

        {/* 오른쪽 버튼 그룹: 수정(아웃라인) / 삭제(블랙) */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={handleEditStart}
            style={({ pressed }) => ({
              paddingHorizontal: 10, paddingVertical: 6,
              borderRadius: 8, backgroundColor: "#cadafdff",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: "#346fefff", fontWeight: "600" }}>수정</Text>
          </Pressable>
          <Pressable
            onPress={onRemove}
            style={({ pressed }) => ({
              paddingHorizontal: 10, paddingVertical: 6,
              borderRadius: 8, backgroundColor: "#FEE2E2",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: "#B00020", fontWeight: "600" }}>삭제</Text>
          </Pressable>
        </View>
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
      {/* 시작/끝 칩 */}
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

      {/* 시간 휠 (하나만 노출) */}
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

      {/* 메모 */}
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

      {/* 하단 버튼 (샘플 스타일과 동일) */}
      <View
        style={{
          marginTop: 12,
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Pressable onPress={handleCancel} style={outlineBtn}>
          <Text>취소</Text>
        </Pressable>
        <Pressable onPress={handleSave} style={blackBtn}>
          <Text style={{ color: "white", fontWeight: "700" }}>저장</Text>
        </Pressable>
      </View>
    </View>
  );
}
