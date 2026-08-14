import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCENT = "#3F7B1E";

export default function QuizResultScreen() {
  const { score, total } = useLocalSearchParams<{ score: string; total: string }>();

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
      <View
        className="h-24 w-24 items-center justify-center rounded-full"
        style={{ backgroundColor: "#F2F8EC" }}
      >
        <Ionicons name="trophy" size={44} color={ACCENT} />
      </View>

      <Text className="mt-6 text-2xl font-bold text-black">
        {score} / {total} correct
      </Text>
      <Text className="mt-2 text-center text-base text-text-on-dark-muted">
        Nice work — points have been added to your balance.
      </Text>

      <TouchableOpacity
        className="mt-10 w-full flex-row items-center justify-center rounded-full py-4"
        activeOpacity={0.85}
        style={{ backgroundColor: ACCENT }}
        onPress={() => router.replace("/(tabs)")}
      >
        <Text className="text-base font-bold text-white">Back to home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}