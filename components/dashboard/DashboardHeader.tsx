import { View, Text, Pressable } from "react-native";
import { supabase } from "../../lib/supabase";

type Props = { selected: string; todoCount: number; };

export default function DashboardHeader({ selected, todoCount }: Props) {
  return (
    <View style={{ padding: 12, borderBottomWidth: 1, borderColor: "#f0f0f0", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: "700" }}>{selected} 기록</Text>
        <Text style={{ color: "#666", marginTop: 6 }}>투두 {todoCount}개</Text>
      </View>
      <Pressable
        onPress={() => supabase.auth.signOut()}
        style={({ pressed }) => ({
          paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", opacity: pressed ? 0.7 : 1
        })}
      >
        <Text style={{ fontWeight: "700" }}>로그아웃</Text>
      </Pressable>
    </View>
  );
}
