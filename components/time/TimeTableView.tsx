// components/time/TimeTableView.tsx
import { ScrollView, View, Text } from "react-native";
import { getColorForLabel, trackColors } from "../../store/timePalette";

type Log = { start: string; end: string | null; memo: string };

// 10분 슬롯 변환
const toSlotStart = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 6 + Math.floor(m / 10);
};
const toSlotEnd = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  if (h === 0 && m === 0) return 144; // 24:00 취급
  return h * 6 + Math.ceil(m / 10);
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function TimeTableView({
  logs = [],
  startHour = 8,
}: {
  logs?: Log[];
  startHour?: number;
}) {
  const ranges = (logs ?? [])
    .filter((l) => l.start && l.end)
    .map((l) => {
      const start = clamp(toSlotStart(l.start), 0, 143);
      const end = clamp(toSlotEnd(l.end!), 0, 144);   // exclusive
      const label = l.memo?.trim() || "활동";
      const col = getColorForLabel(label);            // ⬅️ 호텔 팔레트 적용
      return { start, end, label, col };
    })
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const firstHour = Math.min(Math.max(startHour, 0), 23);
  const hours = Array.from({ length: 24 - firstHour + 1 }, (_, i) => firstHour + i);

  type Segment = {
    leftPct: number;
    widthPct: number;
    label: string;
    col: ReturnType<typeof getColorForLabel>;
  };
  const hourLanes: { lanes: Segment[][] }[] = Array.from({ length: 24 }, () => ({ lanes: [[]] }));

  // 레인 점유(10분 단위)
  const occupancy: Array<Array<Array<string | null>>> = Array.from({ length: 24 }, () => [Array(6).fill(null)]);
  const placeSlice = (hour: number, offset: number, len: number, label: string): number => {
    let lane = occupancy[hour].findIndex((ln) =>
      Array.from({ length: len }, (_, i) => offset + i).every((c) => ln[c] === null)
    );
    if (lane === -1) {
      occupancy[hour].push(Array(6).fill(null));
      lane = occupancy[hour].length - 1;
    }
    for (let i = 0; i < len; i++) occupancy[hour][lane][offset + i] = label;
    return lane;
  };

  ranges.forEach((r) => {
    let cur = r.start;
    while (cur < r.end) {
      const hour = Math.floor(cur / 6);
      if (hour < firstHour || hour >= 24) {
        const nextHour = (hour + 1) * 6;
        cur = Math.max(cur + 1, nextHour);
        continue;
      }
      const hourStart = hour * 6;
      const hourEnd = hourStart + 6;
      const sliceStart = cur;
      const sliceEnd = Math.min(hourEnd, r.end);
      const len = sliceEnd - sliceStart;
      if (len > 0) {
        const offset = sliceStart - hourStart;
        const lane = placeSlice(hour, offset, len, r.label);
        const leftPct = (offset / 6) * 100;
        const widthPct = (len / 6) * 100;

        if (!hourLanes[hour].lanes[lane]) hourLanes[hour].lanes[lane] = [];
        const prev = hourLanes[hour].lanes[lane][hourLanes[hour].lanes[lane].length - 1];
        const isCont = prev && Math.abs(prev.leftPct + prev.widthPct - leftPct) < 0.0001 && prev.label === r.label;
        if (isCont) prev.widthPct += widthPct;
        else hourLanes[hour].lanes[lane].push({ leftPct, widthPct, label: r.label, col: r.col });
      }
      cur = sliceEnd;
    }
  });

  return (
  <ScrollView style={{ marginTop: 8 }}>
    {hours.map((h) => {
      const isLastLabelOnly = h >= 24; // 24:00 라벨 행
      const lanesForHour =
        !isLastLabelOnly && hourLanes[h] && Array.isArray(hourLanes[h].lanes) && hourLanes[h].lanes.length
          ? hourLanes[h].lanes
          : !isLastLabelOnly
            ? [[]] // 트랙은 그리되 빈 레인 하나
            : [];   // 24시는 트랙 자체를 안 그림

      return (
        <View key={h} style={{ marginBottom: 10, flexDirection: "row", alignItems: "flex-start" }}>
          {/* 시간 라벨 */}
          <View style={{ width: 56, paddingRight: 6 }}>
            <Text style={{ color: trackColors.hour }}>{String(h).padStart(2, "0")}:00</Text>
          </View>

          {/* 트랙 영역 */}
          <View style={{ flex: 1 }}>
            {isLastLabelOnly ? null : lanesForHour.map((segments: any[], li: number) => (
              <View
                key={`${h}-${li}`}
                style={{
                  position: "relative",
                  height: 24,
                  marginBottom: 4,
                  borderWidth: 1,
                  borderColor: trackColors.trackBorder,
                  borderRadius: 6,
                  backgroundColor: trackColors.trackBg,
                  overflow: "hidden",
                }}
              >
                {segments.map((seg, si) => (
                  <View
                    key={`${h}-${li}-${si}`}
                    style={{
                      position: "absolute",
                      left: `${seg.leftPct}%`,
                      width: `${seg.widthPct}%`,
                      top: 2,
                      bottom: 2,
                      borderRadius: 6,
                      backgroundColor: seg.col.bg,
                      borderWidth: 1,
                      borderColor: seg.col.border,
                      justifyContent: "center",
                      paddingHorizontal: 6,
                    }}
                  >
                    <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "700", color: seg.col.text }}>
                      {seg.label}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      );
    })}
    <View style={{ height: 8 }} />
  </ScrollView>
);

}
