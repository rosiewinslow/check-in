// services/todos.ts
import type { Todo, ISODate } from "../types";

const warn = (fn: string) =>
  console.warn(`[todos service disabled] '${fn}' 호출됨 — 현재는 로컬 저장만 사용 중입니다.`);

const now = () => Date.now();

/** 날짜별 조회 (서버 비활성화: 빈 배열 반환) */
export async function fetchTodosByDate(_date: ISODate): Promise<Todo[]> {
  warn("fetchTodosByDate");
  return [];
}

/** 추가 (서버 비활성화: no-op) */
export async function addTodo(_params: { title: string; date: ISODate; note?: string }) {
  warn("addTodo");
  // 의도치 않은 의존을 숨기지 않기 위해 반환값은 비움
  // 필요시 여기서 더미 객체를 만들어 반환하도록 바꿀 수 있음.
  return;
}

/** 진행률(완료 토글 포함) (서버 비활성화: no-op) */
export async function setProgress(_id: string, _progress: number) {
  warn("setProgress");
  return;
}

/** 수정 (노트, 마감일 등) (서버 비활성화: no-op) */
export async function updateTodo(_id: string, _patch: Partial<Omit<Todo, "id">>) {
  warn("updateTodo");
  return;
}

/** 삭제 (서버 비활성화: no-op) */
export async function removeTodo(_id: string) {
  warn("removeTodo");
  return;
}

/** 이월 (서버 비활성화: 0 반환) */
export async function rolloverTodos(_fromDate: ISODate, _toDate: ISODate) {
  warn("rolloverTodos");
  return 0;
}
