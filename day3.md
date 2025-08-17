# 앱 기능 개선 및 백엔드 supabase 연동

필수(오늘 구현)
영구 저장: @react-native-async-storage/async-storage
CRUD 완성: 추가/수정/삭제/완료 토글
정렬·필터: 완료/미완료, 마감일 임박순
폼 검증 & UX: 빈 값 방지, 저장 후 토스트/진입 제어
옵션(바로 이어서 가볍게)
5) 마감일 선택: @react-native-community/datetimepicker
6) 로컬 알림: expo-notifications (마감 30분 전)
7) 카테고리/태그 + 검색
8) 백업/복구: JSON로 내보내기/가져오기

필요 패키지 ->
npm i @react-native-async-storage/async-storage
npm i @react-native-community/datetimepicker
expo install expo-notifications
expo install react-native-gesture-handler


# 투두리스트 리팩토링
할거야 ->
1. 날짜별 분기(이전/다음 날짜로 넘기기 + 해당 날짜의 투두 보기/작성)
2. 항목 디테일 모달(메모, 마감 기한, 특정 시각 알림 설정)
어떻게 ->
1. 날짜별 분기. 상단에 이전, 다음 날짜로 이동버튼. 
2. 진행중,되돌리기,완료 상태 버튼 없앰. 어차피 진행률로 확인 가능.
3. 디테일 모달 달아서 간단메모, 마감일 설정, 알림 시간 설정

다음에 또 ->
1. 만약 오늘 진행률 100 못채운 투두는 하루 지나면 다음날로 자동 이월되게. 
2. 모달 페이지 들어가면 상단에 (tabs), (modal)/todo-detail 처럼 파일 명 나오는거 짜침
3. 메모 수정은 그냥 눌러서 하면 되는데, 삭제되는게 없음. 걍 뭔가 저장 느낌보단 진짜 잠깐 쓰는 클립보드같이 생겨서 짜침
4. 진짜 알림 보내주는지 확인해봐야돼.
5. 근데 이거 저장을 작성시간 기준으로 저장하는거 아니고 목표일자? 해당일자 기준으로 해야 나중에 대시보드에도 그렇게 뽑힘.