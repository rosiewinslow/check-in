import { Text } from "react-native";
export default function EmptyState({ text }: { text: string }) {
  return <Text style={{ color: "#999", textAlign: "center", marginTop: 16 }}>{text}</Text>;
}
