// components/time/TimeTableView.tsx
import { ScrollView, View, Text } from "react-native";

type Log = { start: string; end: string | null; memo: string };

// 10분 슬롯: 0..143 (24*6)
const toSlot = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 6 + Math.floor(m / 10);
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// 해시 → 파스텔 HSL 색상
const hash = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const colorOf = (label: string) => {
  const h = hash(label) % 360;          // 0..359
  const s = 70;                          // 파스텔용 채도
  const l = 86;                          // 밝기
  const l2 = 70;                          // 경계선/텍스트 대비
  return {
    bg: `hsl(${h} ${s}% ${l}%)`,
    border: `hsl(${h} ${s - 20}% ${l2 - 8}%)`,
    text: `hsl(${h} ${Math.max(30, s - 40)}% ${l2 - 25}%)`,
  };
};

// helpers
const toSlotStart = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 6 + Math.floor(m / 10);       // 0..143
};
const toSlotEnd = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  // ✅ 종료가 00:00이면 그날의 끝(24:00)로 본다.
  if (h === 0 && m === 0) return 144;      // 24*6
  return h * 6 + Math.ceil(m / 10);        // 종료는 올림이 자연스러움
};

export default function TimeTableView({ logs = [], startHour = 8 }: { logs?: Log[]; startHour?: number }) {
  const ranges = (logs ?? [])
    .filter((l) => l.start && l.end)
    .map((l) => {
      const start = clamp(toSlotStart(l.start), 0, 143);
      const end = clamp(toSlotEnd(l.end!), 0, 144);   // exclusive
      const label = l.memo?.trim() || "활동";
      const col = colorOf(label);
      return { start, end, label, col };
    })
    .filter(r => r.end > r.start) // 방어: 비정상 구간 제거
    .sort((a, b) => a.start - b.start || b.end - a.end);


  const firstHour = Math.min(Math.max(startHour, 0), 23);
  // 24:00 라벨까지 보여주려고 24 포함
  const hours = Array.from({ length: 24 - firstHour + 1 }, (_, i) => firstHour + i);

  // 시간별 레인 구성 + 연속 구간 압축(막대 세그먼트)
  type Segment = { leftPct: number; widthPct: number; label: string; col: ReturnType<typeof colorOf> };
  const hourLanes: { lanes: Segment[][] }[] = Array.from({ length: 24 }, () => ({ lanes: [[]] }));

  // 우선 10분 단위로 레인 충돌 해결(칸 점유), 그 다음 같은 레인의 연속 조각을 하나로 합치기
  const occupancy: Array<Array<Array<string | null>>> = Array.from({ length: 24 }, () =>
    [Array(6).fill(null)] // lane 0
  );

  const placeSlice = (hour: number, offset: number, len: number, label: string): number => {
    // 빈 레인 찾기
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
        // 막대 세그먼트로 압축(퍼센트 기준)
        const leftPct = (offset / 6) * 100;
        const widthPct = (len / 6) * 100;
        if (!hourLanes[hour].lanes[lane]) hourLanes[hour].lanes[lane] = [];
        const prev = hourLanes[hour].lanes[lane][hourLanes[hour].lanes[lane].length - 1];
        // 직전 세그먼트와 이어지면 합치기(연속성 + 동일 라벨)
        const isCont = prev && Math.abs(prev.leftPct + prev.widthPct - leftPct) < 0.0001 && prev.label === r.label;
        if (isCont) {
          prev.widthPct += widthPct;
        } else {
          hourLanes[hour].lanes[lane].push({ leftPct, widthPct, label: r.label, col: r.col });
        }
      }
      cur = sliceEnd;
    }
  });

  return (
    <ScrollView style={{ marginTop: 8 }}>
      {hours.map((h) => {
        const showTrack = h < 24;
        return (
          <View key={h} style={{ marginBottom: 10, flexDirection: "row", alignItems: "flex-start" }}>
            {/* 시간 라벨 */}
            <View style={{ width: 56, paddingRight: 6 }}>
              <Text style={{ color: "#666" }}>{String(h).padStart(2, "0")}:00</Text>
            </View>

            {/* 트랙 영역 */}
            <View style={{ flex: 1 }}>
              {showTrack && (hourLanes[h].lanes.length ? hourLanes[h].lanes : [[]]).map((segments, li) => (
                <View
                  key={`${h}-${li}`}
                  style={{
                    position: "relative",
                    height: 24,
                    marginBottom: 4,
                    borderWidth: 1,
                    borderColor: "#eee",
                    borderRadius: 6,
                    backgroundColor: "#FAFAFA",
                    overflow: "hidden",
                  }}
                >
                  {/* 세그먼트(연속 구간 하나 = 막대 하나, 텍스트도 한 번만) */}
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
