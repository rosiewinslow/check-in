// hooks/useKstDate.ts
import { useMemo } from "react";

export const toKstDateKey = (d = new Date()) => {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
};
export const todayKey = () => toKstDateKey(new Date());

export function useDateKey(date: Date) {
  return useMemo(() => toKstDateKey(date), [date]);
}
