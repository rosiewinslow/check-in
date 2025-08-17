// app/(modal)/todo-detail.tsx
export const options = { headerShown: false, presentation: "modal" };

import {
  View, Text, TextInput, Pressable, Platform,
  KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, ScrollView, StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { useTodoStore } from "../../store/useTodoStore";
// 🧪 TEST BUTTON
import * as Notifications from "expo-notifications";

// 🆕 유틸
const toKstDateKey = (d = new Date()) => {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
};
const todayKey = () => toKstDateKey(new Date());

export default function TodoDetailModalPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { id } = params;

  const { todos } = useTodoStore() as any;
  const todo = useMemo(() => todos.find((t: any) => t.id === id), [todos, id]);

  useEffect(() => {
    if (!id || !todo) router.back();
  }, [id, todo, router]);

  if (!todo) return null;

  const locked = todo.date < todayKey(); // 🔒 과거일자면 잠금

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.fill}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.fill, { backgroundColor: "rgba(0,0,0,0.4)" }]} />
      </TouchableWithoutFeedback>

      <View style={styles.centerWrap}>
        <Card
          todo={todo}
          locked={locked} // 🔒
          onClose={() => router.back()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Card({
  todo,
  locked,
  onClose,
}: {
  todo: any;
  locked: boolean;   // 🔒
  onClose: () => void;
}) {
  const { setDetail } = useTodoStore() as any;

  const [note, setNote] = useState<string>(todo.note ?? "");
  const [dueAt, setDueAt] = useState<Date | undefined>(todo.dueAt ? new Date(todo.dueAt) : undefined);
  const [notifyAt, setNotifyAt] = useState<Date | undefined>(todo.notifyAt ? new Date(todo.notifyAt) : undefined);
  const [showDue, setShowDue] = useState(false);
  const [showNoti, setShowNoti] = useState(false);

  const openDue = () => { if (!locked) { Keyboard.dismiss(); setShowDue(true); } };
  const openNoti = () => { if (!locked) { Keyboard.dismiss(); setShowNoti(true); } };

  // ✅ note 자동 저장 (디바운스 400ms) — 🔒 잠금이면 비활성
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveNote = (text: string) => {
    setNote(text);
    if (locked) return;                        // 🔒
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDetail(todo.id, { note: text.trim() || undefined });
    }, 400);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const clearNote = async () => {
    if (locked) return;                        // 🔒
    setNote("");
    await setDetail(todo.id, { note: undefined });
  };

  const saveDueNoti = async () => {
    if (locked) return;                        // 🔒
    await setDetail(todo.id, {
      dueAt: dueAt ? dueAt.getTime() : null,
      notifyAt: notifyAt ? notifyAt.getTime() : null,
    });
    onClose();
  };

  // 🧪 TEST BUTTON (5초 뒤 알림)
  const testNotify = async () => {
    const fire = new Date(Date.now() + 5000);
    await Notifications.scheduleNotificationAsync({
      content: { title: "테스트 알림", body: "이 알림이 보이면 설정 OK" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fire,
        channelId: "default",
      },
    });
  };
  // 🧪 TEST BUTTON END

  return (
    <View style={styles.card}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
        <Text style={{ fontWeight: "700", fontSize: 18 }}>
          {todo.title} {locked ? "" : ""}
        </Text>

        {/* 메모 */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: "#666" }}>메모</Text>
          {!locked && (
            <Pressable onPress={clearNote}>
              <Text style={{ fontSize: 12, color: "#b00" }}>메모 지우기</Text>
            </Pressable>
          )}
        </View>

        <TextInput
          value={note}
          onChangeText={autoSaveNote}
          placeholder={locked ? "과거 항목은 수정할 수 없어요" : "메모를 입력하세요 (자동 저장)"}
          editable={!locked}                         // 🔒
          multiline
          style={{
            borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
            padding: 12, minHeight: 90, backgroundColor: locked ? "#f7f7f7" : "white",
          }}
        />

        {/* 마감일 */}
        <Pressable
          onPress={openDue}
          disabled={locked}                          // 🔒
          style={{
            padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
            opacity: locked ? 0.6 : 1,
          }}
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
          onPress={openNoti}
          disabled={locked}                          // 🔒
          style={{
            padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
            opacity: locked ? 0.6 : 1,
          }}
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

        {/* 🧪 TEST BUTTON: 테스트 끝나면 아래 블록 삭제 */}
        <Pressable onPress={testNotify} style={{ padding: 12, borderRadius: 10, backgroundColor: "#f0f0f0" }}>
          <Text style={{ textAlign: "center" }}>알림 테스트 (5초 뒤)</Text>
        </Pressable>
        {/* 🧪 TEST BUTTON END */}

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
  fill: { flex: 1 },
  centerWrap: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", padding: 16 },
  card: { width: "100%", maxWidth: 520, borderRadius: 14, backgroundColor: "white", padding: 16 },
});
