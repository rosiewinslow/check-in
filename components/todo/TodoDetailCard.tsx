import { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, Pressable, Platform, ScrollView, StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { todayKey } from "../../hooks/useKstDate";
import { useTodoStore } from "../../store/useTodoStore";

type TodoShape = {
  id: string;
  title: string;
  note?: string;
  dueAt?: number;
  notifyAt?: number;
  date: string;         // YYYY-MM-DD
};

export default function TodoDetailCard({
  todo,
  onClose,
  testButton = __DEV__,
}: {
  todo: TodoShape;
  onClose: () => void;
  testButton?: boolean;
}) {
  const { setDetail } = useTodoStore() as any;
  const locked = todo.date < todayKey();   // 🔒 과거는 읽기 전용

  const [note, setNote] = useState<string>(todo.note ?? "");
  const [dueAt, setDueAt] = useState<Date | undefined>(todo.dueAt ? new Date(todo.dueAt) : undefined);
  const [notifyAt, setNotifyAt] = useState<Date | undefined>(todo.notifyAt ? new Date(todo.notifyAt) : undefined);
  const [showDue, setShowDue] = useState(false);
  const [showNoti, setShowNoti] = useState(false);

  // 메모 자동 저장(디바운스 400ms)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeNote = (text: string) => {
    setNote(text);
    if (locked) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDetail(todo.id, { note: text.trim() || undefined });
    }, 400);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const clearNote = async () => {
    if (locked) return;
    setNote("");
    await setDetail(todo.id, { note: undefined });
  };

  const saveDueNoti = async () => {
    if (locked) return;
    await setDetail(todo.id, {
      dueAt: dueAt ? dueAt.getTime() : null,
      notifyAt: notifyAt ? notifyAt.getTime() : null,
    });
    onClose();
  };

  const testNotify = async () => {
    const fire = new Date(Date.now() + 5000);
    await Notifications.scheduleNotificationAsync({
      content: { title: "테스트 알림", body: "이 알림이 보이면 설정 OK" },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire, channelId: "default" },
    });
  };

  return (
    <View style={styles.card}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
        <Text style={{ fontWeight: "700", fontSize: 18 }}>{todo.title}</Text>

        {/* 메모 */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: "#666" }}>메모</Text>
          {!locked && (
            <Pressable onPress={clearNote}><Text style={{ fontSize: 12, color: "#b00" }}>메모 지우기</Text></Pressable>
          )}
        </View>
        <TextInput
          value={note}
          onChangeText={onChangeNote}
          placeholder={locked ? "과거 항목은 수정할 수 없어요" : "메모를 입력하세요 (자동 저장)"}
          editable={!locked}
          multiline
          style={{
            borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
            padding: 12, minHeight: 90, backgroundColor: locked ? "#f7f7f7" : "white",
          }}
        />

        {/* 마감일 */}
        <Pressable
          onPress={() => { if (!locked) setShowDue(true); }}
          disabled={locked}
          style={{ padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, opacity: locked ? 0.6 : 1 }}
        >
          <Text>{dueAt ? `마감: ${dueAt.toLocaleString()}` : "마감일 설정(선택)"}</Text>
        </Pressable>
        {showDue && (
          <DateTimePicker
            value={dueAt ?? new Date()}
            mode="datetime"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(_, d) => { setShowDue(false); setDueAt(d ?? undefined); }}
          />
        )}

        {/* 알림 시간 */}
        <Pressable
          onPress={() => { if (!locked) setShowNoti(true); }}
          disabled={locked}
          style={{ padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, opacity: locked ? 0.6 : 1 }}
        >
          <Text>{notifyAt ? `알림: ${notifyAt.toLocaleString()}` : "알림 시간 설정(선택)"}</Text>
        </Pressable>
        {showNoti && (
          <DateTimePicker
            value={notifyAt ?? new Date()}
            mode="datetime"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(_, d) => { setShowNoti(false); setNotifyAt(d ?? undefined); }}
          />
        )}

        {testButton && (
          <Pressable onPress={testNotify} style={{ padding: 12, borderRadius: 10, backgroundColor: "#f0f0f0" }}>
            <Text style={{ textAlign: "center" }}>알림 테스트 (5초 뒤)</Text>
          </Pressable>
        )}

        <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
          <Pressable onPress={onClose} style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: "#eee" }}>
            <Text style={{ textAlign: "center" }}>닫기</Text>
          </Pressable>
          {!locked && (
            <Pressable onPress={saveDueNoti} style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: "#111" }}>
              <Text style={{ textAlign: "center", color: "white" }}>저장</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", maxWidth: 520, borderRadius: 14, backgroundColor: "white", padding: 16 },
});
