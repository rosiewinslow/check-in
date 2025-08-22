// store/timePalette.ts
// 호텔 무드 8컬러 팔레트 (우드+크림톤과 어울리는 라이트 럭셔리)
export const palette = [
  "#B99668", // Amber Sandstone
  "#8A724C", // Golden Olive
  "#DCC9A7", // Silken Dune
  "#EDE2CC", // Champagne Veil
  "#F7F3E8", // Ivory Whisper
  "#CBB8A0", // Soft Taupe
  "#9C8F7A", // Smoky Beige
  "#BFA06A", // Desert Gold
] as const;

// ────────────────────────────────────────────────────────────────────────────────
// 유틸: hex → rgb, 그리고 어둡게(darken)/섞기(mix)로 보더/텍스트 톤 생성
const hexToRgb = (hex: string) => {
  const v = hex.replace("#", "");
  const n = parseInt(v.length === 3
    ? v.split("").map(c => c + c).join("")
    : v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const clamp = (x: number, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, x));
const rgbToHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map(n => n.toString(16).padStart(2, "0")).join("");

const darken = (hex: string, amount = 0.2) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    clamp(Math.round(r * (1 - amount))),
    clamp(Math.round(g * (1 - amount))),
    clamp(Math.round(b * (1 - amount))),
  );
};

const mix = (hexA: string, hexB: string, t = 0.5) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * t);
  return rgbToHex(lerp(a.r, b.r), lerp(a.g, b.g), lerp(a.b, b.b));
};

// ────────────────────────────────────────────────────────────────────────────────
// 해시로 라벨 → 인덱스 매핑(항상 같은 색)
const hash = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const idxOf = (label: string) => hash(label) % palette.length;

// 외부 공개: 라벨에 맞는 배경/보더/텍스트 색
export function getColorForLabel(label: string) {
  const base = palette[idxOf(label)];
  return {
    bg: base,                          // 막대 배경
    border: darken(base, 0.25),        // 약간 진한 보더
    text: mix(darken(base, 0.5), "#3C2F22", 0.7), // 더 어두운 텍스트(우드와 조화)
  };
}

// 타임테이블 트랙/라벨용(우드 배경 위 가독)
export const trackColors = {
  trackBg: "#F4F1EA", // 크림톤
  trackBorder: "#E6DAC8",
  label: "#5A4630",   // 진한 브라운
  hour: "#6B5944",    // 시간 텍스트
};
