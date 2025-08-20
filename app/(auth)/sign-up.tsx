import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const isEmail = (v:string)=> /\S+@\S+\.\S+/.test(v);
const isPwOk = (v:string)=> v.length >= 8;

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false); // 인증 메일 안내 모드
  const router = useRouter();

  async function onSignUp() {
    try {
      setLoading(true);
      if (!isEmail(email)) { Alert.alert('안내','이메일 형식을 확인해 주세요.'); return; }
      if (!isPwOk(pw)) { Alert.alert('안내','비밀번호는 8자 이상 권장합니다.'); return; }

      const { data, error } = await supabase.auth.signUp({ email, password: pw });
      if (error) throw error;

      // Email confirmations ON이면 session이 null → 인증 대기
      setSent(true);
      Alert.alert('회원가입 완료', '이메일로 인증 링크를 보냈어요. 메일함을 확인하고 인증 후 로그인해 주세요.');
    } catch (e:any) {
      Alert.alert('회원가입 오류', e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    try {
      setLoading(true);
      // resend: supabase-js v2
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      Alert.alert('재전송 완료', '인증 메일을 다시 보냈어요.');
    } catch (e:any) {
      Alert.alert('재전송 오류', e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onIConfirmed() {
    // 사용자가 메일에서 인증 완료했다면 → 로그인 페이지로 유도
    router.replace('/(auth)/sign-in');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios:'padding', android:undefined })} style={{flex:1,justifyContent:'center',alignItems:'center',padding:16}}>
      <View style={{ width:'100%', maxWidth:480, gap:10 }}>
        <Text style={{ fontSize:22, fontWeight:'800', marginBottom:8 }}>회원가입</Text>

        <TextInput value={email} onChangeText={setEmail} placeholder="이메일" autoCapitalize="none" keyboardType="email-address"
          editable={!sent}
          style={{ borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12, opacity: sent ? 0.6 : 1 }} />
        <TextInput value={pw} onChangeText={setPw} placeholder="비밀번호(8자 이상)" secureTextEntry
          editable={!sent}
          style={{ borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12, opacity: sent ? 0.6 : 1 }} />

        {!sent ? (
          <Pressable onPress={onSignUp} disabled={loading}
            style={({pressed})=>({ paddingVertical:14, borderRadius:10, backgroundColor:'#111', opacity: loading||pressed?0.7:1 })}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={{ color:'#fff', textAlign:'center', fontWeight:'700' }}>가입하기</Text>}
          </Pressable>
        ) : (
          <>
            <Text style={{ color:'#16a34a' }}>인증 메일을 보냈어요. 인증을 완료한 후 로그인해 주세요.</Text>

            <Pressable onPress={onResend} disabled={loading}
              style={({pressed})=>({ paddingVertical:12, borderRadius:10, borderWidth:1, borderColor:'#ddd', opacity: loading||pressed?0.7:1 })}>
              <Text style={{ textAlign:'center', fontWeight:'700' }}>인증 메일 재전송</Text>
            </Pressable>

            <Pressable onPress={onIConfirmed} disabled={loading}
              style={({pressed})=>({ paddingVertical:12, borderRadius:10, backgroundColor:'#111', opacity: loading||pressed?0.7:1 })}>
              <Text style={{ textAlign:'center', color:'#fff', fontWeight:'700' }}>인증 완료했어요 → 로그인</Text>
            </Pressable>
          </>
        )}

        <View style={{ alignItems:'center', marginTop:8 }}>
          <Link href="/(auth)/sign-in" style={{ color:'#346fefff', fontWeight:'600' }}>이미 계정이 있나요? 로그인</Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
