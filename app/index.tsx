// app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // 스플래시 이미지는 app.json에서 표시되고,
  // 코드가 시작되면 즉시 대시보드로 이동합니다.
  return <Redirect href="/dashboard" />;
}
