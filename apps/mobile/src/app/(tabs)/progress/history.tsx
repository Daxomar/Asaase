import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// TODO: replace with real check-in history from backend
const days = [
  { date: "Aug 1", checkedIn: true },
  { date: "Aug 2", checkedIn: true },
  { date: "Aug 3", checkedIn: false },
  { date: "Aug 4", checkedIn: true },
  { date: "Aug 5", checkedIn: true },
];

export default function StreakHistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="ml-3 text-xl font-bold text-black">Check-in history</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="gap-2">
          {days.map((d) => (
            <View
              key={d.date}
              className="flex-row items-center justify-between rounded-xl border border-gray-100 bg-white p-4"
            >
              <Text className="text-sm font-semibold text-black">{d.date}</Text>
              <Ionicons
                name={d.checkedIn ? "checkmark-circle" : "close-circle-outline"}
                size={20}
                color={d.checkedIn ? "#58cc02" : "#d1d5db"}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}