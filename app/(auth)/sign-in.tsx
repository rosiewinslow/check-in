// app/(auth)/sign-in.tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { supabase } from "../../lib/supabase";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSignUp() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password: pw });
      if (error) throw error;
      Alert.alert("회원가입 완료", "가입하신 이메일의 메일함을 확인해주세요.");
    } catch (e: any) {
      Alert.alert("회원가입 오류", e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onSignIn() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) throw error;
      // 성공하면 AuthProvider의 onAuthStateChange가 트리거되고
      // _layout.tsx의 Gate가 /(tabs)/dashboard 로 라우팅함.
    } catch (e: any) {
      Alert.alert("로그인 오류", e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onResetPw() {
    try {
      setLoading(true);
      // 필요 시: 비번 재설정(리다이렉트 URL은 Supabase Auth 설정의 사이트URL 기준)
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      Alert.alert("비밀번호 재설정", "메일함에서 재설정 링크를 확인해주세요.");
    } catch (e: any) {
      Alert.alert("오류", e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <View style={{ width: "100%", maxWidth: 480, gap: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 8 }}>로그인</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="이메일"
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12 }}
        />
        <TextInput
          value={pw}
          onChangeText={setPw}
          placeholder="비밀번호"
          secureTextEntry
          style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12 }}
        />

        <Pressable
          onPress={onSignIn}
          disabled={loading}
          style={({ pressed }) => ({
            paddingVertical: 14,
            borderRadius: 10,
            backgroundColor: "#111",
            opacity: loading || pressed ? 0.7 : 1
          })}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>로그인</Text>
        </Pressable>

        <Pressable
          onPress={onSignUp}
          disabled={loading}
          style={({ pressed }) => ({
            paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#ddd",
            opacity: loading || pressed ? 0.7 : 1
          })}
        >
          <Text style={{ textAlign: "center", fontWeight: "700" }}>회원가입</Text>
        </Pressable>

        <Pressable onPress={onResetPw} disabled={loading} style={{ paddingVertical: 8 }}>
          <Text style={{ textAlign: "center", color: "#346fefff" }}>비밀번호 재설정</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
