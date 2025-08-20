// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../providers/AuthProvider';


export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}


/* 
// 로그인 인증 분기 로직
function ProtectedLayout() {
  const { loading, userId } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const inAuth = segments[0] === '(auth)';

  useEffect(() => {
    if (loading) return;
    if (!userId && !inAuth) router.replace('/(auth)/sign-in');
    if (userId && inAuth) router.replace('/(tabs)/dashboard');
  }, [loading, userId, inAuth]);

  if (loading) {
    return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator/></View>;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProtectedLayout />
    </AuthProvider>
  );
}
*/