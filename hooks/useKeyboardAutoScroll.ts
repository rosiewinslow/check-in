import { RefObject } from "react";
import { FlatList } from "react-native";

export default function useKeyboardAutoScroll(listRef: RefObject<FlatList>) {
  return () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
}
