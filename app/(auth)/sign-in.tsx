import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';

const mapMsg = (m:string)=>{
  if (m.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (m.includes('Email not confirmed')) return '이메일 인증이 필요합니다. 회원가입 시 받은 메일을 확인해 주세요.';
  return m;
};

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSignIn() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) throw error; // 성공 시 _layout이 대시보드로 라우팅
    } catch (e:any) {
      Alert.alert('로그인 오류', mapMsg(e?.message ?? String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios:'padding', android:undefined })} style={{flex:1,justifyContent:'center',alignItems:'center',padding:16}}>
      <View style={{ width:'100%', maxWidth:480, gap:10 }}>
        <Text style={{ fontSize:22, fontWeight:'800', marginBottom:8 }}>로그인</Text>

        <TextInput value={email} onChangeText={setEmail} placeholder="이메일" autoCapitalize="none" keyboardType="email-address"
          style={{ borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12 }} />
        <TextInput value={pw} onChangeText={setPw} placeholder="비밀번호" secureTextEntry
          style={{ borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12 }} />

        <Pressable onPress={onSignIn} disabled={loading}
          style={({pressed})=>({ paddingVertical:14, borderRadius:10, backgroundColor:'#111', opacity: loading||pressed?0.7:1 })}>
          {loading ? <ActivityIndicator color="#fff"/> : <Text style={{ color:'#fff', textAlign:'center', fontWeight:'700' }}>로그인</Text>}
        </Pressable>

        <View style={{ alignItems:'center', marginTop:8 }}>
          <Link href="/(auth)/sign-up" style={{ color:'#346fefff', fontWeight:'600' }}>
            아직 계정이 없나요? 회원가입
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
