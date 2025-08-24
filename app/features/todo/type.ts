export type ISODate = string; // e.g., "2025-08-16"

export type Todo = {
  id: string;
  title: string;
  date: ISODate; //  날짜별 분기/이동 기능의 기준 키
  progress: number; // 0~100 진행률. 100이면 완료
  note?: string;   // 간단 메모(모달에서 편집)
  createdAt: number; 
  updatedAt?: number;
  dueAt?: number;   // 마감 기한
  notifyAt?: number;  // 로컬 알림 시각
  notificationId?: string;   // 예약된 로컬 알림 id ,알림 수정/삭제 시 기존 예약 취소에 사용
  completedAt?: number;
};