// hooks/useLocalDate.ts
import { useMemo } from "react";

export const toLocalDateKey = (d: Date) => {
  // 로컬 자정 기준 YYYY-MM-DD
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const useDateKey = (date: Date) =>
  useMemo(() => toLocalDateKey(date), [date]);
