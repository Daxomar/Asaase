import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCENT = "#3F7B1E";

// TODO: replace with real lesson data from backend
const lessons = [
  { id: "1", title: "What causes flooding?", done: true },
  { id: "2", title: "Reading a flood risk map", done: true },
  { id: "3", title: "Keeping drains clear", done: false },
  { id: "4", title: "What to do during a flood warning", done: false },
  { id: "5", title: "Reporting risks in your community", done: false },
];

export default function LearnScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text className="mt-4 text-2xl font-bold text-black">Learning path</Text>
        <Text className="mt-1 text-sm text-text-on-dark-muted">Flood safety basics</Text>

        <View className="mt-6 gap-3">
          {lessons.map((lesson, i) => (
            <TouchableOpacity
              key={lesson.id}
              activeOpacity={0.85}
              className="flex-row items-center rounded-2xl border border-gray-100 bg-white p-4"
              onPress={() => router.push(`/learn/${lesson.id}`)}
            >
              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  lesson.done ? "bg-[#3F7B1E]" : "bg-gray-100"
                }`}
              >
                {lesson.done ? (
                  <Ionicons name="checkmark" size={18} color="#ffffff" />
                ) : (
                  <Text className="text-sm font-bold text-gray-400">{i + 1}</Text>
                )}
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-black">{lesson.title}</Text>
                <Text className="mt-0.5 text-xs text-text-on-dark-muted">
                  {lesson.done ? "Completed" : "Not started"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}