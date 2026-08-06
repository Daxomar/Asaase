import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCENT = "#3F7B1E";

// TODO: fetch real lesson content by lessonId from backend
export default function LessonDetailScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

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

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text className="mt-4 text-xs font-bold uppercase tracking-wide text-text-on-dark-muted">
          Lesson {lessonId}
        </Text>
        <Text className="mt-2 text-2xl font-bold text-black">Lesson title goes here</Text>

        <Text className="mt-4 text-base leading-6 text-gray-700">
          Lesson body content goes here — replace with real content fetched by lessonId.
        </Text>

        <TouchableOpacity
          className="mb-8 mt-10 flex-row items-center justify-center rounded-full py-4"
          activeOpacity={0.85}
          style={{ backgroundColor: ACCENT }}
          onPress={() => router.push("/quiz")}
        >
          <Text className="text-base font-bold text-white">Take the quiz</Text>
          <Ionicons name="chevron-forward" size={22} color="#ffffff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}