import { View, Pressable, Text } from "react-native";
import { Calendar } from "react-native-calendars";

type Props = {
  selected: string;
  onSelect: (dateKey: string) => void;
  diaries: Record<string, { text?: string }>;
};

export default function DayCalendar({ selected, onSelect, diaries }: Props) {
  const marked: any = { [selected]: { selected: true, selectedColor: "#111", selectedTextColor: "white" } };

  return (
    <Calendar
      firstDay={1}
      markedDates={marked}
      onDayPress={(d) => onSelect(d.dateString)}
      style={{ borderBottomWidth: 1, borderColor: "#eee" }}
      theme={{ textDayFontWeight: "600", textMonthFontWeight: "700", arrowColor: "#111" }}
      dayComponent={({ date, state }) => {
        const isSelected = date?.dateString === selected;
        const hasDiary = !!diaries[date?.dateString ?? ""];
        return (
          <Pressable onPress={() => onSelect(date!.dateString!)} style={{ paddingVertical: 6 }}>
            <View style={{ width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: isSelected ? "#111" : "transparent" }}>
              <Text style={{ color: state === "disabled" ? "#ccc" : isSelected ? "white" : "#111", fontWeight: "600" }}>
                {date?.day}
              </Text>
            </View>
            {hasDiary ? <Text style={{ textAlign: "center", marginTop: 2 }}>♥</Text> : <View style={{ height: 18 }} />}
          </Pressable>
        );
      }}
    />
  );
}
