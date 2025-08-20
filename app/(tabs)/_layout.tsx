// 탭 레이아웃. 하단 네비바의 구조, 골격
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="dashboard" // 앱 켜면 기본으로 열리는 기본 탭. 
      screenOptions={{ headerTitleAlign: "center" }}
    >
      <Tabs.Screen name="todo" options={{ title: "투두리스트" }} />
      <Tabs.Screen name="habits" options={{ title: "습관트래커" }} />
      <Tabs.Screen name="dashboard" options={{ title: "캘린더" }} /> 
      <Tabs.Screen name="time" options={{ title: "타임체크" }} />
      <Tabs.Screen name="settings" options={{ title: "세팅" }} />
    </Tabs>
  );
}
