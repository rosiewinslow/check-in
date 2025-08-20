// app/(tabs)/settings.tsx
import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, Platform, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useSettingsStore } from "../../store/useSettingsStore";
import { ensurePushPermission, scheduleDailyLocal } from "../../utils/notifications";

// ✅ 로컬 백업/복구용
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useTodoStore } from "../../store/useTodoStore";
import { useHabitStore } from "../../store/useHabitStore";
import { useTimeLogStore } from "../../store/useTimeLogStore";

// ❌ 계정 관련(지금은 비활성화)
// import { saveNickname, linkGoogleOAuth, signOutAll, deleteMyAccount, getCurrentUser, fetchProfile } from "../../services/account";

// HH:mm
const fmt = (d: Date) => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;

export default function SettingsScreen() {
  const router = useRouter();
  const {
    nickname, theme, pushEnabled, dailyReminderTime, providers,
    setNickname, setTheme, setPushEnabled, setDailyReminderTime,
    setProviderLinked, resetAll
  } = useSettingsStore();

  // ⛔️ 서버 프로필 동기화는 현재 로컬 모드라 비활성화
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const profile = await fetchProfile().catch(() => null);
  //       if (profile?.nickname && profile.nickname !== nickname) {
  //         setNickname(profile.nickname);
  //       }
  //     } catch {}
  //   })();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

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

  // --- 알림 스위치/시간 ---
  const onTogglePush = async (v: boolean) => {
    if (v) {
      const ok = await ensurePushPermission();
      if (!ok) return;
    }
    setPushEnabled(v);
    if (!v) setDailyReminderTime(null);
  };

  const onPickTime = (_: any, date?: Date) => {
    if (Platform.OS === "android") setTimeOpen(false);
    if (!date) return;
    setTimeTmp(date);
    const hhmm = fmt(date);
    setDailyReminderTime(hhmm);
    if (pushEnabled) {
      const name = (nickname?.trim() || "로지님");
      scheduleDailyLocal(hhmm, `${name}! 오늘의 투두리스트는 뭔가요?`);
    }
  };

  // --- 닉네임 저장 (지금은 로컬만) ---
  const onSaveNickname = async () => {
    const n = (nickname ?? "").trim();
    setNickname(n);
    if (pushEnabled && dailyReminderTime) {
      scheduleDailyLocal(dailyReminderTime, `${n || "로지님"}! 오늘의 투두리스트는 뭔가요?`);
    }
    Alert.alert("완료", "닉네임을 저장했어요."); // 로컬 저장 안내
  };

  // --- (지금은 숨김) 계정 관련 핸들러들 ---
  // const onLinkGoogle = async () => { ... }
  // const onLogout = async () => { ... }
  // const onDeleteAccount = async () => { ... }

  // --- 로컬 백업/복구 ---
  const exportAll = async () => {
    try {
      const payload = {
        version: 1,
        exportedAt: Date.now(),
        todos: useTodoStore.getState().todos,
        habits: {
          habits: useHabitStore.getState().habits,
          checks: useHabitStore.getState().checks,
        },
        timelogs: useTimeLogStore.getState().logs,
        settings: {
          nickname: useSettingsStore.getState().nickname,
          theme: useSettingsStore.getState().theme,
          pushEnabled: useSettingsStore.getState().pushEnabled,
          dailyReminderTime: useSettingsStore.getState().dailyReminderTime,
        },
      };
      const path = FileSystem.cacheDirectory + `backup-${payload.exportedAt}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(payload), { encoding: "utf8" });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      } else {
        Alert.alert("완료", `백업 파일이 저장되었습니다.\n${path}`);
      }
    } catch (e: any) {
      Alert.alert("백업 오류", e?.message ?? String(e));
    }
  };

  const importAll = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: "application/json" });
      const asset = res.assets?.[0];
      if (!asset) return;
      const txt = await FileSystem.readAsStringAsync(asset.uri, { encoding: "utf8" });
      const data = JSON.parse(txt);
      if (!data?.version) throw new Error("백업 형식이 올바르지 않습니다.");

      // 각 스토어에 주입할 setter가 없다면 간단히 교체용 액션을 하나씩 만들어두면 좋아요.
      // 여기서는 편의상 직접 state 교체 메서드를 기대합니다.
      useTodoStore.setState({ todos: data.todos ?? [] });
      useHabitStore.setState({
        habits: data.habits?.habits ?? [],
        checks: data.habits?.checks ?? {},
      });
      useTimeLogStore.setState({ logs: data.timelogs ?? [] });
      useSettingsStore.setState({
        nickname: data.settings?.nickname ?? "",
        theme: data.settings?.theme ?? "light",
        pushEnabled: !!data.settings?.pushEnabled,
        dailyReminderTime: data.settings?.dailyReminderTime ?? null,
      });

      Alert.alert("완료", "가져오기를 마쳤어요.");
    } catch (e: any) {
      Alert.alert("가져오기 오류", e?.message ?? String(e));
    }
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

      {/* 2. (대체) 데이터 관리 — 로컬 백업/복구 */}
      {/* <Section title="데이터 관리 (로컬)">
        <Row>
          <Text>데이터 내보내기</Text>
          <Pressable
            onPress={exportAll}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#111" }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>백업 파일 생성</Text>
          </Pressable>
        </Row>

        <Row>
          <Text>데이터 가져오기</Text>
          <Pressable
            onPress={importAll}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#111" }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>백업 파일 불러오기</Text>
          </Pressable>
        </Row>
      </Section> */}

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

      {/* 5. (비활성화된 계정 섹션 — 주석으로 보존) */}
      {/*
      <Section title="계정 (비활성화)">
        <Row>
          <Text>Google 연동</Text>
          <Pressable
            onPress={onLinkGoogle}
            style={{
              paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
              backgroundColor: providers.google ? "#e7f3ff" : "#111"
            }}
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
      */}
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
