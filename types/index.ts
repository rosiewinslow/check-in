export type ISODate = string; // "2025-08-16"

export type Todo = {
  id: string;
  title: string;
  date: ISODate;   // 해당 날짜의 투두
  progress: number; // 0~100
  note?: string;
  createdAt: number;
};
