// components/todo/TodoRow.tsx
import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import Slider from "@react-native-community/slider";
import { Badge, Btn } from "./Small";

// 날짜 + 시간 포맷
function formatDateTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yy}.${mm}.${dd} ${hh}:${min}`;
}
function formatTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function TodoRow({
  id, title, done, progress, onRemove, onRename, onProgress, onOpenDetail,
  dueAt, notifyAt, note, locked,
}: {
  id: string; title: string; done: boolean; progress: number;
  onRemove?: () => void; onRename?: (t: string) => void; onProgress?: (p: number) => void;
  onOpenDetail: () => void; dueAt?: number; notifyAt?: number; note?: string; locked: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== title && onRename) onRename(v);
    setEditing(false);
  };
  
  const dueText = dueAt ? formatDateTime(dueAt) : "";
  const notiText = notifyAt ? formatTime(notifyAt) : "";

  return (
    <View
      style={{
        borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 12,
        backgroundColor: done ? "#f5f5f5" : "white", opacity: locked ? 0.85 : 1,
      }}
    >
      {/* 제목 */}
      {editing && !locked ? (
        <TextInput
          value={draft} onChangeText={setDraft} onBlur={commit} onSubmitEditing={commit} autoFocus
          style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 }}
        />
      ) : (
        <Text style={{ fontSize: 16, textDecorationLine: done ? "line-through" : "none", marginBottom: 6 }}>
          {title}
        </Text>
      )}

      {/* 배지 */}
      {(dueText || notiText || note || locked) ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
          {dueText ? <Badge text={`마감 ${dueText}`} /> : null}
          {notiText ? <Badge text={`⏰ ${notiText}`} /> : null}
          {note ? <Badge text={"메모 있음"} /> : null}
          {locked ? <Badge text={"읽기전용"} /> : null}
        </View>
      ) : null}

      {/* 진행률 */}
      <View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: "#666" }}>진행률</Text>
          <Text style={{ fontSize: 12, color: "#666" }}>{`${progress}%`}</Text>
        </View>
        <Slider
          value={progress} minimumValue={0} maximumValue={100} step={1}
          disabled={!onProgress} onValueChange={onProgress || (() => {})}
        />
      </View>

      {/* 버튼 */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
        <Btn onPress={onOpenDetail} label="자세히" />
        <View style={{ width: 8 }} />
        <Btn
          onPress={() => onRemove?.()}
          label="삭제"
          danger
          disabled={!onRemove}
        />
        <View style={{ width: 8 }} />
        <Btn onPress={() => setEditing(v => !v)} label={editing ? "완료" : "수정"} disabled={locked} />
      </View>
    </View>
  );
}
