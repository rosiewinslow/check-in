// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';


export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

