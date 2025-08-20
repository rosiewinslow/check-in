// app/(modal)/todo-detail.tsx
export const options = { headerShown: false, presentation: "modal" };

import {
  View, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { useTodoStore } from "../../store/useTodoStore";
import TodoDetailCard from "../../components/todo/TodoDetailCard";
import { todayKey } from "../../hooks/useKstDate";

export default function TodoDetailModalPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { todos } = useTodoStore() as any;

  const todo = useMemo(() => todos.find((t: any) => t.id === id), [todos, id]);

  useEffect(() => {
    if (!id || !todo) router.back();
  }, [id, todo, router]);

  if (!todo) return null;

  return (
    <KeyboardAvoidingView behavior={"padding"} style={styles.fill}>
      {/* dim dismiss */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.fill, { backgroundColor: "rgba(0,0,0,0.4)" }]} />
      </TouchableWithoutFeedback>

      {/* centered card */}
      <View style={styles.centerWrap}>
        <TodoDetailCard
          todo={todo}
          onClose={() => router.back()}
          testButton={__DEV__}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centerWrap: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", padding: 16 },
});
