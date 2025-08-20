// components/time/TimeTableView.tsx
import { View, Text, ScrollView } from "react-native";

type Log = { start: string; end: string | null; memo: string };

const toSlot = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 6 + Math.floor(m / 10); // 0..143
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** 하나의 날(0..143 슬롯)에서, 시간별로 겹치는 구간을 레인으로 배치 */
export default function TimeTableView({ logs }: { logs: Log[] }) {
  // 슬롯 범위로 변환(10분 스냅: 시작내림, 종료올림)
  const ranges = logs
    .filter(l => l.start && l.end)
    .map(l => {
      const s = toSlot(l.start);
      const e = toSlot(l.end!);
      const start = clamp(s, 0, 143);
      const end = clamp(e, 0, 144); // 종료는 exclusive
      return { start, end, label: l.memo || "활동" };
    })
    // 0분 ~ 10분 같은 동시성 정렬 안정성
    .sort((a, b) => a.start - b.start || b.end - a.end);

  // 시간별(24시간)로 레인 배치
  // hourRows[hour] = Array<lane> ; lane = 6칸 배열(each cell: string | null)
  const hourRows: { lanes: (Array<(string | null)>)[] }[] = Array.from({ length: 24 }, () => ({
    lanes: [Array(6).fill(null)],
  }));

  // 각 range를 시간 단위로 잘라서 배치
  ranges.forEach(r => {
    let cur = r.start;
    while (cur < r.end) {
      const hour = Math.floor(cur / 6);
      const hourStart = hour * 6;
      const hourEnd = hourStart + 6;
      const sliceStart = cur;
      const sliceEnd = Math.min(r.end, hourEnd);
      const len = sliceEnd - sliceStart; // 1..6
      if (len > 0 && hour >= 0 && hour < 24) {
        const offset = sliceStart - hourStart; // 0..5
        const cellsNeeded = Array.from({ length: len }, (_, i) => offset + i); // 열 인덱스들

        // 첫 번째로 모든 칸이 비어있는 레인 찾기, 없으면 새 레인 추가
        let laneIdx = hourRows[hour].lanes.findIndex(lane =>
          cellsNeeded.every(c => lane[c] === null)
        );
        if (laneIdx === -1) {
          hourRows[hour].lanes.push(Array(6).fill(null));
          laneIdx = hourRows[hour].lanes.length - 1;
        }
        // 채우기
        cellsNeeded.forEach(c => (hourRows[hour].lanes[laneIdx][c] = r.label));
      }
      cur = sliceEnd; // 다음 시간 블록으로
    }
  });

  return (
    <ScrollView style={{ marginTop: 8 }}>
      {hourRows.map((hr, h) => (
        <View key={h} style={{ marginBottom: 6 }}>
          {/* 왼쪽 시간 라벨 */}
          <Text style={{ marginBottom: 4, color: "#666" }}>
            {String(h).padStart(2, "0")}:00
          </Text>

          {/* 레인들 (겹치면 줄 수가 늘어남) */}
          {hr.lanes.map((lane, li) => (
            <View
              key={li}
              style={{
                flexDirection: "row",
                gap: 4,
                alignItems: "center",
                // 셀 높이: 필요 시 조절
              }}
            >
              {lane.map((label, ci) => (
                <View
                  key={ci}
                  style={{
                    flex: 1,
                    height: 18,
                    borderWidth: 1,
                    borderColor: "#eee",
                    borderRadius: 4,
                    backgroundColor: label ? "#D1FAE5" /* 형광펜 느낌 연초록 */ : "white",
                    justifyContent: "center",
                    paddingHorizontal: 2,
                  }}
                >
                  {label && (
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 10, color: "#065F46", fontWeight: "600" }}
                    >
                      {label}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
