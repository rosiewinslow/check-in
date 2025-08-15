# everly
A personal growth app. todo list, habit tracker, daily, mental health. Do it for me

# 하단 네비바 항목 구성
하단 탭 5개
투두리스트: 항목별 진행률(0–100%) 슬라이더
습관트래커: 주간 매트릭스(가로 요일/세로 습관), 체크 기록
대시보드 캘린더: 날짜별 투두/일기, 일기 있는 날 ♥ 표시
타임체크: 시간 구간 직접 기록 + (2차) 타이머는 제약있어서 시작/종료 시각으로 경과 계산
세팅: 프로필/계정/테마/백업

# 구성 예시 (페이징)
/app
  /(tabs)/_layout.tsx        ← 하단 탭 5개 정의하는 곳
  /(tabs)/todo.tsx           ← 탭1: 투두리스트
  /(tabs)/habits.tsx         ← 탭2: 습관트래커
  /(tabs)/calendar.tsx       ← 탭3: 대시보드 캘린더
  /(tabs)/time.tsx           ← 탭4: 타임체크
  /(tabs)/settings.tsx       ← 탭5: 세팅
  /(modal)/entry.tsx         ← 모달로 띄울 화면(예: 일기쓰기)
  /_layout.tsx               ← 전체 공통 레이아웃(안 건드려도 됨)
