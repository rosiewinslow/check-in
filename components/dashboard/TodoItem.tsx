import { View, Text } from "react-native";

type Props = { item: { id: string; title: string; done: boolean; createdAt: number } };

export default function TodoItem({ item }: Props) {
  return (
    <View style={{ marginHorizontal: 12, marginTop: 8, padding: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 10, backgroundColor: item.done ? "#f7f7f7" : "white" }}>
      <Text style={{ fontWeight: "600", textDecorationLine: item.done ? "line-through" : "none" }}>
        {item.title}
      </Text>
    </View>
  );
}
