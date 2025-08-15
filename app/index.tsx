import { Redirect } from "expo-router";

export default function Index() {
  // 앱 첫 진입은 대시보드(캘린더)로
  return <Redirect href="/calendar" />;
}
