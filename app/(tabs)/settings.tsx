import { useState } from "react";
import { View, Text, TextInput, Pressable, Switch, Platform } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSettingsStore } from "../../store/useSettingsStore";
import { ensurePushPermission, scheduleDailyLocal } from "../../utils/notifications";

// 간단한 HH:mm 포맷 도우미
const fmt = (d: Date) =>
  `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;

export default function SettingsScreen() {
  const router = useRouter();
  const {
    nickname, theme, pushEnabled, dailyReminderTime, providers,
    setNickname, setTheme, setPushEnabled, setDailyReminderTime,
    setProviderLinked, resetAll
  } = useSettingsStore();

  const [timeOpen, setTimeOpen] = useState(false);
  const [timeTmp, setTimeTmp] = useState<Date>(() => {
    const d = new Date();
    if (dailyReminderTime) {
      const [h,m] = dailyReminderTime.split(":").map(Number);
      d.setHours(h, m, 0, 0);
    } else {
      d.setHours(9, 0, 0, 0);
    }
    return d;
  });

  // --- 액션들 ---
  const onTogglePush = async (v: boolean) => {
    if (v) {
      const ok = await ensurePushPermission();
      if (!ok) return; // 권한 거부 시 켜지지 않음
    }
    setPushEnabled(v);
    if (!v) {
      setDailyReminderTime(null);
    }
  };

  const onPickTime = (_: any, date?: Date) => {
    if (Platform.OS === "android") setTimeOpen(false);
    if (!date) return;
    setTimeTmp(date);
    const hhmm = fmt(date);
    setDailyReminderTime(hhmm);
    if (pushEnabled) {
      const name = nickname?.trim() || "로지님";
      scheduleDailyLocal(hhmm, `${name}! 오늘의 투두리스트는 뭔가요?`);
    }
  };

  const onSaveNickname = () => {
    const n = nickname.trim();
    setNickname(n);
    // 푸시가 이미 켜져 있으면 스케줄 본문도 갱신
    if (pushEnabled && dailyReminderTime) {
      scheduleDailyLocal(dailyReminderTime, `${n || "로지님"}! 오늘의 투두리스트는 뭔가요?`);
    }
  };

  const onLinkGoogle = async () => {
    // TODO: expo-auth-session으로 실제 OAuth 연결
    // 지금은 껍데기: 바로 연결되었다고 표시
    setProviderLinked("google", true);
  };

  const onLogout = async () => {
    // TODO: 실제 OAuth signOut(연동 후)
    // 현재는 로컬만 정리하고 인증화면으로
    resetAll();
    router.replace("/(auth)/login"); // 앱 껍데기 로그인 화면으로
  };

  const onDeleteAccount = async () => {
    // TODO: 실제 계정 삭제 API
    resetAll();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 24 }}>
      {/* 1. 프로필 정보 */}
      <Section title="프로필 정보">
        <Text style={{ marginBottom: 6, color: "#666" }}>닉네임</Text>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="예) 로지"
          style={{
            borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
            paddingHorizontal: 12, paddingVertical: 10,
          }}
        />
        <Pressable
          onPress={onSaveNickname}
          style={{ alignSelf: "flex-end", marginTop: 8,
                   backgroundColor: "#111", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>닉네임 저장</Text>
        </Pressable>
      </Section>

      {/* 2. 계정 관련 */}
      <Section title="계정">
        <Row>
          <Text>Google 연동</Text>
          <Pressable
            onPress={onLinkGoogle}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
                     backgroundColor: providers.google ? "#e7f3ff" : "#111" }}
          >
            <Text style={{ color: providers.google ? "#111" : "white", fontWeight: "700" }}>
              {providers.google ? "연동됨" : "Google로 연동"}
            </Text>
          </Pressable>
        </Row>

        <Row>
          <Text>로그아웃</Text>
          <Pressable onPress={onLogout}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#111" }}>
            <Text style={{ color: "white", fontWeight: "700" }}>로그아웃</Text>
          </Pressable>
        </Row>

        <Row>
          <Text style={{ color: "#b00" }}>계정 탈퇴</Text>
          <Pressable onPress={onDeleteAccount}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#fee" }}>
            <Text style={{ color: "#b00", fontWeight: "700" }}>탈퇴</Text>
          </Pressable>
        </Row>
      </Section>

      {/* 3. 디자인 테마 */}
      <Section title="디자인 테마">
        <Row>
          <Text>라이트</Text>
          <Switch value={theme === "dark"} onValueChange={(v) => setTheme(v ? "dark" : "light")} />
          <Text>다크</Text>
        </Row>
      </Section>

      {/* 4. 알림 설정 */}
      <Section title="알림">
        <Row>
          <Text>푸시 알림</Text>
          <Switch value={pushEnabled} onValueChange={onTogglePush} />
        </Row>

        <View style={{ height: 8 }} />

        <Row>
          <Text>매일 리마인드 시간</Text>
          <Pressable
            disabled={!pushEnabled}
            onPress={() => setTimeOpen(true)}
            style={{
              paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
              borderWidth: 1, borderColor: "#ddd", opacity: pushEnabled ? 1 : 0.5
            }}
          >
            <Text style={{ fontWeight: "700" }}>{dailyReminderTime ?? "설정 안 됨"}</Text>
          </Pressable>
        </Row>

        {timeOpen && (
          <DateTimePicker
            value={timeTmp}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onPickTime}
          />
        )}
      </Section>

      {/* 앱 정보/푸터는 나중에 */}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{
      borderWidth: 1, borderColor: "#eee", backgroundColor: "white",
      borderRadius: 12, padding: 12
    }}>
      <Text style={{ fontWeight: "700", marginBottom: 10 }}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 6 }}>
      {children}
    </View>
  );
}
