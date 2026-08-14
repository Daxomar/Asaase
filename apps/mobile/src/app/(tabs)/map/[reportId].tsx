import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// TODO: fetch real report data by reportId from backend
export default function ReportDetailScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-4 h-48 items-center justify-center rounded-2xl bg-gray-100">
          <Ionicons name="location" size={36} color="#9CA3AF" />
        </View>

        <Text className="mt-5 text-xs font-bold uppercase tracking-wide text-text-on-dark-muted">
          Report {reportId}
        </Text>
        <Text className="mt-1 text-2xl font-bold text-black">Location name goes here</Text>
        <Text className="mt-3 text-base leading-6 text-gray-700">
          Report details go here — replace with real content fetched by reportId
          (submitted photo, note, risk level, timestamp, reporter).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}